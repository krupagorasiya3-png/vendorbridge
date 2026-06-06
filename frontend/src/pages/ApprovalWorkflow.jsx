import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ApprovalWorkflow() {
  const { apiFetch, user, showToast, logSimulatedEmail } = useAuth();
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [pastDecisions, setPastDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({}); // Mapping quoteId -> remarks text

  useEffect(() => {
    fetchApprovalData();
  }, []);

  const fetchApprovalData = async () => {
    try {
      const allQuotes = await apiFetch('/quotations');
      
      // Separate pending from approved/rejected
      const pending = allQuotes.filter(q => q.status === 'pending');
      const past = allQuotes.filter(q => q.status !== 'pending');

      setPendingQuotes(pending);
      setPastDecisions(past);
    } catch (err) {
      console.error('Error fetching approval desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (quote, status) => {
    const quoteId = quote._id;
    const comment = remarks[quoteId] || '';

    try {
      await apiFetch(`/approvals/${quoteId}`, {
        method: 'POST',
        body: JSON.stringify({ status, remarks: comment })
      });

      showToast(`Quotation for "${quote.rfqTitle}" has been ${status}!`, 'success');
      
      // If approved, trigger a simulated email dispatch to the vendor and procurement officer!
      if (status === 'approved') {
        // Send email to vendor
        logSimulatedEmail({
          to: 'sales@apexsupplies.com', // Apex email fallback
          subject: `🎉 Congratulations! Quotation Approved for RFQ: ${quote.rfqTitle}`,
          body: `Hello Team,\n\nWe are pleased to inform you that your quotation of ₹${quote.price.toLocaleString()} for "${quote.rfqTitle}" has been APPROVED by our Management.\n\nPurchase Order and Invoice have been auto-generated. Please check your VendorBridge portal.\n\nManagement Remarks: "${comment || 'Excellent pricing and timeline compliance'}"\n\nBest Regards,\nProcurement Team\nVendorBridge ERP`
        });

        // Send email to officer
        logSimulatedEmail({
          to: 'officer@vendorbridge.com',
          subject: `🧾 Action Required: Purchase Order Generated for RFQ: ${quote.rfqTitle}`,
          body: `Hello Neera,\n\nThe quotation submitted by "${quote.vendorName}" for RFQ "${quote.rfqTitle}" has been approved by Suresh Raina.\n\nPurchase Order and Invoices are ready. You can print, download or send them to the vendor directly.\n\nRemarks: "${comment || 'Approved'}"\n\nRegards,\nVendorBridge ERP`
        });
      }

      // Clear remarks for this item
      setRemarks(prev => {
        const copy = { ...prev };
        delete copy[quoteId];
        return copy;
      });

      // Refresh list
      fetchApprovalData();
    } catch (err) {
      showToast(err.message || 'Failed to process decision', 'error');
    }
  };

  const handleRemarksChange = (quoteId, text) => {
    setRemarks(prev => ({
      ...prev,
      [quoteId]: text
    }));
  };

  const isApprover = user.role === 'manager' || user.role === 'admin';

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>Management Approval Deck</h1>
      </div>

      {!isApprover && (
        <div className="glass-panel" style={{ padding: '1.25rem 2rem', background: 'var(--color-danger-glow)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', fontWeight: 600 }}>
            ⚠️ Access Restriction: Only Managers and Admins can sign-off or reject procurement quotations. Please use the Quick-Role selector on the Login screen to swap roles.
          </p>
        </div>
      )}

      {isApprover && (
        <div className="glass-panel">
          <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>📋 Pending Bids Awaiting Sign-Off</h3>
          
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading pending bids...</div>
          ) : pendingQuotes.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
              No quotations are currently awaiting approval. All workflows are completed!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {pendingQuotes.map((quote) => (
                <div key={quote._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {quote.rfqTitle}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Proposed by: <strong>{quote.vendorName}</strong>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--color-cyan)' }}>
                        ₹{quote.price.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Delivery SLA: {quote.deliveryTimeline}
                      </span>
                    </div>
                  </div>

                  {quote.notes && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Vendor comments:</strong> "{quote.notes}"
                    </div>
                  )}

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Manager Decision Remarks / Approval Comments</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Approved. Best pricing structure and delivery SLA matches our criteria."
                      value={remarks[quote._id] || ''}
                      onChange={(e) => handleRemarksChange(quote._id, e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleDecision(quote, 'rejected')}
                      className="btn btn-outline-danger"
                    >
                      Reject Bid
                    </button>
                    <button
                      onClick={() => handleDecision(quote, 'approved')}
                      className="btn btn-success"
                    >
                      Approve Bid & Issue PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workflow History / Past Decisions */}
      <div className="glass-panel">
        <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>📜 Decision Audit Trail</h3>
        
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading history...</div>
        ) : pastDecisions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
            No past approval/rejection decisions registered.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>RFQ Reference</th>
                  <th>Vendor Partner</th>
                  <th>Quoted price</th>
                  <th>SLA</th>
                  <th>Status</th>
                  <th>Manager Comments</th>
                </tr>
              </thead>
              <tbody>
                {pastDecisions.map((quote) => (
                  <tr key={quote._id}>
                    <td>
                      <strong>{quote.rfqTitle}</strong>
                    </td>
                    <td>{quote.vendorName}</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>₹{quote.price.toLocaleString()}</strong></td>
                    <td>{quote.deliveryTimeline}</td>
                    <td>
                      <span className={`status-badge status-${quote.status}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {quote.remarks || 'No comments left.'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

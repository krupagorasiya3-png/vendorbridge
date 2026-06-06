import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function QuotationComparison({ selectedRfqId, setSelectedRfqId, setCurrentPage }) {
  const { apiFetch, user, showToast, logSimulatedEmail } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [rfqId, setRfqId] = useState(selectedRfqId || '');
  const [quotes, setQuotes] = useState([]);
  const [selectedRfqDetails, setSelectedRfqDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRfqs();
  }, []);

  useEffect(() => {
    if (rfqId) {
      fetchQuotes(rfqId);
      const details = rfqs.find(r => r._id === rfqId);
      setSelectedRfqDetails(details || null);
    } else {
      setQuotes([]);
      setSelectedRfqDetails(null);
    }
  }, [rfqId, rfqs]);

  useEffect(() => {
    if (selectedRfqId) {
      setRfqId(selectedRfqId);
    }
  }, [selectedRfqId]);

  const fetchRfqs = async () => {
    try {
      const data = await apiFetch('/rfqs');
      // Show both published and closed for comparison references
      setRfqs(data);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async (id) => {
    try {
      const quotesData = await apiFetch(`/quotations/rfq/${id}`);
      setQuotes(quotesData);
    } catch (err) {
      console.error('Error fetching quotations for RFQ:', err);
    }
  };

  const handleAlertManager = async (quote) => {
    try {
      // Simulate sending alert
      showToast(`Recommendation sent! Simulated email dispatched to manager@vendorbridge.com`, 'success');
      
      // Dispatch simulated email
      logSimulatedEmail({
        to: 'manager@vendorbridge.com',
        subject: `⚠️ Procurement Recommendation Alert: RFQ [${selectedRfqDetails.title}]`,
        body: `Hello Manager Suresh,\n\nProcurement Officer ${user.name} has compared the bids for "${selectedRfqDetails.title}" and recommends the quote from vendor "${quote.vendorName}" for approval.\n\nBid Price: ₹${quote.price.toLocaleString()}\nTimeline: ${quote.deliveryTimeline}\n\nPlease review and action this at your earliest convenience.\n\nLink: http://localhost:3000/approvals\n\nRegards,\nVendorBridge Workflow Automation`
      });

      // Write system log
      await apiFetch('/logs', {
        method: 'POST',
        body: JSON.stringify({
          action: 'QUOTE_RECOMMENDED',
          details: `Officer recommended ${quote.vendorName} quotation (₹${quote.price}) for RFQ "${selectedRfqDetails.title}"`
        })
      });

    } catch (err) {
      showToast('Error registering recommendation', 'error');
    }
  };

  // Find lowest price and fastest delivery quotes to highlight
  let lowestPriceQuoteId = null;
  let fastestDeliveryQuoteId = null;

  if (quotes.length > 0) {
    // Lowest price
    const sortedByPrice = [...quotes].sort((a, b) => a.price - b.price);
    lowestPriceQuoteId = sortedByPrice[0]._id;

    // Fastest delivery (parse number of days)
    const getDays = (timeline) => {
      const match = timeline.match(/\d+/);
      return match ? parseInt(match[0]) : 999;
    };
    const sortedByTimeline = [...quotes].sort((a, b) => getDays(a.deliveryTimeline) - getDays(b.deliveryTimeline));
    fastestDeliveryQuoteId = sortedByTimeline[0]._id;
  }

  const isOfficer = user.role === 'officer' || user.role === 'admin';

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>Quotation Comparison Studio</h1>
      </div>

      <div className="glass-panel">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select RFQ to Compare Bids</label>
          <select
            className="form-control"
            value={rfqId}
            onChange={(e) => {
              setRfqId(e.target.value);
              setSelectedRfqId(e.target.value);
            }}
          >
            <option value="">-- Choose RFQ --</option>
            {rfqs.map((rfq) => (
              <option key={rfq._id} value={rfq._id}>
                {rfq.title} ({rfq.status === 'published' ? 'Active' : 'Closed'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRfqDetails && (
        <div className="glass-panel" style={{ padding: '1.25rem 2.0rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            RFQ Specifications Details
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {selectedRfqDetails.specification}
          </p>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            <span>Quantity Required: <strong>{selectedRfqDetails.quantity}</strong></span>
            <span>Target Deadline: <strong>{new Date(selectedRfqDetails.deadline).toLocaleDateString()}</strong></span>
            <span>Current Status: <strong style={{ color: 'var(--color-primary)' }}>{selectedRfqDetails.status.toUpperCase()}</strong></span>
          </div>
        </div>
      )}

      {rfqId && (
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title">Side-by-Side Quotation Matrix</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {quotes.length} Bid(s) Received
            </span>
          </div>

          {quotes.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2.5rem' }}>
              No quotes submitted for this RFQ yet. Assign vendors or wait for vendor submission.
            </div>
          ) : (
            <div className="comparison-grid">
              {quotes.map((quote) => {
                const isLowest = quote._id === lowestPriceQuoteId;
                const isFastest = quote._id === fastestDeliveryQuoteId;
                
                // Set class based on highlighting
                let cardClass = "comparison-card";
                if (isLowest) cardClass += " lowest-price";
                else if (isFastest) cardClass += " fastest-delivery";

                return (
                  <div key={quote._id} className={cardClass}>
                    {isLowest && <span className="card-ribbon ribbon-success">★ Lowest Price</span>}
                    {isFastest && !isLowest && <span className="card-ribbon ribbon-info">⚡ Fastest Delivery</span>}

                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {quote.vendorName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Vendor rating: ★ 4.5/5.0
                    </div>

                    <div className="compare-price">
                      ₹{quote.price.toLocaleString()}
                    </div>

                    <div className="compare-row">
                      <span>Delivery Time</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{quote.deliveryTimeline}</strong>
                    </div>

                    <div className="compare-row">
                      <span>Submission Date</span>
                      <span>{new Date(quote.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="compare-row">
                      <span>Workflow Status</span>
                      <span className={`status-badge status-${quote.status}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                        {quote.status}
                      </span>
                    </div>

                    {quote.notes && (
                      <div style={{ margin: '0.75rem 0', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', minHeight: '60px' }}>
                        <strong>Notes:</strong> {quote.notes}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                      {isOfficer && quote.status === 'pending' ? (
                        <button
                          onClick={() => handleAlertManager(quote)}
                          className="btn btn-primary"
                          style={{ width: '100%', fontSize: '0.8rem' }}
                        >
                          Recommend & Alert Manager
                        </button>
                      ) : quote.status === 'approved' ? (
                        <button
                          onClick={() => setCurrentPage('invoices')}
                          className="btn btn-success"
                          style={{ width: '100%', fontSize: '0.8rem' }}
                        >
                          View PO & Invoices
                        </button>
                      ) : (
                        <button
                          disabled
                          className="btn btn-secondary"
                          style={{ width: '100%', fontSize: '0.8rem', cursor: 'not-allowed' }}
                        >
                          {quote.status.toUpperCase()}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

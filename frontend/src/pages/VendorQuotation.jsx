import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function VendorQuotation({ selectedRfqId, setSelectedRfqId }) {
  const { apiFetch, user, showToast } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [assignedRfqs, setAssignedRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [rfqId, setRfqId] = useState(selectedRfqId || '');
  const [price, setPrice] = useState('');
  const [deliveryTimeline, setDeliveryTimeline] = useState('7 Days');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  // Keep dropdown in sync if navigated from RFQ page with selection
  useEffect(() => {
    if (selectedRfqId) {
      setRfqId(selectedRfqId);
    }
  }, [selectedRfqId]);

  const fetchData = async () => {
    try {
      // Fetch user's quotations (or all if officer/manager)
      const quotesData = await apiFetch('/quotations');
      setQuotations(quotesData);

      // If user is a vendor, fetch assigned RFQs
      if (user.role === 'vendor') {
        const rfqsData = await apiFetch('/rfqs');
        // Filter RFQs that are active (published)
        setAssignedRfqs(rfqsData.filter(r => r.status === 'published'));
      }
    } catch (err) {
      console.error('Error fetching quotations details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rfqId) {
      showToast('Please select a Request for Quotation (RFQ)', 'warning');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showToast('Please enter a valid quotation amount', 'warning');
      return;
    }

    try {
      await apiFetch('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          rfqId,
          price: parseFloat(price),
          deliveryTimeline,
          notes
        })
      });

      showToast('Quotation submitted successfully!', 'success');
      
      // Reset form
      setPrice('');
      setDeliveryTimeline('7 Days');
      setNotes('');
      setSelectedRfqId(''); // Clear selection context
      setRfqId('');

      // Refresh list
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to submit quotation', 'error');
    }
  };

  const isVendor = user.role === 'vendor';

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>
          {isVendor ? 'Vendor Quotation Desk' : 'All Quotations'}
        </h1>
      </div>

      {isVendor && (
        <div className="glass-panel">
          <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>📤 Submit Bidding Quotation</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Active RFQ</label>
              <select
                className="form-control"
                value={rfqId}
                onChange={(e) => setRfqId(e.target.value)}
                required
              >
                <option value="">-- Choose Assigned RFQ --</option>
                {assignedRfqs.map((rfq) => (
                  <option key={rfq._id} value={rfq._id}>
                    {rfq.title} (Qty: {rfq.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Proposed Bid Price (INR - including tax/logistics)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 450000"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Delivery Timeline</label>
                <select
                  className="form-control"
                  value={deliveryTimeline}
                  onChange={(e) => setDeliveryTimeline(e.target.value)}
                  required
                >
                  <option value="3 Days">3 Days</option>
                  <option value="5 Days">5 Days</option>
                  <option value="7 Days">7 Days</option>
                  <option value="10 Days">10 Days</option>
                  <option value="14 Days">14 Days</option>
                  <option value="21 Days">21 Days</option>
                  <option value="30 Days">30 Days</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quotational Notes & Remarks (Optional)</label>
              <textarea
                className="form-control"
                placeholder="Detail warranties, package items, transport terms, or discounts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Submit Binding Bid
            </button>
          </form>
        </div>
      )}

      <div className="glass-panel">
        <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>
          {isVendor ? 'Your Submission History' : 'Received Quotation Stream'}
        </h3>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading quotation database...</div>
        ) : quotations.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
            No quotations found.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>RFQ Reference</th>
                  {!isVendor && <th>Vendor Name</th>}
                  <th>Quoted Price</th>
                  <th>Timeline</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Manager Remarks</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quote) => (
                  <tr key={quote._id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{quote.rfqTitle}</strong>
                      {quote.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          Note: "{quote.notes}"
                        </div>
                      )}
                    </td>
                    {!isVendor && (
                      <td>
                        <strong>{quote.vendorName}</strong>
                      </td>
                    )}
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                        ₹{quote.price.toLocaleString()}
                      </strong>
                    </td>
                    <td>{quote.deliveryTimeline}</td>
                    <td>{new Date(quote.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <span className={`status-badge status-${quote.status}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: quote.remarks ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                        {quote.remarks || 'No remarks provided.'}
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

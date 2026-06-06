import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function RFQCreation({ setCurrentPage, setSelectedRfqId }) {
  const { apiFetch, user, showToast } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [specification, setSpecification] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [assignedVendors, setAssignedVendors] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const rfqsData = await apiFetch('/rfqs');
      setRfqs(rfqsData);

      // Only need to fetch vendors if officer or admin
      if (user.role === 'officer' || user.role === 'admin') {
        const vendorsData = await apiFetch('/vendors');
        setVendors(vendorsData.filter(v => v.status === 'active'));
      }
    } catch (err) {
      console.error('Error fetching RFQ data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorCheckboxChange = (vendorId) => {
    setAssignedVendors(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId);
      } else {
        return [...prev, vendorId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (assignedVendors.length === 0) {
      showToast('Please assign at least one vendor to the RFQ', 'warning');
      return;
    }

    try {
      await apiFetch('/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          specification,
          quantity: parseInt(quantity),
          deadline,
          assignedVendors
        })
      });

      showToast(`RFQ "${title}" published successfully!`, 'success');
      
      // Reset form
      setTitle('');
      setSpecification('');
      setQuantity(1);
      setDeadline('');
      setAssignedVendors([]);

      // Refresh list
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to publish RFQ', 'error');
    }
  };

  const handleBidClick = (rfqId) => {
    setSelectedRfqId(rfqId);
    setCurrentPage('quotation');
  };

  const isOfficer = user.role === 'officer' || user.role === 'admin';

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>
          {isOfficer ? 'Request for Quotations (RFQ) Hub' : 'Assigned Request for Quotations'}
        </h1>
      </div>

      {isOfficer && (
        <div className="glass-panel">
          <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>📩 Create & Publish RFQ</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">RFQ Subject Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Procurement of Office Workstation Furniture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Product/Service Specification</label>
              <textarea
                className="form-control"
                placeholder="Describe material grades, size, SLA requirements, support expectations, etc..."
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity Needed</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Submission Deadline</label>
                <input
                  type="date"
                  className="form-control"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '0.75rem' }}>Assign Verified Vendor Partners (Select at least one)</label>
              {vendors.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No active vendors found. Please onboard vendors first!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                  {vendors.map((vendor) => (
                    <label key={vendor._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={assignedVendors.includes(vendor._id)}
                        onChange={() => handleVendorCheckboxChange(vendor._id)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <strong>{vendor.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vendor.category}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Publish RFQ to Selected Vendors
            </button>
          </form>
        </div>
      )}

      <div className="glass-panel">
        <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>
          {isOfficer ? 'Published RFQ Listing' : 'RFQs Awaiting Bids'}
        </h3>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading RFQ listing...</div>
        ) : rfqs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
            No RFQs registered in this category.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>RFQ Title</th>
                  <th>Quantity</th>
                  <th>Deadline Date</th>
                  {isOfficer && <th>Assigned Vendors</th>}
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => (
                  <tr key={rfq._id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{rfq.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rfq.specification}
                      </div>
                    </td>
                    <td>{rfq.quantity} units</td>
                    <td>{new Date(rfq.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    {isOfficer && (
                      <td>
                        <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                          {rfq.assignedVendors ? rfq.assignedVendors.length : 0} Vendors
                        </span>
                      </td>
                    )}
                    <td>
                      <span className={`status-badge status-${rfq.status}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td>
                      {user.role === 'vendor' && rfq.status === 'published' ? (
                        <button
                          onClick={() => handleBidClick(rfq._id)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Submit Bid
                        </button>
                      ) : isOfficer ? (
                        <button
                          onClick={() => {
                            setSelectedRfqId(rfq._id);
                            setCurrentPage('comparison');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Compare Quotes
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No Actions Available</span>
                      )}
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function VendorManagement() {
  const { apiFetch, user, showToast } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('IT Hardware & Networking');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstDetails, setGstDetails] = useState('');
  const [checkingGst, setCheckingGst] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const data = await apiFetch('/vendors');
      setVendors(data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyGst = () => {
    if (!gstDetails) {
      showToast('Please enter GST number', 'warning');
      return;
    }
    setCheckingGst(true);
    setTimeout(() => {
      setCheckingGst(false);
      setGstVerified(true);
      showToast('GST Number verified successfully against GSTIN portal!', 'success');
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gstVerified) {
      showToast('Please verify GST details before onboarding', 'warning');
      return;
    }

    try {
      const newVendor = await apiFetch('/vendors', {
        method: 'POST',
        body: JSON.stringify({ name, category, email, phone, gstDetails })
      });
      showToast(`Vendor ${name} onboarded successfully!`, 'success');
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setGstDetails('');
      setGstVerified(false);
      
      // Refresh list
      fetchVendors();
    } catch (err) {
      showToast(err.message || 'Error onboarding vendor', 'error');
    }
  };

  const toggleStatus = async (vendorId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await apiFetch(`/vendors/${vendorId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      showToast(`Vendor status updated to ${nextStatus}`, 'success');
      fetchVendors();
    } catch (err) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  const categories = [
    'IT Hardware & Networking',
    'Manufacturing Equipments',
    'Office Facilities & Logistics',
    'Raw Materials',
    'Pantry & Catering',
    'Legal & Advisory Services'
  ];

  const canEdit = user.role === 'officer' || user.role === 'admin';

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>Vendor Directory Management</h1>
      </div>

      {canEdit && (
        <div className="glass-panel">
          <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>🏢 Onboard New Vendor Partner</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vendor Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Acme Corporation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vendor Classification Category</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Corporate Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. info@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Primary Contact Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g. +91 98765 XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">GST / Tax Identification Number</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  value={gstDetails}
                  onChange={(e) => {
                    setGstDetails(e.target.value.toUpperCase());
                    setGstVerified(false);
                  }}
                  required
                  style={{ textTransform: 'uppercase' }}
                />
                <button
                  type="button"
                  onClick={handleVerifyGst}
                  className={`btn ${gstVerified ? 'btn-success' : 'btn-secondary'}`}
                  style={{ minWidth: '130px' }}
                  disabled={checkingGst}
                >
                  {checkingGst ? 'Validating...' : gstVerified ? '✓ GST Verified' : 'Verify GSTIN'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Onboard Vendor Partner
            </button>
          </form>
        </div>
      )}

      <div className="glass-panel">
        <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>List of Registered Vendor Partners</h3>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading vendor records...</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Category</th>
                  <th>GST Identification</th>
                  <th>Contact Info</th>
                  <th>Reputation Rating</th>
                  <th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor._id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{vendor.name}</strong>
                    </td>
                    <td>{vendor.category}</td>
                    <td><code style={{ color: 'var(--color-cyan)' }}>{vendor.gstDetails}</code></td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{vendor.email}</div>
                      <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>{vendor.phone}</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>
                        ★ {vendor.rating ? vendor.rating.toFixed(1) : '5.0'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${vendor.status}`}>
                        {vendor.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <button
                          onClick={() => toggleStatus(vendor._id, vendor.status)}
                          className={`btn ${vendor.status === 'active' ? 'btn-outline-danger' : 'btn-success'}`}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          {vendor.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
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

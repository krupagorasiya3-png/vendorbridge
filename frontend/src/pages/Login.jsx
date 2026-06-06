import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  const handleQuickLogin = async (roleEmail) => {
    setSubmitting(true);
    setEmail(roleEmail);
    setPassword('password');
    await login(roleEmail, 'password');
    setSubmitting(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card animate-fade">
        <div className="login-logo">VendorBridge</div>
        <div className="login-subtitle">Procurement & Vendor ERP System</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. officer@vendorbridge.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-roles-section">
          <div className="quick-roles-title">Hackathon Quick-Role Access</div>
          <div className="quick-roles-grid">
            <button
              onClick={() => handleQuickLogin('officer@vendorbridge.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem' }}
            >
              🧑 Officer (Neera)
            </button>
            <button
              onClick={() => handleQuickLogin('vendor@vendorbridge.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem' }}
            >
              🏭 Vendor (Apex)
            </button>
            <button
              onClick={() => handleQuickLogin('manager@vendorbridge.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem' }}
            >
              👨‍💼 Manager (Suresh)
            </button>
            <button
              onClick={() => handleQuickLogin('admin@vendorbridge.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem' }}
            >
              🛠️ Admin (Aravind)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

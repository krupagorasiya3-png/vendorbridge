import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ setCurrentPage }) {
  const { apiFetch, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = await apiFetch('/analytics/dashboard');
      setData(result);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading ERP Analytics...</div>;
  }

  const { counts, finance, recentLogs } = data || {
    counts: { vendors: 0, rfqs: 0, quotations: 0, pos: 0, invoices: 0, activeRfqs: 0, closedRfqs: 0 },
    finance: { totalSpend: 0, pendingPayment: 0 },
    recentLogs: []
  };

  return (
    <div className="animate-fade">
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', fontWeight: 800 }}>
              Welcome back, {user.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              VendorBridge is active. Storage Mode: <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>Dual-Mode (Auto-detected)</span>.
            </p>
          </div>
          <div className={`user-role-badge badge-${user.role}`}>
            {user.role} VIEW
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-title">Active RFQs</span>
          <div className="metric-val">{counts.activeRfqs}</div>
          <span className="metric-sub">{counts.closedRfqs} closed RFQs</span>
        </div>

        {user.role !== 'vendor' && (
          <div className="metric-card">
            <span className="metric-title">Registered Vendors</span>
            <div className="metric-val">{counts.vendors}</div>
            <span className="metric-sub">Active & Verified database</span>
          </div>
        )}

        <div className="metric-card">
          <span className="metric-title">Purchase Orders</span>
          <div className="metric-val">{counts.pos}</div>
          <span className="metric-sub">Issued PO contracts</span>
        </div>

        <div className="metric-card">
          <span className="metric-title">{user.role === 'vendor' ? 'Your Billing' : 'Total Spending'}</span>
          <div className="metric-val">₹{(finance.totalSpend / 100000).toFixed(2)}L</div>
          <span className="metric-sub">Pending Unpaid: ₹{(finance.pendingPayment / 100000).toFixed(2)}L</span>
        </div>
      </div>

      {/* Quick Action Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem' }}>
        <h3 className="panel-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Shortcuts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {user.role === 'officer' && (
            <>
              <button onClick={() => setCurrentPage('rfqs')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                📩 New RFQ Creation
              </button>
              <button onClick={() => setCurrentPage('vendors')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                🏢 Register New Vendor
              </button>
              <button onClick={() => setCurrentPage('comparison')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                ⚖️ Compare Quotations
              </button>
            </>
          )}

          {user.role === 'vendor' && (
            <>
              <button onClick={() => setCurrentPage('rfqs')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                📥 View Assigned RFQs
              </button>
              <button onClick={() => setCurrentPage('pos')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                🧾 View Issued POs
              </button>
            </>
          )}

          {user.role === 'manager' && (
            <button onClick={() => setCurrentPage('approvals')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }}>
              ✅ Quotation Approvals Desk
            </button>
          )}

          <button onClick={() => setCurrentPage('analytics')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }}>
            📊 Spending & Ratings Analytics
          </button>

          <button onClick={() => setCurrentPage('helper')} className="btn btn-primary" style={{ justifyContent: 'flex-start', padding: '1rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-purple))' }}>
            🧠 Hackathon Pitch & Report
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Logs & General Information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Activity Logs */}
        <div className="glass-panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <h3 className="panel-title">Audit Log Activities</h3>
            <button onClick={() => setCurrentPage('logs')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity logged.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log._id} style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{log.userName} ({log.userRole})</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {log.action}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {log.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Overview Details */}
        <div className="glass-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-header">
              <h3 className="panel-title">Active Database Status</h3>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span>Storage System:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{data?.databaseMode || 'Local JSON Files'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span>API Endpoint:</span>
                <code style={{ color: 'var(--color-cyan)' }}>http://localhost:5000/api</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span>User Account:</span>
                <span style={{ color: 'var(--text-primary)' }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                <span>Verification State:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>READY (Hackathon Mode)</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
            <strong>💡 Hackathon Note:</strong> You can simulate the entire workflow from Vendor registration to quotation, quotation comparison, manager decision, PO generation, and invoice mailing. The in-app Simulated Inbox helps you view emails without external network dependencies.
          </div>
        </div>
      </div>
    </div>
  );
}

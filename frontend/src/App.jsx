import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VendorManagement from './pages/VendorManagement';
import RFQCreation from './pages/RFQCreation';
import VendorQuotation from './pages/VendorQuotation';
import QuotationComparison from './pages/QuotationComparison';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import POInvoice from './pages/POInvoice';
import LogsNotifications from './pages/LogsNotifications';
import Analytics from './pages/Analytics';
import HackathonHelper from './pages/HackathonHelper';

import './App.css';

function MainAppShell() {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedRfqId, setSelectedRfqId] = useState('');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0e1a', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'sans-serif', fontSize: '1.25rem', fontWeight: 600 }}>VendorBridge ERP</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>Loading secure ERP terminal...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'vendors':
        return <VendorManagement />;
      case 'rfqs':
        return <RFQCreation setCurrentPage={setCurrentPage} setSelectedRfqId={setSelectedRfqId} />;
      case 'quotation':
        return <VendorQuotation selectedRfqId={selectedRfqId} setSelectedRfqId={setSelectedRfqId} />;
      case 'comparison':
        return <QuotationComparison selectedRfqId={selectedRfqId} setSelectedRfqId={setSelectedRfqId} setCurrentPage={setCurrentPage} />;
      case 'approvals':
        return <ApprovalWorkflow />;
      case 'invoices':
        return <POInvoice />;
      case 'logs':
        return <LogsNotifications />;
      case 'analytics':
        return <Analytics />;
      case 'helper':
        return <HackathonHelper />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Command Center Overview';
      case 'vendors': return 'Vendor Database Management';
      case 'rfqs': return 'RFQ Broadcast Operations';
      case 'quotation': return 'Vendor Bids submission';
      case 'comparison': return 'Quotation Comparison Matrices';
      case 'approvals': return 'Management Sign-Off Portal';
      case 'invoices': return 'Financial Ledger Documents';
      case 'logs': return 'Security Logs & Auditing';
      case 'analytics': return 'Spending & SLA Analytics';
      case 'helper': return 'Hackathon Pitch helper';
      default: return 'VendorBridge ERP';
    }
  };

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-text">
            <span>🌉</span> VendorBridge
          </div>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => setCurrentPage('dashboard')} className={`sidebar-item ${currentPage === 'dashboard' ? 'active' : ''}`}>
            🏠 Dashboard Home
          </li>
          
          {user.role !== 'vendor' && (
            <li onClick={() => setCurrentPage('vendors')} className={`sidebar-item ${currentPage === 'vendors' ? 'active' : ''}`}>
              🏢 Vendor Directory
            </li>
          )}

          <li onClick={() => setCurrentPage('rfqs')} className={`sidebar-item ${currentPage === 'rfqs' ? 'active' : ''}`}>
            📩 Request for Quotes
          </li>

          {user.role === 'vendor' && (
            <li onClick={() => setCurrentPage('quotation')} className={`sidebar-item ${currentPage === 'quotation' ? 'active' : ''}`}>
              📤 Submit Quotes
            </li>
          )}

          {user.role !== 'vendor' && (
            <li onClick={() => setCurrentPage('comparison')} className={`sidebar-item ${currentPage === 'comparison' ? 'active' : ''}`}>
              ⚖️ Compare Quotations
            </li>
          )}

          {user.role !== 'vendor' && (
            <li onClick={() => setCurrentPage('approvals')} className={`sidebar-item ${currentPage === 'approvals' ? 'active' : ''}`}>
              ✅ Approvals Desk
            </li>
          )}

          <li onClick={() => setCurrentPage('invoices')} className={`sidebar-item ${currentPage === 'invoices' ? 'active' : ''}`}>
            🧾 POs & Invoices
          </li>

          {user.role !== 'vendor' && (
            <li onClick={() => setCurrentPage('analytics')} className={`sidebar-item ${currentPage === 'analytics' ? 'active' : ''}`}>
              📊 Reports & Stats
            </li>
          )}

          <li onClick={() => setCurrentPage('logs')} className={`sidebar-item ${currentPage === 'logs' ? 'active' : ''}`}>
            🔔 Audit Activity Logs
          </li>

          <li onClick={() => setCurrentPage('helper')} className={`sidebar-item ${currentPage === 'helper' ? 'active' : ''}`} style={{ marginTop: 'auto', border: '1px dashed var(--color-cyan)', color: 'var(--color-cyan)', background: 'rgba(6, 182, 212, 0.03)' }}>
            🧠 Hackathon Helper
          </li>
        </ul>

        {/* User Card at bottom of sidebar */}
        <div className="sidebar-user">
          <div className="user-name">{user.name}</div>
          <span className={`user-role-badge badge-${user.role}`}>{user.role}</span>
        </div>
      </aside>

      {/* 2. Header and Main Workspace Panel */}
      <div className="main-content">
        <header className="navbar">
          <h2 className="nav-title">{getPageTitle()}</h2>
          <div className="nav-actions">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Server: <strong style={{ color: 'var(--color-success)' }}>Online</strong>
            </span>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              🚪 Log Out
            </button>
          </div>
        </header>

        <main style={{ marginTop: '1rem' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppShell />
    </AuthProvider>
  );
}

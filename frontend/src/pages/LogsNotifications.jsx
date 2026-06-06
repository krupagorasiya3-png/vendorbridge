import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LogsNotifications() {
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let result = [...logs];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(log => 
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term)
      );
    }

    if (filterAction !== 'ALL') {
      result = result.filter(log => log.action.includes(filterAction));
    }

    setFilteredLogs(result);
  }, [search, filterAction, logs]);

  const fetchLogs = async () => {
    try {
      const logsData = await apiFetch('/logs');
      setLogs(logsData);
      setFilteredLogs(logsData);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('REGISTER') || action.includes('CREATE')) return 'var(--color-primary)';
    if (action.includes('DECISION') || action.includes('APPROVAL')) return 'var(--color-warning)';
    if (action.includes('AUTO_GENERATE')) return 'var(--color-cyan)';
    if (action.includes('EMAIL') || action.includes('PRINT')) return 'var(--color-purple)';
    if (action.includes('LOGIN')) return 'var(--color-success)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>System Audit Trails & Alerts</h1>
        <button onClick={fetchLogs} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
          ↻ Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ flexGrow: 1, margin: 0 }}>
            <label className="form-label">Search Activity Logs</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by user, action, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ width: '220px', margin: 0 }}>
            <label className="form-label">Filter Action Type</label>
            <select
              className="form-control"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Logins</option>
              <option value="VENDOR">Vendors</option>
              <option value="RFQ">RFQs</option>
              <option value="QUOTE">Quotes & Bids</option>
              <option value="PO">Purchase Orders</option>
              <option value="INV">Invoices</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel">
        <div className="panel-header">
          <h3 className="panel-title">ERP Operations Log (Immutable Ledger)</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing {filteredLogs.length} events
          </span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading ledger feed...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No logs matched your query.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operator</th>
                  <th>Action Code</th>
                  <th>Detailed Log Entry</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div>
                        <strong>{log.userName}</strong>
                      </div>
                      <span className={`user-role-badge badge-${log.userRole}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.25rem' }}>
                        {log.userRole}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: getActionColor(log.action), fontWeight: 800, fontSize: '0.825rem', fontFamily: 'monospace' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.details}
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

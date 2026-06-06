import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Analytics() {
  const { apiFetch } = useAuth();
  const [spending, setSpending] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const spendingData = await apiFetch('/analytics/spending');
      setSpending(spendingData);

      const perfData = await apiFetch('/analytics/vendor-performance');
      setPerformance(perfData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find max spending amount for chart scaling
  const maxAmount = spending.length > 0 ? Math.max(...spending.map(s => s.amount), 100000) : 100000;

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>Procurement & Financial Analytics</h1>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Compiling analytics matrices...</div>
      ) : (
        <>
          {/* Monthly Spend Chart Card */}
          <div className="glass-panel">
            <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.5rem' }}>📈 Monthly Expenditure Analysis (INR)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Custom CSS Bar Chart */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '260px', background: 'rgba(0,0,0,0.2)', padding: '2rem 1rem 1rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', position: 'relative' }}>
                {spending.map((item) => {
                  const percentageHeight = (item.amount / maxAmount) * 100;
                  return (
                    <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', height: '100%' }}>
                      {/* Bar and value on hover */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', height: '80%', position: 'relative' }}>
                        {/* Value tooltip */}
                        <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-cyan)', opacity: item.amount > 0 ? 1 : 0.4 }}>
                          ₹{(item.amount / 1000).toFixed(0)}k
                        </div>
                        {/* Color gradient based on spending */}
                        <div style={{
                          height: `${Math.max(percentageHeight, 5)}%`,
                          background: 'linear-gradient(to top, var(--color-primary), var(--color-cyan))',
                          borderRadius: '6px 6px 0 0',
                          width: '100%',
                          transition: 'height 1s ease-out',
                          boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)'
                        }} />
                      </div>
                      {/* Label */}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', fontWeight: 600 }}>
                        {item.month}
                      </span>
                    </div>
                  );
                })}

                {/* Background Grid Lines helper */}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '20%', borderBottom: '1px dashed rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '50%', borderBottom: '1px dashed rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '80%', borderBottom: '1px dashed rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Vendor Performance Reports */}
          <div className="glass-panel">
            <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>🎯 Vendor Performance and Bid Success Rate</h3>
            
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Category</th>
                    <th>Quality Rating</th>
                    <th>Total Bids</th>
                    <th>Approved Contracts</th>
                    <th>Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((v) => (
                    <tr key={v.name}>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{v.name}</strong></td>
                      <td>{v.category}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ color: 'var(--color-warning)', fontWeight: 800 }}>★</span>
                          <span>{v.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </td>
                      <td>{v.totalBids} submitted</td>
                      <td>{v.approvedBids} approved</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ flexGrow: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', overflow: 'hidden', minWidth: '80px' }}>
                            <div style={{
                              width: `${v.successRate}%`,
                              height: '100%',
                              backgroundColor: v.successRate > 50 ? 'var(--color-success)' : v.successRate > 20 ? 'var(--color-warning)' : 'var(--color-primary)'
                            }} />
                          </div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{v.successRate}%</strong>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function POInvoice() {
  const { apiFetch, user, showToast, logSimulatedEmail, simulatedEmails } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('invoices'); // 'pos' or 'invoices'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const invoicesData = await apiFetch('/invoices');
      setInvoices(invoicesData);
      
      const posData = await apiFetch('/pos');
      setPurchaseOrders(posData);

      if (invoicesData.length > 0) {
        setSelectedInvoice(invoicesData[0]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const logInvoiceAction = async (invoiceId, action, details) => {
    try {
      const result = await apiFetch(`/invoices/${invoiceId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, details })
      });
      // Update local invoice state
      setSelectedInvoice(result.invoice);
      setInvoices(prev => prev.map(inv => inv._id === invoiceId ? result.invoice : inv));
    } catch (err) {
      console.error('Error logging invoice action:', err);
    }
  };

  const handlePrint = () => {
    if (!selectedInvoice) return;
    logInvoiceAction(selectedInvoice._id, 'print', 'Invoice printed using native print options');
    showToast(`Opening browser print dialogue for Invoice ${selectedInvoice.invoiceNumber}`, 'success');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownload = () => {
    if (!selectedInvoice) return;
    logInvoiceAction(selectedInvoice._id, 'download', 'Invoice PDF generated and downloaded');
    showToast(`Simulated download: PDF file [${selectedInvoice.invoiceNumber}.pdf] successfully saved!`, 'success');
  };

  const handleSendEmail = () => {
    if (!selectedInvoice) return;
    
    const recipientEmail = 'finance@vendorbridge.com';
    const vendorEmail = 'sales@apexsupplies.com';

    logInvoiceAction(selectedInvoice._id, 'email', `Invoice dispatched electronically to ${recipientEmail} and ${vendorEmail}`);
    showToast(`Invoice email dispatched successfully! Checked Simulated Inbox.`, 'success');

    logSimulatedEmail({
      to: `${recipientEmail}, ${vendorEmail}`,
      subject: `🧾 Electronic Invoice Dispatch: ${selectedInvoice.invoiceNumber}`,
      body: `Hello Team,\n\nPlease find attached the official invoice generated for Purchase Order ${selectedInvoice.poNumber}.\n\nInvoice ID: ${selectedInvoice.invoiceNumber}\nDescription: ${selectedInvoice.rfqTitle}\nTotal Payable: ₹${selectedInvoice.totalAmount.toLocaleString()} (Subtotal: ₹${selectedInvoice.subtotal.toLocaleString()} + 18% GST: ₹${selectedInvoice.taxAmount.toLocaleString()})\nPayment Status: ${selectedInvoice.status.toUpperCase()}\n\nPlease process the payment at your earliest convenience.\n\nThank you,\nFinance Department\nVendorBridge ERP`
    });
  };

  const togglePaymentStatus = async (invoice) => {
    const nextStatus = invoice.status === 'paid' ? 'unpaid' : 'paid';
    try {
      // Direct update in routes
      const result = await apiFetch(`/invoices/${invoice._id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action: 'print', details: `Payment status toggled to ${nextStatus}` })
      });
      
      // Update invoice status locally by fetching again
      await apiFetch(`/logs`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'PAYMENT_TOGGLE',
          details: `Invoice ${invoice.invoiceNumber} status changed to ${nextStatus.toUpperCase()}`
        })
      });
      
      showToast(`Invoice ${invoice.invoiceNumber} status set to ${nextStatus.toUpperCase()}`, 'success');
      fetchDocuments();
    } catch (err) {
      showToast('Error toggling payment status', 'error');
    }
  };

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>Financial Document Control Center</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🧾 Customer Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`btn ${activeTab === 'pos' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📦 Purchase Orders ({purchaseOrders.length})
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading documents database...</div>
      ) : activeTab === 'pos' ? (
        // PURCHASE ORDERS VIEW
        <div className="glass-panel">
          <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Purchase Order Logs</h3>
          {purchaseOrders.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No Purchase Orders have been generated yet. Approve quotations to issue POs.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>RFQ Reference</th>
                    <th>Vendor Partner</th>
                    <th>Issued Date</th>
                    <th>Contract Value</th>
                    <th>Contract Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po._id}>
                      <td><code style={{ color: 'var(--color-cyan)', fontWeight: 'bold' }}>{po.poNumber}</code></td>
                      <td>{po.rfqTitle}</td>
                      <td><strong>{po.vendorName}</strong></td>
                      <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td><strong style={{ color: 'var(--text-primary)' }}>₹{po.totalAmount.toLocaleString()}</strong></td>
                      <td>
                        <span className="status-badge status-approved" style={{ fontSize: '0.65rem' }}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // INVOICES VIEW (with Master-Detail split pane)
        <div className="doc-viewer-grid">
          {/* Master List */}
          <div className="doc-list">
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Invoices List
            </div>
            {invoices.length === 0 ? (
              <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                No Invoices available.
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv._id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`doc-list-item ${selectedInvoice?._id === inv._id ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <code style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>{inv.invoiceNumber}</code>
                    <span className={`status-badge status-${inv.status}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                      {inv.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.rfqTitle}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>{inv.vendorName}</span>
                    <span>₹{inv.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Preview Panel */}
          <div className="invoice-preview-container">
            {selectedInvoice ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 700 }}>
                      Invoice Details: {selectedInvoice.invoiceNumber}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Associated Purchase Order: <strong>{selectedInvoice.poNumber}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => togglePaymentStatus(selectedInvoice)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Toggle Paid Status
                      </button>
                    )}
                    <button onClick={handlePrint} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                      🖨️ Print
                    </button>
                    <button onClick={handleDownload} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                      💾 Save PDF
                    </button>
                    <button onClick={handleSendEmail} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                      ✉️ Send Email
                    </button>
                  </div>
                </div>

                {/* Printable Invoice Sheet */}
                <div className="invoice-sheet">
                  <div className="invoice-header-row">
                    <div>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' }}>
                        VENDORBRIDGE
                      </h2>
                      <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        Procurement Automation ERP Systems
                      </p>
                    </div>
                    <div className="invoice-metadata">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151' }}>INVOICE</h3>
                      <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.35rem' }}>
                        <div>Invoice No: <strong>{selectedInvoice.invoiceNumber}</strong></div>
                        <div>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</div>
                        <div>PO Ref: <code>{selectedInvoice.poNumber}</code></div>
                        <div>Status: <span style={{ textTransform: 'uppercase', fontWeight: 700, color: selectedInvoice.status === 'paid' ? '#10b981' : '#ef4444' }}>{selectedInvoice.status}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="invoice-parties">
                    <div>
                      <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Billed From (Vendor)
                      </h4>
                      <strong>{selectedInvoice.vendorName}</strong>
                      <div style={{ color: '#4b5563', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        <div>GSTIN: {selectedInvoice.vendorId === 'local_seedy_v1' || selectedInvoice.vendorName.includes('Apex') ? '27AAAAA1111A1Z1' : '27BBBBB2222B2Z2'}</div>
                        <div>Registered Address & Logistics Center</div>
                        <div>Email: vendor@vendorbridge.com</div>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Billed To (Organization)
                      </h4>
                      <strong>VendorBridge Corporate HQ</strong>
                      <div style={{ color: '#4b5563', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        <div>GSTIN: 27VNDBDG8829C1Z9</div>
                        <div>Procurement and Facilities Division</div>
                        <div>finance@vendorbridge.com</div>
                      </div>
                    </div>
                  </div>

                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Line Item Description</th>
                        <th style={{ textAlign: 'right' }}>Tax Code</th>
                        <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{selectedInvoice.rfqTitle}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>
                            Procured services contract as per approved technical specifications.
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', color: '#4b5563' }}>GST 18%</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{selectedInvoice.subtotal.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="invoice-totals">
                    <div className="invoice-total-row">
                      <span>Subtotal</span>
                      <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="invoice-total-row">
                      <span>Tax (18% GST)</span>
                      <span>₹{selectedInvoice.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="invoice-total-row grand-total">
                      <span>Total Invoice Value</span>
                      <span>₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '3rem', paddingTop: '1rem', fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center' }}>
                    This is a computer-generated document and does not require signature. Audit record registered.
                  </div>
                </div>

                {/* Audit Logs for this Invoice */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    Document Distribution Logs
                  </h4>
                  {selectedInvoice.distributionLogs && selectedInvoice.distributionLogs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedInvoice.distributionLogs.map((log, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{log.action.toUpperCase()}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{log.details}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No distribution logs registered for this document yet. Click Print, Save PDF, or Send Email.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Please select an invoice from the left panel to inspect details.
              </div>
            )}
          </div>

          {/* Email Inbox Preview Frame (displays at bottom of details if emails exist) */}
          {simulatedEmails.length > 0 && (
            <div className="inbox-viewer" style={{ gridColumn: 'span 2' }}>
              <div className="inbox-header">📬 Simulated Global Mail Inbox (Real-Time Output)</div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {simulatedEmails.map((email) => (
                  <div key={email.id} className="email-log-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.15rem' }}>
                      <strong>To: {email.to}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{email.timestamp}</span>
                    </div>
                    <div style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                      Subject: {email.subject}
                    </div>
                    <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: '1.4' }}>
                      {email.body}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

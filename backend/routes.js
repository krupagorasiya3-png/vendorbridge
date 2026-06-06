const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_super_secret_key_1337';

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Middleware: Require specific user roles
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}

// Helper: Log Activity
async function logActivity(req, action, details) {
  try {
    await db.create('ActivityLog', {
      userId: req.user ? req.user.id : 'system',
      userName: req.user ? req.user.name : 'System',
      userRole: req.user ? req.user.role : 'system',
      action,
      details
    });
  } catch (err) {
    console.error('Error writing audit log:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS (/api/auth)
// ==========================================

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, role, name, vendorId } = req.body;
    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await db.findOne('User', { email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.create('User', {
      email,
      password: hashedPassword,
      role,
      name,
      vendorId: role === 'vendor' ? vendorId : null
    });

    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const user = await db.findOne('User', { email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, vendorId: user.vendorId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Write login audit log
    await db.create('ActivityLog', {
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      details: `User logged into ERP system (${user.role})`
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        vendorId: user.vendorId
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.findById('User', req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      vendorId: user.vendorId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. VENDOR MANAGEMENT ENDPOINTS (/api/vendors)
// ==========================================

// GET /api/vendors
router.get('/vendors', authenticateToken, async (req, res) => {
  try {
    const vendors = await db.find('Vendor');
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vendors
router.post('/vendors', authenticateToken, requireRole(['officer', 'admin']), async (req, res) => {
  try {
    const { name, category, email, phone, gstDetails } = req.body;
    if (!name || !category || !email || !phone || !gstDetails) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const vendor = await db.create('Vendor', {
      name,
      category,
      email,
      phone,
      gstDetails,
      status: 'active',
      rating: 5.0
    });

    await logActivity(req, 'VENDOR_REGISTER', `Registered vendor "${name}" [GST: ${gstDetails}]`);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/vendors/:id/status
router.put('/vendors/:id/status', authenticateToken, requireRole(['officer', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await db.findByIdAndUpdate('Vendor', req.params.id, { status });
    if (!updated) return res.status(404).json({ message: 'Vendor not found' });

    await logActivity(req, 'VENDOR_STATUS_CHANGE', `Updated status of vendor "${updated.name}" to ${status}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. RFQ ENDPOINTS (/api/rfqs)
// ==========================================

// GET /api/rfqs
router.get('/rfqs', authenticateToken, async (req, res) => {
  try {
    let query = {};
    // If vendor, only show RFQs they are assigned to
    if (req.user.role === 'vendor') {
      query = { assignedVendors: req.user.vendorId };
    }
    const rfqs = await db.find('RFQ', query);
    res.json(rfqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rfqs
router.post('/rfqs', authenticateToken, requireRole(['officer', 'admin']), async (req, res) => {
  try {
    const { title, specification, quantity, deadline, assignedVendors } = req.body;
    if (!title || !specification || !quantity || !deadline || !assignedVendors) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const rfq = await db.create('RFQ', {
      title,
      specification,
      quantity,
      deadline: new Date(deadline),
      assignedVendors,
      status: 'published'
    });

    await logActivity(req, 'RFQ_CREATE', `Created RFQ "${title}" with ${assignedVendors.length} assigned vendors`);
    res.status(201).json(rfq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. QUOTATION ENDPOINTS (/api/quotations)
// ==========================================

// GET /api/quotations
router.get('/quotations', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      query = { vendorId: req.user.vendorId };
    }
    const quotes = await db.find('Quotation', query);
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quotations/rfq/:rfqId
router.get('/quotations/rfq/:rfqId', authenticateToken, async (req, res) => {
  try {
    const quotes = await db.find('Quotation', { rfqId: req.params.rfqId });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quotations
router.post('/quotations', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { rfqId, price, deliveryTimeline, notes } = req.body;
    if (!rfqId || !price || !deliveryTimeline) {
      return res.status(400).json({ message: 'Missing price or delivery timeline' });
    }

    const rfq = await db.findById('RFQ', rfqId);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });

    // Validate vendor assignment
    if (!rfq.assignedVendors.includes(req.user.vendorId)) {
      return res.status(403).json({ message: 'You are not assigned to this RFQ' });
    }

    const vendor = await db.findById('Vendor', req.user.vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor details not found' });

    const quote = await db.create('Quotation', {
      rfqId,
      rfqTitle: rfq.title,
      vendorId: req.user.vendorId,
      vendorName: vendor.name,
      price: parseFloat(price),
      deliveryTimeline,
      notes,
      status: 'pending'
    });

    await logActivity(req, 'QUOTE_SUBMIT', `Submitted bid for RFQ "${rfq.title}" of amount ₹${price}`);
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. APPROVAL ENDPOINTS (/api/approvals)
// ==========================================

// POST /api/approvals/:quoteId
router.post('/approvals/:quoteId', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { status, remarks } = req.body; // status must be 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    // Update Quotation Status
    const updatedQuote = await db.findByIdAndUpdate('Quotation', req.params.quoteId, {
      status,
      remarks: remarks || ''
    });

    if (!updatedQuote) return res.status(404).json({ message: 'Quotation not found' });

    // Audit the approval action
    await logActivity(req, 'QUOTE_DECISION', `${status.toUpperCase()} quotation from vendor "${updatedQuote.vendorName}" for RFQ "${updatedQuote.rfqTitle}"`);

    // If quotation is approved, we automatically update RFQ status to 'closed'
    if (status === 'approved') {
      await db.findByIdAndUpdate('RFQ', updatedQuote.rfqId, { status: 'closed' });
      
      // Auto-reject all other quotations for the same RFQ
      const otherQuotes = await db.find('Quotation', { rfqId: updatedQuote.rfqId, status: 'pending' });
      for (const quote of otherQuotes) {
        if (quote._id !== updatedQuote._id) {
          await db.findByIdAndUpdate('Quotation', quote._id, {
            status: 'rejected',
            remarks: 'System rejected: another quotation was approved.'
          });
        }
      }

      // Automatically Generate a Purchase Order (PO)
      const poNumber = 'PO-' + Date.now().toString().substring(5, 11) + '-' + Math.floor(1000 + Math.random() * 9000);
      const po = await db.create('PurchaseOrder', {
        poNumber,
        rfqId: updatedQuote.rfqId,
        rfqTitle: updatedQuote.rfqTitle,
        quotationId: updatedQuote._id,
        vendorId: updatedQuote.vendorId,
        vendorName: updatedQuote.vendorName,
        totalAmount: updatedQuote.price,
        status: 'issued'
      });

      await logActivity(req, 'PO_AUTO_GENERATE', `Auto-generated Purchase Order ${poNumber} for vendor "${updatedQuote.vendorName}"`);

      // Automatically Generate an Invoice from PO
      const invoiceNumber = 'INV-' + Date.now().toString().substring(5, 11) + '-' + Math.floor(1000 + Math.random() * 9000);
      const subtotal = updatedQuote.price;
      const taxAmount = parseFloat((subtotal * 0.18).toFixed(2)); // 18% GST standard
      const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

      await db.create('Invoice', {
        invoiceNumber,
        poNumber: poNumber,
        rfqTitle: updatedQuote.rfqTitle,
        vendorId: updatedQuote.vendorId,
        vendorName: updatedQuote.vendorName,
        subtotal,
        taxAmount,
        totalAmount,
        status: 'unpaid',
        distributionLogs: []
      });

      await logActivity(req, 'INV_AUTO_GENERATE', `Auto-generated Invoice ${invoiceNumber} for Purchase Order ${poNumber}`);
    }

    res.json({ message: `Quotation ${status} successfully`, quote: updatedQuote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. PURCHASE ORDERS (/api/pos)
// ==========================================

// GET /api/pos
router.get('/pos', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      query = { vendorId: req.user.vendorId };
    }
    const pos = await db.find('PurchaseOrder', query);
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. INVOICE ENDPOINTS (/api/invoices)
// ==========================================

// GET /api/invoices
router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      query = { vendorId: req.user.vendorId };
    }
    const invoices = await db.find('Invoice', query);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices/:id/action
router.post('/invoices/:id/action', authenticateToken, async (req, res) => {
  try {
    const { action, details } = req.body; // 'print', 'email', 'download'
    if (!['print', 'email', 'download'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    const logEntry = {
      action,
      timestamp: new Date().toISOString(),
      details: details || `Executed ${action} operation`
    };

    const invoice = await db.findById('Invoice', req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Update invoice with action log
    const updatedInvoice = await db.findByIdAndUpdate('Invoice', req.params.id, {
      $push: { distributionLogs: logEntry }
    });

    await logActivity(
      req,
      `INVOICE_${action.toUpperCase()}`,
      `Invoice ${invoice.invoiceNumber} was ${action}ed. Details: ${details}`
    );

    res.json({ message: `Successfully logged ${action} action`, invoice: updatedInvoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. REPORTS & ANALYTICS (/api/analytics)
// ==========================================

router.get('/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const vendorId = req.user.vendorId;

    let vendorQuery = {};
    let rfqQuery = {};
    let quoteQuery = {};
    let poQuery = {};
    let invoiceQuery = {};

    if (userRole === 'vendor') {
      vendorQuery = { _id: vendorId };
      rfqQuery = { assignedVendors: vendorId };
      quoteQuery = { vendorId };
      poQuery = { vendorId };
      invoiceQuery = { vendorId };
    }

    const vendorsCount = (await db.find('Vendor', vendorQuery)).length;
    const rfqsCount = (await db.find('RFQ', rfqQuery)).length;
    const quotesCount = (await db.find('Quotation', quoteQuery)).length;
    const posCount = (await db.find('PurchaseOrder', poQuery)).length;
    const invoicesCount = (await db.find('Invoice', invoiceQuery)).length;

    // Financial calculations
    const allInvoices = await db.find('Invoice', invoiceQuery);
    const totalSpend = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pendingPayment = allInvoices
      .filter(inv => inv.status === 'unpaid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Let's count RFQs by status
    const allRfqs = await db.find('RFQ', rfqQuery);
    const activeRfqs = allRfqs.filter(r => r.status === 'published').length;
    const closedRfqs = allRfqs.filter(r => r.status === 'closed').length;

    // Get 5 recent activities
    let logsQuery = {};
    const logs = await db.find('ActivityLog', logsQuery);
    const recentLogs = logs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      counts: {
        vendors: vendorsCount,
        rfqs: rfqsCount,
        quotations: quotesCount,
        pos: posCount,
        invoices: invoicesCount,
        activeRfqs,
        closedRfqs
      },
      finance: {
        totalSpend: parseFloat(totalSpend.toFixed(2)),
        pendingPayment: parseFloat(pendingPayment.toFixed(2))
      },
      recentLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/spending
router.get('/analytics/spending', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      query = { vendorId: req.user.vendorId };
    }
    const invoices = await db.find('Invoice', query);

    // Group spending by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const spendingMap = {};
    
    // Seed current and past months
    const currentMonthIndex = new Date().getMonth();
    for (let i = 4; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      spendingMap[months[idx]] = 0;
    }

    invoices.forEach(inv => {
      const date = new Date(inv.createdAt);
      const monthName = months[date.getMonth()];
      if (spendingMap[monthName] !== undefined) {
        spendingMap[monthName] += inv.totalAmount;
      }
    });

    const dataset = Object.keys(spendingMap).map(key => ({
      month: key,
      amount: parseFloat(spendingMap[key].toFixed(2))
    }));

    res.json(dataset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/vendor-performance
router.get('/analytics/vendor-performance', authenticateToken, async (req, res) => {
  try {
    const vendors = await db.find('Vendor');
    const quotations = await db.find('Quotation');

    const list = vendors.map(vendor => {
      const vendorQuotes = quotations.filter(q => q.vendorId === vendor._id);
      const approvedQuotes = vendorQuotes.filter(q => q.status === 'approved');
      
      const successRate = vendorQuotes.length > 0 
        ? Math.round((approvedQuotes.length / vendorQuotes.length) * 100) 
        : 0;

      return {
        name: vendor.name,
        category: vendor.category,
        rating: vendor.rating || 5.0,
        totalBids: vendorQuotes.length,
        approvedBids: approvedQuotes.length,
        successRate
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. LOGS & NOTIFICATIONS (/api/logs)
// ==========================================

router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await db.find('ActivityLog');
    const sorted = logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

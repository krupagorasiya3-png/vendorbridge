const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root path diagnostic
app.get('/', (req, res) => {
  res.json({
    app: 'VendorBridge Procurement ERP Backend',
    status: 'Running',
    databaseMode: db.isMongo() ? 'MongoDB' : 'Local JSON Files'
  });
});

// Mount consolidated API routes
app.use('/api', routes);

// Database Initialization & Automatic Seeding
async function startServer() {
  await db.init();
  
  // Seed database with sample data if no users exist
  try {
    const existingUsers = await db.find('User');
    if (existingUsers.length === 0) {
      console.log('[VendorBridge Seeder] Database is empty. Seeding initial demo data...');

      // 1. Seed Vendors
      const vendor1 = await db.create('Vendor', {
        name: 'Apex Industrial Supplies',
        category: 'Manufacturing Equipments',
        email: 'sales@apexsupplies.com',
        phone: '+91 98765 43210',
        gstDetails: '27AAAAA1111A1Z1',
        status: 'active',
        rating: 4.8
      });

      const vendor2 = await db.create('Vendor', {
        name: 'ByteCore Technologies',
        category: 'IT Hardware & Networking',
        email: 'corporate@bytecore.co.in',
        phone: '+91 88888 77777',
        gstDetails: '27BBBBB2222B2Z2',
        status: 'active',
        rating: 4.5
      });

      const vendor3 = await db.create('Vendor', {
        name: 'Zenith Logistics & Services',
        category: 'Office Facilities & Logistics',
        email: 'info@zenithlogistics.com',
        phone: '+91 77777 66666',
        gstDetails: '27CCCCC3333C3Z3',
        status: 'active',
        rating: 4.2
      });

      const vendor4 = await db.create('Vendor', {
        name: 'Global Metal Alloys',
        category: 'Raw Materials',
        email: 'deals@globalmetals.com',
        phone: '+91 99999 88888',
        gstDetails: '27DDDDD4444D4Z4',
        status: 'inactive',
        rating: 3.9
      });

      // 2. Seed Users (with hashed passwords)
      const hashedPassword = await bcrypt.hash('password', 10);
      
      // Admin
      await db.create('User', {
        email: 'admin@vendorbridge.com',
        password: hashedPassword,
        role: 'admin',
        name: 'Aravind Swamy'
      });

      // Procurement Officer
      await db.create('User', {
        email: 'officer@vendorbridge.com',
        password: hashedPassword,
        role: 'officer',
        name: 'Neera Tandon'
      });

      // Manager/Approver
      await db.create('User', {
        email: 'manager@vendorbridge.com',
        password: hashedPassword,
        role: 'manager',
        name: 'Suresh Raina'
      });

      // Vendor user linked to Apex Supplies
      await db.create('User', {
        email: 'vendor@vendorbridge.com',
        password: hashedPassword,
        role: 'vendor',
        name: 'Rajesh Kumar (Apex Sales)',
        vendorId: vendor1._id
      });

      // Vendor user linked to ByteCore
      await db.create('User', {
        email: 'bytecore@vendorbridge.com',
        password: hashedPassword,
        role: 'vendor',
        name: 'Priya Sharma (ByteCore IT)',
        vendorId: vendor2._id
      });

      // 3. Seed RFQs
      const rfq1 = await db.create('RFQ', {
        title: 'Procurement of High-End Development Laptops',
        specification: '15 units of 16-inch laptops with 32GB RAM, 1TB SSD, and Apple M3 Max or Intel i9 processor. Local warranty included.',
        quantity: 15,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        assignedVendors: [vendor1._id, vendor2._id, vendor3._id],
        status: 'published'
      });

      const rfq2 = await db.create('RFQ', {
        title: 'Office Cafeteria Industrial Coffee Machine',
        specification: 'Commercial grade espresso machine with dual boiler, grinders, and installation training support.',
        quantity: 1,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        assignedVendors: [vendor1._id, vendor3._id],
        status: 'published'
      });

      const rfq3 = await db.create('RFQ', {
        title: 'Server Rack Upgrade Cabinets',
        specification: '42U Standard Server Rack Enclosures with lock, cable management and ventilation fans.',
        quantity: 4,
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // expired/closed
        assignedVendors: [vendor2._id],
        status: 'closed'
      });

      // 4. Seed Quotations
      // Quotes for Laptop RFQ
      await db.create('Quotation', {
        rfqId: rfq1._id,
        rfqTitle: rfq1.title,
        vendorId: vendor1._id,
        vendorName: vendor1.name,
        price: 3375000, // ₹33,75,000 (Apex Quote)
        deliveryTimeline: '10 Days',
        notes: 'Includes free laptop sleeves and 3 years corporate onsite support.',
        status: 'pending'
      });

      await db.create('Quotation', {
        rfqId: rfq1._id,
        rfqTitle: rfq1.title,
        vendorId: vendor2._id,
        vendorName: vendor2.name,
        price: 3225000, // ₹32,25,000 (ByteCore Quote - cheaper!)
        deliveryTimeline: '14 Days',
        notes: 'Price includes standard installation and setup help.',
        status: 'pending'
      });

      // Quotes for Closed Rack RFQ (Approved)
      const approvedQuote = await db.create('Quotation', {
        rfqId: rfq3._id,
        rfqTitle: rfq3.title,
        vendorId: vendor2._id,
        vendorName: vendor2.name,
        price: 240000, // ₹2,40,000
        deliveryTimeline: '5 Days',
        notes: 'Includes mounting brackets and delivery charges.',
        status: 'approved',
        remarks: 'Competitively priced and meets immediate specifications.'
      });

      // 5. Seed PO and Invoice for the approved Rack RFQ
      const poNum = 'PO-992384-8821';
      await db.create('PurchaseOrder', {
        poNumber: poNum,
        rfqId: rfq3._id,
        rfqTitle: rfq3.title,
        quotationId: approvedQuote._id,
        vendorId: vendor2._id,
        vendorName: vendor2.name,
        totalAmount: 240000,
        status: 'issued'
      });

      const invNum = 'INV-110294-8239';
      await db.create('Invoice', {
        invoiceNumber: invNum,
        poNumber: poNum,
        rfqTitle: rfq3.title,
        vendorId: vendor2._id,
        vendorName: vendor2.name,
        subtotal: 240000,
        taxAmount: 43200, // 18% GST
        totalAmount: 283200,
        status: 'unpaid',
        distributionLogs: [
          { action: 'downloaded', timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), details: 'Downloaded by Procurement Officer' }
        ]
      });

      // 6. Seed System Activity Logs
      await db.create('ActivityLog', {
        userId: 'system',
        userName: 'System Init',
        userRole: 'system',
        action: 'SYSTEM_STARTUP',
        details: 'ERP Database loaded. Sample data successfully seeded.'
      });

      console.log('[VendorBridge Seeder] Seeding completed successfully!');
    }
  } catch (seedError) {
    console.error('[VendorBridge Seeder] Error seeding database:', seedError);
  }

  // Start Server Listener
  app.listen(PORT, () => {
    console.log(`\n=============================================================`);
    console.log(`  \x1b[32mVendorBridge API Server running on http://localhost:${PORT}\x1b[0m`);
    console.log(`=============================================================\n`);
  });
}

startServer();

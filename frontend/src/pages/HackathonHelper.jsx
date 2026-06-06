import React, { useState } from 'react';

export default function HackathonHelper() {
  const [activeTab, setActiveTab] = useState('ppt'); // 'ppt' | 'architecture' | 'schemas' | 'report'
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "VendorBridge ERP",
      subtitle: "Procurement & Vendor Relationship Management System",
      content: (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <h3 style={{ color: 'var(--color-cyan)', fontSize: '1.3rem', marginBottom: '1rem' }}>Sleek, Secure & Standardized ERP</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Digitizing and streamlining the B2B supply chain procurement lifecycle, from vendor registration to quotation comparison, manager approval, and automated PO/invoice ledger tracking.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>⚡ React 18 & Vite Frontend</span>
            <span>⚙️ Node.js & Express Backend</span>
            <span>💾 MongoDB + JSON Dual Storage</span>
          </div>
        </div>
      )
    },
    {
      title: "The Problem Statement",
      subtitle: "Manual Bottlenecks in Modern Procurement",
      content: (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', margin: '1rem auto', maxWidth: '600px' }}>
          <li>❌ <strong>Siloed Communications:</strong> Procurement officers exchange RFQs and bids over fragmented emails, resulting in lost quotes.</li>
          <li>❌ <strong>Poor Audit Trails:</strong> Lack of immutable logging leads to security concerns and zero corporate transparency.</li>
          <li>❌ <strong>Inefficient Analysis:</strong> Comparing multiple vendor quotation parameters manually is slow, prone to errors, and labor-intensive.</li>
          <li>❌ <strong>Fragmented Tools:</strong> Separate software for approvals, PO creation, and invoicing breaks the supply chain pipeline.</li>
        </ul>
      )
    },
    {
      title: "The VendorBridge Solution",
      subtitle: "Integrated End-to-End ERP Architecture",
      content: (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', margin: '1rem auto', maxWidth: '600px' }}>
          <li>🛡️ <strong>Secure Role-Based Workflows:</strong> Strict routing policies for Procurement Officers, Vendors, and Approval Managers.</li>
          <li>📊 <strong>Quotation Studio:</strong> Visual comparison matrices with automated flags for Lowest Cost and Fastest Delivery.</li>
          <li>⚡ <strong>Automated Ledger:</strong> Single-click conversion from Approved quotation to Purchase Order (PO) and Tax Invoice.</li>
          <li>💾 <strong>Dual-Mode Failover:</strong> Auto-detects local MongoDB server, falling back to an in-app JSON DB file system for out-of-the-box demo portability.</li>
        </ul>
      )
    },
    {
      title: "Project Technology Stack",
      subtitle: "Scalable, Performant, and Maintainable Software Stack",
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
          <div>
            <h4 style={{ color: 'var(--color-cyan)', marginBottom: '0.5rem' }}>Client Layer</h4>
            <ul>
              <li>Vite React Framework for fast rendering</li>
              <li>Modular Context Providers for Session auth</li>
              <li>Pure-CSS Custom Dark-Mode (glassmorphic variables)</li>
              <li>Native document printing & simulated mail rendering</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-cyan)', marginBottom: '0.5rem' }}>Service & Database Layer</h4>
            <ul>
              <li>Node.js Express Server (REST API patterns)</li>
              <li>JWT Authentication & BcryptJS hashing</li>
              <li>Mongoose Database Models Mapping</li>
              <li>Fallback JSON Local File Reader/Writer (Failsafe)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Why VendorBridge Wins",
      subtitle: "Hackathon Business Highlights",
      content: (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', margin: '1rem auto', maxWidth: '600px' }}>
          <li>🚀 <strong>Zero Setup Demo:</strong> Dual-mode DB ensures immediate evaluation capability for judges.</li>
          <li>📈 <strong>Business Intelligence:</strong> Integrated performance rating dashboards mapping vendor success ratios.</li>
          <li>📜 <strong>Compliance Ready:</strong> Complete immutable audit logging capturing every system action and document print/email trigger.</li>
          <li>🎨 <strong>World Class UX:</strong> High-end modern UI designed using customized theme tokens and transitions.</li>
        </ul>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="animate-fade">
      <div className="panel-header">
        <h1 className="panel-title" style={{ fontSize: '1.5rem' }}>Hackathon Collateral & Pitch Assistant</h1>
      </div>

      {/* Tabs */}
      <div className="helper-tabs">
        <button
          onClick={() => setActiveTab('ppt')}
          className={`helper-tab-btn ${activeTab === 'ppt' ? 'active' : ''}`}
        >
          📺 Browser Pitch Presentation
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`helper-tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
        >
          ⚙️ System Architecture
        </button>
        <button
          onClick={() => setActiveTab('schemas')}
          className={`helper-tab-btn ${activeTab === 'schemas' ? 'active' : ''}`}
        >
          📂 DB Schemas Details
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`helper-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
        >
          📝 Hackathon Project Report
        </button>
      </div>

      {/* Slide Deck Tab */}
      {activeTab === 'ppt' && (
        <div className="glass-panel" style={{ padding: '2rem', minHeight: '450px' }}>
          <div className="ppt-slide-deck">
            <div className="ppt-slide">
              <span className="slide-number">Slide {currentSlide + 1} of {slides.length}</span>
              <div>
                <div className="slide-title">{slides[currentSlide].title}</div>
                <div style={{ color: 'var(--color-cyan)', fontSize: '0.9rem', marginTop: '-1rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                  {slides[currentSlide].subtitle}
                </div>
              </div>
              <div className="slide-content">
                {slides[currentSlide].content}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
              <button
                onClick={handlePrev}
                className="btn btn-secondary"
                disabled={currentSlide === 0}
                style={{ opacity: currentSlide === 0 ? 0.5 : 1 }}
              >
                ◀ Previous Slide
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Slide {currentSlide + 1}
              </span>
              <button
                onClick={handleNext}
                className="btn btn-primary"
                disabled={currentSlide === slides.length - 1}
                style={{ opacity: currentSlide === slides.length - 1 ? 0.5 : 1 }}
              >
                Next Slide ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Architecture Tab */}
      {activeTab === 'architecture' && (
        <div className="glass-panel">
          <h3 className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>System Architecture Map</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <pre style={{ color: 'var(--color-cyan)', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto', lineHeight: '1.5' }}>
{`+-------------------------------------------------------+
|             Client App (Vite + React)                 |
|  - Custom CSS Design System                           |
|  - AuthProvider (Session, JWT Handling, simulated Box)|
+-------------------------------------------------------+
                           |
                           | HTTP Request with JWT Header
                           v
+-------------------------------------------------------+
|         Express Server Routing Node.js Core           |
|  - Auth (/api/auth)      - RFQs (/api/rfqs)           |
|  - Vendors (/api/vendor) - Approvals (/api/approvals)  |
+-------------------------------------------------------+
                           |
      +--------------------+--------------------+
      | (If MongoDB runs)                       | (If MongoDB fails)
      v                                         v
+---------------------------+             +---------------------------+
|    MongoDB Database       |             |  Local JSON File Storage  |
|  - Models via Mongoose    |             |  - data/users.json        |
|  - Dynamic collection maps|             |  - data/vendors.json      |
+---------------------------+             +---------------------------+`}
              </pre>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Key Architectural Design Decisions:</h4>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>
                  <strong>Abstacted DB Interface (`db.js`):</strong> Mounts Mongoose schemas if MongoDB connection resolves, otherwise mounts dynamic JSON file read/write routines. This prevents server crashes during grading environments and eliminates installation prerequisites.
                </li>
                <li>
                  <strong>Role-Based Authentication Filters:</strong> Backend middleware intercepts endpoints (like RFQ creation, vendor status updates, approval submissions) checking JWT tokens for correct roles, returning `403 Forbidden` if validation fails.
                </li>
                <li>
                  <strong>State-Driven Navigation:</strong> Simple tab layout prevents React router dependencies issues and keeps the deployment footprint lightweight.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DB Schemas Tab */}
      {activeTab === 'schemas' && (
        <div className="glass-panel">
          <h3 className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>MongoDB / Mongoose Collections Schemas</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxHeight: '380px', overflowY: 'auto' }}>
              <pre style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.5' }}>
{`// 1. USER SCHEMA
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['officer', 'vendor', 'manager', 'admin'] },
  name: { type: String, required: true },
  vendorId: { type: String, default: null } // Link to Vendor profile
});

// 2. VENDOR SCHEMA
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gstDetails: { type: String, required: true },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  rating: { type: Number, default: 5.0 }
});

// 3. RFQ SCHEMA
const RFQSchema = new mongoose.Schema({
  title: { type: String, required: true },
  specification: { type: String, required: true },
  quantity: { type: Number, required: true },
  deadline: { type: Date, required: true },
  assignedVendors: [{ type: String }],
  status: { type: String, default: 'published', enum: ['published', 'closed'] }
});

// 4. QUOTATION SCHEMA
const QuotationSchema = new mongoose.Schema({
  rfqId: { type: String, required: true },
  rfqTitle: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  price: { type: Number, required: true },
  deliveryTimeline: { type: String, required: true },
  notes: { type: String },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  remarks: { type: String }
});`}
              </pre>
            </div>
            <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Note: Database model codes are implemented inside [db.js](file:///C:/Users/krupa/.gemini/antigravity-ide/scratch/vendorbridge/backend/db.js) file.
            </div>
          </div>
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <div className="glass-panel">
          <h3 className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Hackathon Project Report Template</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Copy this markdown report for hackathon submission portals (Devpost, GitHub README, or Project Report PDFs).
          </p>

          <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxHeight: '350px', overflowY: 'auto' }}>
            <pre style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
{`# Project Report: VendorBridge ERP
## Procurement & Vendor Management Automation Portal

### 1. Abstract
VendorBridge digitizes organizational procurement operations. It solves coordination, compliance, and auditing issues within corporate supply chain pipelines by managing the full lifecycle from Vendor onboarding, RFQ broadcasting, side-by-side quote analytics, manager approvals, to PO/invoice ledgers.

### 2. Core Problem Solved
Procurement is traditionally bottlenecked by manual spreadsheets and email coordination:
- Scattered quotation details makes choosing the optimal bid difficult.
- Invoices are sent via emails without central log tracking.
- Regulatory audits lack unified activity ledgers.

### 3. Solution Overview
VendorBridge addresses this with:
- **Centralized RFQ Dispatch:** Officers create requirements and assign multiple vendors in seconds.
- **Visual Quotation Comparison:** Side-by-side matrices instantly tag the "Lowest Bid" and "Fastest Lead-Time".
- **Dynamic Workflows:** Manager approvals auto-generate official Purchase Orders and Tax Invoices with standard 18% GST calculations.
- **Audit Trails:** Every action (login, recommendation, document printing, download, emailing) is recorded in an immutable ledger.
- **Failover Database Layer:** Auto-connects MongoDB but defaults to local JSON file stores if MongoDB is offline.

### 4. Technical Architecture
- **Frontend:** React 18, Vite Client, custom CSS design system using HSL color variables and glassmorphic layouts.
- **Backend:** Node.js, Express Router.
- **Database:** MongoDB (via Mongoose driver) and File System JSON storage fallbacks.
- **Authentication:** Role-Based Access Control verified via JWT Token signatures.`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

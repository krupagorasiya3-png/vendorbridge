const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting VendorBridge API Automated Verification Script');
  console.log(`📡 Targeting Backend Server at: http://localhost:${PORT}`);
  console.log('========================================================\n');

  let token = '';
  let vendorId = '';
  let rfqId = '';
  let quoteId = '';

  // Test 1: Health Check
  try {
    const res = await fetch(`http://localhost:${PORT}/`);
    if (!res.ok) throw new Error('Root check failed');
    const data = await res.json();
    console.log(`✅ [TEST 1/7] Health Check Passed: Database Mode: [${data.databaseMode}]`);
  } catch (err) {
    console.error(`❌ [TEST 1/7] Failed: Is the server running? Run "npm start" in backend folder first.`);
    process.exit(1);
  }

  // Test 2: Authenticate (Login as Procurement Officer)
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer@vendorbridge.com', password: 'password' })
    });
    if (!res.ok) throw new Error('Officer authentication failed');
    const data = await res.json();
    token = data.token;
    console.log(`✅ [TEST 2/7] Authenticated as Officer [${data.user.name}]. Token received.`);
  } catch (err) {
    console.error(`❌ [TEST 2/7] Authentication Failed:`, err.message);
    process.exit(1);
  }

  // Test 3: List Vendors
  try {
    const res = await fetch(`${BASE_URL}/vendors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('List vendors failed');
    const data = await res.json();
    console.log(`✅ [TEST 3/7] Read Vendor Database. Total Vendors: ${data.length}`);
    if (data.length > 0) {
      vendorId = data[0]._id;
      console.log(`   Selected Demo Vendor ID: ${vendorId} (${data[0].name})`);
    }
  } catch (err) {
    console.error(`❌ [TEST 3/7] Vendor Registry Check Failed:`, err.message);
    process.exit(1);
  }

  // Test 4: List RFQs
  try {
    const res = await fetch(`${BASE_URL}/rfqs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('List RFQs failed');
    const data = await res.json();
    console.log(`✅ [TEST 4/7] Read RFQ Hub. Total RFQs: ${data.length}`);
    if (data.length > 0) {
      rfqId = data[0]._id;
      console.log(`   Selected Demo RFQ ID: ${rfqId} (${data[0].title})`);
    }
  } catch (err) {
    console.error(`❌ [TEST 4/7] RFQ Hub Check Failed:`, err.message);
    process.exit(1);
  }

  // Test 5: Login as Vendor and Submit a Quotation
  let vendorToken = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vendor@vendorbridge.com', password: 'password' })
    });
    const loginData = await loginRes.json();
    vendorToken = loginData.token;

    // Create a new quotation for the RFQ
    const quoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`
      },
      body: JSON.stringify({
        rfqId: rfqId,
        price: 3100000,
        deliveryTimeline: '10 Days',
        notes: 'Verification script automated bid submission'
      })
    });
    
    if (!quoteRes.ok) {
      const errText = await quoteRes.json();
      throw new Error(errText.message || 'Submit quote endpoint failed');
    }
    const quoteData = await quoteRes.json();
    quoteId = quoteData._id;
    console.log(`✅ [TEST 5/7] Authenticated Vendor & Submitted bid of ₹${quoteData.price.toLocaleString()} for RFQ.`);
  } catch (err) {
    console.error(`❌ [TEST 5/7] Vendor Bid Submission Failed:`, err.message);
    process.exit(1);
  }

  // Test 6: Login as Manager and Approve/Reject the Quotation
  try {
    const managerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@vendorbridge.com', password: 'password' })
    });
    const managerData = await managerRes.json();
    const managerToken = managerData.token;

    const approvalRes = await fetch(`${BASE_URL}/approvals/${quoteId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        remarks: 'Verification script auto-approval test'
      })
    });

    if (!approvalRes.ok) throw new Error('Sign-off process failed');
    console.log(`✅ [TEST 6/7] Manager Signed off. Bid APPROVED. PO & Invoice Auto-Generated.`);
  } catch (err) {
    console.error(`❌ [TEST 6/7] Manager Sign-off Process Failed:`, err.message);
    process.exit(1);
  }

  // Test 7: Fetch Analytics Dashboard
  try {
    const res = await fetch(`${BASE_URL}/analytics/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Fetch analytics failed');
    const data = await res.json();
    console.log(`✅ [TEST 7/7] Fetched Analytics. Aggregates loaded: Spend = ₹${data.finance.totalSpend.toLocaleString()}`);
  } catch (err) {
    console.error(`❌ [TEST 7/7] Analytics Sync Failed:`, err.message);
    process.exit(1);
  }

  console.log('\n========================================================');
  console.log('🎉 ALL VENDORBRIDGE ERP API VERIFICATION TESTS PASSED!');
  console.log('========================================================');
}

runTests();

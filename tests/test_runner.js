// ====================================================================
// TataDana Automated Test Suite & Verification Runner
// ====================================================================
const assert = require('assert');
const { db } = require('../server/config/db');
const AIService = require('../server/services/aiService');
const TelegramService = require('../server/services/telegramService');
const ReportGenerator = require('../server/services/reportGenerator');

async function runTests() {
  console.log('🧪 [TEST SUITE] Starting TataDana Core Verifications...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${name} ->`, e.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${name} ->`, e.message);
      failed++;
    }
  }

  // 1. Indonesian Colloquial Currency Parsing Tests
  console.log('1️⃣ Testing Indonesian Natural Currency Parsing...');
  const testCases = [
    { input: 'beli bakso 15rb', expectedNominal: 15000, expectedType: 'expense' },
    { input: 'gajian 5jt', expectedNominal: 5000000, expectedType: 'income' },
    { input: 'kopi susu 25k', expectedNominal: 25000, expectedType: 'expense' },
    { input: 'beli bensin 25.000', expectedNominal: 25000, expectedType: 'expense' },
    { input: 'bonus project 1.5jt', expectedNominal: 1500000, expectedType: 'income' },
    { input: 'bayar wifi 350ribu', expectedNominal: 350000, expectedType: 'expense' },
    { input: 'service ac 150k', expectedNominal: 150000, expectedType: 'expense' }
  ];

  for (const tc of testCases) {
    await testAsync(`Parse NLP: "${tc.input}"`, async () => {
      const res = await AIService.parseTransactionText(tc.input);
      assert.strictEqual(res.success, true, 'Parsing should succeed');
      assert.strictEqual(res.data.nominal, tc.expectedNominal, `Nominal mismatch: got ${res.data.nominal}, expected ${tc.expectedNominal}`);
      assert.strictEqual(res.data.jenis, tc.expectedType, `Type mismatch: got ${res.data.jenis}, expected ${tc.expectedType}`);
    });
  }

  // 2. Telegram Webhook Idempotency Test
  console.log('\n2️⃣ Testing Telegram Webhook Idempotency Engine...');
  await testAsync('Skipping duplicate update_id', async () => {
    const fakeUpdate = {
      update_id: 99887766,
      message: {
        chat: { id: 12345 },
        from: { id: 12345, username: 'testuser' },
        text: 'kopi 10rb'
      }
    };

    const firstRun = await TelegramService.handleWebhookUpdate(fakeUpdate, 'fake_token');
    const secondRun = await TelegramService.handleWebhookUpdate(fakeUpdate, 'fake_token');

    assert.strictEqual(secondRun.skipped, true, 'Second run must be skipped');
    assert.strictEqual(secondRun.reason, 'DUPLICATE_UPDATE_ID', 'Must detect duplicate update_id');
  });

  // 3. Database & Admin Approval Logic Test
  console.log('\n3️⃣ Testing Database & Admin Approval Workflow...');
  test('Pending user status restriction', () => {
    const pendingUser = db.table('profiles').findOne(p => p.approval_status === 'pending_approval');
    assert.ok(pendingUser, 'Must have at least 1 pending user seeded');
    assert.strictEqual(pendingUser.approval_status, 'pending_approval');

    // Admin approves user
    db.table('profiles').update(pendingUser.id, { approval_status: 'approved' });
    const verified = db.table('profiles').findById(pendingUser.id);
    assert.strictEqual(verified.approval_status, 'approved', 'User must now be approved');

    // Revert for cleanliness
    db.table('profiles').update(pendingUser.id, { approval_status: 'pending_approval' });
  });

  // 4. Visual Progress Bar Generation Test
  console.log('\n4️⃣ Testing Visual Progress Bar...');
  test('Progress bar rendering (50%, 80%, 100%)', () => {
    const bar50 = TelegramService.renderProgressBar(50);
    assert.strictEqual(bar50, '█████░░░░░');

    const bar80 = TelegramService.renderProgressBar(80);
    assert.strictEqual(bar80, '████████░░');

    const bar100 = TelegramService.renderProgressBar(100);
    assert.strictEqual(bar100, '██████████');
  });

  // 5. Excel & PDF Generator Test
  console.log('\n5️⃣ Testing Report & Export Generators...');
  await testAsync('Generate Excel .xlsx report', async () => {
    const dummyUser = { full_name: 'Budi Pratama' };
    const dummyTxs = [
      { date: new Date().toISOString(), type: 'expense', amount: 50000, category_name: 'Makanan', wallet_name: 'BCA', notes: 'Makan Siang' }
    ];
    const res = await ReportGenerator.generateExcel(dummyTxs, dummyUser, 'Bulan Ini');
    assert.ok(res.filePath, 'Excel file path must exist');
    assert.ok(res.size > 1000, 'Excel file size must be > 1KB');
  });

  await testAsync('Generate PDF report', async () => {
    const dummyUser = { full_name: 'Budi Pratama' };
    const dummyTxs = [
      { date: new Date().toISOString(), type: 'expense', amount: 50000, category_name: 'Makanan', wallet_name: 'BCA', notes: 'Makan Siang' }
    ];
    const res = await ReportGenerator.generatePDF(dummyTxs, dummyUser, 'Bulan Ini');
    assert.ok(res.filePath, 'PDF file path must exist');
    assert.ok(res.size > 1000, 'PDF file size must be > 1KB');
  });

  console.log(`\n========================================`);
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

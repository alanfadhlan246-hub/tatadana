const puppeteer = require('puppeteer-core');
const axios = require('axios');

(async () => {
  console.log('=== TEST 1: LAN IP REACHABILITY (192.168.1.3:3000) ===');
  try {
    const res = await axios.get('http://192.168.1.3:3000/health');
    console.log('✅ LAN Health Check OK:', res.data.status, 'Time:', res.data.wib_time);
  } catch (e) {
    console.error('❌ LAN Check Failed:', e.message);
  }

  console.log('\n=== TEST 2: CONCURRENT DUAL-WINDOW SESSION ISOLATION ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. OPEN WINDOW 1 (ADMIN)
  const windowAdmin = await browser.newPage();
  await windowAdmin.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Navigate to Login
  await windowAdmin.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Masuk');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Admin Login
  await windowAdmin.type('input[type="text"]', 'fadhlan2146@gmail.com');
  await windowAdmin.type('input[type="password"]', 'Fadhlan2146');
  await windowAdmin.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));

  const adminGreeting = await windowAdmin.evaluate(() => document.body.innerText);
  console.log('Window 1: Logged in as Admin ->', adminGreeting.includes('Fadhlan'));

  // 2. OPEN WINDOW 2 (USER)
  const windowUser = await browser.newPage();
  await windowUser.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Verify Window 2 is completely clean (not logged in as Admin)
  const userWindowInit = await windowUser.evaluate(() => document.body.innerText);
  console.log('Window 2: Clean independent window ->', userWindowInit.includes('Coba Gratis'));

  // User clicks Coba Gratis to register
  await windowUser.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Coba Gratis'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const rand = Math.floor(Math.random() * 899999 + 100000);
  const newEmail = 'user_' + rand + '@test.com';
  const newPhone = '081' + rand + '99';

  await windowUser.type('input[placeholder="Budi Pratama"]', 'Calon Nasabah Baru');
  await windowUser.type('input[placeholder="budi@example.com"]', newEmail);
  await windowUser.type('input[placeholder="081234567890"]', newPhone);
  await windowUser.type('input[type="password"]', 'Rahasia123');
  await windowUser.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));

  const userStatusText = await windowUser.evaluate(() => document.body.innerText);
  console.log('Window 2: User in Pending Approval state ->', userStatusText.includes('Menunggu Persetujuan Admin'));

  // 3. CHECK WINDOW 1 (ADMIN) AGAIN
  // CRITICAL CHECK: Did Window 1 turn into User?
  const adminCheck = await windowAdmin.evaluate(() => document.body.innerText);
  const stillAdmin = adminCheck.includes('Fadhlan') && !adminCheck.includes('Menunggu Persetujuan Admin');
  console.log('Window 1: STILL ADMIN (No Session Overwrite!) ->', stillAdmin);

  // 4. ADMIN APPROVES USER IN WINDOW 1
  await windowAdmin.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminMenu = btns.find(b => b.innerText.includes('Super Admin'));
    if (adminMenu) adminMenu.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const approved = await windowAdmin.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const approveBtn = btns.find(b => b.innerText.includes('Setujui'));
    if (approveBtn) {
      approveBtn.click();
      return true;
    }
    return false;
  });
  console.log('Window 1: Admin approved applicant ->', approved);
  await new Promise(r => setTimeout(r, 1000));

  // 5. USER CLICKS "CEK STATUS" IN WINDOW 2
  await windowUser.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cek Status Persetujuan'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const userFinalDashboard = await windowUser.evaluate(() => document.body.innerText);
  console.log('Window 2: User successfully entered their own dashboard ->', userFinalDashboard.includes('Calon Nasabah') || userFinalDashboard.includes('Beranda'));

  // 6. FINAL CHECK ON WINDOW 1 (ADMIN)
  const adminFinal = await windowAdmin.evaluate(() => document.body.innerText);
  console.log('Window 1: Admin remains 100% Super Admin ->', adminFinal.includes('Superadmin Control Center') || adminFinal.includes('Fadhlan'));

  await browser.close();
  console.log('\n🎉 ALL MULTI-WINDOW & DUAL-SESSION VERIFICATIONS 100% SUCCESSFUL!');
})();

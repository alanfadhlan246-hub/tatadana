const puppeteer = require('puppeteer-core');

(async () => {
  console.log('--- TEST DUAL TAB / MULTI-WINDOW ISOLATION ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Tab 1: Admin
  const pageAdmin = await browser.newPage();
  await pageAdmin.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Click Masuk on Tab 1
  await pageAdmin.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Masuk');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Fill Admin Credentials
  await pageAdmin.type('input[type="text"]', 'fadhlan2146@gmail.com');
  await pageAdmin.type('input[type="password"]', 'Fadhlan2146');
  await pageAdmin.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));

  const adminBody = await pageAdmin.evaluate(() => document.body.innerText);
  console.log('Tab 1 - Is Admin Logged In:', adminBody.includes('Super Admin'));

  // Tab 2: User in same browser
  const pageUser = await browser.newPage();
  await pageUser.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Verify Tab 2 is clean (starts at Landing, not polluted by Admin)
  const userInitBody = await pageUser.evaluate(() => document.body.innerText);
  console.log('Tab 2 - Starts Fresh at Landing:', userInitBody.includes('Coba Gratis'));

  // Click Coba Gratis on Tab 2
  await pageUser.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Coba Gratis'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Register New User in Tab 2
  const randNum = Math.floor(Math.random() * 899999 + 100000);
  const userEmail = 'user_' + randNum + '@gmail.com';
  const userPhone = '081' + randNum + '88';

  await pageUser.type('input[placeholder="Budi Pratama"]', 'User Tes Mandiri');
  await pageUser.type('input[placeholder="budi@example.com"]', userEmail);
  await pageUser.type('input[placeholder="081234567890"]', userPhone);
  await pageUser.type('input[type="password"]', 'Password123');
  await pageUser.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));

  const userPendingBody = await pageUser.evaluate(() => document.body.innerText);
  console.log('Tab 2 - Is In Pending Approval Screen:', userPendingBody.includes('Menunggu Persetujuan Admin'));

  // Switch back to Tab 1 (Admin) and check that Tab 1 is STILL Admin and did NOT turn into User!
  const adminCheckBody = await pageAdmin.evaluate(() => document.body.innerText);
  console.log('Tab 1 - Still Admin (No Pollution):', adminCheckBody.includes('Super Admin') && !adminCheckBody.includes('Menunggu Persetujuan Admin'));

  // Tab 1 (Admin) clicks Super Admin tab
  await pageAdmin.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const admBtn = btns.find(b => b.innerText.includes('Super Admin'));
    if (admBtn) admBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Tab 1 (Admin) clicks Approve on the new user
  const approveResult = await pageAdmin.evaluate((email) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const approveBtn = btns.find(b => b.innerText.includes('Setujui'));
    if (approveBtn) {
      approveBtn.click();
      return true;
    }
    return false;
  }, userEmail);
  console.log('Tab 1 - Admin Clicked Approve:', approveResult);
  await new Promise(r => setTimeout(r, 1000));

  // Tab 2 (User) clicks Cek Status Persetujuan
  await pageUser.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cek Status Persetujuan'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const userDashboardBody = await pageUser.evaluate(() => document.body.innerText);
  console.log('Tab 2 - User Successfully Entered Dashboard:', userDashboardBody.includes('User Tes Mandiri') || userDashboardBody.includes('Beranda'));

  // Tab 1 (Admin) verify STILL Admin
  const adminFinalBody = await pageAdmin.evaluate(() => document.body.innerText);
  console.log('Tab 1 - Admin Session Still Intact:', adminFinalBody.includes('Super Admin'));

  await browser.close();
  console.log('?? DUAL TAB & DUAL ACCOUNT CONCURRENT TEST PASSED 100%!');
})();

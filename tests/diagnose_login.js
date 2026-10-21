const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Click Masuk
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Masuk');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.type('input[type="text"]', 'fadhlan2146@gmail.com');
  await page.type('input[type="password"]', 'Fadhlan2146');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Result page title / snippet:\n', text.substring(0, 300));
  await browser.close();
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. Admin Login (Port 5176) - HD Corporate Architecture Background
  const pageAdmin = await browser.newPage();
  await pageAdmin.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await pageAdmin.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/tests/screenshots/hd_bg_admin_login_preview.png' });
  console.log('HD Admin Login Background Screenshot Saved!');

  // 2. Client Login (Port 5174) - HD Modern Luxury House Background
  const pageClient = await browser.newPage();
  await pageClient.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await pageClient.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/tests/screenshots/hd_bg_client_login_preview.png' });
  console.log('HD Client Login Background Screenshot Saved!');

  // 3. Worker Login (Port 5175) - HD Trades & Tools Background
  const pageWorker = await browser.newPage();
  await pageWorker.goto('http://localhost:5175', { waitUntil: 'networkidle' });
  await pageWorker.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/tests/screenshots/hd_bg_worker_login_preview.png' });
  console.log('HD Worker Login Background Screenshot Saved!');

  await browser.close();
})();

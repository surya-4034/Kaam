const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing Admin App on port 5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/admin_portal_running_preview.png' });
  console.log('Admin Portal Running Screenshot Saved!');
  
  await browser.close();
})();

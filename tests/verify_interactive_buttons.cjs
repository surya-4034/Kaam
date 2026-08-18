const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  
  // Submit Admin Login
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/interactive_admin_dashboard_preview.png' });
  console.log('Interactive Admin Dashboard Screenshot Saved!');
  
  await browser.close();
})();

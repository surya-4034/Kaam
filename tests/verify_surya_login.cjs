const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  
  // Submit Admin Login with Surya-4034
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  
  const title = await page.title();
  console.log('Admin Dashboard Title:', title);
  
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/surya_admin_dashboard_preview.png' });
  console.log('Surya Admin Dashboard Screenshot Saved!');
  
  await browser.close();
})();

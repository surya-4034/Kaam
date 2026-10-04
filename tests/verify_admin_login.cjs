const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  
  // Clear any existing localStorage session to show Login Card
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  
  const title = await page.title();
  console.log('Admin Login Page Title:', title);
  
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/admin_login_portal_preview.png' });
  console.log('Admin Login Portal Screenshot Saved!');
  
  await browser.close();
})();

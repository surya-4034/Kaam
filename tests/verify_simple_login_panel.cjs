const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  
  const title = await page.title();
  console.log('Admin Login Page Title:', title);
  
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/simple_admin_login_panel_preview.png' });
  console.log('Simple Admin Login Panel Screenshot Saved!');
  
  await browser.close();
})();

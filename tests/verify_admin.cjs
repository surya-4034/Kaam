const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  
  // Fill Admin Login
  await page.fill('input[type="email"]', 'admin@kaam.in');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(1000);
  
  const title = await page.title();
  console.log('Admin App Page Title:', title);
  
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/admin_sections_preview.png' });
  console.log('Admin App Page Screenshot Saved!');
  
  await browser.close();
})();

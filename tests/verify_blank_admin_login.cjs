const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Take screenshot of blank Admin Login Panel
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/blank_admin_login_panel_preview.png' });
  console.log('Blank Admin Login Panel Screenshot Saved!');

  await browser.close();
})();

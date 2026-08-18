const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Click Forgot Password?
  await page.click('button:has-text("Forgot Password?")');
  await page.waitForSelector('h2:has-text("TYPE ADMIN SECRET CODE")');

  // Take screenshot of clean TYPE ADMIN SECRET CODE screen
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/clean_type_admin_secret_code_preview.png' });
  console.log('Clean TYPE ADMIN SECRET CODE Screenshot Saved!');

  await browser.close();
})();

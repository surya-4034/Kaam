const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing Master Admin Forgot Password Flow on Port 5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  
  // Click Forgot Password?
  await page.click('button:has-text("Forgot Password?")');
  await page.waitForTimeout(1000);
  
  // Screenshot Step 1: TYPE SECRET CODE Screen
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/admin_forgot_secret_code_preview.png' });
  console.log('Admin Forgot Step 1 (TYPE SECRET CODE) Screenshot Saved!');
  
  // Fill Secret Code and click Verify
  await page.fill('input[placeholder="Enter 6-digit secret code"]', '123456');
  await page.click('button:has-text("Verify Secret Code & Continue")');
  await page.waitForTimeout(1000);
  
  // Screenshot Step 2: Reset Admin Password Screen
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/admin_reset_password_page_preview.png' });
  console.log('Admin Reset Password Page Screenshot Saved!');
  
  await browser.close();
})();

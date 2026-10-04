const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing Updated Reset Password Flow on Client App...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  
  // Navigate to Email Sign In -> Forgot Password
  await page.click('button:has-text("Email Login")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Forgot Password?")');
  await page.waitForTimeout(500);
  
  // Fill Email and click Send OTP / Code
  await page.fill('input[name="email"]', 'sy191101400@gmail.com');
  await page.click('button:has-text("Send OTP / Code")');
  await page.waitForTimeout(1000);
  
  // Screenshot 1: Clean Step 1 without extra header banners
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/clean_forgot_step1_preview.png' });
  console.log('Clean Step 1 Screenshot Saved!');
  
  // Bypass code verification to Step 2 for UI test
  await page.evaluate(() => {
    // Fill OTP code directly or force transition
    const confirmBtn = document.querySelector('button:has-text("Confirm Code")');
    if (confirmBtn) confirmBtn.click();
  });
  await page.waitForTimeout(1000);
  
  await page.close();
  await browser.close();
})();

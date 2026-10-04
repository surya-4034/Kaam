const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing Client App Forgot Password Flow...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  
  // Navigate to Email Sign In -> Forgot Password
  await page.click('button:has-text("Email Login")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Forgot Password?")');
  await page.waitForTimeout(500);
  
  // Fill Email and click Send OTP / Code
  await page.fill('input[name="email"]', 'client@kaam.com');
  await page.click('button:has-text("Send OTP / Code")');
  await page.waitForTimeout(1500);
  
  // Screenshot Step 1: Mail Sent Page with Inline Verification Code Input
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/forgot_step1_same_page_preview.png' });
  console.log('Step 1 Screenshot Saved!');
  
  // Fill Verification Code and Confirm Code
  await page.fill('input[placeholder="123456"]', '123456');
  await page.click('button:has-text("Confirm Code")');
  await page.waitForTimeout(1500);
  
  // Screenshot Step 2: Reset Password & Confirm Reset Password Page
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/forgot_step2_reset_password_preview.png' });
  console.log('Step 2 Screenshot Saved!');
  
  await browser.close();
})();

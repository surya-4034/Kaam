const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Click Forgot Password to get OTP
  await page.click('button:has-text("Forgot Password?")');
  await page.waitForTimeout(500);

  // Directly set authViewState to RESET_PASSWORD using React state / or mock response
  await page.route('**/api/auth/admin-verify-code', route => {
    route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
  });

  await page.fill('input[placeholder="Enter 6-digit secret code"]', '123456');
  await page.click('button:has-text("Verify Secret Code & Continue")');
  await page.waitForTimeout(500);

  // Fill Confirm New Admin Key
  await page.fill('input[placeholder="Confirm new password"]', 'Sujal957#Updated');
  // Click Eye Icon on Confirm Reset Password Field
  await page.click('button:has(svg.lucide-eye)');
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/admin_reset_confirm_eye_revealed_preview.png' });
  console.log('Admin Reset Confirm Eye Revealed Screenshot Saved!');

  await browser.close();
})();

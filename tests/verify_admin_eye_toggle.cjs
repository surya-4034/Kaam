const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing Admin Eye Toggle on Port 5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  
  // Fill Admin Key
  await page.fill('input[placeholder="Sujal957#"]', 'Sujal957#');
  
  // Click Eye Icon on Login Key Field to toggle visibility
  await page.click('button:has(svg.lucide-eye)');
  await page.waitForTimeout(500);
  
  // Screenshot Login Page with Password Revealed
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/admin_login_eye_revealed_preview.png' });
  console.log('Admin Login Eye Revealed Screenshot Saved!');
  
  // Now test Reset Password Confirm field
  await page.click('button:has-text("Forgot Password?")');
  await page.waitForTimeout(500);
  await page.fill('input[placeholder="Enter 6-digit secret code"]', '123456');
  await page.click('button:has-text("Verify Secret Code & Continue")');
  await page.waitForTimeout(500);
  
  // Fill Confirm New Admin Key
  await page.fill('input[placeholder="Confirm new password"]', 'MyNewSecretPass#');
  // Click Eye Icon on Confirm Reset Password Field
  await page.click('button:has(svg.lucide-eye)');
  await page.waitForTimeout(500);
  
  // Screenshot Reset Page with Confirm Password Revealed
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/admin_reset_confirm_eye_revealed_preview.png' });
  console.log('Admin Reset Confirm Eye Revealed Screenshot Saved!');
  
  await browser.close();
})();

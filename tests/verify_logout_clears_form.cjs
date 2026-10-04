const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing Admin Logout Form Clearing on Port 5176...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Mock admin-login route
  await page.route('**/api/auth/admin-login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'mock-admin-token', admin: { id: 'Surya-4034', role: 'ADMIN' } })
    });
  });

  // 1. Fill credentials and submit
  await page.fill('input[placeholder="Enter Admin ID"]', 'Surya-4034');
  await page.fill('input[placeholder="Enter Admin Key"]', 'Sujal957#');
  await page.click('button:has-text("Admin Login")');
  await page.waitForTimeout(500);

  // 2. Click Sign Out
  await page.click('button:has-text("Sign Out")');
  await page.waitForTimeout(500);

  // 3. Verify input values are completely blank
  const adminIdVal = await page.inputValue('input[placeholder="Enter Admin ID"]');
  const passwordVal = await page.inputValue('input[placeholder="Enter Admin Key"]');

  console.log(`Admin ID Value: "${adminIdVal}"`);
  console.log(`Password Value: "${passwordVal}"`);

  if (adminIdVal === '' && passwordVal === '') {
    console.log('✅ SUCCESS: Form fields are completely BLANK after logout!');
  } else {
    console.error('❌ ERROR: Form fields still contain values after logout!');
  }

  // Screenshot post-logout blank page
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/post_logout_blank_form_preview.png' });

  await browser.close();
})();

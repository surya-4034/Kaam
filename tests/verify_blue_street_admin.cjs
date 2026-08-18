const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 1. Admin Login View (Blue Street Cyan Theme)
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/tests/screenshots/blue_street_admin_login_preview.png' });
  console.log('Admin Login Blue Street Theme Screenshot Saved!');

  // 2. Perform Login to view Dashboard
  await page.fill('input[placeholder="Enter Admin ID"]', 'Surya-4034');
  await page.fill('input[placeholder="Enter Admin Key"]', 'Sujal957#');
  
  // Intercept login request if backend is offline to simulate logged-in state
  await page.evaluate(() => {
    localStorage.setItem('kaam_admin_session', 'true');
    localStorage.setItem('kaam_admin_token', 'mock_token');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/tests/screenshots/blue_street_admin_dashboard_preview.png' });
  console.log('Admin Dashboard Blue Street Theme Screenshot Saved!');

  await browser.close();
})();

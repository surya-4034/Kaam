const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Client App (Port 5174) - Image 1 Deep Teal & Gold Theme
  const pageClient = await browser.newPage();
  await pageClient.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await pageClient.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/tests/screenshots/theme_client_teal_gold_preview.png' });
  console.log('Client App Teal & Gold Theme Screenshot Saved!');

  // 2. Admin App (Port 5176) - Image 2 Magenta/Purple/Teal Theme
  const pageAdmin = await browser.newPage();
  await pageAdmin.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await pageAdmin.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/tests/screenshots/theme_admin_magenta_teal_preview.png' });
  console.log('Admin App Magenta & Teal Theme Screenshot Saved!');

  await browser.close();
})();

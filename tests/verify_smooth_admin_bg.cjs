const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/tests/screenshots/smooth_blue_street_admin_preview.png' });
  console.log('Smooth Blue Street Admin Background Screenshot Saved!');
  await browser.close();
})();

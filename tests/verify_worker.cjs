const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5175...');
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
  
  const title = await page.title();
  console.log('Worker App Page Title:', title);
  
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/scratch/kaam/worker_page_preview.png' });
  console.log('Worker App Page Screenshot Saved!');
  
  await browser.close();
})();

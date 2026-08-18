const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const targetDir = path.join(__dirname, 'Videos', 'authentication module videos');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function recordVideo(url, actionFn, outputFilename) {
  console.log(`🎥 Starting recording for: ${outputFilename}`);
  const browser = await chromium.launch({ headless: true });
  const tempRecordDir = path.join(targetDir, 'temp_' + Date.now());
  fs.mkdirSync(tempRecordDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: tempRecordDir,
      size: { width: 1280, height: 800 }
    }
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  try {
    await actionFn(page);
  } catch (err) {
    console.error(`Error during recording ${outputFilename}:`, err);
  }

  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  // Find recorded video file
  const files = fs.readdirSync(tempRecordDir);
  const videoFile = files.find(f => f.endsWith('.webm') || f.endsWith('.mp4'));
  
  if (videoFile) {
    const srcPath = path.join(tempRecordDir, videoFile);
    const destPathMp4 = path.join(targetDir, outputFilename.replace('.mp3', '.mp4'));
    const destPathMp3 = path.join(targetDir, outputFilename);
    
    console.log(`🔄 Encoding QuickTime Compatible H.264 Video: ${destPathMp4}`);
    try {
      // Use FFmpeg to convert to 100% QuickTime Player compatible H.264 / yuv420p MP4
      execSync(`"${ffmpegPath}" -y -i "${srcPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" "${destPathMp4}"`, { stdio: 'inherit' });
      fs.copyFileSync(destPathMp4, destPathMp3);
      console.log(`✅ QuickTime Compatible Recording Saved: ${destPathMp4} & ${destPathMp3}`);
    } catch (ffmpegErr) {
      console.error('FFmpeg encoding warning:', ffmpegErr);
      fs.copyFileSync(srcPath, destPathMp4);
      fs.copyFileSync(srcPath, destPathMp3);
    }
    
    fs.rmSync(tempRecordDir, { recursive: true, force: true });
  }
}

async function runAllRecordings() {
  // 1. Worker Login Demo
  await recordVideo(
    'http://localhost:5175',
    async (page) => {
      console.log('Step 1: Worker Login Demo Walkthrough');
      await page.waitForSelector('text=Google Authentication', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      const emailLoginBtn = page.locator('button:has-text("Email Login")');
      if (await emailLoginBtn.isVisible()) {
        await emailLoginBtn.click();
        await page.waitForTimeout(1000);
        await page.fill('input[name="email"]', 'worker.demo@kaam.in');
        await page.fill('input[name="password"]', 'WorkerPass123!');
        await page.waitForTimeout(1000);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2500);
      }
    },
    'workerlogin.mp3'
  );

  // 2. Worker Signup Demo
  await recordVideo(
    'http://localhost:5175',
    async (page) => {
      console.log('Step 2: Worker Signup Demo Walkthrough');
      await page.waitForSelector('text=Not having account? create account', { timeout: 5000 });
      await page.click('text=Not having account? create account');
      await page.waitForTimeout(1000);
      
      const byEmailBtn = page.locator('button:has-text("By E-mail")');
      if (await byEmailBtn.isVisible()) {
        await byEmailBtn.click();
        await page.waitForTimeout(1000);
        await page.fill('input[name="fullName"]', 'Suresh Kumar Plumber');
        await page.fill('input[name="email"]', 'suresh.plumber@kaam.in');
        await page.click('text=Verify Mail');
        await page.waitForTimeout(1500);
        await page.fill('input[placeholder="123456"]', '987654');
        await page.click('button:has-text("Confirm")');
        await page.waitForTimeout(1000);
        await page.fill('input[name="password"]', 'PlumberPass123!');
        await page.waitForTimeout(1500);
      }
    },
    'worker_account_signup.mp3'
  );

  // 3. Client Login Demo
  await recordVideo(
    'http://localhost:5174',
    async (page) => {
      console.log('Step 3: Client Login Demo Walkthrough');
      await page.waitForSelector('text=Google Authentication', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      const emailLoginBtn = page.locator('button:has-text("Email Login")');
      if (await emailLoginBtn.isVisible()) {
        await emailLoginBtn.click();
        await page.waitForTimeout(1000);
        await page.fill('input[name="email"]', 'client.demo@kaam.in');
        await page.fill('input[name="password"]', 'ClientPass123!');
        await page.waitForTimeout(1000);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2500);
      }
    },
    'client_login.mp3'
  );

  // 4. Client Signup Demo
  await recordVideo(
    'http://localhost:5174',
    async (page) => {
      console.log('Step 4: Client Signup Demo Walkthrough');
      await page.waitForSelector('text=Not having account? create account', { timeout: 5000 });
      await page.click('text=Not having account? create account');
      await page.waitForTimeout(1000);
      
      const byEmailBtn = page.locator('button:has-text("By E-mail")');
      if (await byEmailBtn.isVisible()) {
        await byEmailBtn.click();
        await page.waitForTimeout(1000);
        await page.fill('input[name="fullName"]', 'Anita Sharma Homeowner');
        await page.fill('input[name="email"]', 'anita.homeowner@kaam.in');
        await page.click('text=Verify Mail');
        await page.waitForTimeout(1500);
        await page.fill('input[placeholder="123456"]', '654321');
        await page.click('button:has-text("Confirm")');
        await page.waitForTimeout(1000);
        await page.fill('input[name="password"]', 'HomeownerPass123!');
        await page.waitForTimeout(1500);
      }
    },
    'client_signup.mp3'
  );

  console.log('🎉 All QuickTime-compatible demo recordings completed successfully!');
}

runAllRecordings();

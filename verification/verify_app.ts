import { chromium, Page } from 'playwright';

async function verifyApp() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // The base path is set to /interactive-task-bubble/ in vite.config.ts
  const url = 'http://localhost:5173/interactive-task-bubble/';

  console.log(`Navigating to ${url}`);
  await page.goto(url);

  // Wait for the app to load.
  // We can look for the title or a canvas element which Matter.js creates.
  await page.waitForSelector('canvas');

  // Also check if the title is correct (though it's in index.html, we can just check if page loads)
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Take a screenshot
  await page.screenshot({ path: 'verification/app_screenshot.png' });

  console.log('Screenshot taken at verification/app_screenshot.png');

  await browser.close();
}

verifyApp().catch(console.error);

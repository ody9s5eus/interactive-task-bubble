import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');

    // Wait for title or initial load
    await page.waitForTimeout(1000); // Wait for physics engine to init

    // Take screenshot of initial state (empty)
    await page.screenshot({ path: 'verification/initial.png' });
    console.log('Taken initial screenshot');

    // Add a task
    console.log('Adding task 1...');
    // Click the FAB to open input
    await page.click('button:has(.lucide-plus)');

    // Type in input
    await page.fill('input[type="text"]', 'Hello World');

    // Click submit (the button inside the form)
    await page.click('form button[type="submit"]');

    // Add another task
    console.log('Adding task 2...');
    await page.fill('input[type="text"]', 'Bounce Me');
    await page.click('form button[type="submit"]');

    // Wait for bubbles to appear and fall
    await page.waitForTimeout(2000);

    // Take screenshot with bubbles
    await page.screenshot({ path: 'verification/bubbles.png' });
    console.log('Taken bubbles screenshot');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);

    // Add a task to create a bubble
    console.log('Adding task...');
    await page.click('button:has(.lucide-plus)');
    await page.fill('input[type="text"]', 'Drag Me');
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(2000); // Wait for bubble to fall and settle

    // Find the bubble's DOM element
    // Note: We can't click the DOM element directly because it has pointer-events-none.
    // However, Playwright's mouse actions work on coordinates.
    // We need to find the coordinates of the "Drag Me" text.

    // We can locate the element by text
    const bubbleText = page.getByText('Drag Me');
    const box = await bubbleText.boundingBox();

    if (!box) {
        throw new Error('Bubble not found');
    }

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    console.log(`Found bubble at ${startX}, ${startY}`);

    // Perform Drag
    // We drag it up
    const targetX = startX;
    const targetY = startY - 200;

    console.log(`Dragging to ${targetX}, ${targetY}`);

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 20 }); // Smooth drag

    // Hold it there for a moment
    await page.waitForTimeout(500);

    // Take a screenshot while holding (to prove we moved it)
    await page.screenshot({ path: 'verification/dragging.png' });
    console.log('Taken dragging screenshot');

    await page.mouse.up();

    // Wait for it to fall back down
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/dropped.png' });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();

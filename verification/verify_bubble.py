from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 667}) # Mobile viewport

        # Go to local dev server
        page.goto("http://localhost:5173/")

        # Click the floating action button (Plus icon) to open the input
        # It has a Plus icon. The input is initially hidden or not rendered.
        # Check InputOverlay.tsx: it renders a button with Plus icon.
        # When clicked, it sets isOpen to true, and the form appears.

        # Click the FAB
        page.locator("button:has(svg.lucide-plus)").last.click()

        # Wait for input to appear
        page.wait_for_selector("input[placeholder='New Task...']")

        # Add a task to create a bubble
        page.fill("input[placeholder='New Task...']", "Test Task")

        # Click the submit button inside the form (the first Plus icon inside the form)
        page.locator("form button[type='submit']").click()

        # Wait for bubble to appear
        page.wait_for_selector("text=Test Task")

        # Take screenshot
        page.screenshot(path="verification/mobile_view.png")

        browser.close()

if __name__ == "__main__":
    run()

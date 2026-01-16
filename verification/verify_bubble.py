import time
from playwright.sync_api import sync_playwright

def verify_bubble():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 375, 'height': 667})
        page = context.new_page()

        try:
            page.goto('http://localhost:5173/interactive-task-bubble/')
            page.wait_for_load_state("networkidle")

            # 1. Click the toggle button (Plus icon) to open input
            # It toggles between Plus and X. Initially Plus.
            # It's a button.
            page.get_by_role("button").first.click()

            # 2. Now the input should appear
            page.wait_for_selector('input[placeholder="New Task..."]')

            # 3. Fill and submit
            page.get_by_placeholder("New Task...").fill("GlassyTest")
            page.get_by_role("button").last.click() # The submit button inside the form

            time.sleep(2)
            page.screenshot(path="verification/bubble_check.png")
            print("Screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_debug.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_bubble()

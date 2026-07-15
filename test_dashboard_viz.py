from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.on("console", lambda msg: print(f"Browser console: {msg.type}: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page error: {err}"))
    
    page.goto("http://localhost:8085/")
    page.wait_for_timeout(3000)
    
    # Click the Performance tab
    page.locator("#tabPerformance").click()
    page.wait_for_timeout(1000)
    
    # Select ITDC
    page.select_option("#perfFilterBU", "ITDC")
    page.wait_for_timeout(2000)
    
    browser.close()

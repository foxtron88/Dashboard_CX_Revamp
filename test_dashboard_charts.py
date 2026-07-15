from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
    page.goto("http://localhost:8085/")
    page.wait_for_timeout(2000)
    
    # Check if elements exist
    cc = page.locator("#perfCallCenterChart").count()
    sm = page.locator("#perfSocialMediaChart").count()
    comp = page.locator("#perfComplaintChart").count()
    print(f"Charts present: CC={cc}, SM={sm}, Comp={comp}")
    
    browser.close()

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:8085/")
    page.wait_for_timeout(2000)
    
    val = page.locator(".overall-kpi-card:has-text('Total Pengunjung') .kpi-value").inner_text()
    print("Total Pengunjung Value:", val)
    
    # Change date filter
    page.fill("#filterStartDate", "2026-02-01")
    page.fill("#filterEndDate", "2026-02-28")
    page.locator("#filterStartDate").dispatchEvent("change")
    page.wait_for_timeout(2000)
    
    val2 = page.locator(".overall-kpi-card:has-text('Total Pengunjung') .kpi-value").inner_text()
    print("Total Pengunjung Value After Date Filter:", val2)
    
    browser.close()

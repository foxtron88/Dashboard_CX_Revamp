from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}") if msg.type in ['error','warning'] else None)
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
    
    page.goto("http://localhost:8085/")
    page.wait_for_timeout(3000)
    
    # Click Performance tab
    page.locator("#tabPerformance").click()
    page.wait_for_timeout(2000)
    
    # Check new charts exist
    charts = ['chartPengunjungInteraksi','chartKategoriInteraksi','chartChannelVolume','chartAHTChannel']
    for cid in charts:
        count = page.locator(f"#{cid}").count()
        print(f"Canvas #{cid}: {'✅' if count > 0 else '❌'}")
    
    # Check KPI cards
    kpi = page.locator("#interaksiKpiCards .kpi-card").count()
    print(f"KPI Cards: {kpi}")
    
    # Test with API filter
    page.select_option("#perfFilterBU", "API")
    page.wait_for_timeout(1500)
    print("Filter to API: OK")
    
    browser.close()
    print("All tests done!")

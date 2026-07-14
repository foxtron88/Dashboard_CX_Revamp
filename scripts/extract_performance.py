#!/usr/bin/env python3
"""
Extract performance targets and statistics from CX_Performance Excel files
and output to a structured JSON file for the dashboard.
"""

import pandas as pd
import os
import glob
import json

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
CX_PERF_DIR = os.path.join(DATA_DIR, 'CX_Performance')
OUTPUT_FILE = os.path.join(DATA_DIR, 'cx_performance.json')

def safe_extract_list(values):
    """Extract numeric values, replacing NaN with None"""
    res = []
    for v in values:
        try:
            # handle numeric strings formatted with comma
            if isinstance(v, str) and ',' in v:
                v = v.replace(',', '.')
            num = pd.to_numeric(v)
            if pd.isna(num):
                res.append(None)
            else:
                res.append(float(num))
        except:
            res.append(None)
    return res

def main():
    files = glob.glob(os.path.join(CX_PERF_DIR, "*.xlsx"))
    result = {}

    months_labels = [
        "Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25",
        "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25",
        "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"
    ]

    for f in sorted(files):
        if "~$" in f: continue
        bu_name = os.path.basename(f).replace("Template Data CX Performance - ", "").replace(".xlsx", "")
        
        print(f"Processing {bu_name}...")
        bu_data = {
            "scores": {
                "overall": [],
                "people": [],
                "process": [],
                "premises": []
            },
            "interactions": {
                "pengaduan": [],
                "permohonan": [],
                "informasi": [],
                "pengunjung": []
            }
        }
        
        xl = pd.ExcelFile(f)
        
        # 1. Extract Scores from "Data Performance"
        dp_sheet = [s for s in xl.sheet_names if "Performance" in s]
        if dp_sheet:
            df = pd.read_excel(f, sheet_name=dp_sheet[0], header=None)
            for i, row in df.iterrows():
                row_str = " ".join([str(x).lower() for x in row.values[:5]])
                
                if len(row.values) >= 24:
                    vals_2025 = safe_extract_list(row.values[5:17])
                    vals_2026 = safe_extract_list(row.values[18:24])
                    combined_vals = vals_2025 + vals_2026
                else:
                    combined_vals = [None] * 18

                if "csat - overall" in row_str or "overall satisfaction" in row_str or "kepuasan menginap" in row_str:
                    bu_data["scores"]["overall"] = combined_vals
                elif "csat - people" in row_str:
                    bu_data["scores"]["people"] = combined_vals
                elif "csat - process" in row_str:
                    bu_data["scores"]["process"] = combined_vals
                elif "csat - premises" in row_str:
                    bu_data["scores"]["premises"] = combined_vals

        # 2. Extract Statistics from "Statistik"
        stat_sheet = [s for s in xl.sheet_names if "Statistik" in s]
        if stat_sheet:
            df = pd.read_excel(f, sheet_name=stat_sheet[0], header=None)
            for i, row in df.iterrows():
                row_str = " ".join([str(x).lower() for x in row.values[:5]])
                
                if len(row.values) >= 24:
                    vals_2025 = safe_extract_list(row.values[5:17])
                    vals_2026 = safe_extract_list(row.values[18:24])
                    combined_vals = vals_2025 + vals_2026
                else:
                    combined_vals = [None] * 18

                if "pengaduan" in row_str and "telepon" not in row_str:
                    bu_data["interactions"]["pengaduan"] = combined_vals
                elif "permohonan" in row_str:
                    bu_data["interactions"]["permohonan"] = combined_vals
                elif "informasi" in row_str:
                    bu_data["interactions"]["informasi"] = combined_vals
                elif "jumlah pengunjung" in row_str or "total pengunjung" in row_str:
                    bu_data["interactions"]["pengunjung"] = combined_vals

        result[bu_name] = bu_data

    result["_months"] = months_labels

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        json.dump(result, outfile, indent=2, ensure_ascii=False)
        
    print(f"✅ Successfully wrote parsed performance data to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

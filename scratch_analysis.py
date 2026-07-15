import pandas as pd
import os
import glob
from datetime import datetime

data_dir = "data/CX_Performance"
files = glob.glob(os.path.join(data_dir, "*.xlsx"))

report_lines = []
report_lines.append("# Analisis Data CX Performance")
report_lines.append("")
report_lines.append("Berdasarkan data yang ada di folder `data/CX_Performance`, berikut adalah hasil ekstraksi dan agregasi dari *sheet* **Statistik** (interaksi pelanggan) untuk masing-masing Business Unit:")
report_lines.append("")

summary_data = []

for f in sorted(files):
    if "~$" in f: continue
    bu_name = os.path.basename(f).replace("Template Data CX Performance - ", "").replace(".xlsx", "")
    
    xl = pd.ExcelFile(f)
    stat_sheet = [s for s in xl.sheet_names if "Statistik" in s]
    
    if stat_sheet:
        df = pd.read_excel(f, sheet_name=stat_sheet[0], header=None)
        
        metrics = {
            "Pengaduan (Complaints)": 0,
            "Permintaan/Permohonan (Requests)": 0,
            "Informasi (Information)": 0,
            "Pertanyaan (Questions)": 0,
            "Apresiasi (Appreciation)": 0,
            "Saran (Suggestions)": 0
        }
        
        for i, row in df.iterrows():
            # Get text from first 5 columns to identify the row type
            row_str = " ".join([str(x).lower() for x in row.values[:5]])
            
            # Sum columns 5 to 22 (Jan 2025 to Jun 2026)
            try:
                row_sum = pd.to_numeric(row.values[5:23], errors='coerce').sum()
            except:
                row_sum = 0
                
            if pd.isna(row_sum): row_sum = 0
            
            if "pengaduan" in row_str and "telepon" not in row_str:
                metrics["Pengaduan (Complaints)"] += row_sum
            elif "permohonan" in row_str:
                metrics["Permintaan/Permohonan (Requests)"] += row_sum
            elif "pertanyaan" in row_str:
                metrics["Pertanyaan (Questions)"] += row_sum
            elif "informasi" in row_str:
                metrics["Informasi (Information)"] += row_sum
            elif "apresiasi" in row_str:
                metrics["Apresiasi (Appreciation)"] += row_sum
            elif "saran" in row_str and "kotak" not in row_str:
                metrics["Saran (Suggestions)"] += row_sum
                
        summary_data.append({
            "BU": bu_name,
            **metrics
        })
        
        report_lines.append(f"## {bu_name}")
        for k, v in metrics.items():
            report_lines.append(f"- **{k}**: {int(v):,}")
        report_lines.append("")

report_lines.append("## Kesimpulan Agregat")
report_lines.append("Jika dijumlahkan secara keseluruhan, berikut adalah distribusi interaksi pelanggan dari semua BU:")
total_metrics = {}
for d in summary_data:
    for k, v in d.items():
        if k != "BU":
            total_metrics[k] = total_metrics.get(k, 0) + v

for k, v in total_metrics.items():
    report_lines.append(f"- **{k}**: {int(v):,}")

report_content = "\n".join(report_lines)

# Write to a temporary file, then we can read it to create an artifact.
with open("temp_report.md", "w") as f:
    f.write(report_content)

print("Analysis complete. Wrote to temp_report.md")

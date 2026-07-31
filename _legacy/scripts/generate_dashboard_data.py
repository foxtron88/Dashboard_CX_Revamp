import os
import csv
import re
from datetime import datetime

BASE = "/Users/erwanramadhani/Documents/Dashboard_CX/_legacy/data/Sensum_Raw/Sensum"
OUT_FILE = "/Users/erwanramadhani/Documents/Dashboard_CX/public/data/sensum_csat.csv"
TARGET_BUS = ["API", "IAS", "IDM", "ITDC", "Sarinah"]

SCHEMA = [
    "respondent_id", "synced_at", "bu", "survey_type", "subholding",
    "location", "region", "facility_type", "facility_id",
    "overall_score", "overall_group", "people_score", "process_score",
    "premises_score", "nps_score", "feedback", "tags", "sentiment",
    "channel", "language"
]

def clean_header(h: str) -> str:
    return h.strip().lstrip("\ufeff").strip('"').strip()

def safe(row, idx, default=""):
    if idx is None or idx >= len(row):
        return default
    return row[idx].strip()

def score_to_numeric(val):
    if not val: return ""
    try:
        s = float(val)
        return str(int(s)) if s == int(s) else str(s)
    except:
        return ""

def get_avg_valid(row, cols):
    vals = []
    for c in cols:
        if c < len(row):
            s = score_to_numeric(row[c].strip())
            if s: vals.append(float(s))
    if not vals: return ""
    avg = sum(vals)/len(vals)
    return str(int(avg)) if avg == int(avg) else f"{avg:.1f}"

def score_to_group(score_str: str) -> str:
    try:
        s = float(score_str)
        if s >= 4:   return "Satisfied"
        if s == 3:   return "Neutral"
        if s <= 2:   return "Dissatisfied"
    except (ValueError, TypeError):
        pass
    return ""

def parse_date(raw: str) -> str:
    raw = raw.strip()
    for fmt in (
        "%d-%m-%Y %H:%M:%S", "%d-%m-%Y %H:%M",
        "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ",
        "%d/%m/%Y %H:%M:%S", "%d/%m/%Y",
        "%Y-%m-%d %H:%M:%S", "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            pass
    return raw

def process_file(bu, fname, fpath, all_records, seen_ids):
    try:
        with open(fpath, encoding="utf-8", errors="replace") as f:
            rows = list(csv.reader(f))
        if len(rows) <= 1: return
        
        raw_headers = rows[0]
        h = [clean_header(x) for x in raw_headers]
        h_upper = [x.upper() for x in h]
        
        def find_col(*patterns):
            for pat in patterns:
                pat_l = pat.lower()
                for i, col in enumerate(h):
                    if pat_l in col.lower(): return i
            return None
            
        resp_idx = next((i for i, x in enumerate(h_upper) if x in ["RESPONDENT ID", "RESPONDENT_ID"]), None)
        sync_idx = find_col("Sync On-DateTime", "Sync On")
        sub_idx = find_col("SUBHOLDING")
        loc_idx = find_col("NAMA LOKASI")
        reg_idx = find_col("REGION", "DESTINASI")
        tipe_idx = find_col("TIPE FASILITAS")
        id_idx = find_col("ID FASILITAS")
        
        # Determine Survey Type from filename or tipe fasilitas
        survey_type = ""
        if "baggage claim" in fname.lower(): survey_type = "Baggage Claim"
        elif "toilet" in fname.lower(): survey_type = "Toilet"
        elif "musholla" in fname.lower() or "praying room" in fname.lower(): survey_type = "Musholla"
        elif "kasir" in fname.lower(): survey_type = "Kasir"
        elif "shuttle" in fname.lower(): survey_type = "Shuttle"
        else: survey_type = "General"
        
        # 3P CSAT indices
        ov_cols, ppl_cols, prm_cols, prc_cols = [], [], [], []
        for i, col in enumerate(h):
            hl = col.lower().strip()
            if not hl.startswith("numeric_"):
                continue

            # Sub-driver: People — always has "staff / petugas / karyawan"
            if "staff" in hl or "petugas" in hl or "karyawan" in hl:
                ppl_cols.append(i)

            # Sub-driver: Process — operational flow keywords
            elif "alur" in hl or "proses" in hl or "antrean" in hl or "akses" in hl or "pembayaran" in hl or "informasi" in hl or "kecepatan" in hl or "prosedur" in hl:
                prc_cols.append(i)

            # Sub-driver: Premises — physical facility keywords
            # Covers: kelengkapan/kebersihan/kenyamanan/ketersediaan AND
            # API-specific: "Numeric_Fasilitas <FacilityName> (...)" sub-driver columns
            # IDM-specific: "Kualitas Foto dan Harga layanan"
            elif ("kelengkapan" in hl or "kebersihan" in hl or "kenyamanan" in hl or "ketersediaan" in hl or "kualitas" in hl or "harga" in hl
                  or ("fasilitas" in hl and "secara keseluruhan" not in hl and "seberapa puas" not in hl)):
                prm_cols.append(i)

            # Overall: generic satisfaction question — "secara keseluruhan" OR "seberapa puas"
            # (includes "{tipe fasilitas}" placeholder variants)
            elif "secara keseluruhan" in hl or "seberapa puas" in hl:
                ov_cols.append(i)
                    
        # Fallback for IJH (NPS, overall is sometimes not caught if pattern misses)
        if bu == "IJH" and not ov_cols:
            idx1 = find_col("Numeric_Seberapa puas Anda dengan keseluruhan")
            if idx1 is not None: ov_cols.append(idx1)
            
        nps_idx = find_col("Numeric_NPS", "Numeric_Recommend", "Numeric_Seberapa besar kemungkinan")
        
        # Feedback and Sentiment
        fb_idx = find_col("Silakan berikan saran", "saran dan masukan", "Ceritakan pengalaman", "Mohon berikan masukan", "saran / masukan")
        fbs_idx = find_col("Sentiment_Silakan", "Sentiment_Ceritakan", "Sentiment_Mohon", "Sentiment_saran")
        tags_idx = find_col("Tags_Silakan", "Tags_Ceritakan", "Tags_Mohon", "Tags_saran")
        
        chan_idx = find_col("Channel Type")
        lang_idx = find_col("Response Language")
        
        for row in rows[1:]:
            if not any(c.strip() for c in row): continue
            
            rid = safe(row, resp_idx)
            if rid:
                if rid in seen_ids: continue
                seen_ids.add(rid)
                
            # If IJH, naming might contain tipe fasilitas
            t_fas = safe(row, tipe_idx)
            if bu == "IJH" and not t_fas:
                naming = safe(row, find_col("NAMING"))
                if naming:
                    t_fas = naming.split("-")[0].strip() if "-" in naming else naming
                    
            ov_score = get_avg_valid(row, ov_cols)
            # if no overall score but we have others, still keep it? Yes, we want all responses.
            # However, if we don't have any score, maybe skip.
            ppl_score = get_avg_valid(row, ppl_cols)
            prm_score = get_avg_valid(row, prm_cols)
            prc_score = get_avg_valid(row, prc_cols)
            nps = score_to_numeric(safe(row, nps_idx))
            
            if not (ov_score or ppl_score or prm_score or prc_score or nps):
                # Try getting raw CSAT if numeric is missing
                csat_raw_idx = find_col("Seberapa puas")
                if csat_raw_idx is not None and safe(row, csat_raw_idx):
                    # We have a raw text answer, but let's just keep the row anyway if it has feedback
                    pass
                else:
                    if not safe(row, fb_idx):
                        continue
                        
            sync_val = safe(row, sync_idx)
            
            record = {
                "respondent_id": rid,
                "synced_at": parse_date(sync_val) if sync_val else "",
                "bu": bu,
                "survey_type": survey_type,
                "subholding": safe(row, sub_idx),
                "location": safe(row, loc_idx),
                "region": safe(row, reg_idx),
                "facility_type": t_fas,
                "facility_id": safe(row, id_idx),
                "overall_score": ov_score,
                "overall_group": score_to_group(ov_score),
                "people_score": ppl_score,
                "process_score": prc_score,
                "premises_score": prm_score,
                "nps_score": nps,
                "feedback": safe(row, fb_idx).replace("\n", " "),
                "tags": safe(row, tags_idx).replace("\n", " "),
                "sentiment": safe(row, fbs_idx),
                "channel": safe(row, chan_idx),
                "language": safe(row, lang_idx)
            }
            all_records.append(record)
            
    except Exception as e:
        print(f"Error reading {bu}/{fname}: {e}")

def main():
    all_records = []
    seen_ids = set()
    
    for bu in TARGET_BUS:
        bu_path = os.path.join(BASE, bu)
        if not os.path.isdir(bu_path): continue
        
        csv_files = [f for f in os.listdir(bu_path) if f.lower().endswith(".csv")]
        for fname in sorted(csv_files):
            process_file(bu, fname, os.path.join(bu_path, fname), all_records, seen_ids)
            
    # Write to final CSV
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SCHEMA)
        writer.writeheader()
        writer.writerows(all_records)
        
    print(f"Successfully generated {OUT_FILE} with {len(all_records)} records.")

if __name__ == "__main__":
    main()

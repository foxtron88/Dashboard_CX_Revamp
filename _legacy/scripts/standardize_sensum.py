from __future__ import annotations
"""
standardize_sensum.py
=====================
Reads all CSV files per BU (API, IDM, IJH, ITDC, Sarinah),
extracts core CSAT fields into a unified schema, then writes:

  _legacy/data/Sensum_Raw/Sensum/standardized/
    ├── API_standardized.csv
    ├── IDM_standardized.csv
    ├── IJH_standardized.csv
    ├── ITDC_standardized.csv
    ├── Sarinah_standardized.csv
    └── ALL_standardized.csv        ← merged across all BUs

Standardized schema (one row = one respondent):
  sequence | bu | subholding | nama_lokasi | lokasi_detail |
  tipe_fasilitas | id_fasilitas |
  survey_date | respondent_id | survey_status |
  channel_type | response_time_sec | survey_mode |
  csat_label | csat_score |        ← overall satisfaction (1-5)
  csat_group |                     ← Satisfied / Neutral / Dissatisfied
  nps_score |                      ← NPS (0-10, IJH only)
  verbatim | verbatim_sentiment |  ← open-text feedback + sentiment
  source_file
"""

import os
import csv
import re
from datetime import datetime

BASE      = "/Users/erwanramadhani/Documents/Dashboard_CX/_legacy/data/Sensum_Raw/Sensum"
OUT_DIR   = os.path.join(BASE, "standardized")
os.makedirs(OUT_DIR, exist_ok=True)

SCHEMA = [
    "sequence", "bu", "subholding", "nama_lokasi", "lokasi_detail",
    "tipe_fasilitas", "id_fasilitas",
    "survey_date", "respondent_id", "survey_status",
    "channel_type", "response_time_sec", "survey_mode",
    "csat_label", "csat_score", "csat_group",
    "nps_score",
    "verbatim", "verbatim_sentiment",
    "source_file",
]

# ── helpers ──────────────────────────────────────────────────────────────────

def clean_header(h: str) -> str:
    return h.strip().lstrip("\ufeff").strip('"').strip()


def find_col(header, *patterns):
    """Return the index of the first header that contains any of the patterns."""
    for pat in patterns:
        pat_l = pat.lower()
        for i, h in enumerate(header):
            if pat_l in h.lower():
                return i
    return None


def safe(row, idx, default=""):
    if idx is None or idx >= len(row):
        return default
    return row[idx].strip()


def csat_to_numeric(label: str) -> str:
    """Convert text scale to 1-5 numeric if needed."""
    mapping = {
        "very satisfied": "5", "sangat puas": "5", "sangat memuaskan": "5",
        "satisfied": "4",       "puas": "4",         "memuaskan": "4",
        "neutral": "3",         "netral": "3",        "cukup puas": "3",
        "dissatisfied": "2",    "tidak puas": "2",    "kurang puas": "2",
        "very dissatisfied": "1","sangat tidak puas": "1",
    }
    return mapping.get(label.lower().strip(), "")


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
    """Normalise to YYYY-MM-DD."""
    raw = raw.strip()
    for fmt in (
        "%d-%m-%Y %H:%M:%S", "%d-%m-%Y %H:%M",
        "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ",
        "%d/%m/%Y %H:%M:%S", "%d/%m/%Y",
        "%Y-%m-%d %H:%M:%S", "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return raw[:10] if len(raw) >= 10 else raw


# ── per-BU extraction strategies ─────────────────────────────────────────────

def extract_row_generic(row: list[str], header: list[str], fname: str, bu: str) -> dict:
    """
    Generic extractor that works for API, IDM, ITDC, Sarinah.
    All share: sequence | SUBHOLDING | NAMA LOKASI | <location_detail> |
               TIPE FASILITAS | ID FASILITAS | <main Q> | Group_<Q> | Numeric_<Q>
               … | Respondent Id | Survey Status | Survey Mode | Sync On-DateTime |
               … | Response Time | … | Channel Type | …
    """
    h = [clean_header(x) for x in header]

    # --- metadata cols ---
    seq      = safe(row, 0)
    sub      = safe(row, 1)
    loc      = safe(row, 2)
    loc_det  = safe(row, 3)                          # REGION / DESTINASI / KETERANGAN
    tipe     = safe(row, find_col(h, "TIPE FASILITAS"))
    id_fac   = safe(row, find_col(h, "ID FASILITAS"))

    # --- main CSAT ---
    # Numeric_ col at index 8 is always the overall score for all these BUs
    csat_num_idx = find_col(h, "Numeric_Seberapa puas", "Numeric_Secara keseluruhan")
    if csat_num_idx is None and len(h) > 8:
        # fallback: col 8 is Numeric of main Q
        if h[8].startswith("Numeric_"):
            csat_num_idx = 8

    csat_lbl_idx = find_col(h, "Group_Seberapa puas", "Group_Secara keseluruhan")
    if csat_lbl_idx is None and len(h) > 7 and h[7].startswith("Group_"):
        csat_lbl_idx = 7

    csat_raw_idx = 6   # col 6 is always the main question answer (raw text or number)

    csat_score_raw = safe(row, csat_num_idx)
    csat_lbl_raw   = safe(row, csat_lbl_idx)

    # If numeric col has a number, use it; else try raw
    csat_score = ""
    try:
        csat_score = str(float(csat_score_raw))
        # trim .0
        if csat_score.endswith(".0"):
            csat_score = csat_score[:-2]
    except ValueError:
        # try parsing label or raw answer
        csat_score = csat_to_numeric(safe(row, csat_raw_idx))

    csat_label = csat_lbl_raw or safe(row, csat_raw_idx)
    csat_group = score_to_group(csat_score)

    # --- verbatim (open text feedback) ---
    vb_idx  = find_col(h, "Silakan berikan saran", "Mohon berikan masukan")
    vbs_idx = find_col(h, "Sentiment_Silakan berikan", "Sentiment_Mohon berikan")
    verbatim   = safe(row, vb_idx)
    verbatim_s = safe(row, vbs_idx)

    # --- system metadata ---
    resp_id = safe(row, find_col(h, "Respondent Id", "Respondent ID"))
    status  = safe(row, find_col(h, "Survey Status"))
    mode    = safe(row, find_col(h, "Survey Mode"))
    channel = safe(row, find_col(h, "Channel Type"))
    rt_raw  = safe(row, find_col(h, "Response Time"))
    rt_sec  = ""
    try:
        rt_sec = str(int(float(rt_raw)))
    except ValueError:
        pass

    date_raw = safe(row, find_col(h, "Sync On-DateTime", "Sync On"))
    date_str = parse_date(date_raw) if date_raw else ""

    return {
        "sequence": seq, "bu": bu, "subholding": sub,
        "nama_lokasi": loc, "lokasi_detail": loc_det,
        "tipe_fasilitas": tipe, "id_fasilitas": id_fac,
        "survey_date": date_str, "respondent_id": resp_id,
        "survey_status": status, "channel_type": channel,
        "response_time_sec": rt_sec, "survey_mode": mode,
        "csat_label": csat_label, "csat_score": csat_score,
        "csat_group": csat_group, "nps_score": "",
        "verbatim": verbatim, "verbatim_sentiment": verbatim_s,
        "source_file": fname,
    }


def extract_row_ijh(row: list[str], header: list[str], fname: str) -> dict:
    """
    IJH has a hotel/event structure:
    cols 0-5: sequence, SUBHOLDING, NAMA LOKASI, REGION, STAR RATE, OWNERSHIP
    col  6:   NAMING (hotel-facility label)
    col  7-8: Guest Name / Sentiment
    col  9:   Email
    col 10-12: Event fields
    col 13:   Overall satisfaction Q  (CSAT)
    col 14:   Group_ (Satisfied / Neutral / Dissatisfied)
    col 15:   Numeric_ (1-5)
    col 16:   NPS Q (0-10 recommend)
    col 17:   Group_NPS
    col 18:   Numeric_NPS
    """
    h = [clean_header(x) for x in header]

    seq     = safe(row, 0)
    sub     = safe(row, 1)
    loc     = safe(row, 2)
    region  = safe(row, 3)
    naming  = safe(row, 6)       # e.g. "Banquette-GRAND INNA TUNJUNGAN"

    # tipe_fasilitas = first part of naming before "-"
    tipe = naming.split("-")[0].strip() if "-" in naming else naming

    # CSAT overall: col 13/14/15
    csat_num_idx = find_col(h, "Numeric_Seberapa puas Anda dengan keseluruhan",
                               "Numeric_Secara keseluruhan")
    csat_lbl_idx = find_col(h, "Group_Seberapa puas Anda dengan keseluruhan",
                               "Group_Secara keseluruhan")
    csat_raw_idx = find_col(h, "Seberapa puas Anda dengan keseluruhan",
                               "Secara keseluruhan")

    csat_score_raw = safe(row, csat_num_idx)
    csat_lbl_raw   = safe(row, csat_lbl_idx)

    csat_score = ""
    try:
        v = float(csat_score_raw)
        csat_score = str(int(v)) if v == int(v) else str(v)
    except ValueError:
        csat_score = csat_to_numeric(safe(row, csat_raw_idx))

    csat_label = csat_lbl_raw or safe(row, csat_raw_idx)
    csat_group = score_to_group(csat_score)

    # NPS
    nps_num_idx = find_col(h, "Numeric_Seberapa besar kemungkinan",
                               "Numeric_NPS", "Numeric_Recommend")
    nps_score = safe(row, nps_num_idx)

    # verbatim: open feedback col
    vb_idx  = find_col(h, "Silakan berikan saran", "saran dan masukan",
                          "Ceritakan pengalaman", "Mohon berikan")
    vbs_idx = find_col(h, "Sentiment_Silakan", "Sentiment_Ceritakan", "Sentiment_Mohon")
    verbatim   = safe(row, vb_idx)
    verbatim_s = safe(row, vbs_idx)

    resp_id = safe(row, find_col(h, "Respondent Id"))
    status  = safe(row, find_col(h, "Survey Status"))
    mode    = safe(row, find_col(h, "Survey Mode"))
    channel = safe(row, find_col(h, "Channel Type"))
    rt_raw  = safe(row, find_col(h, "Response Time"))
    rt_sec  = ""
    try:
        rt_sec = str(int(float(rt_raw)))
    except ValueError:
        pass

    date_raw = safe(row, find_col(h, "Sync On-DateTime", "Sync On"))
    date_str = parse_date(date_raw) if date_raw else ""

    return {
        "sequence": seq, "bu": "IJH", "subholding": sub,
        "nama_lokasi": loc, "lokasi_detail": region,
        "tipe_fasilitas": tipe, "id_fasilitas": naming,
        "survey_date": date_str, "respondent_id": resp_id,
        "survey_status": status, "channel_type": channel,
        "response_time_sec": rt_sec, "survey_mode": mode,
        "csat_label": csat_label, "csat_score": csat_score,
        "csat_group": csat_group, "nps_score": nps_score,
        "verbatim": verbatim, "verbatim_sentiment": verbatim_s,
        "source_file": fname,
    }


# ── main processing ───────────────────────────────────────────────────────────

BU_CONFIGS = {
    "API":     {"extractor": "generic"},
    "IDM":     {"extractor": "generic"},
    "IJH":     {"extractor": "ijh"},
    "ITDC":    {"extractor": "generic"},
    "Sarinah": {"extractor": "generic"},
}

all_rows = []
stats = {}


def deduplicate(rows, bu_label):
    """
    Deduplicate a list of record dicts by respondent_id.
    Strategy:
      - If respondent_id is non-empty  → keep FIRST occurrence (earliest file in
        sorted order, which = earliest export date in filename).
      - If respondent_id is empty       → keep ALL (cannot identify dupes).
    Returns (deduped_rows, n_raw, n_removed).
    """
    seen_ids = set()
    deduped  = []
    removed  = 0

    for rec in rows:
        rid = rec.get("respondent_id", "").strip()
        if rid:
            if rid in seen_ids:
                removed += 1
                continue
            seen_ids.add(rid)
        deduped.append(rec)

    return deduped, len(rows), removed


for bu, cfg in BU_CONFIGS.items():
    bu_path   = os.path.join(BASE, bu)
    csv_files = sorted([f for f in os.listdir(bu_path) if f.endswith(".csv")])

    bu_rows  = []
    files_ok  = 0
    files_skip = 0
    rows_err  = 0

    for fname in csv_files:
        fpath = os.path.join(bu_path, fname)
        try:
            with open(fpath, encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f)
                rows   = list(reader)

            if len(rows) <= 1:
                files_skip += 1
                continue

            header    = rows[0]
            data_rows = rows[1:]

            for row in data_rows:
                if not any(c.strip() for c in row):
                    continue
                try:
                    if cfg["extractor"] == "ijh":
                        rec = extract_row_ijh(row, header, fname)
                    else:
                        rec = extract_row_generic(row, header, fname, bu)

                    if rec["csat_score"]:
                        bu_rows.append(rec)
                except Exception:
                    rows_err += 1

            files_ok += 1

        except Exception:
            files_skip += 1

    # ── Deduplicate by Respondent ID ────────────────────────────────────────
    bu_deduped, n_raw, n_removed = deduplicate(bu_rows, bu)

    # Write per-BU CSV  (deduped)
    out_path = os.path.join(OUT_DIR, f"{bu}_standardized.csv")
    with open(out_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=SCHEMA)
        writer.writeheader()
        writer.writerows(bu_deduped)

    all_rows.extend(bu_deduped)
    stats[bu] = {
        "files_processed": files_ok,
        "files_skipped":   files_skip,
        "rows_raw":        n_raw,
        "rows_removed":    n_removed,
        "rows_unique":     len(bu_deduped),
        "rows_error":      rows_err,
    }
    print(
        f"✅ {bu:10s}  files={files_ok:4d}  "
        f"raw={n_raw:6,}  dupes_removed={n_removed:5,}  unique={len(bu_deduped):6,}"
    )

# Write combined deduplicated CSV
all_path = os.path.join(OUT_DIR, "ALL_standardized.csv")
with open(all_path, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=SCHEMA)
    writer.writeheader()
    writer.writerows(all_rows)

print(f"\n{'─'*65}")
print(f"{'BU':<12} {'Raw':>8} {'Removed':>10} {'Unique':>8}")
print(f"{'─'*65}")
total_raw = total_removed = total_unique = 0
for bu, s in stats.items():
    print(
        f"{bu:<12} {s['rows_raw']:>8,} {s['rows_removed']:>10,} {s['rows_unique']:>8,}"
    )
    total_raw     += s["rows_raw"]
    total_removed += s["rows_removed"]
    total_unique  += s["rows_unique"]
print(f"{'─'*65}")
print(f"{'TOTAL':<12} {total_raw:>8,} {total_removed:>10,} {total_unique:>8,}")
print(f"\n  Dedup rate : {total_removed/total_raw*100:.1f}% rows removed" if total_raw else "")
print(f"  Output dir : {OUT_DIR}")
print(f"\nFiles written:")
for fname in sorted(os.listdir(OUT_DIR)):
    size = os.path.getsize(os.path.join(OUT_DIR, fname))
    print(f"  {fname:<38}  {size/1024:7.1f} KB")

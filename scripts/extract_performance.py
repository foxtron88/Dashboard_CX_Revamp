#!/usr/bin/env python3
"""
Extract performance targets and statistics from CX_Performance Excel files
and output to a structured JSON file for the dashboard.

Updated to also extract:
- Jumlah Pengunjung
- Total Interaksi
- Kategorisasi Interaksi (Pengaduan, Permohonan, Informasi, Apresiasi)
- Interaksi per Channel (summed across categories)
- Average Handling Time per Channel (in minutes)
"""

import pandas as pd
import os
import glob
import json
import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
CX_PERF_DIR = os.path.join(DATA_DIR, 'CX_Performance')
OUTPUT_FILE = os.path.join(DATA_DIR, 'cx_performance.json')

# Canonical channel name mapping (normalise typos & variants)
CHANNEL_MAP = {
    'telepon': 'Telepon',
    'telepon/dial': 'Telepon',
    'telepon / dial': 'Telepon',
    'dial': 'Telepon',
    'customer sevice/tatap muka': 'Customer Service',
    'customer service/tatap muka': 'Customer Service',
    'customer service': 'Customer Service',
    'tatap muka': 'Customer Service',
    'email': 'Email',
    'email & wa grs': 'Email',
    'chatmail (email)': 'Email',
    'kotak saran': 'Kotak Saran',
    'live chat': 'Live Chat',
    'sp4n lapor!': 'SP4N Lapor!',
    'sp4n lapor': 'SP4N Lapor!',
    'whtasapp': 'WhatsApp',
    'whatsapp': 'WhatsApp',
    'instagram': 'Instagram',
    'twitter': 'Twitter',
    'contact us': 'Contact Us',
    'google review': 'Google Review',
    'surveysensum': 'SurveySensum',
    'website inquiry (cms)': 'Website Inquiry',
    'voice (omnix)': 'Voice (Omnix)',
}

MONTHS_LABELS = [
    "Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25",
    "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25",
    "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"
]

CATEGORY_KEYWORDS = [
    'keluhan', 'pengaduan', 'permintaan', 'permohonan', 'informasi',
    'pertanyaan', 'apresiasi', 'laporan', 'saran', 'request', 'reservasi',
    'permintaan informasi'
]


def safe_extract_list(values):
    res = []
    for v in values:
        try:
            if isinstance(v, str) and ',' in v:
                v = v.replace(',', '.')
            num = pd.to_numeric(v)
            res.append(None if pd.isna(num) else float(num))
        except Exception:
            res.append(None)
    return res


def extract_time_to_minutes(values):
    res = []
    for v in values:
        if isinstance(v, datetime.time):
            res.append(round(v.hour * 60 + v.minute + v.second / 60, 2))
        elif isinstance(v, str) and ':' in v:
            parts = v.strip().split(':')
            try:
                if len(parts) == 3:
                    h, m, s = int(parts[0]), int(parts[1]), float(parts[2])
                    res.append(round(h * 60 + m + s / 60, 2))
                elif len(parts) == 2:
                    m, s = int(parts[0]), float(parts[1])
                    res.append(round(m + s / 60, 2))
                else:
                    res.append(None)
            except Exception:
                res.append(None)
        elif isinstance(v, (int, float)) and not pd.isna(v) and v > 0:
            # Excel may store time as fraction of a day
            res.append(round(float(v) * 24 * 60, 2))
        else:
            res.append(None)
    return res


def get_combined_vals(row):
    """Extract Jan 25 – Jun 26 (18 months) as floats."""
    n = len(row.values)
    if n >= 23:
        return safe_extract_list(row.values[5:17]) + safe_extract_list(row.values[17:23])
    elif n >= 17:
        return safe_extract_list(row.values[5:17]) + [None] * 6
    else:
        return [None] * 18


def get_combined_vals_time(row):
    """Extract Jan 25 – Jun 26 as minutes from time fields."""
    n = len(row.values)
    if n >= 23:
        return extract_time_to_minutes(row.values[5:17]) + extract_time_to_minutes(row.values[17:23])
    elif n >= 17:
        return extract_time_to_minutes(row.values[5:17]) + [None] * 6
    else:
        return [None] * 18


def normalise_channel(name):
    return CHANNEL_MAP.get(name.lower().strip(), name.strip())


def is_blank(val):
    s = str(val).strip()
    return s in ['', 'nan', 'NaN', '\xa0']


def parse_statistik_sheet(df):
    """Parse a Statistik DataFrame and return structured metrics."""
    data = {
        "jumlah_pengunjung": [None] * 18,
        "total_interaksi": [None] * 18,
        "interaksi_kategori": {
            "pengaduan": [None] * 18,
            "permohonan": [None] * 18,
            "informasi": [None] * 18,
            "apresiasi": [None] * 18,
        },
        "interaksi_channel": {},
        "aht_channel": {},
    }

    # Detect section boundaries
    idx_pengunjung = None
    idx_total_interaksi = None
    idx_kategori_start = None
    idx_channel_start = None
    idx_aht_start = None

    for i, row in df.iterrows():
        r0 = str(row.values[0]) if len(row.values) > 0 else ''
        r1 = str(row.values[1]) if len(row.values) > 1 else ''
        r2 = str(row.values[2]) if len(row.values) > 2 else ''
        combined = ' '.join([r0, r1, r2]).lower()

        if idx_pengunjung is None and 'jumlah pengunjung' in combined:
            idx_pengunjung = i
        elif idx_total_interaksi is None and 'total interaksi' in combined and 'kategori' not in combined:
            idx_total_interaksi = i
        elif idx_kategori_start is None and ('interaksi per-kategori' in combined or 'interaksi per-kategory' in combined or 'jumlah interaksi per' in combined):
            idx_kategori_start = i
        elif idx_channel_start is None and 'interaksi per channel' in combined:
            idx_channel_start = i
        elif idx_aht_start is None and 'average handling time' in combined:
            idx_aht_start = i

    # Extract Pengunjung
    if idx_pengunjung is not None:
        data["jumlah_pengunjung"] = get_combined_vals(df.iloc[idx_pengunjung])

    # Extract Total Interaksi
    if idx_total_interaksi is not None:
        data["total_interaksi"] = get_combined_vals(df.iloc[idx_total_interaksi])

    # Extract Kategori
    if idx_kategori_start is not None:
        end_idx = idx_channel_start if idx_channel_start is not None else (idx_aht_start or len(df))
        for i in range(idx_kategori_start + 1, end_idx):
            row = df.iloc[i]
            r2 = str(row.values[2]).lower().strip() if len(row.values) > 2 else ''
            r3 = str(row.values[3]).lower().strip() if len(row.values) > 3 else ''
            label = r2 if r2 not in ['nan', '', '\xa0'] else r3
            vals = get_combined_vals(row)
            has_data = any(v is not None and v > 0 for v in vals)
            if not has_data:
                continue

            if any(k in label for k in ['pengaduan', 'keluhan']):
                if all(v is None for v in data["interaksi_kategori"]["pengaduan"]):
                    data["interaksi_kategori"]["pengaduan"] = vals
            elif any(k in label for k in ['permintaan', 'permohonan', 'request', 'reservasi']):
                if all(v is None for v in data["interaksi_kategori"]["permohonan"]):
                    data["interaksi_kategori"]["permohonan"] = vals
            elif any(k in label for k in ['informasi', 'pertanyaan', 'permintaan informasi']):
                if all(v is None for v in data["interaksi_kategori"]["informasi"]):
                    data["interaksi_kategori"]["informasi"] = vals
            elif 'apresiasi' in label:
                if all(v is None for v in data["interaksi_kategori"]["apresiasi"]):
                    data["interaksi_kategori"]["apresiasi"] = vals

    # Extract Channel interactions (sum all category rows per channel)
    if idx_channel_start is not None:
        end_idx = idx_aht_start if idx_aht_start is not None else len(df)
        current_channel = None

        for i in range(idx_channel_start + 1, end_idx):
            row = df.iloc[i]
            r1 = str(row.values[1]).strip() if len(row.values) > 1 else ''
            r2 = str(row.values[2]).strip() if len(row.values) > 2 else ''
            r3 = str(row.values[3]).strip() if len(row.values) > 3 else ''

            # A new channel header: has a letter index AND a non-blank channel name
            # AND channel name is not a category keyword
            is_channel_hdr = (
                not is_blank(r1) and len(r1) <= 3 and
                not is_blank(r2) and
                not any(k in r2.lower() for k in CATEGORY_KEYWORDS) and
                r2.lower() not in ['nan', '\xa0']
            )

            if is_channel_hdr:
                current_channel = normalise_channel(r2)
                if current_channel not in data["interaksi_channel"]:
                    data["interaksi_channel"][current_channel] = [0.0] * 18

            if current_channel is not None:
                # Determine if this row is a category row
                cat_label = r3.lower() if not is_blank(r3) else r2.lower()
                is_cat_row = any(k in cat_label for k in CATEGORY_KEYWORDS)

                if is_cat_row:
                    vals = get_combined_vals(row)
                    for j, v in enumerate(vals):
                        if v is not None:
                            data["interaksi_channel"][current_channel][j] = (
                                (data["interaksi_channel"][current_channel][j] or 0) + v
                            )

    # Remove channels with all-zero
    data["interaksi_channel"] = {
        k: [None if v == 0 else v for v in vals]
        for k, vals in data["interaksi_channel"].items()
        if any(v and v > 0 for v in vals)
    }

    # Extract AHT per Channel
    if idx_aht_start is not None:
        for i in range(idx_aht_start + 1, len(df)):
            row = df.iloc[i]
            r1 = str(row.values[1]).strip() if len(row.values) > 1 else ''
            r2 = str(row.values[2]).strip() if len(row.values) > 2 else ''
            if is_blank(r1) or len(r1) > 3 or is_blank(r2):
                continue
            if any(kw in r2.lower() for kw in ['cp cx', 'definisi', 'injourney', '08']):
                continue
            aht_vals = get_combined_vals_time(row)
            if any(v is not None and v > 0 for v in aht_vals):
                data["aht_channel"][normalise_channel(r2)] = aht_vals

    return data


def main():
    files = glob.glob(os.path.join(CX_PERF_DIR, "*.xlsx"))
    result = {}

    for f in sorted(files):
        if "~$" in f:
            continue
        bu_name = (
            os.path.basename(f)
            .replace("Template Data CX Performance - ", "")
            .replace(".xlsx", "")
        )

        print(f"Processing {bu_name}...")
        bu_data = {
            "scores": {"overall": [], "people": [], "process": [], "premises": []},
            "interactions": {"pengaduan": [], "permohonan": [], "informasi": [], "pengunjung": [], "volume": []},
            "call_center": {"volume": [], "fcr": [], "service_level": [], "waiting_time": [], "abandoned_rate": []},
            "social_media": {"nss": [], "avg_response_time": [], "rsr": []},
            "complaints": {"total": [], "completed": [], "progress": [], "untouch": [], "resolution_rate": [], "avg_time_resolution": []},
            "statistik": {
                "jumlah_pengunjung": [None] * 18,
                "total_interaksi": [None] * 18,
                "interaksi_kategori": {"pengaduan": [None]*18, "permohonan": [None]*18, "informasi": [None]*18, "apresiasi": [None]*18},
                "interaksi_channel": {},
                "aht_channel": {},
            }
        }

        xl = pd.ExcelFile(f)

        # 1. Scores from "Data Performance"
        dp_sheet = [s for s in xl.sheet_names if "Performance" in s and "Data" in s]
        if dp_sheet:
            df = pd.read_excel(f, sheet_name=dp_sheet[0], header=None)
            for i, row in df.iterrows():
                row_str = " ".join([str(x).lower() for x in row.values[:5]])
                n = len(row.values)
                if n >= 24:
                    combined_vals = safe_extract_list(row.values[5:17]) + safe_extract_list(row.values[18:24])
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
                elif "first call resolution" in row_str or ("fcr" in row_str and "score" not in row_str):
                    bu_data["call_center"]["fcr"] = combined_vals
                elif "service level" in row_str:
                    bu_data["call_center"]["service_level"] = combined_vals
                elif "call waiting time" in row_str:
                    bu_data["call_center"]["waiting_time"] = combined_vals
                elif "abandoned call rate" in row_str:
                    bu_data["call_center"]["abandoned_rate"] = combined_vals
                elif "net sentiment score" in row_str or "nss" in row_str:
                    bu_data["social_media"]["nss"] = combined_vals
                elif "average response time" in row_str:
                    bu_data["social_media"]["avg_response_time"] = combined_vals
                elif "respons to sentiment ratio" in row_str or "rsr" in row_str:
                    bu_data["social_media"]["rsr"] = combined_vals
                elif "complaint resolution rate" in row_str:
                    bu_data["complaints"]["resolution_rate"] = combined_vals
                elif "average time resolution" in row_str:
                    bu_data["complaints"]["avg_time_resolution"] = combined_vals

        # 2. Statistik sheet
        SKIP_SUBSHEETS = ['Corcom', 'INU', 'Nusa Dua', 'Mandalika', 'Golo', 'MGPA', 'Rekap', 'Bisa dihapus']
        stat_candidates = [
            s for s in xl.sheet_names
            if any(kw in s for kw in ['Statistik', 'statistik', 'Data Statistik'])
            and not any(sk in s for sk in SKIP_SUBSHEETS)
        ]
        total_sheets = [s for s in stat_candidates if 'Total' in s]
        chosen_stat = total_sheets[0] if total_sheets else (stat_candidates[0] if stat_candidates else None)

        if chosen_stat:
            df_stat = pd.read_excel(f, sheet_name=chosen_stat, header=None)
            stat_data = parse_statistik_sheet(df_stat)
            bu_data["statistik"] = stat_data
            # Backfill legacy fields
            if any(v is not None and v > 0 for v in stat_data["jumlah_pengunjung"]):
                bu_data["interactions"]["pengunjung"] = stat_data["jumlah_pengunjung"]
            if all(v is None for v in bu_data["interactions"]["pengaduan"]):
                bu_data["interactions"]["pengaduan"] = stat_data["interaksi_kategori"]["pengaduan"]
            if all(v is None for v in bu_data["interactions"]["permohonan"]):
                bu_data["interactions"]["permohonan"] = stat_data["interaksi_kategori"]["permohonan"]
            if all(v is None for v in bu_data["interactions"]["informasi"]):
                bu_data["interactions"]["informasi"] = stat_data["interaksi_kategori"]["informasi"]

        result[bu_name] = bu_data
        # Report what was found
        st = bu_data["statistik"]
        ch_count = len(st["interaksi_channel"])
        aht_count = len(st["aht_channel"])
        has_peng = any(v for v in st["jumlah_pengunjung"] if v)
        has_intr = any(v for v in st["total_interaksi"] if v)
        print(f"  → Pengunjung: {has_peng}, Total Interaksi: {has_intr}, Channels: {ch_count}, AHT channels: {aht_count}")

    result["_months"] = MONTHS_LABELS

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        json.dump(result, outfile, indent=2, ensure_ascii=False)

    print(f"\n✅ Successfully wrote parsed performance data to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()


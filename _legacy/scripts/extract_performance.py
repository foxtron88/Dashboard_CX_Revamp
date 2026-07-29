#!/usr/bin/env python3
"""
Extract performance targets and statistics from CX_Performance Excel files
and output to a structured JSON file for the dashboard.

Extracts from Data Performance:
- CSAT (Overall, People, Process, Premises)
- ACI Score
- Branch Service Performance (Overall, People, Process, Premises)
- Call Center (Volume, FCR, Service Level, Waiting Time, Abandoned Rate)
- Social Media (Volume, NSS, Avg Response Time, RSR)
- Complaint Handling (Total, Completed, Progress, Untouch, Resolution Rate, Avg Time)

Extracts from Data Statistik:
- Jumlah Pengunjung, Total Interaksi
- Interaksi per Kategori (Pengaduan, Permohonan, Pertanyaan, Informasi, Apresiasi, dll.)
- Interaksi per Channel
- SLA Resolution (FCR, <3hr, <14hr, <30hr)
- AHT per Channel
"""

import pandas as pd
import os
import glob
import json
import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
CX_PERF_DIR = os.path.join(DATA_DIR, 'CX_Performance')
OUTPUT_FILE = os.path.join(DATA_DIR, 'cx_performance.json')

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
            "pertanyaan": [None] * 18,
            "apresiasi": [None] * 18,
            "laporan": [None] * 18,
            "saran": [None] * 18,
            "lost_and_found": [None] * 18,
            "priority_service": [None] * 18,
        },
        "interaksi_channel": {},
        "aht_channel": {},
        "sla_resolution": {
            "fcr": [None] * 18,
            "lt_3_hari": [None] * 18,
            "lt_14_hari": [None] * 18,
            "lt_30_hari": [None] * 18,
        },
    }

    # Detect section boundaries
    idx_pengunjung = None
    idx_total_interaksi = None
    idx_kategori_start = None
    idx_channel_start = None
    idx_aht_start = None
    idx_sla_start = None

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
        elif idx_sla_start is None and ('customer resolution' in combined or 'service level agree' in combined):
            idx_sla_start = i
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
            elif any(k in label for k in ['informasi', 'permintaan informasi']):
                if all(v is None for v in data["interaksi_kategori"]["informasi"]):
                    data["interaksi_kategori"]["informasi"] = vals
            elif 'pertanyaan' in label:
                if all(v is None for v in data["interaksi_kategori"]["pertanyaan"]):
                    data["interaksi_kategori"]["pertanyaan"] = vals
            elif 'apresiasi' in label:
                if all(v is None for v in data["interaksi_kategori"]["apresiasi"]):
                    data["interaksi_kategori"]["apresiasi"] = vals
            elif 'laporan' in label:
                if all(v is None for v in data["interaksi_kategori"]["laporan"]):
                    data["interaksi_kategori"]["laporan"] = vals
            elif 'saran' in label:
                if all(v is None for v in data["interaksi_kategori"]["saran"]):
                    data["interaksi_kategori"]["saran"] = vals
            elif 'lost and found' in label or 'lost & found' in label:
                if all(v is None for v in data["interaksi_kategori"]["lost_and_found"]):
                    data["interaksi_kategori"]["lost_and_found"] = vals
            elif 'priority service' in label:
                if all(v is None for v in data["interaksi_kategori"]["priority_service"]):
                    data["interaksi_kategori"]["priority_service"] = vals

    # Extract Channel interactions
    if idx_channel_start is not None:
        end_sla = idx_sla_start if idx_sla_start is not None else (idx_aht_start if idx_aht_start is not None else len(df))
        current_channel = None
        for i in range(idx_channel_start + 1, end_sla):
            row = df.iloc[i]
            r1 = str(row.values[1]).strip() if len(row.values) > 1 else ''
            r2 = str(row.values[2]).strip() if len(row.values) > 2 else ''
            r3 = str(row.values[3]).strip() if len(row.values) > 3 else ''

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
                cat_label = r3.lower() if not is_blank(r3) else r2.lower()
                is_cat_row = any(k in cat_label for k in CATEGORY_KEYWORDS)
                if is_cat_row:
                    vals = get_combined_vals(row)
                    for j, v in enumerate(vals):
                        if v is not None:
                            data["interaksi_channel"][current_channel][j] = (
                                (data["interaksi_channel"][current_channel][j] or 0) + v
                            )

    data["interaksi_channel"] = {
        k: [None if v == 0 else v for v in vals]
        for k, vals in data["interaksi_channel"].items()
        if any(v and v > 0 for v in vals)
    }

    # Extract SLA Resolution
    if idx_sla_start is not None:
        end_aht = idx_aht_start if idx_aht_start is not None else len(df)
        for i in range(idx_sla_start + 1, end_aht):
            row = df.iloc[i]
            r1 = str(row.values[1]).strip() if len(row.values) > 1 else ''
            r2 = str(row.values[2]).strip() if len(row.values) > 2 else ''
            label = (r2 if not is_blank(r2) else r1).lower()

            if 'fcr' in label or 'first contact' in label:
                vals = get_combined_vals(row)
                if any(v for v in vals if v):
                    data["sla_resolution"]["fcr"] = vals
            elif '3' in label and 'hari' in label:
                data["sla_resolution"]["lt_3_hari"] = get_combined_vals(row)
            elif '14' in label and 'hari' in label:
                data["sla_resolution"]["lt_14_hari"] = get_combined_vals(row)
            elif '30' in label and 'hari' in label:
                data["sla_resolution"]["lt_30_hari"] = get_combined_vals(row)

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


def parse_performance_sheet(df):
    """Parse Data Performance sheet for all KPIs."""
    metrics = {
        "csat": {"overall": [None]*18, "people": [None]*18, "process": [None]*18, "premises": [None]*18},
        "aci": [None]*18,
        "branch_service": {"overall": [None]*18, "people": [None]*18, "process": [None]*18, "premises": [None]*18},
        "call_center": {"volume": [None]*18, "fcr": [None]*18, "service_level": [None]*18, "waiting_time": [None]*18, "abandoned_rate": [None]*18},
        "social_media": {"volume": [None]*18, "nss": [None]*18, "avg_response_time": [None]*18, "rsr": [None]*18},
        "complaints": {"total": [None]*18, "completed": [None]*18, "progress": [None]*18, "untouch": [None]*18, "resolution_rate": [None]*18, "avg_time_resolution": [None]*18},
    }

    for i, row in df.iterrows():
        row_str = " ".join([str(x).lower() for x in row.values[:5]])
        n = len(row.values)
        if n >= 24:
            vals = safe_extract_list(row.values[5:17]) + safe_extract_list(row.values[18:24])
        elif n >= 17:
            vals = safe_extract_list(row.values[5:17]) + [None] * 6
        else:
            vals = [None] * 18

        time_vals = None

        # CSAT
        if "overall satisfaction" in row_str or "csat - overall" in row_str or "kepuasan menginap" in row_str:
            if any(v for v in vals if v): metrics["csat"]["overall"] = vals
        elif "csat - people" in row_str:
            if any(v for v in vals if v): metrics["csat"]["people"] = vals
        elif "csat - process" in row_str:
            if any(v for v in vals if v): metrics["csat"]["process"] = vals
        elif "csat - premises" in row_str:
            if any(v for v in vals if v): metrics["csat"]["premises"] = vals
        # ACI
        elif "customer satisfaction (aci)" in row_str or "(aci)" in row_str:
            if any(v for v in vals if v): metrics["aci"] = vals
        # Branch Service Performance
        elif "service performance - overall" in row_str:
            if any(v for v in vals if v): metrics["branch_service"]["overall"] = vals
        elif "service performance - people" in row_str:
            if any(v for v in vals if v): metrics["branch_service"]["people"] = vals
        elif "service performance - process" in row_str:
            if any(v for v in vals if v): metrics["branch_service"]["process"] = vals
        elif "service performance - premises" in row_str:
            if any(v for v in vals if v): metrics["branch_service"]["premises"] = vals
        # Call Center
        elif "volume of call" in row_str:
            if any(v for v in vals if v): metrics["call_center"]["volume"] = vals
        elif "first call resolution" in row_str or ("fcr" in row_str and "score" not in row_str):
            if any(v for v in vals if v): metrics["call_center"]["fcr"] = vals
        elif "service level" in row_str:
            if any(v for v in vals if v): metrics["call_center"]["service_level"] = vals
        elif "call waiting time" in row_str:
            if n >= 24:
                time_vals = extract_time_to_minutes(row.values[5:17]) + extract_time_to_minutes(row.values[18:24])
            elif n >= 17:
                time_vals = extract_time_to_minutes(row.values[5:17]) + [None] * 6
            if time_vals and any(v for v in time_vals if v):
                metrics["call_center"]["waiting_time"] = time_vals
        elif "abandoned call rate" in row_str:
            if any(v for v in vals if v): metrics["call_center"]["abandoned_rate"] = vals
        # Social Media
        elif "volume of interaction" in row_str:
            if any(v for v in vals if v): metrics["social_media"]["volume"] = vals
        elif "net sentiment score" in row_str or ("nss" in row_str and "score" not in row_str.replace("net sentiment score", "")):
            if any(v for v in vals if v): metrics["social_media"]["nss"] = vals
        elif "average response time" in row_str:
            if any(v for v in vals if v): metrics["social_media"]["avg_response_time"] = vals
        elif "respons to sentiment ratio" in row_str or "rsr" in row_str:
            if any(v for v in vals if v): metrics["social_media"]["rsr"] = vals
        # Complaints
        elif "total complaint" in row_str:
            if any(v for v in vals if v): metrics["complaints"]["total"] = vals
        elif row_str.strip().endswith("completed") or "b. completed" in row_str:
            if any(v for v in vals if v): metrics["complaints"]["completed"] = vals
        elif "c. progress" in row_str or ("progress" in row_str and "completed" not in row_str and "branch" not in row_str):
            if any(v for v in vals if v): metrics["complaints"]["progress"] = vals
        elif "untouch" in row_str:
            if any(v for v in vals if v): metrics["complaints"]["untouch"] = vals
        elif "complaint resolution rate" in row_str:
            if any(v for v in vals if v): metrics["complaints"]["resolution_rate"] = vals
        elif "average time resolution" in row_str:
            if any(v for v in vals if v): metrics["complaints"]["avg_time_resolution"] = vals

    return metrics


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
            "performance": {},
            "statistik": {
                "jumlah_pengunjung": [None] * 18,
                "total_interaksi": [None] * 18,
                "interaksi_kategori": {
                    "pengaduan": [None]*18, "permohonan": [None]*18, "informasi": [None]*18,
                    "pertanyaan": [None]*18, "apresiasi": [None]*18, "laporan": [None]*18,
                    "saran": [None]*18, "lost_and_found": [None]*18, "priority_service": [None]*18
                },
                "interaksi_channel": {},
                "aht_channel": {},
                "sla_resolution": {
                    "fcr": [None]*18, "lt_3_hari": [None]*18,
                    "lt_14_hari": [None]*18, "lt_30_hari": [None]*18
                },
            },
            # Legacy fields for backward compat
            "scores": {"overall": [], "people": [], "process": [], "premises": []},
            "interactions": {"pengaduan": [], "permohonan": [], "informasi": [], "pertanyaan": [], "pengunjung": [], "volume": []},
            "call_center": {"volume": [], "fcr": [], "service_level": [], "waiting_time": [], "abandoned_rate": []},
            "social_media": {"nss": [], "avg_response_time": [], "rsr": []},
            "complaints": {"total": [], "completed": [], "progress": [], "untouch": [], "resolution_rate": [], "avg_time_resolution": []},
        }

        xl = pd.ExcelFile(f)

        # 1. Data Performance sheet
        dp_sheet = [s for s in xl.sheet_names if "Performance" in s and "Data" in s or "Performa" in s and "Data" in s]
        if dp_sheet:
            df = pd.read_excel(f, sheet_name=dp_sheet[0], header=None)
            perf = parse_performance_sheet(df)
            bu_data["performance"] = perf
            # Backfill legacy fields
            bu_data["scores"]["overall"] = perf["csat"]["overall"]
            bu_data["scores"]["people"] = perf["csat"]["people"]
            bu_data["scores"]["process"] = perf["csat"]["process"]
            bu_data["scores"]["premises"] = perf["csat"]["premises"]
            bu_data["call_center"] = perf["call_center"]
            bu_data["social_media"]["nss"] = perf["social_media"]["nss"]
            bu_data["social_media"]["avg_response_time"] = perf["social_media"]["avg_response_time"]
            bu_data["social_media"]["rsr"] = perf["social_media"]["rsr"]
            bu_data["complaints"] = perf["complaints"]

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
            # Backfill legacy interaction fields
            if any(v is not None and v > 0 for v in stat_data["jumlah_pengunjung"]):
                bu_data["interactions"]["pengunjung"] = stat_data["jumlah_pengunjung"]
            bu_data["interactions"]["pengaduan"] = stat_data["interaksi_kategori"]["pengaduan"]
            bu_data["interactions"]["permohonan"] = stat_data["interaksi_kategori"]["permohonan"]
            bu_data["interactions"]["informasi"] = stat_data["interaksi_kategori"]["informasi"]
            bu_data["interactions"]["pertanyaan"] = stat_data["interaksi_kategori"]["pertanyaan"]
            bu_data["interactions"]["apresiasi"] = stat_data["interaksi_kategori"]["apresiasi"]
            bu_data["interactions"]["laporan"] = stat_data["interaksi_kategori"]["laporan"]
            bu_data["interactions"]["saran"] = stat_data["interaksi_kategori"]["saran"]
            bu_data["interactions"]["lost_and_found"] = stat_data["interaksi_kategori"]["lost_and_found"]
            bu_data["interactions"]["priority_service"] = stat_data["interaksi_kategori"]["priority_service"]

        result[bu_name] = bu_data
        st = bu_data["statistik"]
        ch_count = len(st["interaksi_channel"])
        aht_count = len(st["aht_channel"])
        has_peng = any(v for v in st["jumlah_pengunjung"] if v)
        has_intr = any(v for v in st["total_interaksi"] if v)
        print(f"  → Pengunjung: {has_peng}, Total Interaksi: {has_intr}, Channels: {ch_count}, AHT channels: {aht_count}")
        if bu_data["performance"]:
            csat = bu_data["performance"]["csat"]["overall"]
            print(f"  → CSAT Overall data points: {sum(1 for v in csat if v)}")

    result["_months"] = MONTHS_LABELS

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        json.dump(result, outfile, indent=2, ensure_ascii=False)

    print(f"\n✅ Successfully wrote parsed performance data to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()

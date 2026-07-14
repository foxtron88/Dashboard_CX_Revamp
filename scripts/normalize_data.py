#!/usr/bin/env python3
"""
Normalize all Sensum CX survey CSVs into a single consolidated JSON file.
Handles different column schemas across 6 business units.
"""

import csv
import json
import os
import re
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
OUTPUT_FILE = os.path.join(DATA_DIR, 'consolidated.json')

def find_column(headers, patterns):
    """Find a column by matching multiple possible patterns (case-insensitive)."""
    for pattern in patterns:
        for h in headers:
            if pattern.lower() in h.lower():
                return h
    return None

def find_numeric_column(headers, patterns):
    """Find a Numeric_ prefixed column."""
    for pattern in patterns:
        for h in headers:
            if h.lower().startswith('numeric_') and pattern.lower() in h.lower():
                return h
    return None

def find_sentiment_column(headers):
    """Find the sentiment column."""
    for h in headers:
        if h.lower().startswith('sentiment_') or (h.lower().startswith('sentiment') and 'saran' in h.lower()):
            return h
    return None

def find_tags_column(headers):
    """Find the tags column."""
    for h in headers:
        if h.lower().startswith('tags_'):
            return h
    return None

def find_feedback_column(headers):
    """Find the open-text feedback column."""
    for h in headers:
        if 'saran' in h.lower() and 'masukan' in h.lower() and not h.lower().startswith('tags_') and not h.lower().startswith('sentiment_'):
            return h
    # For IJH post stay
    for h in headers:
        if 'additional comment' in h.lower() or 'komentar' in h.lower():
            return h
    return None

def parse_date(date_str):
    """Parse various date formats to ISO format."""
    if not date_str or date_str.strip() == '':
        return None
    date_str = date_str.strip()
    formats = [
        '%d-%m-%Y %H:%M:%S',
        '%d-%m-%Y',
        '%Y-%m-%dT%H:%M:%S.%fZ',
        '%Y-%m-%dT%H:%M:%S',
        '%m/%d/%Y %H:%M:%S',
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None

def safe_float(val):
    """Convert value to float safely."""
    if val is None or val == '':
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def safe_int(val):
    """Convert value to int safely."""
    f = safe_float(val)
    if f is not None:
        return int(f)
    return None

def process_csv(filepath, source_folder):
    """Process a single CSV file and return normalized records."""
    records = []
    filename = os.path.basename(filepath)

    try:
        # Try UTF-8 with BOM first
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames
            if not headers:
                return records

            # Find core columns
            col_subholding = find_column(headers, ['SUBHOLDING'])
            col_location = find_column(headers, ['NAMA LOKASI'])
            col_facility_type = find_column(headers, ['TIPE FASILITAS'])
            col_facility_id = find_column(headers, ['ID FASILITAS'])
            col_sync = find_column(headers, ['Sync On-DateTime'])
            col_language = find_column(headers, ['Response Language'])
            col_channel = find_column(headers, ['Distribution Channel'])
            col_status = find_column(headers, ['Survey Status'])

            # Find overall satisfaction score (numeric)
            col_overall = None
            col_overall_group = None
            for h in headers:
                if h.startswith('Numeric_') and ('puas' in h.lower() or 'kepuasan' in h.lower() or 'satisfaction' in h.lower()):
                    col_overall = h
                    break
            for h in headers:
                if h.startswith('Group_') and ('puas' in h.lower() or 'kepuasan' in h.lower() or 'satisfaction' in h.lower()):
                    col_overall_group = h
                    break

            # Find sub-dimension numeric scores
            col_staff = None
            col_facility = None
            col_cleanliness = None

            for h in headers:
                hl = h.lower()
                if h.startswith('Numeric_'):
                    if 'staff' in hl or 'petugas' in hl:
                        col_staff = h
                    elif 'fasilitas' in hl or 'kelengkapan' in hl or ('toilet' in hl and ('bowl' in hl or 'tisu' in hl)):
                        col_facility = h
                    elif 'kebersihan' in hl or 'kenyamanan' in hl or 'alur' in hl or 'pengelolaan' in hl or 'akses' in hl:
                        col_cleanliness = h

            # Find feedback, sentiment, tags
            col_feedback = find_feedback_column(headers)
            col_sentiment = find_sentiment_column(headers)
            col_tags = find_tags_column(headers)

            # Special handling for IJH Post Stay (has NPS)
            col_nps = None
            col_nps_group = None
            is_hotel = 'Post Stay' in filename or 'IJH' in source_folder
            if is_hotel:
                for h in headers:
                    if 'Numeric_' in h and 'merekomendasikan' in h.lower():
                        col_nps = h
                    if 'Group_' in h and 'merekomendasikan' in h.lower():
                        col_nps_group = h

            # Additional hotel dimensions
            col_arrival = None
            col_friendliness = None
            col_room = None
            col_fnb = None
            col_checkout = None

            if is_hotel:
                for h in headers:
                    hl = h.lower()
                    if h.startswith('Numeric_'):
                        if 'kedatangan' in hl or 'arrival' in hl:
                            col_arrival = h
                        elif 'keramahan' in hl or 'friendliness' in hl:
                            col_friendliness = h
                        elif 'kamar' in hl or 'room' in hl:
                            col_room = h
                        elif 'makanan' in hl or 'food' in hl or 'f&b' in hl or 'restaurant' in hl:
                            col_fnb = h

            for row in reader:
                if not row:
                    continue

                # Skip rows without valid status
                status = row.get(col_status, '') if col_status else ''
                if status and status != 'Completed':
                    continue

                overall_score = safe_int(row.get(col_overall)) if col_overall else None
                overall_group = row.get(col_overall_group, '') if col_overall_group else ''

                response_date = parse_date(row.get(col_sync, '')) if col_sync else None

                # Determine facility type from file name if not in columns
                facility_type = row.get(col_facility_type, '') if col_facility_type else ''
                if not facility_type:
                    # Extract from filename
                    facility_type = re.sub(r'_\d{2}-\d{2}-\d{4}.*$', '', filename).replace('.csv', '').strip()

                record = {
                    'source': source_folder,
                    'subholding': row.get(col_subholding, source_folder) if col_subholding else source_folder,
                    'location': row.get(col_location, '') if col_location else '',
                    'facility_type': facility_type,
                    'facility_id': row.get(col_facility_id, '') if col_facility_id else '',
                    'overall_score': overall_score,
                    'overall_group': overall_group,
                    'staff_score': safe_int(row.get(col_staff)) if col_staff else None,
                    'facility_score': safe_int(row.get(col_facility)) if col_facility else None,
                    'cleanliness_score': safe_int(row.get(col_cleanliness)) if col_cleanliness else None,
                    'feedback': row.get(col_feedback, '') if col_feedback else '',
                    'sentiment': row.get(col_sentiment, '') if col_sentiment else '',
                    'tags': row.get(col_tags, '') if col_tags else '',
                    'response_date': response_date,
                    'language': row.get(col_language, '') if col_language else '',
                    'channel': row.get(col_channel, '') if col_channel else '',
                    'nps_score': safe_int(row.get(col_nps)) if col_nps else None,
                    'nps_group': row.get(col_nps_group, '') if col_nps_group else '',
                    'survey_name': re.sub(r'_\d{2}-\d{2}-\d{4}.*$', '', filename).replace('.csv', '').strip(),
                }

                # Hotel-specific dimensions
                if is_hotel:
                    record['arrival_score'] = safe_int(row.get(col_arrival)) if col_arrival else None
                    record['friendliness_score'] = safe_int(row.get(col_friendliness)) if col_friendliness else None
                    record['room_score'] = safe_int(row.get(col_room)) if col_room else None
                    record['fnb_score'] = safe_int(row.get(col_fnb)) if col_fnb else None

                records.append(record)

    except Exception as e:
        print(f"  ERROR processing {filepath}: {e}")

    return records

def main():
    all_records = []
    folders = ['API', 'IAS', 'IDM', 'IJH', 'ITDC', 'Sarinah']
    RAW_DATA_DIR = os.path.join(DATA_DIR, 'Sensum_Raw')

    for folder in folders:
        folder_path = os.path.join(RAW_DATA_DIR, folder)
        if not os.path.exists(folder_path):
            print(f"Skipping {folder} — directory not found at {folder_path}")
            continue

        csv_files = [f for f in os.listdir(folder_path) if f.endswith('.csv')]
        print(f"\n📁 Processing {folder}/ ({len(csv_files)} files)")

        for csv_file in sorted(csv_files):
            filepath = os.path.join(folder_path, csv_file)
            records = process_csv(filepath, folder)
            print(f"  ✅ {csv_file}: {len(records)} records")
            all_records.extend(records)

    # Deduplicate records
    unique_records = []
    seen = set()
    for r in all_records:
        # Exclude survey_name (filename) from deduplication key to catch duplicates across files
        key_dict = {k: v for k, v in r.items() if k != 'survey_name'}
        k = json.dumps(key_dict, sort_keys=True)
        if k not in seen:
            seen.add(k)
            unique_records.append(r)

    all_records = unique_records

    # Generate summary stats
    print(f"\n{'='*50}")
    print(f"Total unique records: {len(all_records)}")

    # Count by source
    by_source = {}
    for r in all_records:
        by_source[r['source']] = by_source.get(r['source'], 0) + 1
    for src, cnt in sorted(by_source.items()):
        print(f"  {src}: {cnt}")

    # Count by sentiment
    by_sentiment = {}
    for r in all_records:
        s = r.get('sentiment', '') or 'Unknown'
        by_sentiment[s] = by_sentiment.get(s, 0) + 1
    print(f"\nSentiment distribution:")
    for s, cnt in sorted(by_sentiment.items()):
        print(f"  {s}: {cnt}")

    # Write output
    output = {
        'generated_at': datetime.now().isoformat(),
        'total_records': len(all_records),
        'sources': list(by_source.keys()),
        'records': all_records,
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=None)

    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"\n✅ Output written to {OUTPUT_FILE}")
    print(f"   File size: {file_size / 1024:.1f} KB")

if __name__ == '__main__':
    main()

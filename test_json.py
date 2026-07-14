import json
records = json.load(open('data/consolidated.json'))['records']
dates = ['2025-10-21', '2025-10-22', '2025-10-24', '2025-11-14', '2025-11-15', '2025-11-21', '2025-12-05']
# find a subholding or location or facility_type that has exactly these dates
from collections import defaultdict
by_facility = defaultdict(list)
for r in records:
    if r.get('response_date') in dates:
        by_facility[r.get('facility_type')].append(r)

for f, recs in by_facility.items():
    if len(recs) < 20:
        print(f"Facility: {f}")
        for r in recs:
            print(f"  {r.get('response_date')}: Score={r.get('overall_score')}")


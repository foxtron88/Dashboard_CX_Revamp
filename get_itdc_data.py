import json

records = json.load(open('data/consolidated.json'))['records']
itdc_records = [r for r in records if r.get('source') == 'ITDC' or r.get('subholding') == 'ITDC']

with open('itdc_data.json', 'w') as f:
    json.dump(itdc_records, f, indent=2)

print(f"Extracted {len(itdc_records)} records")

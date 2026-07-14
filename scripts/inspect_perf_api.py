import pandas as pd
import json

path = "data/CX_Performance/Template Data CX Performance - API.xlsx"
items = set()
xl = pd.ExcelFile(path)
for sheet in xl.sheet_names:
    df = xl.parse(sheet)
    for col in df.columns:
        for val in df[col].dropna().unique():
            if isinstance(val, str) and len(val) > 2:
                items.add(val)

print(json.dumps([v for v in items if 'kepuasan' in v.lower() or 'overall' in v.lower() or 'csat' in v.lower()], indent=2))

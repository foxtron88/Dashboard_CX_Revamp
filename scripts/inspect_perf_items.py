import pandas as pd
import glob
import os
import json

files = glob.glob("data/CX_Performance/*.xlsx")
items = {}

for f in files:
    if '~$' in f: continue
    bu_name = os.path.basename(f)
    items[bu_name] = set()
    try:
        xl = pd.ExcelFile(f)
        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            for col in df.columns:
                for val in df[col].dropna().unique():
                    if isinstance(val, str) and len(val) > 2 and 'csat' in val.lower():
                        items[bu_name].add(val)
    except:
        pass
    items[bu_name] = list(items[bu_name])

print(json.dumps(items, indent=2))

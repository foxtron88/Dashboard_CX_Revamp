import os
import pandas as pd
import json

folder = "data/CX_Performance"
results = {}

for f in os.listdir(folder):
    if f.endswith('.xlsx') and not f.startswith('~'):
        path = os.path.join(folder, f)
        try:
            xl = pd.ExcelFile(path)
            sheets_info = {}
            for sheet in xl.sheet_names:
                df = xl.parse(sheet, nrows=5)
                sheets_info[sheet] = [str(c) for c in df.columns]
            results[f] = sheets_info
        except Exception as e:
            results[f] = str(e)

print(json.dumps(results, indent=2))

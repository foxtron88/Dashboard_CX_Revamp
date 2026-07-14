import pandas as pd
import glob
import json
import os
import re

files = glob.glob('data/CX_Performance/*.xlsx')
results = []

def looks_like_csat(val):
    if not isinstance(val, str):
        return False
    val = val.lower()
    return 'csat' in val or 'kepuasan' in val or 'satisfaction' in val

for f in files:
    try:
        xl = pd.ExcelFile(f)
        bu_name = os.path.basename(f).replace('Template Data CX Performance - ', '').replace('.xlsx', '')
        
        # Scan sheets
        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            # Iterate through rows and columns to find 'CSAT'
            for i, row in df.iterrows():
                for col in df.columns:
                    cell_val = row[col]
                    if looks_like_csat(cell_val):
                        # Attempt to extract numbers from the next few columns in this row
                        row_vals = row.tolist()
                        col_idx = df.columns.get_loc(col)
                        subsequent_vals = row_vals[col_idx+1:]
                        numbers = [v for v in subsequent_vals if isinstance(v, (int, float)) and pd.notna(v)]
                        if numbers:
                            results.append({
                                'file': bu_name,
                                'sheet': sheet,
                                'label': str(cell_val),
                                'numbers': numbers[:12] # Assuming up to 12 months
                            })
    except Exception as e:
        print(f'Error on {f}: {e}')

print(json.dumps(results, indent=2))

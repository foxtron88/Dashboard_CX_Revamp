import pandas as pd
import glob
import json
import os
import math

def looks_like_csat(val):
    if not isinstance(val, str):
        return False
    val = val.lower()
    if 'csat - overall' in val or 'kepuasan menginap' in val:
        return True
    return False

def main():
    files = glob.glob(os.path.join(os.path.dirname(__file__), '../data/CX_Performance/*.xlsx'))
    results = {}

    for f in files:
        try:
            xl = pd.ExcelFile(f)
            bu_name = os.path.basename(f).replace('Template Data CX Performance - ', '').replace('.xlsx', '')
            found_csat = False
            
            for sheet in xl.sheet_names:
                df = xl.parse(sheet)
                for i, row in df.iterrows():
                    for col in df.columns:
                        cell_val = row[col]
                        if looks_like_csat(cell_val):
                            row_vals = row.tolist()
                            col_idx = df.columns.get_loc(col)
                            subsequent_vals = row_vals[col_idx+1:]
                            # Filter only numbers and handle NaN
                            numbers = []
                            for v in subsequent_vals:
                                if isinstance(v, (int, float)):
                                    if math.isnan(v):
                                        numbers.append(None)
                                    else:
                                        numbers.append(round(v, 2))
                                elif isinstance(v, str) and v.replace('.', '', 1).isdigit():
                                    numbers.append(round(float(v), 2))

                            if any(n is not None for n in numbers):
                                # Save first 12 months
                                # If they have zeroes, they might not have data for that month.
                                results[bu_name] = {
                                    'label': str(cell_val),
                                    'scores': numbers[:12]
                                }
                                found_csat = True
                                break
                    if found_csat: break
                if found_csat: break
                
        except Exception as e:
            print(f'Error on {f}: {e}')

    output_path = os.path.join(os.path.dirname(__file__), '../data/cx_performance.json')
    with open(output_path, 'w') as out:
        json.dump(results, out, indent=2)
    
    print(f"Generated {output_path} with {len(results)} Business Units.")

if __name__ == "__main__":
    main()

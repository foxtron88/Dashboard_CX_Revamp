import pandas as pd
import glob
import json
import os
import math

def looks_like_csat(val):
    if not isinstance(val, str):
        return False
    val = val.lower()
    if 'csat - overall' in val or 'kepuasan menginap' in val or 'overall satisfaction' in val:
        return True
    return False

def main():
    files = glob.glob(os.path.join(os.path.dirname(__file__), '../data/CX_Performance/*.xlsx'))
    results = {}

    for f in files:
        if '~$' in f: continue
        try:
            xl = pd.ExcelFile(f)
            bu_name = os.path.basename(f).replace('Template Data CX Performance - ', '').replace('.xlsx', '')
            found_csat = False
            # print(f"Processing {bu_name}")
            
            for sheet in xl.sheet_names:
                df = xl.parse(sheet)
                for i, row in df.iterrows():
                    for col in df.columns:
                        cell_val = row[col]
                        if looks_like_csat(cell_val):
                            row_vals = row.tolist()
                            col_idx = df.columns.get_loc(col)
                            subsequent_vals = row_vals[col_idx+1:]
                            subsequent_cols = df.columns.tolist()[col_idx+1:]
                            
                            data_points = []
                            for v, c in zip(subsequent_vals, subsequent_cols):
                                val = None
                                if isinstance(v, (int, float)):
                                    if not math.isnan(v): val = round(v, 2)
                                elif isinstance(v, str) and v.replace('.', '', 1).isdigit():
                                    val = round(float(v), 2)
                                
                                # Format date column label nicely
                                label = str(c)
                                if isinstance(c, pd.Timestamp) or hasattr(c, 'strftime'):
                                    label = c.strftime('%b %Y')
                                elif 'Unnamed' in label:
                                    label = f'M{len(data_points)+1}' # Fallback name

                                # Even if val is None, we record the date to show a gap
                                data_points.append({'date': label, 'score': val})

                            if any(d['score'] is not None for d in data_points):
                                results[bu_name] = {
                                    'label': str(cell_val),
                                    'data': data_points
                                }
                                found_csat = True
                                break
                            else:
                                print(f"Found {cell_val} in {bu_name} but no valid scores. data_points: {data_points}")
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

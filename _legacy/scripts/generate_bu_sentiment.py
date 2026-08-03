import os
import csv
import glob
import json

def get_sentiment_data():
    base_dir = "/Users/erwanramadhani/Documents/Dashboard_CX/_legacy/data/Sensum_Raw/Sensum/Combined"
    files = glob.glob(os.path.join(base_dir, "Combine *.csv"))
    
    bu_counts = {
        "API": {"Positive": 0, "Neutral": 0, "Negative": 0, "Unknown": 0},
        "IDM": {"Positive": 0, "Neutral": 0, "Negative": 0, "Unknown": 0},
        "IJH": {"Positive": 0, "Neutral": 0, "Negative": 0, "Unknown": 0},
        "ITDC": {"Positive": 0, "Neutral": 0, "Negative": 0, "Unknown": 0},
        "Sarinah": {"Positive": 0, "Neutral": 0, "Negative": 0, "Unknown": 0},
    }
    
    seen_respondents = set()
    
    for path in files:
        basename = os.path.basename(path)
        # Parse BU from filename: "Combine API_01-03-2026_165927.csv" -> "API"
        # Wait, what if it's "Combine IJH.csv"?
        name_part = basename.replace("Combine ", "").replace(".csv", "")
        bu = name_part.split("_")[0]
        if bu not in bu_counts:
            # Maybe there are some BUs we don't track, or it's named slightly differently
            continue
            
        with open(path, "r", encoding="utf-8-sig", errors="ignore") as f:
            reader = csv.reader(f)
            try:
                headers = next(reader)
            except StopIteration:
                continue
                
            headers_lower = [h.lower() for h in headers]
            
            # Find Sentiment column and Respondent ID column
            sent_idx = next((i for i, h in enumerate(headers_lower) if "entiment" in h), -1)
            resp_idx = next((i for i, h in enumerate(headers_lower) if "espondent id" in h), -1)
            
            if sent_idx == -1:
                # no sentiment column found
                continue
                
            for row in reader:
                if not row or len(row) <= sent_idx:
                    continue
                
                resp_id = row[resp_idx].strip() if resp_idx != -1 and len(row) > resp_idx else ""
                # Optional: deduplicate by Respondent ID, but some might be empty
                if resp_id:
                    if resp_id in seen_respondents:
                        continue
                    seen_respondents.add(resp_id)
                
                sentiment_raw = row[sent_idx].strip().lower()
                if "positive" in sentiment_raw or "positif" in sentiment_raw:
                    bu_counts[bu]["Positive"] += 1
                elif "negative" in sentiment_raw or "negatif" in sentiment_raw:
                    bu_counts[bu]["Negative"] += 1
                elif "neutral" in sentiment_raw or "netral" in sentiment_raw:
                    bu_counts[bu]["Neutral"] += 1
                else:
                    bu_counts[bu]["Unknown"] += 1

    # Convert to list for the chart
    chart_data = []
    for bu, counts in bu_counts.items():
        chart_data.append({
            "bu": bu,
            "Positive": counts["Positive"],
            "Neutral": counts["Neutral"],
            "Negative": counts["Negative"]
        })
        
    out_path = "/Users/erwanramadhani/Documents/Dashboard_CX/public/data/sentiment_by_bu.json"
    with open(out_path, "w") as f:
        json.dump(chart_data, f, indent=2)
    print(f"Written sentiment data to {out_path}")
    print(json.dumps(chart_data, indent=2))

if __name__ == "__main__":
    get_sentiment_data()

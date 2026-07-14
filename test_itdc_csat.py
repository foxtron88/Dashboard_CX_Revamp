import json

def analyze():
    records = json.load(open('data/consolidated.json'))['records']
    itdc_records = [r for r in records if r.get('source') == 'ITDC' or r.get('subholding') == 'ITDC']
    
    total = len(itdc_records)
    scored = [r for r in itdc_records if r.get('overall_score') is not None]
    
    total_scored = len(scored)
    
    if total_scored == 0:
        print("No scored records for ITDC")
        return

    sum_scores = sum(r['overall_score'] for r in scored)
    avg_csat = sum_scores / total_scored
    
    satisfied = [r for r in scored if r['overall_score'] >= 4]
    csat_pct = (len(satisfied) / total_scored) * 100
    
    # Sub-dimensions
    staff_scores = [r['staff_score'] for r in itdc_records if r.get('staff_score') is not None]
    fac_scores = [r['facility_score'] for r in itdc_records if r.get('facility_score') is not None]
    clean_scores = [r['cleanliness_score'] for r in itdc_records if r.get('cleanliness_score') is not None]

    avg_staff = sum(staff_scores) / len(staff_scores) if staff_scores else 0
    avg_fac = sum(fac_scores) / len(fac_scores) if fac_scores else 0
    avg_clean = sum(clean_scores) / len(clean_scores) if clean_scores else 0

    print(f"--- ITDC CSAT Calculation ---")
    print(f"Total ITDC Records: {total}")
    print(f"Records with an 'overall_score': {total_scored}")
    print(f"Sum of all overall_scores: {sum_scores}")
    print(f"Average CSAT: {sum_scores} / {total_scored} = {avg_csat:.2f} (out of 5)")
    print(f"")
    print(f"Responses with score 4 or 5 (Satisfied): {len(satisfied)}")
    print(f"CSAT % (Satisfied %): ({len(satisfied)} / {total_scored}) * 100 = {csat_pct:.1f}%")
    print(f"")
    print(f"--- Sub-dimensions (Cascade) ---")
    print(f"People (PPL / staff_score) Avg: {avg_staff:.2f} (from {len(staff_scores)} scored records)")
    print(f"Premises (PRM / facility_score) Avg: {avg_fac:.2f} (from {len(fac_scores)} scored records)")
    print(f"Process (PRC / cleanliness_score) Avg: {avg_clean:.2f} (from {len(clean_scores)} scored records)")

if __name__ == "__main__":
    analyze()

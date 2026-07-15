import re
filenames = [
    "Nursery Room API_26-02-2026_090544.csv",
    "Nursery Room API_(24Feb26).csv",
    "Baggage Claim API.csv",
    "Nursery Room API_3-12-2025.csv"
]
for f in filenames:
    clean = re.sub(r'(_\d{1,2}-\d{1,2}-\d{4}.*|_\(.*?\))', '', f.replace('.csv', '')).strip()
    print(f"{f} -> {clean}")

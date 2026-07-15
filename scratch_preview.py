import json

with open("data/cx_performance.json") as f:
    data = json.load(f)

months = data["_months"]
print("| Business Unit | Kategori | " + " | ".join(months[-6:]) + " |")
print("|---|---|---|" + "|".join(["---" for _ in range(5)]) + "|")

for bu, metrics in data.items():
    if bu == "_months": continue
    # Just show a couple of rows per BU as an example
    for cat_name, cat_data in metrics.items():
        for metric, values in cat_data.items():
            # grab the last 6 months
            recent = [str(v) if v is not None else "-" for v in values[-6:]]
            print(f"| {bu} | {cat_name.title()} - {metric.title()} | " + " | ".join(recent) + " |")

import json

with open('data/consolidated.json', 'r') as f:
    data = json.load(f)

records = data.get('records', [])
sample_feedback = {'Positive': set(), 'Negative': set(), 'Neutral': set()}

for r in records:
    text = r.get('feedback', '')
    if text and isinstance(text, str) and len(text.strip()) > 10:
        sentiment = r.get('sentiment', 'Unknown')
        if sentiment in sample_feedback and len(sample_feedback[sentiment]) < 20:
            sample_feedback[sentiment].add(text.strip().replace('\n', ' '))

print("=== SAMPLE NEGATIVE FEEDBACK ===")
for t in list(sample_feedback['Negative'])[:10]:
    print(f"- {t}")

print("\n=== SAMPLE POSITIVE FEEDBACK ===")
for t in list(sample_feedback['Positive'])[:10]:
    print(f"- {t}")

print("\n=== SAMPLE NEUTRAL FEEDBACK ===")
for t in list(sample_feedback['Neutral'])[:10]:
    print(f"- {t}")


import json

with open('data/consolidated.json', 'r') as f:
    data = json.load(f)

records = data.get('records', [])
feedback_counts = {'Positive': 0, 'Negative': 0, 'Neutral': 0, 'Unknown': 0}
sample_feedback = {'Positive': [], 'Negative': [], 'Neutral': [], 'Unknown': []}

for r in records:
    text = r.get('suggestion')
    if text and isinstance(text, str) and len(text.strip()) > 5:
        sentiment = r.get('sentiment', 'Unknown')
        feedback_counts[sentiment] += 1
        if len(sample_feedback[sentiment]) < 10:
            sample_feedback[sentiment].append(text.strip().replace('\n', ' '))

print("Total Feedback with Text:")
print(json.dumps(feedback_counts, indent=2))
print("\nSample Negative Feedback:")
for t in sample_feedback['Negative']:
    print(f"- {t}")

print("\nSample Positive Feedback:")
for t in sample_feedback['Positive']:
    print(f"- {t}")


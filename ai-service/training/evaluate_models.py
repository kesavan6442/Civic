import json
import os
import sys
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

# Add app directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.text_classifier import text_classifier

def evaluate_text_model_on_validation_split():
    val_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'validation', 'civic_dataset_val.json')
    if not os.path.exists(val_file):
        print(f"Error: Validation file not found at {val_file}")
        return

    with open(val_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    samples = data.get('samples', [])
    print(f"--- Evaluating {len(samples)} Ground Truth Validation Samples across 12 Civic Domains ---")

    y_true = []
    y_pred = []

    for s in samples:
        text = s['text']
        exp_domain = s['expected_domain']
        res = text_classifier.classify_text(title=text, description="")
        pred_domain = res['domain']
        
        y_true.append(exp_domain)
        y_pred.append(pred_domain)
        is_match = (exp_domain == pred_domain)
        print(f"Sample [{s['id']}] Expected: '{exp_domain}' | Predicted: '{pred_domain}' | Match: {is_match}")

    domains = sorted(list(set(y_true + y_pred)))
    acc = accuracy_score(y_true, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted', zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=domains)
    report = classification_report(y_true, y_pred, labels=domains, output_dict=True, zero_division=0)

    print("\n================ REAL SCIKIT-LEARN CLASSIFICATION REPORT ===============")
    print(classification_report(y_true, y_pred, labels=domains, zero_division=0))

    metrics = {
        "dataset_type": data.get("metadata", {}).get("dataset_type", "ground_truth_validation"),
        "total_samples": len(samples),
        "domain_accuracy": round(float(acc), 4),
        "precision_weighted": round(float(prec), 4),
        "recall_weighted": round(float(rec), 4),
        "f1_score_weighted": round(float(f1), 4),
        "domain_count": len(domains)
    }

    print("\n--- Model Evaluation Summary ---")
    print(json.dumps(metrics, indent=2))
    return metrics

if __name__ == '__main__':
    evaluate_text_model_on_validation_split()

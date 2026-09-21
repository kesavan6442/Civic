import json
import os
import joblib
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

def evaluate_on_unseen_test_set():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    test_file = os.path.join(base_dir, 'data', 'test', 'civic_dataset_test.json')
    model_bundle_path = os.path.join(base_dir, 'models', 'best_civic_classifier.joblib')

    with open(test_file, 'r', encoding='utf-8') as f:
        test_data = json.load(f)

    test_samples = test_data['samples']
    print(f"===================================================================")
    print(f"EVALUATING MODEL ON HELD-OUT UNSEEN TEST DATASET ({len(test_samples)} SAMPLES)")
    print(f"===================================================================")

    bundle = joblib.load(model_bundle_path)
    vec = bundle['vectorizer']
    dom_clf = bundle['domain_classifier']
    cat_clf = bundle['category_classifier']
    urg_clf = bundle['urgency_classifier']

    X_test = [s['text'] for s in test_samples]
    y_test_dom = [s['domain'] for s in test_samples]
    y_test_cat = [s['category'] for s in test_samples]
    y_test_urg = [s['urgency'] for s in test_samples]
    languages = [s['language'] for s in test_samples]

    X_test_vec = vec.transform(X_test)

    # Predictions
    pred_dom = dom_clf.predict(X_test_vec)
    pred_cat = cat_clf.predict(X_test_vec)
    pred_urg = urg_clf.predict(X_test_vec)

    # 1. Overall Metrics
    dom_acc = accuracy_score(y_test_dom, pred_dom)
    dom_prec, dom_rec, dom_f1, _ = precision_recall_fscore_support(y_test_dom, pred_dom, average='weighted', zero_division=0)
    dom_macro_f1 = precision_recall_fscore_support(y_test_dom, pred_dom, average='macro', zero_division=0)[2]

    cat_acc = accuracy_score(y_test_cat, pred_cat)
    cat_prec, cat_rec, cat_f1, _ = precision_recall_fscore_support(y_test_cat, pred_cat, average='weighted', zero_division=0)
    cat_macro_f1 = precision_recall_fscore_support(y_test_cat, pred_cat, average='macro', zero_division=0)[2]

    urg_acc = accuracy_score(y_test_urg, pred_urg)
    urg_prec, urg_rec, urg_f1, _ = precision_recall_fscore_support(y_test_urg, pred_urg, average='weighted', zero_division=0)
    urg_macro_f1 = precision_recall_fscore_support(y_test_urg, pred_urg, average='macro', zero_division=0)[2]

    print("\n--- 1. OVERALL TEST METRICS ---")
    print(f"Domain Classification:   Accuracy={dom_acc*100:.2f}% | Precision={dom_prec*100:.2f}% | Recall={dom_rec*100:.2f}% | F1={dom_f1*100:.2f}% (Macro F1={dom_macro_f1*100:.2f}%)")
    print(f"Category Classification: Accuracy={cat_acc*100:.2f}% | Precision={cat_prec*100:.2f}% | Recall={cat_rec*100:.2f}% | F1={cat_f1*100:.2f}% (Macro F1={cat_macro_f1*100:.2f}%)")
    print(f"Urgency Classification:  Accuracy={urg_acc*100:.2f}% | Precision={urg_prec*100:.2f}% | Recall={urg_rec*100:.2f}% | F1={urg_f1*100:.2f}% (Macro F1={urg_macro_f1*100:.2f}%)")

    # 2. English vs Hindi Language Breakdown
    en_indices = [i for i, lang in enumerate(languages) if lang == 'en']
    hi_indices = [i for i, lang in enumerate(languages) if lang == 'hi']

    en_dom_acc = accuracy_score([y_test_dom[i] for i in en_indices], [pred_dom[i] for i in en_indices])
    en_dom_f1 = precision_recall_fscore_support([y_test_dom[i] for i in en_indices], [pred_dom[i] for i in en_indices], average='weighted', zero_division=0)[2]
    en_cat_acc = accuracy_score([y_test_cat[i] for i in en_indices], [pred_cat[i] for i in en_indices])
    en_cat_f1 = precision_recall_fscore_support([y_test_cat[i] for i in en_indices], [pred_cat[i] for i in en_indices], average='weighted', zero_division=0)[2]

    hi_dom_acc = accuracy_score([y_test_dom[i] for i in hi_indices], [pred_dom[i] for i in hi_indices])
    hi_dom_f1 = precision_recall_fscore_support([y_test_dom[i] for i in hi_indices], [pred_dom[i] for i in hi_indices], average='weighted', zero_division=0)[2]
    hi_cat_acc = accuracy_score([y_test_cat[i] for i in hi_indices], [pred_cat[i] for i in hi_indices])
    hi_cat_f1 = precision_recall_fscore_support([y_test_cat[i] for i in hi_indices], [pred_cat[i] for i in hi_indices], average='weighted', zero_division=0)[2]

    print("\n--- 2. LINGUISTIC BREAKDOWN (ENGLISH vs HINDI) ---")
    print(f"English (600 test samples): Domain Acc={en_dom_acc*100:.2f}% (F1={en_dom_f1*100:.2f}%) | Category Acc={en_cat_acc*100:.2f}% (F1={en_cat_f1*100:.2f}%)")
    print(f"Hindi   (600 test samples): Domain Acc={hi_dom_acc*100:.2f}% (F1={hi_dom_f1*100:.2f}%) | Category Acc={hi_cat_acc*100:.2f}% (F1={hi_cat_f1*100:.2f}%)")

    # 3. Detailed Per-Domain Report
    dom_report = classification_report(y_test_dom, pred_dom, output_dict=True, zero_division=0)
    dom_labels = sorted(list(set(y_test_dom)))
    dom_cm = confusion_matrix(y_test_dom, pred_dom, labels=dom_labels).tolist()

    # 4. Detailed Per-Category Report
    cat_report = classification_report(y_test_cat, pred_cat, output_dict=True, zero_division=0)
    cat_labels = sorted(list(set(y_test_cat)))
    cat_cm = confusion_matrix(y_test_cat, pred_cat, labels=cat_labels).tolist()

    # 5. Detailed Per-Urgency Report
    urg_report = classification_report(y_test_urg, pred_urg, output_dict=True, zero_division=0)
    urg_labels = ['Critical', 'High', 'Medium', 'Low']
    urg_cm = confusion_matrix(y_test_urg, pred_urg, labels=urg_labels).tolist()

    # 6. Assemble Comprehensive Evaluation Report
    full_eval_report = {
        'evaluation_metadata': {
            'evaluation_split': 'unseen_held_out_test_set',
            'test_samples_count': len(test_samples),
            'languages': {'english': len(en_indices), 'hindi': len(hi_indices)},
            'evaluation_timestamp': '2026-09-17',
            'zero_synthetic_overlap': True
        },
        'overall_metrics': {
            'domain_classification': {
                'accuracy': round(float(dom_acc), 4),
                'precision_weighted': round(float(dom_prec), 4),
                'recall_weighted': round(float(dom_rec), 4),
                'f1_weighted': round(float(dom_f1), 4),
                'f1_macro': round(float(dom_macro_f1), 4)
            },
            'category_classification': {
                'accuracy': round(float(cat_acc), 4),
                'precision_weighted': round(float(cat_prec), 4),
                'recall_weighted': round(float(cat_rec), 4),
                'f1_weighted': round(float(cat_f1), 4),
                'f1_macro': round(float(cat_macro_f1), 4)
            },
            'urgency_classification': {
                'accuracy': round(float(urg_acc), 4),
                'precision_weighted': round(float(urg_prec), 4),
                'recall_weighted': round(float(urg_rec), 4),
                'f1_weighted': round(float(urg_f1), 4),
                'f1_macro': round(float(urg_macro_f1), 4)
            }
        },
        'language_comparison': {
            'english': {
                'samples': len(en_indices),
                'domain_accuracy': round(float(en_dom_acc), 4),
                'domain_f1': round(float(en_dom_f1), 4),
                'category_accuracy': round(float(en_cat_acc), 4),
                'category_f1': round(float(en_cat_f1), 4)
            },
            'hindi': {
                'samples': len(hi_indices),
                'domain_accuracy': round(float(hi_dom_acc), 4),
                'domain_f1': round(float(hi_dom_f1), 4),
                'category_accuracy': round(float(hi_cat_acc), 4),
                'category_f1': round(float(hi_cat_f1), 4)
            }
        },
        'per_domain_classification_report': dom_report,
        'domain_labels': dom_labels,
        'domain_confusion_matrix': dom_cm,
        'per_category_classification_report': cat_report,
        'category_labels': cat_labels,
        'category_confusion_matrix': cat_cm,
        'per_urgency_classification_report': urg_report,
        'urgency_labels': urg_labels,
        'urgency_confusion_matrix': urg_cm
    }

    out_file = os.path.join(base_dir, 'reports', 'model_evaluation_report.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(full_eval_report, f, indent=2, ensure_ascii=False)

    print(f"\nSaved full evaluation results to: {out_file}")

if __name__ == '__main__':
    evaluate_on_unseen_test_set()

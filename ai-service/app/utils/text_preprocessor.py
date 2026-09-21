import re
from typing import List, Set, Dict, Tuple

# Common Hindi and English stopwords for civic processing
STOPWORDS: Set[str] = {
    'the', 'a', 'an', 'and', 'or', 'is', 'in', 'at', 'of', 'to', 'for', 'with', 'on', 'this', 'that', 'it', 'from',
    'hai', 'ki', 'ke', 'ka', 'mein', 'par', 'se', 'ko', 'aur', 'karna', 'karo', 'yeh', 'woh', 'है', 'की', 'के', 'का', 'में', 'पर', 'से', 'को', 'और'
}

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    # Strip dangerous/unprintable chars
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    return text.strip()

def tokenize_and_remove_stopwords(text: str) -> List[str]:
    cleaned = clean_text(text).lower()
    tokens = re.findall(r'[\w\u0900-\u097F]+', cleaned)
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]

def extract_civic_keywords(text: str, top_k: int = 8) -> List[str]:
    tokens = tokenize_and_remove_stopwords(text)
    if not tokens:
        return ["Civic Defect", "Infrastructure"]
    # Frequency count
    freq: Dict[str, int] = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + 1
    sorted_tokens = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [k for k, _ in sorted_tokens[:top_k]]

def is_spam_or_gibberish(text: str) -> Tuple[bool, str]:
    cleaned = clean_text(text).lower()
    if len(cleaned) < 5:
        return True, "Input is too short to extract civic defect."
    if re.search(r'(test|asdf|qwerty|123456|fake|spam|lorem ipsum|aaa{3,})', cleaned):
        return True, "Syntactic test pattern or gibberish keywords detected."
    # High repetition check
    words = cleaned.split()
    if len(words) >= 4 and len(set(words)) == 1:
        return True, "Repeated identical word pattern."
    return False, ""

import asyncio
from typing import Dict, List, Tuple
from transformers import pipeline

# Global NER pipeline (loaded once at startup)
_ner_pipeline = None

# Known entity label mappings from dslim/bert-base-NER
ENTITY_LABELS = ["PERSON", "ORG", "LOC", "MISC"]

# Prefix mappings from BERT NER output labels
LABEL_MAP = {
    "PER": "PERSON",
    "PERSON": "PERSON",
    "ORG": "ORG",
    "LOC": "LOC",
    "MISC": "MISC",
}


def load_ner_pipeline():
    """Load the BERT NER model. Called once at startup."""
    global _ner_pipeline
    if _ner_pipeline is None:
        print("Loading BERT NER model (dslim/bert-base-NER)...")
        _ner_pipeline = pipeline(
            "ner",
            model="dslim/bert-base-NER",
            aggregation_strategy="simple",
        )
        print("BERT NER model loaded successfully.")
    return _ner_pipeline


def _normalize_label(raw_label: str) -> str:
    """Normalize raw BERT output labels to our standard labels."""
    # Strip B- / I- prefixes if present
    clean = raw_label.replace("B-", "").replace("I-", "").upper()
    return LABEL_MAP.get(clean, "MISC")


def _run_ner(text: str) -> Tuple[Dict[str, List[dict]], float]:
    """
    Run NER on text and group entities by type.

    Returns:
        (entities_dict, accuracy_score_percent)
    """
    ner = load_ner_pipeline()

    # Split long text into chunks to stay within BERT's 512 token limit
    max_chunk_chars = 1000
    chunks = [text[i : i + max_chunk_chars] for i in range(0, len(text), max_chunk_chars)]

    all_entities = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        try:
            results = ner(chunk)
            all_entities.extend(results)
        except Exception as e:
            print(f"NER chunk error: {e}")
            continue

    # Group by normalized label, deduplicate by word
    grouped: Dict[str, List[dict]] = {label: [] for label in ENTITY_LABELS}
    seen: Dict[str, set] = {label: set() for label in ENTITY_LABELS}
    all_scores = []

    for ent in all_entities:
        label = _normalize_label(ent.get("entity_group", ent.get("entity", "MISC")))
        word = ent.get("word", "").strip()
        score = float(ent.get("score", 0.0))

        if not word or len(word) < 2:
            continue

        # Clean up tokenizer artifacts
        word = word.replace("##", "").strip()
        if not word:
            continue

        if word not in seen[label]:
            seen[label].add(word)
            grouped[label].append({"word": word, "score": round(score, 4)})
            all_scores.append(score)

    # Calculate accuracy as mean confidence
    accuracy_score = (sum(all_scores) / len(all_scores) * 100) if all_scores else 0.0

    return grouped, round(accuracy_score, 2)


async def extract_entities(raw_text: str) -> Tuple[Dict[str, List[dict]], float]:
    """
    Async wrapper for BERT NER extraction.

    Returns:
        (entities_dict, accuracy_score_percent)
    """
    loop = asyncio.get_event_loop()
    entities, accuracy = await loop.run_in_executor(None, _run_ner, raw_text)
    return entities, accuracy

from pydantic import BaseModel
from typing import Dict, List, Optional


class EntityEntry(BaseModel):
    word: str
    score: float


class ExtractionResult(BaseModel):
    job_id: str
    status: str  # "processing" | "done" | "error"
    page_count: int = 0
    raw_text: str = ""
    entities: Dict[str, List[EntityEntry]] = {}
    accuracy_score: float = 0.0
    processing_time_ms: int = 0
    error_message: Optional[str] = None

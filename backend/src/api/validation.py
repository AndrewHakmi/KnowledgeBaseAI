from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict
from src.services.validation import validate_canonical_graph_snapshot

router = APIRouter(prefix="/v1/validation", tags=["Валидация"])

class GraphSnapshotInput(BaseModel):
    snapshot: Dict

class ValidationResult(BaseModel):
    ok: bool
    errors: list[str]
    warnings: list[str]

@router.post("/graph_snapshot", summary="Валидация снимка графа", description="Проверяет канонический снимок графа на согласованность и правила целостности.", response_model=ValidationResult)
async def graph_snapshot(payload: GraphSnapshotInput) -> Dict:
    """
    Принимает:
      - snapshot: объект с полями nodes и edges

    Возвращает:
      - ok: флаг корректности
      - errors: список ошибок
      - warnings: список предупреждений
    """
    return validate_canonical_graph_snapshot(payload.snapshot)

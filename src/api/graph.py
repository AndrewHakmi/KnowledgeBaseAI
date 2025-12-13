from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List
from src.services.graph.neo4j_repo import relation_context
from openai import AsyncOpenAI
from src.core.config import settings

router = APIRouter(prefix="/v1/graph")

class ViewportQuery(BaseModel):
    x: float
    y: float
    zoom: float

@router.get("/viewport")
async def viewport(x: float, y: float, zoom: float) -> Dict:
    return {"nodes": [], "edges": [], "viewport": {"x": x, "y": y, "zoom": zoom}}

class ChatInput(BaseModel):
    question: str
    from_uid: str
    to_uid: str

@router.post("/chat")
async def chat(payload: ChatInput) -> Dict:
    ctx = relation_context(payload.from_uid, payload.to_uid)
    oai = AsyncOpenAI(api_key=settings.openai_api_key)
    messages = [
        {"role": "system", "content": "You are a graph expert. Explain why the relationship exists using provided metadata."},
        {"role": "user", "content": f"Q: {payload.question}\nFrom: {ctx.get('from_title','')} ({payload.from_uid})\nTo: {ctx.get('to_title','')} ({payload.to_uid})\nRelation: {ctx.get('rel','')}\nProps: {ctx.get('props',{})}"}
    ]
    resp = await oai.chat.completions.create(model="gpt-4o-mini", messages=messages)
    usage = resp.usage or None
    answer = resp.choices[0].message.content if resp.choices else ""
    return {"answer": answer, "usage": (usage.model_dump() if hasattr(usage, 'model_dump') else None), "context": ctx}

from fastapi import APIRouter, WebSocket
import asyncio
import json
from redis.asyncio import Redis

router = APIRouter()

@router.websocket("/ws/progress")
async def ws_progress(ws: WebSocket):
    await ws.accept()
    job_id = (ws.query_params.get("job_id") if hasattr(ws, 'query_params') else None) or "default"
    r = Redis(host="redis", port=6379)
    pubsub = r.pubsub()
    await pubsub.subscribe(f"progress:{job_id}")
    try:
        async for msg in pubsub.listen():
            if msg and msg.get("type") == "message":
                data = msg.get("data")
                try:
                    payload = json.loads(data)
                except Exception:
                    payload = {"text": str(data)}
                await ws.send_json(payload)
    finally:
        await pubsub.unsubscribe(f"progress:{job_id}")
        await r.close()

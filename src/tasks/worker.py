from arq import create_pool
from arq.connections import RedisSettings
import asyncio
import json

async def publish_progress(ctx, job_id: str, step: str, payload: dict):
    await ctx['redis'].publish(f"progress:{job_id}", json.dumps({"step": step, **payload}))

async def magic_fill_job(ctx, job_id: str, topic_uid: str, topic_title: str):
    await publish_progress(ctx, job_id, "started", {"topic_uid": topic_uid})
    await asyncio.sleep(0.5)
    await publish_progress(ctx, job_id, "concepts", {"count": 5})
    await asyncio.sleep(0.5)
    await publish_progress(ctx, job_id, "skills", {"count": 3})
    await asyncio.sleep(0.5)
    await publish_progress(ctx, job_id, "done", {})

class WorkerSettings:
    redis_settings = RedisSettings(host='redis', port=6379)
    functions = [magic_fill_job]


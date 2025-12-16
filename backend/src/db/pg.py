import psycopg2
from typing import Any, Dict, Tuple
from src.config.settings import settings

def get_conn():
    dsn = str(settings.pg_dsn)
    if not dsn:
        raise RuntimeError("PG_DSN is not configured")
    return psycopg2.connect(dsn)

def ensure_tables():
    conn = get_conn()
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS proposals (
              proposal_id TEXT PRIMARY KEY,
              tenant_id TEXT NOT NULL,
              base_graph_version BIGINT NOT NULL,
              proposal_checksum TEXT NOT NULL,
              status TEXT NOT NULL,
              operations_json JSONB NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_log (
              tx_id TEXT PRIMARY KEY,
              tenant_id TEXT NOT NULL,
              proposal_id TEXT NOT NULL,
              operations_applied JSONB NOT NULL,
              revert_operations JSONB NOT NULL,
              created_at TIMESTAMP DEFAULT NOW()
            )
            """
        )
    conn.close()

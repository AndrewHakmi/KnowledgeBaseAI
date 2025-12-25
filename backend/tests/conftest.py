import warnings, pytest
warnings.filterwarnings("ignore")
from src.db.pg import get_conn, ensure_tables
from src.events.publisher import get_redis
from src.services.graph.neo4j_repo import get_driver

@pytest.fixture(autouse=True)
def _clean_db():
    ensure_tables()
    conn = get_conn(); conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("DELETE FROM events_outbox")
        cur.execute("DELETE FROM proposals")
        cur.execute("DELETE FROM audit_log")
        cur.execute("DELETE FROM graph_changes")
        cur.execute("DELETE FROM tenant_graph_version")
    conn.close()
    try:
        r = get_redis()
        r.delete("events:graph_committed")
    except Exception:
        ...
    try:
        drv = get_driver()
        with drv.session() as s:
            s.run("MATCH (n) DETACH DELETE n")
        drv.close()
    except Exception:
        ...
    yield

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
from src.schemas.proposal import Proposal, Operation, ProposalStatus
from src.db.pg import get_conn, ensure_tables
from src.services.proposal_service import create_draft_proposal
from src.core.context import get_tenant_id

router = APIRouter(prefix="/v1/proposals")

def require_tenant() -> str:
    tid = get_tenant_id()
    if not tid:
        raise HTTPException(status_code=400, detail="tenant_id missing")
    return tid

@router.post("")
async def create_proposal(payload: Dict, tenant_id: str = Depends(require_tenant)) -> Dict:
    try:
        ops = [Operation.model_validate(o) for o in (payload.get("operations") or [])]
        base_graph_version = int(payload.get("base_graph_version") or 0)
        ensure_tables()
        p = create_draft_proposal(tenant_id, base_graph_version, ops)
        conn = get_conn()
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO proposals (proposal_id, tenant_id, base_graph_version, proposal_checksum, status, operations_json) VALUES (%s,%s,%s,%s,%s,%s)",
                (
                    p.proposal_id,
                    p.tenant_id,
                    p.base_graph_version,
                    p.proposal_checksum,
                    ProposalStatus.DRAFT.value,
                    p.model_dump()["operations"],
                ),
            )
        conn.close()
        return {"proposal_id": p.proposal_id, "proposal_checksum": p.proposal_checksum, "status": ProposalStatus.DRAFT.value}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="failed to create proposal")

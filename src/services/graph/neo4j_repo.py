import os
from typing import List, Dict, Tuple
from neo4j import GraphDatabase

def get_driver():
    uri = os.getenv('NEO4J_URI')
    user = os.getenv('NEO4J_USER')
    password = os.getenv('NEO4J_PASSWORD')
    if not (uri and user and password):
        raise RuntimeError('Missing Neo4j env')
    return GraphDatabase.driver(uri, auth=(user, password))

def read_graph(subject_uid: str | None = None) -> Tuple[List[Dict], List[Dict]]:
    drv = get_driver()
    nodes: List[Dict] = []
    edges: List[Dict] = []
    with drv.session() as s:
        res = s.run(
            (
                "MATCH (s:Subject) "
                "WITH collect(s) AS subs "
                "MATCH (a)-[r]->(b) "
                "RETURN collect({id:id(a), uid:coalesce(a.uid,''), label:coalesce(a.title,''), labels:labels(a)}) AS ns, "
                "       collect({source:id(a), target:id(b), rel:type(r)}) AS es"
            )
        ).single()
        ns = res["ns"] if res else []
        es = res["es"] if res else []
        nodes = [{"id": n["id"], "uid": n.get("uid"), "label": n.get("label"), "labels": n.get("labels", [])} for n in ns]
        edges = [{"from": e.get("source"), "to": e.get("target"), "type": e.get("rel")} for e in es]
    drv.close()
    return nodes, edges

def relation_context(from_uid: str, to_uid: str) -> Dict:
    drv = get_driver()
    ctx: Dict = {}
    with drv.session() as s:
        res = s.run(
            (
                "MATCH (a {uid:$from})-[r]->(b {uid:$to}) "
                "RETURN type(r) AS rel, properties(r) AS props, a.title AS a_title, b.title AS b_title"
            ), {"from": from_uid, "to": to_uid}
        ).single()
        if res:
            ctx = {"rel": res["rel"], "props": res["props"], "from_title": res["a_title"], "to_title": res["b_title"]}
    drv.close()
    return ctx

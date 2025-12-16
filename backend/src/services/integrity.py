from typing import Dict, List, Set, Tuple
import networkx as nx

def check_prereq_cycles(rels: List[Dict]) -> List[Tuple[str, str]]:
    """
    rels: list of {'type': 'PREREQ', 'from_uid': str, 'to_uid': str}
    """
    g = nx.DiGraph()
    for r in rels:
        if str(r.get("type")) != "PREREQ":
            continue
        a = str(r.get("from_uid"))
        b = str(r.get("to_uid"))
        if a and b:
            g.add_edge(a, b)
    cycles = list(nx.simple_cycles(g))
    violations: List[Tuple[str, str]] = []
    for cyc in cycles:
        if len(cyc) == 1:
            violations.append((cyc[0], cyc[0]))
        else:
            for i in range(len(cyc)):
                violations.append((cyc[i], cyc[(i + 1) % len(cyc)]))
    return violations

def check_dangling_skills(nodes: List[Dict], rels: List[Dict]) -> List[str]:
    """
    nodes: list of {'type': 'Skill', 'uid': str}
    rels: list of {'type': 'BASED_ON', 'from_uid': str, 'to_uid': str}
    """
    skills: Set[str] = set()
    for n in nodes:
        if str(n.get("type")) == "Skill":
            uid = str(n.get("uid"))
            if uid:
                skills.add(uid)
    has_base: Set[str] = set()
    for r in rels:
        if str(r.get("type")) == "BASED_ON":
            uid = str(r.get("from_uid"))
            if uid:
                has_base.add(uid)
    dangling = sorted(list(skills.difference(has_base)))
    return dangling

def integrity_check_subgraph(nodes: List[Dict], rels: List[Dict]) -> Dict:
    cyc = check_prereq_cycles(rels)
    dangling = check_dangling_skills(nodes, rels)
    ok = (len(cyc) == 0) and (len(dangling) == 0)
    return {"ok": ok, "prereq_cycles": cyc, "dangling_skills": dangling}

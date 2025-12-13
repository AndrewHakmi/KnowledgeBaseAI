import React, { useEffect, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import axios from 'axios'

export default function Graph() {
  const ref = useRef<HTMLDivElement>(null)
  const [centerUid, setCenterUid] = useState('')
  const [depth, setDepth] = useState(1)
  const [subjectUid, setSubjectUid] = useState('')
  const [groupMode, setGroupMode] = useState<'viewport'|'subject'>('viewport')
  const [relFilters, setRelFilters] = useState<Record<string, boolean>>({
    contains: true, has_skill: true, PREREQ: true, targets: true, linked: true
  })
  useEffect(() => {
    const cy = cytoscape({ container: ref.current!, elements: [], style: [
      { selector: 'node', style: { 'background-color': '#3b82f6', 'label': 'data(label)' } },
      { selector: ':parent', style: { 'background-color': '#0ea5e9', 'compound-sizing-wrt-labels': 'exclude' } },
      { selector: 'edge', style: { 'line-color': '#94a3b8', 'width': 2, 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#94a3b8' } }
    ], layout: { name: 'cose' } })
    ;(ref.current as any)._cy = cy
  }, [])
  async function loadNeighborhood() {
    if (!centerUid) return
    const { data } = await axios.get('/v1/graph/viewport', { params: { center_uid: centerUid, depth } })
    const cy = (ref.current as any)._cy as cytoscape.Core
    const existing = new Set(cy.nodes().map(n => n.id()))
    const edgesExisting = new Set(cy.edges().map(e => e.id()))
    const elements: any[] = []
    for (const n of data.nodes || []) {
      const id = n.uid || String(n.id)
      if (!existing.has(id)) {
        elements.push({ data: { id, label: n.label || '', type: (n.labels || [])[0] || 'topic' } })
      }
    }
    for (const e of data.edges || []) {
      const id = `${e.from}->${e.to}`
      if (!edgesExisting.has(id) && relFilters[e.type || 'linked']) {
        elements.push({ data: { id, source: String(e.from), target: String(e.to), rel: e.type || 'linked' } })
      }
    }
    cy.add(elements)
    cy.layout({ name: 'cose' }).run()
  }
  async function loadSubjectGrouped() {
    if (!subjectUid) return
    const cy = (ref.current as any)._cy as cytoscape.Core
    cy.elements().remove()
    const query = { query: `query { graph(subject_uid: "${subjectUid}") { nodes { uid title type } edges { source target rel } } }` }
    const { data } = await axios.post('/v1/graphql', query)
    const g = data?.data?.graph
    const nodes: any[] = []
    const edges: any[] = []
    const sectionIds = new Set<string>()
    const nodeById: Record<string, any> = {}
    for (const n of g.nodes || []) {
      nodeById[n.uid] = n
    }
    // build parent links from section->topic contains edges
    const parentMap: Record<string, string> = {}
    for (const e of g.edges || []) {
      if (e.rel === 'contains') {
        const src = nodeById[e.source]
        const tgt = nodeById[e.target]
        if (src?.type === 'section' && tgt?.type === 'topic') parentMap[tgt.uid] = src.uid
      }
    }
    for (const n of g.nodes || []) {
      if (n.type === 'section') {
        sectionIds.add(n.uid)
        nodes.push({ data: { id: n.uid, label: n.title } })
      }
    }
    for (const n of g.nodes || []) {
      if (n.type !== 'section') {
        const parent = parentMap[n.uid]
        nodes.push({ data: { id: n.uid, label: n.title, parent } })
      }
    }
    for (const e of g.edges || []) {
      const id = `${e.source}->${e.target}`
      if (relFilters[e.rel || 'linked']) {
        edges.push({ data: { id, source: e.source, target: e.target, rel: e.rel || 'linked' } })
      }
    }
    cy.add([...nodes, ...edges])
    cy.layout({ name: 'cose' }).run()
  }
  function toggleRel(k: string) {
    setRelFilters(prev => ({ ...prev, [k]: !prev[k] }))
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <label><input type="radio" checked={groupMode==='viewport'} onChange={() => setGroupMode('viewport')} /> Окрестность</label>
        <label><input type="radio" checked={groupMode==='subject'} onChange={() => setGroupMode('subject')} /> Группы по разделам</label>
      </div>
      {groupMode === 'viewport' ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="UID центра" value={centerUid} onChange={e => setCenterUid(e.target.value)} />
          <input type="number" min={1} max={3} value={depth} onChange={e => setDepth(parseInt(e.target.value || '1', 10))} />
          <button onClick={loadNeighborhood}>Окрестность</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="UID предмета" value={subjectUid} onChange={e => setSubjectUid(e.target.value)} />
          <button onClick={loadSubjectGrouped}>Загрузить предмет</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {Object.keys(relFilters).map(k => (
          <label key={k}><input type="checkbox" checked={relFilters[k]} onChange={() => toggleRel(k)} /> {k}</label>
        ))}
      </div>
      <div ref={ref} style={{ height: 600, border: '1px solid #e5e7eb' }} />
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { DataSet } from 'vis-data'
import { Network, type Edge as VisNetworkEdge, type Node as VisNetworkNode } from 'vis-network'
import type { ViewportResponse } from '../api'
import { getViewport } from '../api'
import { NodeDetailsSidebar } from '../components/NodeDetailsSidebar'

type ExplorePageProps = {
  selectedUid: string
  onSelectUid: (uid: string) => void
}

type VisNode = VisNetworkNode

type VisEdge = VisNetworkEdge

function toVisData(viewport: ViewportResponse) {
  const nodes = viewport.nodes.map((n): VisNode => {
    // Style based on hierarchy (Kind)
    let color = '#7c5cff' // Default Purple
    let size = 24
    let label = n.title || n.uid

    if (n.kind === 'Subject') {
      color = '#ff9f1c' // Orange/Gold
      size = 40
    } else if (n.kind === 'Section') {
      color = '#2ec4b6' // Teal/Blue
      size = 32
    } else if (n.kind === 'Topic') {
      color = '#7c5cff' // Purple
      size = 24
    } else if (n.kind === 'Skill') {
      color = '#e71d36' // Red/Pink
      size = 18
    }

    // Функция для переноса длинных слов
     const formatLabel = (text: string) => {
       if (!text) return ''
       const maxLen = 15
       if (text.length <= maxLen) return text
       // Разбиваем по пробелам, если возможно
       const words = text.split(' ')
       let lines = []
       let currentLine = words[0]
       for (let i = 1; i < words.length; i++) {
         if (currentLine.length + 1 + words[i].length <= maxLen) {
           currentLine += ' ' + words[i]
         } else {
           lines.push(currentLine)
           currentLine = words[i]
         }
       }
       lines.push(currentLine)
       return lines.join('\n')
     }

     return {
       id: n.uid,
       label: formatLabel(label),
       group: n.kind,
       shape: 'hexagon',
       size: size,
       color: {
         background: color,
         border: '#ffffff',
         highlight: { background: '#ffffff', border: color },
       },
       font: {
          size: 14,
          color: '#ffffff',
          multi: true,
          vadjust: size * 0.8,
        }
      }
    })

  const edges = viewport.edges.map((e, idx): VisEdge => ({
    id: `${e.source}->${e.target}:${idx}`,
    from: e.source,
    to: e.target,
    // label: undefined,
    color: { color: 'rgba(255,255,255,0.4)', highlight: '#fff', opacity: 0.4 },
    dashes: [2, 4],
    width: 1,
    arrows: { to: { enabled: true, scaleFactor: 0.4, type: 'arrow' } }
  }))

  return { nodes, edges }
}

export default function ExplorePage(props: ExplorePageProps) {
  const { selectedUid, onSelectUid } = props

  const containerRef = useRef<HTMLDivElement | null>(null)
  const networkRef = useRef<Network | null>(null)

  const [depth, setDepth] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewport, setViewport] = useState<ViewportResponse | null>(null)
  
  // State for sidebar
  const [detailsUid, setDetailsUid] = useState<string | null>(null)
  
  // State for tooltip data (WHAT to show)
  const [hoveredNode, setHoveredNode] = useState<ViewportResponse['nodes'][0] | null>(null)
  // State for cursor position (WHERE to show)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })

  const visData = useMemo(() => {
    if (!viewport) return null
    return toVisData(viewport)
  }, [viewport])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getViewport({ center_uid: props.selectedUid, depth })
        if (cancelled) return
        setViewport(data)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Ошибка загрузки viewport')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [props.selectedUid, depth])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !visData) return

    const nodes = new DataSet(visData.nodes)
    const edges = new DataSet(visData.edges)

    const network = new Network(
      el,
      { nodes, edges },
      {
        autoResize: true,
        interaction: {
          hover: true,
          multiselect: false,
          navigationButtons: false,
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -100, // Сильнее отталкивание
            centralGravity: 0.005,
            springLength: 200, // Длиннее связи, чтобы было место для стрелок
            springConstant: 0.05,
          },
          stabilization: { iterations: 250 },
        },
        nodes: {
          // Defaults overridden by individual nodes
          shape: 'hexagon',
          font: { color: '#ffffff', size: 14, face: 'ui-sans-serif' },
          borderWidth: 2,
        },
        edges: {
          width: 1,
          dashes: true, // Включаем пунктир глобально
          smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
        },
      },
    )

    network.on('selectNode', (params) => {
      const id = params.nodes?.[0]
      if (typeof id === 'string') {
        setDetailsUid(id)
      }
    })
    
    network.on('doubleClick', (params) => {
      const id = params.nodes?.[0]
      if (typeof id === 'string') {
        onSelectUid(id)
      }
    })

    network.on('hoverNode', (params) => {
      const id = params.node
      if (viewport && typeof id === 'string') {
        const node = viewport.nodes.find((n) => n.uid === id)
        if (node) {
          setHoveredNode(node)
        }
      }
    })

    network.on('blurNode', () => {
      setHoveredNode(null)
    })

    networkRef.current = network

    return () => {
      network.destroy()
      networkRef.current = null
    }
  }, [visData, onSelectUid])

  useEffect(() => {
    const network = networkRef.current
    if (!network) return
    
    // Check if node exists before selecting to avoid RangeError
    const allNodes = network.body.data.nodes
    if (!allNodes.get(selectedUid)) return

    network.selectNodes([selectedUid])
    network.focus(selectedUid, { scale: 1.1, animation: { duration: 350, easingFunction: 'easeInOutQuad' } })
  }, [selectedUid])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Explore (vis-network)</div>
          <div style={{ fontSize: 16, fontWeight: 650 }}>Большой граф + физика</div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Depth</div>
          <select
            className="kb-input"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            style={{ width: 120 }}
          >
            {[1, 2, 3].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="kb-panel" style={{ padding: 12, borderRadius: 14, borderColor: 'rgba(255, 77, 109, 0.35)' }}>
          <div style={{ fontSize: 13, fontWeight: 650 }}>Ошибка</div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      )}

      <div 
        className="kb-panel" 
        style={{ flex: 1, borderRadius: 18, position: 'relative', overflow: 'hidden' }}
        onMouseMove={(e) => {
          if (!hoveredNode) return
          // Получаем координаты мыши относительно контейнера
          const rect = e.currentTarget.getBoundingClientRect()
          setCursorPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          })
        }}
      >
        <NodeDetailsSidebar 
          uid={detailsUid} 
          onClose={() => setDetailsUid(null)} 
          onAskAI={(uid) => alert(`TODO: Open Chat for ${uid}`)} 
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(800px 500px at 50% 40%, rgba(124, 92, 255, 0.18), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
          }}
        /> 

        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

        {loading && (
          <div
            className="kb-panel"
            style={{
              position: 'absolute',
              left: 14,
              bottom: 14,
              padding: '10px 12px',
              borderRadius: 14,
              background: 'rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Загрузка…</div>
          </div>
        )}

        {viewport && (
          <div
            className="kb-panel"
            style={{
              position: 'absolute',
              right: 14,
              bottom: 14,
              padding: '10px 12px',
              borderRadius: 14,
              background: 'rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Nodes: {viewport.nodes.length}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Edges: {viewport.edges.length}</div>
          </div>
        )}

        {hoveredNode && (
          <div
            style={{
              position: 'absolute',
              left: cursorPos.x + 20, // Смещение вправо
              top: cursorPos.y + 20,  // Смещение вниз (чтобы не перекрывать курсор)
              pointerEvents: 'none',
              background: 'rgba(20, 20, 30, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              minWidth: 150,
              // Плавность движения
              transition: 'top 0.05s linear, left 0.05s linear',
            }}
          >
            <div style={{ fontSize: 11, color: '#2ee9a6', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>
              {hoveredNode.kind}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
              {hoveredNode.title || hoveredNode.uid}
            </div>
            {hoveredNode.title && (
               <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace' }}>
                 {hoveredNode.uid}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

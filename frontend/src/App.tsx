import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Graph from './components/Graph'
import AdminPanel from './components/AdminPanel'
import ProgressStream from './components/ProgressStream'
import CommandPalette from './components/CommandPalette'
import ExplainPanel from './components/ExplainPanel'
import Header from './components/Header'
import Footer from './components/Footer'
import Constructor from './components/Constructor'

type Node = { uid: string; title: string; type: string }
type TopicDetails = {
  uid: string
  title: string
  prereqs: Node[]
  goals: { uid: string; title: string }[]
  objectives: { uid: string; title: string }[]
  methods: Node[]
  examples: { uid: string; title: string; difficulty: number }[]
}

function App() {
  const [uid, setUid] = useState<string>('TOP-TEST')
  const [details, setDetails] = useState<TopicDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [tab, setTab] = useState<'visualizer'|'admin'|'constructor'>('visualizer')

  async function loadDetails() {
    setLoading(true)
    setError(null)
    try {
      const query = {
        query: `query { topic(uid: "${uid}") { uid title prereqs { uid title } goals { uid title } objectives { uid title } methods { uid title } examples { uid title difficulty } } }`,
      }
      const { data } = await axios.post('/v1/graphql', query)
      setDetails(data?.data?.topic || null)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetails()
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui', color: 'var(--text)', padding: 16 }}>
      <Header active={tab} onChange={setTab} onOpenPalette={() => setPaletteOpen(true)} />
      {tab === 'visualizer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h2>Детали темы</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={uid} onChange={e => setUid(e.target.value)} placeholder="TOP-UID" />
              <button onClick={loadDetails}>Загрузить</button>
            </div>
            {loading && <p>Загрузка...</p>}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {details && (
              <div style={{ marginTop: 16 }}>
                <section>
                  <h3>{details.title}</h3>
                  <p>Пререквизиты: {details.prereqs?.length || 0}</p>
                  <p>Цели: {details.goals?.length || 0}</p>
                  <p>Задачи: {details.objectives?.length || 0}</p>
                  <p>Методы: {details.methods?.length || 0}</p>
                  <p>Примеры: {details.examples?.length || 0}</p>
                </section>
                <ExplainPanel details={details} />
              </div>
            )}
          </div>
          <div>
            <h2>Визуализатор</h2>
            <Graph />
          </div>
        </div>
      )}
      {tab === 'admin' && (
        <div style={{ marginTop: 24 }}>
          <div id="admin-panel-anchor"><AdminPanel /></div>
          <div style={{ marginTop: 24 }}>
            <ProgressStream />
          </div>
        </div>
      )}
      {tab === 'constructor' && (
        <div style={{ marginTop: 24 }}>
          <Constructor />
          <div style={{ marginTop: 24 }}>
            <ProgressStream />
          </div>
        </div>
      )}
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onLoadSubject={(su) => {
            const el = document.querySelector<HTMLInputElement>('input[placeholder="UID предмета"]')
            if (el) el.value = su
            setPaletteOpen(false)
          }}
          onLoadNeighborhood={(cu) => {
            const el = document.querySelector<HTMLInputElement>('input[placeholder="UID центра"]')
            if (el) el.value = cu
            setPaletteOpen(false)
          }}
        />
      )}
      <Footer />
    </div>
  )
}

export default App

import React, { useEffect, useState } from 'react'
import axios from 'axios'

type Props = {
  onClose: () => void
  onLoadSubject: (uid: string) => void
  onLoadNeighborhood: (uid: string) => void
}

export default function CommandPalette({ onClose, onLoadSubject, onLoadNeighborhood }: Props) {
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([
    'Загрузить предмет',
    'Окрестность узла',
    'Запустить Magic Fill',
    'Открыть Админ панель'
  ])
  async function run(cmd: string) {
    if (cmd === 'Загрузить предмет' && q) onLoadSubject(q)
    if (cmd === 'Окрестность узла' && q) onLoadNeighborhood(q)
    if (cmd === 'Запустить Magic Fill' && q) {
      await axios.post('/v1/construct/magic_fill/queue', { topic_uid: q, topic_title: q, language: 'ru' })
    }
    if (cmd === 'Открыть Админ панель') {
      const el = document.getElementById('admin-panel-anchor')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
    onClose()
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
      <div style={{ width: 600, background: 'var(--panel-bg)', color: 'var(--text)', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
          <input autoFocus placeholder="Введите команду или UID" value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%', padding: 8, background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8 }} />
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
          {suggestions.map(s => (
            <li key={s}>
              <button onClick={() => run(s)} style={{ width: '100%', textAlign: 'left', padding: 10, background: 'transparent', color: 'var(--text)', border: 0, borderRadius: 8 }}>{s}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

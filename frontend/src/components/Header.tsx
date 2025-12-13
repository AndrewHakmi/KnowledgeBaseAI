import React from 'react'
import ThemeToggle from './ThemeToggle'

type Props = {
  active: 'visualizer' | 'admin' | 'constructor'
  onChange: (tab: 'visualizer' | 'admin' | 'constructor') => void
  onOpenPalette: () => void
}

export default function Header({ active, onChange, onOpenPalette }: Props) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h1>KnowledgeBaseAI</h1>
      <nav style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => onChange('visualizer')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: active==='visualizer' ? 'var(--chip-bg)' : 'transparent', color: 'var(--text)' }}>Визуализатор</button>
        <button onClick={() => onChange('admin')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: active==='admin' ? 'var(--chip-bg)' : 'transparent', color: 'var(--text)' }}>Админ</button>
        <button onClick={() => onChange('constructor')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: active==='constructor' ? 'var(--chip-bg)' : 'transparent', color: 'var(--text)' }}>Конструктор</button>
      </nav>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <ThemeToggle />
        <button onClick={onOpenPalette} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>⌘K</button>
      </div>
    </header>
  )
}

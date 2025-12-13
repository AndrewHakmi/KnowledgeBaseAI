import React, { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light'|'dark'>('dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span>Тема</span>
      <button onClick={() => setTheme('light')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: theme==='light' ? 'var(--chip-bg)' : 'transparent', color: 'var(--text)' }}>Light</button>
      <button onClick={() => setTheme('dark')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: theme==='dark' ? 'var(--chip-bg)' : 'transparent', color: 'var(--text)' }}>Dark</button>
    </div>
  )
}

import React from 'react'

type Node = { uid: string; title: string; type: string }
type Example = { uid: string; title: string; difficulty: number }
type Details = {
  uid: string
  title: string
  prereqs: Node[]
  goals: { uid: string; title: string }[]
  objectives: { uid: string; title: string }[]
  methods: Node[]
  examples: Example[]
}

export default function ExplainPanel({ details }: { details: Details | null }) {
  if (!details) return null
  const insights = [
    `Недостающие пререквизиты: ${details.prereqs.length}`,
    `Рекомендованные методы: ${details.methods.length}`,
    `Задачи/цели: ${details.objectives.length}/${details.goals.length}`,
    `Примеры: ${details.examples.length}`
  ]
  return (
    <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--panel-bg)' }}>
      <div style={{ marginBottom: 8, color: 'var(--text-muted)' }}>Почему система предлагает это</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {insights.map((t, i) => (
          <span key={i} style={{ display: 'inline-block', padding: '6px 10px', background: 'var(--chip-bg)', color: 'var(--text)', borderRadius: 999, border: '1px solid var(--border)' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

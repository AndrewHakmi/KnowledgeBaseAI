import React, { useState } from 'react'
import axios from 'axios'

export default function Constructor() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('ru')
  const [topicUid, setTopicUid] = useState('')
  const [topicTitle, setTopicTitle] = useState('')
  const [out, setOut] = useState('')

  async function propose() {
    const { data } = await axios.post('/v1/construct/propose', { text, language })
    setOut(JSON.stringify(data, null, 2))
  }
  async function queueMagicFill() {
    const { data } = await axios.post('/v1/construct/magic_fill/queue', { topic_uid: topicUid, topic_title: topicTitle, language })
    setOut(JSON.stringify(data, null, 2))
  }

  return (
    <div>
      <h2>Конструктор знаний</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h3>Предложения из текста</h3>
          <textarea placeholder="Вставьте текст" value={text} onChange={e => setText(e.target.value)} style={{ width: '100%', height: 160, background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input placeholder="Язык" value={language} onChange={e => setLanguage(e.target.value)} />
            <button onClick={propose}>Сгенерировать</button>
          </div>
        </div>
        <div>
          <h3>Magic Fill</h3>
          <input placeholder="topic_uid" value={topicUid} onChange={e => setTopicUid(e.target.value)} />
          <input placeholder="topic_title" value={topicTitle} onChange={e => setTopicTitle(e.target.value)} />
          <button onClick={queueMagicFill}>Запустить</button>
        </div>
      </div>
      <pre style={{ marginTop: 12, border: '1px solid var(--border)', padding: 8, borderRadius: 8 }}>{out}</pre>
    </div>
  )
}

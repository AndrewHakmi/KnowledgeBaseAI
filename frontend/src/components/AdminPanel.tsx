import React, { useState } from 'react'
import axios from 'axios'

export default function AdminPanel() {
  const [subject_uid, setSubjectUid] = useState('')
  const [subject_title, setSubjectTitle] = useState('')
  const [code, setCode] = useState('')
  const [nodesJson, setNodesJson] = useState('[]')
  const [out, setOut] = useState('')

  async function generateSubject() {
    const payload = { subject_uid, subject_title, language: 'ru' }
    const { data } = await axios.post('/v1/admin/generate_subject', payload)
    setOut(JSON.stringify(data, null, 2))
  }
  async function generateSubjectImport() {
    const payload = { subject_uid, subject_title, language: 'ru' }
    const { data } = await axios.post('/v1/admin/generate_subject_import', payload)
    setOut(JSON.stringify(data, null, 2))
  }
  async function addCurriculumNodes() {
    const nodes = JSON.parse(nodesJson)
    const { data } = await axios.post('/v1/admin/curriculum/nodes', { code, nodes })
    setOut(JSON.stringify(data, null, 2))
  }

  return (
    <div>
      <h2>Админ панель</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h3>Генерация предмета</h3>
          <input placeholder="subject_uid" value={subject_uid} onChange={e => setSubjectUid(e.target.value)} />
          <input placeholder="subject_title" value={subject_title} onChange={e => setSubjectTitle(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={generateSubject}>Generate</button>
            <button onClick={generateSubjectImport}>Generate+Import</button>
          </div>
        </div>
        <div>
          <h3>Curriculum</h3>
          <input placeholder="code" value={code} onChange={e => setCode(e.target.value)} />
          <textarea placeholder='nodes JSON' value={nodesJson} onChange={e => setNodesJson(e.target.value)} style={{ width: '100%', height: 100 }} />
          <button onClick={addCurriculumNodes}>Add Nodes</button>
        </div>
      </div>
      <pre style={{ marginTop: 12, border: '1px solid #eee', padding: 8 }}>{out}</pre>
    </div>
  )
}

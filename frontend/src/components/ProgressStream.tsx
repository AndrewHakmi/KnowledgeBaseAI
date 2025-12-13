import React, { useEffect, useState } from 'react'

export default function ProgressStream() {
  const [jobId, setJobId] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  useEffect(() => {
    if (!jobId) return
    const ws = new WebSocket(`${location.origin.replace('http','ws')}/ws/progress?job_id=${jobId}`)
    ws.onmessage = (ev) => {
      setLogs(prev => [...prev, ev.data])
    }
    return () => ws.close()
  }, [jobId])
  return (
    <div>
      <h3>Прогресс</h3>
      <input placeholder="job_id" value={jobId} onChange={e => setJobId(e.target.value)} />
      <pre style={{ height: 120, overflow: 'auto', border: '1px solid #eee' }}>{logs.join('\n')}</pre>
    </div>
  )
}

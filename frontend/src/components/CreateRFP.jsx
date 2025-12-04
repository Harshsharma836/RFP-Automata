import React, { useState } from 'react'
import { apiFetch } from '../api'

export default function CreateRFP() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isTextValid = text.trim().length >= 10

  async function handleParse() {
    if (!isTextValid) {
      setError('Please enter at least 10 characters describing your RFP')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/rfps/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const data = await res.json()
      setResult(data.rfp)
      setError('')
    } catch (err) {
      setError(`Parse failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result) {
      setError('No RFP to save. Parse first.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/rfps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) })
      const data = await res.json()
      alert('Saved RFP: ' + (data.rfp && data.rfp.id ? data.rfp.id : 'unknown'))
      setText('')
      setResult(null)
    } catch (err) {
      setError(`Save failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Create RFP (natural language)</h2>
      <textarea 
        value={text} 
        onChange={e => {
          setText(e.target.value)
          setError('')
        }} 
        placeholder="Describe what you want to buy, budget, delivery time, quantities..." 
        style={{ borderColor: !isTextValid && text.length > 0 ? '#ef4444' : undefined }}
      />
      {text.length > 0 && !isTextValid && (
        <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
          Minimum 10 characters required ({text.length}/10)
        </div>
      )}
      {error && (
        <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8, padding: '8px 12px', background: '#fee2e2', borderRadius: 6 }}>
          ⚠ {error}
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <button onClick={handleParse} disabled={!isTextValid || loading}>
          {loading ? 'Parsing...' : 'Parse to Structured RFP'}
        </button>
      </div>
      {result && (
        <div className="card">
          <h3>Structured RFP</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          <button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save RFP'}
          </button>
        </div>
      )}
    </div>
  )
}

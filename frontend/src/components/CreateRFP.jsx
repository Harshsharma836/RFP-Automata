import React, { useState } from 'react'
import { apiFetch } from '../api'

export default function CreateRFP() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('ai') // 'ai' or 'manual'
  const [manualData, setManualData] = useState({
    title: '',
    description: '',
    budget: '',
    delivery_days: '',
    priority: 'medium',
    category: 'general'
  })

  const isTextValid = text.trim().length >= 10
  const isManualValid = manualData.title.trim().length >= 3 && manualData.description.trim().length >= 10

  async function handleParse() {
    if (!isTextValid) {
      setError('Please enter at least 10 characters describing your RFP')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/rfps/parse', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ text }) 
      })
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
    setSuccess('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/rfps', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(result) 
      })
      const data = await res.json()
      const rfpId = data.rfp && data.rfp.id ? data.rfp.id : 'unknown'
      setSuccess(`✓ RFP #${rfpId} saved successfully!`)
      setText('')
      setResult(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Save failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveManual() {
    if (!isManualValid) {
      setError('Please fill in all required fields (title min 3 chars, description min 10 chars)')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const payload = {
        title: manualData.title,
        description: manualData.description,
        budget: manualData.budget ? parseInt(manualData.budget, 10) : null,
        delivery_days: manualData.delivery_days ? parseInt(manualData.delivery_days, 10) : null,
        priority: manualData.priority,
        category: manualData.category,
        items: []
      }
      const res = await apiFetch('/api/rfps', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      })
      const data = await res.json()
      const rfpId = data.rfp && data.rfp.id ? data.rfp.id : 'unknown'
      setSuccess(`✓ RFP #${rfpId} created successfully!`)
      setManualData({
        title: '',
        description: '',
        budget: '',
        delivery_days: '',
        priority: 'medium',
        category: 'general'
      })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Save failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>✨ Create RFP</h2>
      
      <div className="section">
        <h3>Choose Your Method</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`${mode === 'ai' ? '' : 'btn-secondary'}`}
            onClick={() => setMode('ai')}
            style={{ flex: 1 }}
          >
            🤖 AI Parser (Natural Language)
          </button>
          <button 
            className={`${mode === 'manual' ? '' : 'btn-secondary'}`}
            onClick={() => setMode('manual')}
            style={{ flex: 1 }}
          >
            ✍️ Manual Entry
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {mode === 'ai' ? (
        <div>
          <div className="section">
            <label>📝 Describe Your RFP</label>
            <textarea 
              value={text} 
              onChange={e => {
                setText(e.target.value)
                setError('')
              }} 
              placeholder="Example: We need 20 laptops with 16GB RAM, Intel i7 processor, delivery within 30 days, budget is $50,000. Also need extended warranty..."
            />
            {text.length > 0 && !isTextValid && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                ⚠ Minimum 10 characters required ({text.length}/10)
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              onClick={handleParse} 
              disabled={!isTextValid || loading}
              style={{ flex: 1 }}
            >
              {loading ? '⏳ Parsing...' : '🚀 Parse with AI'}
            </button>
          </div>

          {result && (
            <div className="section" style={{ marginTop: '16px' }}>
              <h3>📋 Parsed RFP</h3>
              <div className="grid grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label>Title</label>
                  <input 
                    value={result.title || ''} 
                    onChange={e => setResult({ ...result, title: e.target.value })}
                  />
                </div>
                <div>
                  <label>Budget</label>
                  <input 
                    type="number" 
                    value={result.budget || ''} 
                    onChange={e => setResult({ ...result, budget: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label>Description</label>
                <textarea 
                  value={result.description || ''} 
                  onChange={e => setResult({ ...result, description: e.target.value })}
                  style={{ minHeight: '100px' }}
                />
              </div>
              <div>
                <label>Delivery Days</label>
                <input 
                  type="number" 
                  value={result.delivery_days || ''} 
                  onChange={e => setResult({ ...result, delivery_days: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div style={{ marginTop: '16px' }}>
                <label>Items ({result.items?.length || 0})</label>
                {result.items?.map((item, idx) => (
                  <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.qty}x {item.name}</span>
                    <button 
                      className="btn-danger"
                      onClick={() => {
                        const newItems = result.items.filter((_, i) => i !== idx)
                        setResult({ ...result, items: newItems })
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="btn-success"
                style={{ marginTop: '16px', width: '100%' }}
              >
                {loading ? '💾 Saving...' : '💾 Save RFP'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="section">
            <div className="grid grid-2">
              <div>
                <label>📌 RFP Title *</label>
                <input 
                  value={manualData.title} 
                  onChange={e => setManualData({ ...manualData, title: e.target.value })}
                  placeholder="e.g., Laptop Purchase for Engineering Team"
                />
              </div>
              <div>
                <label>📂 Category</label>
                <select 
                  value={manualData.category}
                  onChange={e => setManualData({ ...manualData, category: e.target.value })}
                >
                  <option>general</option>
                  <option>it</option>
                  <option>facilities</option>
                  <option>services</option>
                  <option>supplies</option>
                </select>
              </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: '12px' }}>
              <div>
                <label>💰 Budget</label>
                <input 
                  type="number" 
                  value={manualData.budget} 
                  onChange={e => setManualData({ ...manualData, budget: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label>📅 Delivery Days</label>
                <input 
                  type="number" 
                  value={manualData.delivery_days} 
                  onChange={e => setManualData({ ...manualData, delivery_days: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label>🎯 Priority</label>
              <select 
                value={manualData.priority}
                onChange={e => setManualData({ ...manualData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label>📝 Description *</label>
              <textarea 
                value={manualData.description} 
                onChange={e => setManualData({ ...manualData, description: e.target.value })}
                placeholder="Describe what you need in detail..."
              />
            </div>

            <button 
              onClick={handleSaveManual} 
              disabled={!isManualValid || loading}
              className="btn-success"
              style={{ marginTop: '16px', width: '100%' }}
            >
              {loading ? '💾 Creating...' : '✨ Create RFP'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

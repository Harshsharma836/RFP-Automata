import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import CompareProposals from './CompareProposals'

export default function SendRFP() {
  const [rfps, setRfps] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedRfp, setSelectedRfp] = useState(null)
  const [selectedVendors, setSelectedVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [view, setView] = useState('send') // 'send' or 'propose'
  const [proposalText, setProposalText] = useState('')
  const [proposalLoading, setProposalLoading] = useState(false)
  const [sendHistory, setSendHistory] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const r = await apiFetch('/api/rfps')
      const dr = await r.json()
      setRfps(dr.rfps || [])

      const v = await apiFetch('/api/vendors')
      const dv = await v.json()
      setVendors(dv.vendors || [])
    } catch (err) {
      setError('Failed to load RFPs and vendors')
    }
  }

  function toggleVendor(id) {
    setSelectedVendors(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function sendRfp() {
    if (!selectedRfp || selectedVendors.length === 0) {
      setError('Please select an RFP and at least one vendor')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await apiFetch('/api/send-rfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfp_id: selectedRfp, vendor_ids: selectedVendors })
      })

      const data = await res.json()

      if (data.ok) {
        setSuccess(`✓ RFP sent to ${data.sent} vendor(s)`)
        setSelectedVendors([])
        
        // Load send history
        if (selectedRfp) {
          const historyRes = await apiFetch(`/api/send-rfp/history/${selectedRfp}`)
          const historyData = await historyRes.json()
          if (historyData.ok) setSendHistory(historyData.history || [])
        }
        
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to send RFP')
      }

      if (data.errors?.length > 0) {
        setError(`${data.failed} failed: ${data.errors[0].error}`)
      }
    } catch (err) {
      setError(`Send failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function submitProposal() {
    if (!selectedRfp || !proposalText.trim()) {
      setError('Please select an RFP and enter a proposal')
      return
    }

    setError('')
    setSuccess('')
    setProposalLoading(true)

    try {
      // For demo, use vendor ID 1 (would be from logged-in vendor in real system)
      const vendorId = 1

      const res = await apiFetch('/api/send-rfp/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfp_id: selectedRfp,
          vendor_id: vendorId,
          proposal_text: proposalText
        })
      })

      const data = await res.json()

      if (data.ok) {
        setSuccess(`✓ Proposal submitted! AI Score: ${data.score}/100`)
        setProposalText('')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to submit proposal')
      }
    } catch (err) {
      setError(`Submission failed: ${err.message}`)
    } finally {
      setProposalLoading(false)
    }
  }

  return (
    <div>
      <h2>📧 Send & Track RFPs</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="section">
        <h3>Choose Action</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={view === 'send' ? '' : 'btn-secondary'}
            onClick={() => setView('send')}
            style={{ flex: 1 }}
          >
            📤 Send RFP to Vendors
          </button>
          <button
            className={view === 'propose' ? '' : 'btn-secondary'}
            onClick={() => setView('propose')}
            style={{ flex: 1 }}
          >
            📝 Submit Proposal
          </button>
          <button
            className={view === 'compare' ? '' : 'btn-secondary'}
            onClick={() => setView('compare')}
            style={{ flex: 1 }}
          >
            📊 Compare Proposals
          </button>
        </div>
      </div>

      {view === 'send' && (
        <div className="section">
          <h3>📤 Send RFP to Vendors</h3>

          <div>
            <label>🎯 Select RFP</label>
            <select 
              value={selectedRfp || ''}
              onChange={e => {
                setSelectedRfp(parseInt(e.target.value) || null)
                // Load send history for selected RFP
                if (e.target.value) {
                  apiFetch(`/api/send-rfp/history/${e.target.value}`)
                    .then(r => r.json())
                    .then(d => d.ok && setSendHistory(d.history || []))
                    .catch(() => {})
                }
              }}
            >
              <option value="">-- Select an RFP --</option>
              {rfps.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title || `RFP #${r.id}`} (Budget: ${r.budget || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {selectedRfp && (
            <>
              <div style={{ marginTop: '16px' }}>
                <label>👥 Select Vendors</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedVendors(vendors.map(v => v.id))}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Select All
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedVendors([])}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Deselect All
                  </button>
                </div>
                <div className="grid grid-2">
                  {vendors.map(v => (
                    <label key={v.id} style={{ padding: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(v.id)}
                        onChange={() => toggleVendor(v.id)}
                      />
                      <span style={{ marginLeft: '8px' }}>
                        {v.name} ({v.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={sendRfp}
                disabled={selectedVendors.length === 0 || loading}
                style={{ marginTop: '16px', width: '100%' }}
              >
                {loading ? '⏳ Sending...' : `📤 Send to ${selectedVendors.length} Vendor(s)`}
              </button>

              {sendHistory.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <label>📋 Send History</label>
                  <div className="grid grid-2" style={{ gap: '8px' }}>
                    {sendHistory.map((entry, idx) => (
                      <div key={idx} className="card" style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{entry.vendor_name}</div>
                        <div className="card-subtitle" style={{ fontSize: '10px' }}>
                          {entry.vendor_email}
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '4px', color: '#10b981' }}>
                          ✓ {new Date(entry.sent_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === 'propose' && (
        <div className="section">
          <h3>📝 Submit Proposal as Vendor</h3>

          <div>
            <label>🎯 Select RFP to Respond To</label>
            <select 
              value={selectedRfp || ''}
              onChange={e => setSelectedRfp(parseInt(e.target.value) || null)}
            >
              <option value="">-- Select an RFP --</option>
              {rfps.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title || `RFP #${r.id}`}
                </option>
              ))}
            </select>
          </div>

          {selectedRfp && (
            <>
              <div style={{ marginTop: '16px' }}>
                <label>📄 Your Proposal</label>
                <textarea
                  value={proposalText}
                  onChange={e => setProposalText(e.target.value)}
                  placeholder="Describe your proposal including:
- Itemized pricing
- Delivery timeline
- Payment terms
- Any special offers
- Support details"
                />
              </div>

              <button
                onClick={submitProposal}
                disabled={!proposalText.trim() || proposalLoading}
                className="btn-success"
                style={{ marginTop: '16px', width: '100%' }}
              >
                {proposalLoading ? '⏳ Submitting...' : '📤 Submit Proposal'}
              </button>
            </>
          )}
        </div>
      )}

      {view === 'compare' && (
        <CompareProposals rfpId={selectedRfp} />
      )}
    </div>
  )
}

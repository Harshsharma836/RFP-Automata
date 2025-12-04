import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'

export default function CompareProposals({ rfpId }) {
  const [proposals, setProposals] = useState([])
  const [rfp, setRfp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedForComparison, setSelectedForComparison] = useState([])
  const [showDetails, setShowDetails] = useState(null)

  useEffect(() => {
    if (rfpId) loadProposals()
  }, [rfpId])

  async function loadProposals() {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch(`/api/proposals/compare/${rfpId}`)
      const data = await res.json()
      if (data.ok) {
        setRfp(data.rfp)
        setProposals(data.proposals || [])
      } else {
        setError(data.error || 'Failed to load proposals')
      }
    } catch (err) {
      setError(`Error loading proposals: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function toggleSelection(proposalId) {
    setSelectedForComparison(prev =>
      prev.includes(proposalId)
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    )
  }

  const sortedProposals = [...proposals].sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
  const displayProposals = selectedForComparison.length > 0
    ? sortedProposals.filter(p => selectedForComparison.includes(p.id))
    : sortedProposals

  if (!rfpId) {
    return (
      <div className="alert alert-info">
        Select an RFP to compare proposals
      </div>
    )
  }

  return (
    <div>
      <h2>📊 Proposal Comparison</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {rfp && (
        <div className="section">
          <h3>RFP Details</h3>
          <div className="grid grid-3">
            <div>
              <label className="muted">Title</label>
              <div style={{ fontWeight: 'bold' }}>{rfp.title}</div>
            </div>
            <div>
              <label className="muted">Budget</label>
              <div style={{ fontWeight: 'bold' }}>
                ${rfp.budget ? rfp.budget.toLocaleString() : 'Not specified'}
              </div>
            </div>
            <div>
              <label className="muted">Proposals Received</label>
              <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                {proposals.length}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h3>Select Proposals to Compare</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            onClick={() => setSelectedForComparison(proposals.map(p => p.id))}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedForComparison([])}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Clear Selection
          </button>
          <button
            onClick={loadProposals}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            🔄 Refresh
          </button>
        </div>

        {proposals.length === 0 ? (
          <div className="alert alert-info">
            No proposals received yet. Send this RFP to vendors to start receiving proposals.
          </div>
        ) : (
          <div className="grid grid-2">
            {sortedProposals.map(proposal => (
              <div
                key={proposal.id}
                className="card"
                style={{
                  borderColor: selectedForComparison.includes(proposal.id) ? '#3b82f6' : undefined,
                  borderWidth: selectedForComparison.includes(proposal.id) ? '2px' : '1px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="checkbox"
                    checked={selectedForComparison.includes(proposal.id)}
                    onChange={() => toggleSelection(proposal.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{proposal.vendor_name}</div>
                    <div className="card-subtitle">{proposal.vendor_email}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="muted">AI Score</label>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                      {proposal.ai_score || 0}/100
                    </div>
                  </div>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)`,
                        width: `${proposal.ai_score || 0}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                {proposal.ai_feedback && (
                  <div style={{ marginBottom: '12px', padding: '8px', background: '#f0fdf4', borderRadius: '6px' }}>
                    <div className="card-subtitle">💡 AI Insight</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{proposal.ai_feedback}</div>
                  </div>
                )}

                <div className="grid grid-2" style={{ gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <label className="muted">Total Price</label>
                    <div style={{ fontWeight: 'bold' }}>
                      {proposal.total ? `$${proposal.total.toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="muted">Vendor Rating</label>
                    <div style={{ fontWeight: 'bold' }}>
                      {'⭐'.repeat(proposal.vendor_rating || 5)}
                    </div>
                  </div>
                </div>

                {proposal.terms && (
                  <div style={{ marginBottom: '12px' }}>
                    <label className="muted">Terms</label>
                    <div style={{ fontSize: '12px' }}>{proposal.terms}</div>
                  </div>
                )}

                {proposal.line_items && proposal.line_items.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <label className="muted">Line Items ({proposal.line_items.length})</label>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowDetails(showDetails === proposal.id ? null : proposal.id)}
                      style={{ padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
                    >
                      {showDetails === proposal.id ? '▼ Hide' : '▶ Show'}
                    </button>
                    {showDetails === proposal.id && (
                      <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {proposal.line_items.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
                            <div>{item.description}</div>
                            <div style={{ color: '#6b7280' }}>${item.amount ? item.amount.toLocaleString() : 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {displayProposals.length > 1 && (
        <div className="section">
          <h3>📈 Comparison Summary</h3>
          <div className="grid grid-2">
            <div>
              <label>Highest Score</label>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                {displayProposals[0]?.vendor_name}
              </div>
              <div className="card-subtitle">{displayProposals[0]?.ai_score}/100</div>
            </div>
            <div>
              <label>Best Price</label>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                {displayProposals.filter(p => p.total).sort((a, b) => a.total - b.total)[0]?.vendor_name || 'N/A'}
              </div>
              <div className="card-subtitle">
                $
                {displayProposals
                  .filter(p => p.total)
                  .sort((a, b) => a.total - b.total)[0]?.total?.toLocaleString() || 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: '#dbeafe', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <strong>💡 Recommendation:</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              {displayProposals[0]?.vendor_name} has the best overall score (
              {displayProposals[0]?.ai_score}/100)
              {displayProposals[0]?.ai_feedback ? `. ${displayProposals[0].ai_feedback}` : '.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

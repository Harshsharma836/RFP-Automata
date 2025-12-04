import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'

export default function VendorPortal() {
  const [rfps, setRfps] = useState([])
  const [selectedRfp, setSelectedRfp] = useState(null)
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [proposalText, setProposalText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRfpDetails, setShowRfpDetails] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [rfpsRes, vendorsRes] = await Promise.all([
        apiFetch('/api/rfps'),
        apiFetch('/api/vendors')
      ])
      const rfpsData = await rfpsRes.json()
      const vendorsData = await vendorsRes.json()

      setRfps(rfpsData.rfps || [])
      setVendors(vendorsData.vendors || [])
    } catch (err) {
      setError('Failed to load RFPs')
    }
  }

  async function submitProposal() {
    if (!selectedRfp || !selectedVendor || !proposalText.trim()) {
      setError('Please select RFP, vendor, and enter a proposal')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await apiFetch('/api/send-rfp/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfp_id: selectedRfp,
          vendor_id: selectedVendor,
          proposal_text: proposalText
        })
      })

      const data = await res.json()

      if (data.ok) {
        setSuccess(`✓ Proposal submitted successfully!\n\nAI Score: ${data.score}/100\nFeedback: ${data.feedback}`)
        setProposalText('')
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.error || 'Failed to submit proposal')
      }
    } catch (err) {
      setError(`Submission failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const selectedRfpData = rfps.find(r => r.id === selectedRfp)
  const selectedVendorData = vendors.find(v => v.id === selectedVendor)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📧 Vendor Proposal Portal
        </h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>
          Respond to RFPs and submit your proposals
        </p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '4px solid #ef4444' }}>
          ⚠ {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '4px solid #10b981', whiteSpace: 'pre-line' }}>
          {success}
        </div>
      )}

      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
            👤 Step 1: Who are you? (Select your vendor)
          </label>
          <select
            value={selectedVendor || ''}
            onChange={e => setSelectedVendor(parseInt(e.target.value) || null)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <option value="">-- Select your vendor --</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.email})
              </option>
            ))}
          </select>
        </div>

        {selectedVendorData && (
          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', marginBottom: '24px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '13px', color: '#166534' }}>
              ✓ You are responding as: <strong>{selectedVendorData.name}</strong>
            </div>
          </div>
        )}

        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
            📋 Step 2: Which RFP?
          </label>
          <select
            value={selectedRfp || ''}
            onChange={e => setSelectedRfp(parseInt(e.target.value) || null)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <option value="">-- Select an RFP to respond to --</option>
            {rfps.map(r => (
              <option key={r.id} value={r.id}>
                {r.title || `RFP #${r.id}`} (Budget: ${r.budget || 'N/A'})
              </option>
            ))}
          </select>
        </div>

        {selectedRfpData && (
          <>
            <button
              onClick={() => setShowRfpDetails(!showRfpDetails)}
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                marginBottom: '12px',
                fontWeight: '600'
              }}
            >
              {showRfpDetails ? '▼' : '▶'} View RFP Details
            </button>

            {showRfpDetails && (
              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#111827' }}>{selectedRfpData.title}</h4>
                <p style={{ margin: '0 0 12px 0', color: '#6b7280', lineHeight: '1.6' }}>
                  {selectedRfpData.description}
                </p>
                {selectedRfpData.budget && (
                  <div style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong>💰 Budget:</strong> ${selectedRfpData.budget}
                  </div>
                )}
                {selectedRfpData.delivery_days && (
                  <div style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong>📅 Delivery:</strong> {selectedRfpData.delivery_days} days
                  </div>
                )}
                {selectedRfpData.category && (
                  <div style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong>📂 Category:</strong> {selectedRfpData.category}
                  </div>
                )}
                {selectedRfpData.items && selectedRfpData.items.length > 0 && (
                  <div style={{ margin: '12px 0' }}>
                    <strong>📦 Items Needed:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {selectedRfpData.items.map((item, idx) => (
                        <li key={idx} style={{ fontSize: '14px', margin: '4px 0' }}>
                          {item.qty}x {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
            ✍️ Step 3: Write Your Proposal
          </label>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Include pricing, delivery timeline, payment terms, and any special offers
          </div>
          <textarea
            value={proposalText}
            onChange={e => setProposalText(e.target.value)}
            placeholder={`Example:

We can supply ${selectedRfpData?.items?.[0]?.qty || '20'} ${selectedRfpData?.items?.[0]?.name || 'units'} for $${selectedRfpData?.budget ? Math.floor(selectedRfpData.budget * 0.85) : '15000'} total.

Unit price: $${selectedRfpData?.budget ? Math.floor((selectedRfpData.budget * 0.85) / (selectedRfpData?.items?.[0]?.qty || 20)) : '750'} each

Delivery: ${selectedRfpData?.delivery_days || 30} days
Payment terms: Net 30
Warranty: 1 year
Support: Free technical support included`}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            Characters: {proposalText.length}
          </div>
        </div>

        
        <button
          onClick={submitProposal}
          disabled={!selectedRfp || !selectedVendor || !proposalText.trim() || loading}
          style={{
            width: '100%',
            padding: '14px',
            background: !selectedRfp || !selectedVendor || !proposalText.trim() || loading
              ? '#d1d5db'
              : 'linear-gradient(135deg, #3b82f6, #1e40af)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: !selectedRfp || !selectedVendor || !proposalText.trim() || loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? '⏳ Submitting...' : '🚀 Submit Proposal'}
        </button>

        <div style={{ marginTop: '24px', padding: '16px', background: '#dbeafe', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <strong style={{ color: '#1e40af' }}>💡 How it works:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '14px', color: '#1e40af' }}>
            <li>Our AI system will automatically parse your proposal</li>
            <li>Your proposal will be scored (0-100)</li>
            <li>Buyers will compare all vendor proposals</li>
            <li>You'll receive confirmation when submitted</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

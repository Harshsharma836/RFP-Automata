import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'

export default function RFPDashboard({ onCreateClick }) {
  const [rfps, setRfps] = useState([])
  const [vendors, setVendors] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      const [rfpsRes, vendorsRes] = await Promise.all([
        apiFetch('/api/rfps'),
        apiFetch('/api/vendors')
      ])
      const rfpsData = await rfpsRes.json()
      const vendorsData = await vendorsRes.json()

      const rfpsList = rfpsData.rfps || []
      setRfps(rfpsList)
      setVendors(vendorsData.vendors || [])
      setStats({
        total: rfpsList.length,
        active: rfpsList.filter(r => r.status === 'active' || !r.status).length,
        completed: rfpsList.filter(r => r.status === 'completed').length
      })
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Dashboard</h2>
      
      <div className="grid grid-3 mt">
        <div className="card text-center">
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>
            {stats.total}
          </div>
          <div className="card-subtitle">Total RFPs</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
            {stats.active}
          </div>
          <div className="card-subtitle">Active</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {vendors.length}
          </div>
          <div className="card-subtitle">Vendors</div>
        </div>
      </div>

      <div className="section mt">
        <h3>🚀 Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={onCreateClick} style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}>
            ✨ Create New RFP
          </button>
          <button className="btn-secondary" onClick={loadDashboard}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {rfps.length > 0 ? (
        <div className="section mt">
          <h3>📋 Recent RFPs</h3>
          <div className="grid grid-2">
            {rfps.slice(0, 6).map(rfp => (
              <div key={rfp.id} className="card">
                <div className="card-header">
                  <span>{rfp.title || `RFP #${rfp.id}`}</span>
                  <span className="badge badge-primary">
                    {rfp.status || 'active'}
                  </span>
                </div>
                <div className="card-subtitle" style={{ marginBottom: '8px' }}>
                  {rfp.description?.substring(0, 80)}...
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  {rfp.items?.length || 0} items
                  {rfp.budget && ` • $${rfp.budget}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="alert alert-info mt">
          <strong>No RFPs yet!</strong> Click "Create New RFP" to get started.
        </div>
      )}
    </div>
  )
}

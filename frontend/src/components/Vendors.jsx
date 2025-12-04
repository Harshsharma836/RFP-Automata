import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [form, setForm] = useState({ 
    name: '', 
    email: '',
    category: 'general',
    rating: 5,
    phone: '',
    address: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchVendors() }, [])

  async function fetchVendors() {
    try {
      const res = await apiFetch('/api/vendors')
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (err) {
      setError('Failed to load vendors')
    }
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required')
      return
    }
    if (!form.email.includes('@')) {
      setError('Please enter a valid email')
      return
    }
    
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await apiFetch('/api/vendors', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(form) 
      })
      setSuccess('✓ Vendor added successfully!')
      setForm({ 
        name: '', 
        email: '',
        category: 'general',
        rating: 5,
        phone: '',
        address: ''
      })
      fetchVendors()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to add vendor: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function deleteVendor(id) {
    if (!confirm('Are you sure you want to delete this vendor?')) return
    
    try {
      await apiFetch(`/api/vendors/${id}`, { method: 'DELETE' })
      setSuccess('✓ Vendor deleted')
      fetchVendors()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete vendor')
    }
  }

  const filteredVendors = filter === 'all' 
    ? vendors 
    : vendors.filter(v => v.category === filter)

  return (
    <div>
      <h2>👥 Vendor Management</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="section">
        <h3>➕ Add New Vendor</h3>
        <div className="grid grid-2">
          <div>
            <label>Vendor Name *</label>
            <input 
              placeholder="e.g., TechSupplies Inc." 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
            />
          </div>
          <div>
            <label>Email *</label>
            <input 
              type="email"
              placeholder="vendor@example.com" 
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
            />
          </div>
          <div>
            <label>Phone</label>
            <input 
              type="tel"
              placeholder="+1 (555) 123-4567" 
              value={form.phone} 
              onChange={e => setForm({ ...form, phone: e.target.value })} 
            />
          </div>
          <div>
            <label>Category</label>
            <select 
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              <option value="general">General</option>
              <option value="it">IT & Tech</option>
              <option value="furniture">Furniture</option>
              <option value="services">Services</option>
              <option value="supplies">Office Supplies</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Address</label>
            <input 
              placeholder="123 Business St, City, State" 
              value={form.address} 
              onChange={e => setForm({ ...form, address: e.target.value })} 
            />
          </div>
          <div>
            <label>Rating (1-5 stars)</label>
            <select 
              value={form.rating}
              onChange={e => setForm({ ...form, rating: e.target.value })}
            >
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
          </div>
        </div>
        <button 
          onClick={handleAdd} 
          disabled={loading}
          className="btn-success"
          style={{ marginTop: '16px', width: '100%' }}
        >
          {loading ? '⏳ Adding...' : '➕ Add Vendor'}
        </button>
      </div>

      <div className="section">
        <h3>📋 Vendors List</h3>
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className={filter === 'all' ? '' : 'btn-secondary'}
            onClick={() => setFilter('all')}
            style={{ padding: '6px 12px' }}
          >
            All ({vendors.length})
          </button>
          <button 
            className={filter === 'it' ? '' : 'btn-secondary'}
            onClick={() => setFilter('it')}
            style={{ padding: '6px 12px' }}
          >
            IT
          </button>
          <button 
            className={filter === 'furniture' ? '' : 'btn-secondary'}
            onClick={() => setFilter('furniture')}
            style={{ padding: '6px 12px' }}
          >
            Furniture
          </button>
          <button 
            className={filter === 'services' ? '' : 'btn-secondary'}
            onClick={() => setFilter('services')}
            style={{ padding: '6px 12px' }}
          >
            Services
          </button>
        </div>

        {filteredVendors.length > 0 ? (
          <div className="grid grid-2">
            {filteredVendors.map(v => (
              <div key={v.id} className="card">
                <div className="card-header">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{v.name}</div>
                    <div className="card-subtitle">{v.category}</div>
                  </div>
                  <div style={{ fontSize: '14px' }}>{'⭐'.repeat(v.rating || 5)}</div>
                </div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>
                  <div>📧 {v.email}</div>
                  {v.phone && <div>📞 {v.phone}</div>}
                  {v.address && <div>📍 {v.address}</div>}
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-secondary"
                    style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => deleteVendor(v.id)}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            No vendors in this category yet.
          </div>
        )}
      </div>
    </div>
  )
}

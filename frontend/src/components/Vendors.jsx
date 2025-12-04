import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [form, setForm] = useState({ name: '', email: '' })

  useEffect(() => { fetchVendors() }, [])

  async function fetchVendors() {
    const res = await apiFetch('/api/vendors')
    const data = await res.json()
    setVendors(data.vendors || [])
  }

  async function handleAdd() {
    await apiFetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ name: '', email: '' })
    fetchVendors()
  }

  return (
    <div>
      <h2>Vendors</h2>
      <div style={{ maxWidth: 480 }}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <button onClick={handleAdd}>Add Vendor</button>
      </div>
      <div style={{ marginTop: 12 }}>
        {vendors.map(v => (
          <div key={v.id} className="card"><b>{v.name}</b> — {v.email}</div>
        ))}
      </div>
    </div>
  )
}

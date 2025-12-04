import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'

export default function SendRFP() {
  const [rfps, setRfps] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedRfp, setSelectedRfp] = useState(null)
  const [selectedVendors, setSelectedVendors] = useState([])

  useEffect(() => { load() }, [])
  async function load() {
    const r = await apiFetch('/api/rfps'); const dr = await r.json(); setRfps(dr.rfps || [])
    const v = await apiFetch('/api/vendors'); const dv = await v.json(); setVendors(dv.vendors || [])
  }

  function toggleVendor(id) {
    setSelectedVendors(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function send() {
    if (!selectedRfp || !selectedVendors.length) return alert('Select RFP and at least one vendor');
    // For prototype: send a simple email per vendor via backend endpoint
    for (const vId of selectedVendors) {
      await apiFetch('/api/send-rfp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rfp_id: selectedRfp, vendor_id: vId }) })
    }
    alert('Send requests queued (prototype)')
  }

  return (
    <div>
      <h2>Send RFP</h2>
      <div>
        <label>Choose RFP</label>
        <select onChange={e => setSelectedRfp(parseInt(e.target.value||'') )}>
          <option value="">--select--</option>
          {rfps.map(r => <option key={r.id} value={r.id}>{r.title || r.id}</option>)}
        </select>
      </div>
      <div style={{ marginTop: 8 }}>
        <h4>Vendors</h4>
        {vendors.map(v => (
          <div key={v.id}><label><input type="checkbox" checked={selectedVendors.includes(v.id)} onChange={() => toggleVendor(v.id)} /> {v.name} ({v.email})</label></div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={send}>Send RFP Emails</button>
      </div>
    </div>
  )
}

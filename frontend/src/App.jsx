import React, { useState, useEffect } from 'react'
import CreateRFP from './components/CreateRFP'
import Vendors from './components/Vendors'
import SendRFP from './components/SendRFP'

export default function App() {
  const [view, setView] = useState('create')

  return (
    <div className="app">
      <header className="app-header">
        <h1>RFP Manager</h1>
        <p className="muted">Prototype — manage and send RFPs</p>
      </header>

      <nav className="app-nav">
        <button className="nav-btn" onClick={() => setView('create')}>Create RFP</button>
        <button className="nav-btn" onClick={() => setView('vendors')}>Vendors</button>
        <button className="nav-btn" onClick={() => setView('send')}>Send RFP</button>
      </nav>

      <main className="app-content">
        {view === 'create' && <CreateRFP />}
        {view === 'vendors' && <Vendors />}
        {view === 'send' && <SendRFP />}
      </main>
    </div>
  )
}

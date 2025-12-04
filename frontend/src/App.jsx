import React, { useState, useEffect } from 'react'
import CreateRFP from './components/CreateRFP'
import Vendors from './components/Vendors'
import SendRFP from './components/SendRFP'
import RFPDashboard from './components/RFPDashboard'
import VendorPortal from './components/VendorPortal'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [userRole, setUserRole] = useState('buyer') // 'buyer' or 'vendor'

  return (
    <div className="app">
      <header className="app-header">
        <h1>RFP Manager</h1>
        <p className="muted">AI-Powered Request for Proposal Management System</p>
      
      </header>

      {userRole === 'buyer' && (
        <>
          <nav className="app-nav">
            <button 
              className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`nav-btn ${view === 'create' ? 'active' : ''}`}
              onClick={() => setView('create')}
            >
              ✨ Create RFP
            </button>
            <button 
              className={`nav-btn ${view === 'vendors' ? 'active' : ''}`}
              onClick={() => setView('vendors')}
            >
              👥 Vendors
            </button>
            <button 
              className={`nav-btn ${view === 'send' ? 'active' : ''}`}
              onClick={() => setView('send')}
            >
              📧 Send & Track
            </button>
          </nav>

          <main className="app-content">
            {view === 'dashboard' && <RFPDashboard onCreateClick={() => setView('create')} />}
            {view === 'create' && <CreateRFP />}
            {view === 'vendors' && <Vendors />}
            {view === 'send' && <SendRFP />}
          </main>
        </>
      )}

      {userRole === 'vendor' && (
        <div>
          <VendorPortal />
          <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '32px' }}>
            <button
              className="btn-secondary"
              onClick={() => setUserRole('buyer')}
              style={{ padding: '8px 16px' }}
            >
              ← Back to Buyer Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

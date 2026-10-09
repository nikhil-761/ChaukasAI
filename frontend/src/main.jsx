import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { registerSW } from './lib/pwa'
import { ThemeProvider } from './lib/theme'
import { LanguageProvider } from './lib/i18n'

class Boundary extends React.Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (!this.state.err) return this.props.children
    // Sirf asli crash par dikhta hai (kabhi galat alarm nahi)
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: '#05070F', color: '#EEF4FF', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <h2 style={{ margin: 0 }}>Kuch gadbad ho gayi</h2>
          <p style={{ opacity: .7 }}>Page reload karke dekho. Phir bhi aaye to ye text screenshot karke bhejo:</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,.06)', padding: 12, borderRadius: 12, fontSize: 12, overflow: 'auto' }}>{String(this.state.err?.stack || this.state.err)}</pre>
          <button onClick={() => location.reload()} style={{ marginTop: 8, padding: '10px 18px', borderRadius: 12, border: 0, background: '#2F80FF', color: '#fff', fontWeight: 700 }}>Reload</button>
        </div>
      </div>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Boundary>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </Boundary>
  </React.StrictMode>
)

registerSW()

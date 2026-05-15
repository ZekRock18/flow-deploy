import { useEffect, useState, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import { TooltipProvider } from '@/components/ui/tooltip'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#021B1A', color: '#F1F7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 600, fontFamily: 'monospace' }}>
            <p style={{ color: '#F87171', fontWeight: 700, marginBottom: 12 }}>Render error (report this):</p>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#AACBC4' }}>{String(this.state.error)}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function RequireAuth({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#021B1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          border: '2.5px solid rgba(0,223,129,0.2)',
          borderTopColor: '#00DF81',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!session) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

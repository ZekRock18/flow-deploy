import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard', { replace: true })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate('/dashboard', { replace: true })
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  const signIn = (provider) =>
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/dashboard` } })

  return (
    <div style={{ minHeight: '100vh', background: '#021B1A', display: 'flex', position: 'relative', overflow: 'hidden' }}>

      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,223,129,0.12) 0%, transparent 65%)',
        animation: 'blob 14s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-5%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(44,194,149,0.09) 0%, transparent 65%)',
        animation: 'blob 18s ease-in-out infinite reverse', pointerEvents: 'none',
      }} />

      {/* Left panel — brand */}
      <div style={{
        display: 'none',
        flex: '1',
        padding: '64px',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }} className="left-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg,#00DF81,#2CC295)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" fill="none" stroke="#021B1A" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#F1F7F6', letterSpacing: '-0.3px' }}>FlowDeploy</span>
        </div>
      </div>

      {/* Center / Right — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Card */}
          <div style={{
            background: '#032221',
            border: '1px solid rgba(0,223,129,0.2)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,223,129,0.08)',
          }}>
            {/* Top accent line */}
            <div style={{ height: 2, background: 'linear-gradient(90deg,#00DF81,#2CC295,transparent)' }} />

            <div style={{ padding: '36px 32px 28px' }}>
              {/* Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                <motion.div
                  animate={{ boxShadow: ['0 0 16px rgba(0,223,129,0.3)', '0 0 32px rgba(0,223,129,0.5)', '0 0 16px rgba(0,223,129,0.3)'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'linear-gradient(135deg,#00DF81,#2CC295)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <svg width="24" height="24" fill="none" stroke="#021B1A" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </motion.div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F7F6', letterSpacing: '-0.5px', marginBottom: 6, textAlign: 'center' }}>
                  Welcome to FlowDeploy
                </h1>
                <p style={{ fontSize: 13.5, color: '#AACBC4', textAlign: 'center' }}>
                  Deploy GitHub repos to Kubernetes effortlessly
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <motion.button
                  whileHover={{ scale: 1.015, boxShadow: '0 0 24px rgba(0,223,129,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => signIn('github')}
                  style={{
                    width: '100%', height: 46, borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg,#00DF81,#2CC295)',
                    color: '#021B1A', fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    cursor: 'pointer', letterSpacing: '-0.1px',
                    boxShadow: '0 4px 20px rgba(0,223,129,0.2)',
                  }}
                >
                  <svg width="18" height="18" fill="#021B1A" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                  </svg>
                  Continue with GitHub
                </motion.button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,223,129,0.12)' }} />
                  <span style={{ fontSize: 11, color: '#707D7D', fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,223,129,0.12)' }} />
                </div>

                <motion.button
                  whileHover={{ scale: 1.015, borderColor: 'rgba(0,223,129,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => signIn('google')}
                  style={{
                    width: '100%', height: 46, borderRadius: 12,
                    border: '1px solid rgba(0,223,129,0.2)',
                    background: 'rgba(2,27,26,0.6)',
                    color: '#F1F7F6', fontWeight: 600, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </motion.button>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 32px',
              borderTop: '1px solid rgba(0,223,129,0.08)',
              background: 'rgba(2,27,26,0.4)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 11.5, color: '#707D7D' }}>
                By continuing you agree to our{' '}
                <span style={{ color: '#AACBC4', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>
              </p>
            </div>
          </div>

          {/* Brand below card on mobile */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'linear-gradient(135deg,#00DF81,#2CC295)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" stroke="#021B1A" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#AACBC4' }}>FlowDeploy</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

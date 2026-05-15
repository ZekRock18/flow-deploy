import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import api from '../api'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/* ── tokens ─────────────────────────────────────────── */
const C = {
  bg:      '#021B1A',
  card:    '#032221',
  cardHi:  '#03291F',
  green:   '#00DF81',
  green2:  '#2CC295',
  text:    '#F1F7F6',
  sub:     '#AACBC4',
  dim:     '#707D7D',
  border:  'rgba(0,223,129,0.15)',
  borderHi:'rgba(0,223,129,0.28)',
  rowHover:'rgba(0,223,129,0.04)',
}

const card = (extra = {}) => ({
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  ...extra,
})

/* ── small components ────────────────────────────────── */

function Pill({ children, color = 'gray' }) {
  const map = {
    green: { bg: 'rgba(0,223,129,0.12)',  color: '#00DF81' },
    amber: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    blue:  { bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
    mint:  { bg: 'rgba(44,194,149,0.14)', color: '#2CC295' },
    gray:  { bg: 'rgba(112,125,125,0.18)',color: '#AACBC4' },
  }
  const s = map[color] || map.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 9px', borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {children}
    </span>
  )
}

function GhIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill={color} viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
    </svg>
  )
}

/* ── Navbar ──────────────────────────────────────────── */
function Navbar({ user, onSignOut }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(2,27,26,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg,${C.green},${C.green2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="15" height="15" fill="none" stroke={C.bg} strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: C.text, letterSpacing: '-0.4px' }}>FlowDeploy</span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${C.border}` }} />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `linear-gradient(135deg,${C.green},${C.green2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: C.bg,
                }}>
                  {user.username?.[0]?.toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'none' }} className="nav-username">
                {user.username}
              </span>
            </>
          )}
          <div style={{ width: 1, height: 18, background: C.border }} />
          <button
            onClick={onSignOut}
            style={{
              background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '5px 12px', fontSize: 12, fontWeight: 600, color: C.dim,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; e.currentTarget.style.color = '#F87171' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Profile card ────────────────────────────────────── */
function ProfileCard({ user }) {
  return (
    <div style={{ ...card(), padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.username} style={{
            width: 52, height: 52, borderRadius: '50%',
            border: `2px solid ${C.green}40`,
          }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: `linear-gradient(135deg,${C.green},${C.green2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 20, color: C.bg,
          }}>
            {user.username?.[0]?.toUpperCase()}
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 12, height: 12, borderRadius: '50%',
          background: C.green, border: `2px solid ${C.card}`,
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.3px' }}>
            {user.username}
          </span>
          <Pill color={user.provider === 'github' ? 'mint' : 'blue'}>{user.provider}</Pill>
        </div>
        <p style={{ fontSize: 13, color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </p>
      </div>
    </div>
  )
}

/* ── Connect GitHub banner ───────────────────────────── */
function ConnectBanner({ onConnect, loading }) {
  return (
    <div style={{
      borderRadius: 16, padding: 2,
      background: `linear-gradient(135deg,${C.green}35,${C.green2}15,transparent)`,
    }}>
      <div style={{
        borderRadius: 14, padding: '20px 24px',
        background: '#032B21',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'rgba(0,223,129,0.08)',
          border: `1px solid rgba(0,223,129,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GhIcon size={20} color={C.green} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>
            Connect your GitHub account
          </p>
          <p style={{ fontSize: 13, color: C.sub }}>
            You signed in with Google — link GitHub to sync and deploy your repositories.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: `0 0 20px ${C.green}35` }}
          whileTap={{ scale: 0.97 }}
          onClick={onConnect}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg,${C.green},${C.green2})`,
            color: C.bg, fontWeight: 700, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {loading
            ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.bg}40`, borderTopColor: C.bg, animation: 'spin 0.7s linear infinite' }} />
            : <GhIcon size={14} color={C.bg} />
          }
          {loading ? 'Connecting…' : 'Connect GitHub'}
        </motion.button>
      </div>
    </div>
  )
}

/* ── Section header ──────────────────────────────────── */
function SectionHead({ title, count, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.3px' }}>{title}</h2>
        {count != null && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.green,
            background: 'rgba(0,223,129,0.1)', padding: '1px 8px', borderRadius: 99,
          }}>{count}</span>
        )}
      </div>
      {action}
    </div>
  )
}

/* ── Table wrapper ───────────────────────────────────── */
function TableCard({ children }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: 'hidden', /* clips corners for table */
    }}>
      <div style={{ overflowX: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

function Th({ children, first }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: first ? '11px 20px 11px 20px' : '11px 16px',
      fontSize: 10.5, fontWeight: 700, color: C.dim,
      textTransform: 'uppercase', letterSpacing: '0.09em',
      background: 'rgba(3,98,76,0.15)',
      borderBottom: `1px solid ${C.border}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  )
}

function Td({ children, first, last, style: s = {} }) {
  return (
    <td style={{
      padding: first ? '13px 20px' : last ? '13px 20px 13px 16px' : '13px 16px',
      fontSize: 13, color: C.sub,
      verticalAlign: 'middle',
      ...s,
    }}>
      {children}
    </td>
  )
}

/* ── Empty state ─────────────────────────────────────── */
function Empty({ title, sub }) {
  return (
    <TableCard>
      <div style={{ padding: '56px 24px', textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
          background: 'rgba(0,223,129,0.07)', border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" fill="none" stroke={C.green} strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{title}</p>
        {sub && <p style={{ fontSize: 12.5, color: C.dim, maxWidth: 280, margin: '0 auto' }}>{sub}</p>}
      </div>
    </TableCard>
  )
}

/* ── Repos section ───────────────────────────────────── */
function ReposSection({ repos, onSync, syncing, canSync, loading }) {
  if (loading) return <SkeletonTable />

  return (
    <section>
      <SectionHead
        title="Repositories"
        count={canSync ? repos.length : null}
        action={
          canSync ? (
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: `0 0 20px ${C.green}30` }}
              whileTap={{ scale: 0.96 }}
              onClick={onSync}
              disabled={syncing}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg,${C.green},${C.green2})`,
                color: C.bg, fontWeight: 700, fontSize: 13,
                cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1,
                boxShadow: `0 2px 14px ${C.green}20`,
              }}
            >
              <svg width="13" height="13" fill="none" stroke={C.bg} strokeWidth="2.2" viewBox="0 0 24 24"
                style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {syncing ? 'Syncing…' : 'Sync Repos'}
            </motion.button>
          ) : null
        }
      />

      {repos.length === 0 ? (
        <Empty title="No repositories synced" sub="Click Sync Repos to import your GitHub repositories" />
      ) : (
        <TableCard>
          <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th first>Name</Th>
                <Th>Language</Th>
                <Th>Stars</Th>
                <Th>Forks</Th>
                <Th>Visibility</Th>
                <Th>Deploy</Th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {repos.map((repo, i) => (
                  <motion.tr
                    key={repo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    style={{ borderBottom: i < repos.length - 1 ? `1px solid rgba(0,223,129,0.06)` : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Td first>
                      <a
                        href={repo.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontWeight: 700, fontSize: 13.5, color: C.text, textDecoration: 'none', display: 'block' }}
                        onMouseEnter={e => e.currentTarget.style.color = C.green}
                        onMouseLeave={e => e.currentTarget.style.color = C.text}
                      >
                        {repo.name}
                      </a>
                      {repo.description && (
                        <span style={{ fontSize: 11.5, color: C.dim, display: 'block', marginTop: 2, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {repo.description}
                        </span>
                      )}
                    </Td>
                    <Td>{repo.language || <span style={{ color: '#3d5a57' }}>—</span>}</Td>
                    <Td>
                      {repo.stars > 0
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: '#F59E0B' }}>★</span>{repo.stars.toLocaleString()}</span>
                        : <span style={{ color: '#3d5a57' }}>0</span>
                      }
                    </Td>
                    <Td>{repo.forks > 0 ? repo.forks.toLocaleString() : <span style={{ color: '#3d5a57' }}>0</span>}</Td>
                    <Td>
                      <Pill color={repo.is_private ? 'amber' : 'green'}>
                        {repo.is_private ? 'Private' : 'Public'}
                      </Pill>
                    </Td>
                    <Td last>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            disabled
                            style={{
                              padding: '5px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                              background: 'transparent', color: C.dim, fontSize: 11.5,
                              fontWeight: 600, cursor: 'not-allowed',
                            }}
                          >
                            Deploy to K8S
                          </button>
                        </TooltipTrigger>
                        <TooltipContent style={{ background: '#032221', border: `1px solid ${C.border}`, color: C.green, fontSize: 11 }}>
                          Coming soon
                        </TooltipContent>
                      </Tooltip>
                    </Td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </TableCard>
      )}
    </section>
  )
}

/* ── Projects section ────────────────────────────────── */
function ProjectsSection({ projects, loading }) {
  if (loading) return <SkeletonTable rows={3} />
  const pc = { active: 'blue', deployed: 'green', pending: 'gray' }

  return (
    <section>
      <SectionHead title="Projects" count={projects.length} />
      {projects.length === 0 ? (
        <Empty title="No projects yet" sub="Create a project to manage your deployments" />
      ) : (
        <TableCard>
          <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th first>Name</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: i < projects.length - 1 ? `1px solid rgba(0,223,129,0.06)` : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Td first style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{p.name}</Td>
                  <Td>
                    <span style={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description || <span style={{ color: '#3d5a57' }}>—</span>}
                    </span>
                  </Td>
                  <Td><Pill color={pc[p.status] || 'gray'}>{p.status}</Pill></Td>
                  <Td last>
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </section>
  )
}

/* ── Skeleton ────────────────────────────────────────── */
function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ ...card(), padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 2, height: 14, borderRadius: 6, background: 'rgba(3,98,76,0.25)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ flex: 1, height: 14, borderRadius: 6, background: 'rgba(3,98,76,0.18)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ width: 60, height: 14, borderRadius: 6, background: 'rgba(3,98,76,0.15)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  )
}

/* ── Error banner ────────────────────────────────────── */
function ErrorBanner({ msg, onDismiss, onSignInGitHub }) {
  const isIdentityConflict = msg?.includes('already linked')
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)',
            borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#FCA5A5',
          }}
        >
          <span style={{ flex: 1, minWidth: 200 }}>{msg}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isIdentityConflict && (
              <button
                onClick={onSignInGitHub}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8, border: 'none',
                  background: 'rgba(248,113,113,0.15)', color: '#FCA5A5',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <GhIcon size={13} color="#FCA5A5" />
                Sign in with GitHub instead
              </button>
            )}
            <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Page ────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser]             = useState(null)
  const [repos, setRepos]           = useState([])
  const [projects, setProjects]     = useState([])
  const [syncing, setSyncing]       = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [hasGitHub, setHasGitHub]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const checkGitHub = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUserIdentities()
      const linked = data?.identities?.some(id => id.provider === 'github') ?? false
      setHasGitHub(linked)
      return linked
    } catch { return false }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [uR, rR, pR] = await Promise.all([api.get('/api/me'), api.get('/api/repos'), api.get('/api/projects')])
      setUser(uR.data); setRepos(rR.data); setProjects(pR.data)
      await checkGitHub()
    } catch { setError('Failed to load data. Please try again.') }
    finally { setLoading(false) }
  }, [checkGitHub])

  useEffect(() => { fetchData() }, [fetchData])

  // Parse error params Supabase puts in the URL after a failed OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('error_code')
    if (code === 'identity_already_exists') {
      setError(
        'That GitHub account is already linked to a different login. ' +
        'Sign out and sign in with GitHub directly — then you can connect Google from there.'
      )
    } else if (code) {
      setError(params.get('error_description')?.replace(/\+/g, ' ') || 'An auth error occurred.')
    }
    // Clean the URL so the error doesn't persist on refresh
    if (params.get('error')) {
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        const linked = await checkGitHub()
        if (linked) handleSync()
      }
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  const handleSync = async () => {
    setSyncing(true); setError(null)
    try { setRepos((await api.get('/api/repos/sync')).data); setHasGitHub(true) }
    catch { setError('Sync failed. Make sure GitHub is connected.') }
    finally { setSyncing(false) }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const { error: e } = await supabase.auth.linkIdentity({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (e) {
        if (e.message?.includes('already')) {
          setError(
            'That GitHub account is already linked to a different login. ' +
            'Sign out and sign in with GitHub directly — then connect Google from there.'
          )
        } else {
          setError(e.message)
        }
        setConnecting(false)
      }
    } catch (e) { setError(e.message); setConnecting(false) }
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate('/', { replace: true }) }

  const handleSignInGitHub = async () => {
    await supabase.auth.signOut()
    supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/dashboard` } })
  }

  const canSync  = user?.provider === 'github' || hasGitHub
  const needsGH  = user?.provider === 'google' && !hasGitHub

  return (
    <div style={{ minHeight: '100vh', background: C.bg, position: 'relative' }}>
      {/* BG blobs */}
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,223,129,0.07) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(44,194,149,0.05) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar user={user} onSignOut={handleSignOut} />

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ErrorBanner msg={error} onDismiss={() => setError(null)} onSignInGitHub={handleSignInGitHub} />

          {/* Profile */}
          {loading ? (
            <div style={{ ...card(), padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(3,98,76,0.3)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ width: 120, height: 14, borderRadius: 6, background: 'rgba(3,98,76,0.3)' }} />
                <div style={{ width: 200, height: 11, borderRadius: 6, background: 'rgba(3,98,76,0.2)' }} />
              </div>
            </div>
          ) : user ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <ProfileCard user={user} />
            </motion.div>
          ) : null}

          {/* Connect GitHub */}
          {!loading && needsGH && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ConnectBanner onConnect={handleConnect} loading={connecting} />
            </motion.div>
          )}

          {/* Stats */}
          {!loading && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }} className="stats-grid-4">
              {[
                { label: 'Repos',   value: canSync ? repos.length : '—' },
                { label: 'Stars',   value: canSync ? repos.reduce((s, r) => s + r.stars, 0) : '—' },
                { label: 'Public',  value: canSync ? repos.filter(r => !r.is_private).length : '—' },
                { label: 'Private', value: canSync ? repos.filter(r => r.is_private).length : '—' },
              ].map((s, i) => (
                <div key={s.label} style={{ ...card(), padding: '16px 20px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>{s.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Repos */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ReposSection repos={repos} onSync={handleSync} syncing={syncing} canSync={canSync} loading={loading} />
          </motion.div>

          {/* Projects */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <ProjectsSection projects={projects} loading={loading} />
          </motion.div>
        </main>
      </div>

      {/* Responsive stats grid */}
      <style>{`
        @media (max-width: 640px) {
          .stats-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (min-width: 641px) {
          .nav-username { display: inline !important; }
        }
        @keyframes pulse {
          0%,100% { opacity:1; } 50% { opacity:0.5; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}

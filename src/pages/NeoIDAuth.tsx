import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Typography, Button } from '@mui/material'
import { apiClient } from '../api/client'

const API_URL = import.meta.env.VITE_API_URL || ''

function storeTokens(token: string, refreshToken: string, user: any) {
  localStorage.setItem('token', token)
  localStorage.setItem('refreshToken', refreshToken)
  if (user?.email) localStorage.setItem('userEmail', user.email)
  if (user?.name) localStorage.setItem('userName', user.name)
  if (user?.avatar) localStorage.setItem('userAvatar', user.avatar)
  localStorage.setItem('acceptedTerms', 'true')
  const exp = new Date()
  exp.setDate(exp.getDate() + 30)
  document.cookie = `token=${token}; path=/; expires=${exp.toUTCString()}; SameSite=Lax`
  document.cookie = `refreshToken=${refreshToken}; path=/; expires=${exp.toUTCString()}; SameSite=Lax`
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  window.dispatchEvent(new Event('auth-changed'))
}

async function exchangeToken(neoToken: string, neoRefresh: string): Promise<void> {
  try {
    const resp = await apiClient.post(`${API_URL}/api/v1/auth/neo-id/callback`, { token: neoToken })
    const data = resp.data?.data || resp.data
    storeTokens(data.token, data.refreshToken, data.user)
  } catch {
    // Fallback: use Neo ID token directly if API not configured
    storeTokens(neoToken, neoRefresh || neoToken, null)
  }
}

export const NeoIDAuth = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'opening' | 'waiting' | 'error'>('idle')
  const [error, setError] = useState('')
  const popupRef = useRef<Window | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Handle postMessage from popup
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (e.data?.type !== 'neo_id_auth') return
      const { access_token, refresh_token } = e.data
      if (!access_token) { setError('No token received'); setStatus('error'); return }
      await exchangeToken(access_token, refresh_token || '')
      navigate('/', { replace: true })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate])

  // Handle pending token (popup was blocked → user came back via redirect)
  useEffect(() => {
    const pending = localStorage.getItem('neo_id_pending_token')
    const pendingRefresh = localStorage.getItem('neo_id_pending_refresh')
    if (pending) {
      localStorage.removeItem('neo_id_pending_token')
      localStorage.removeItem('neo_id_pending_refresh')
      exchangeToken(pending, pendingRefresh || '').then(() => navigate('/', { replace: true }))
    }
  }, [navigate])

  // Handle token in URL hash (redirect flow fallback)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.slice(1))
    const token = params.get('access_token') || params.get('token')
    const refresh = params.get('refresh_token') || ''
    if (token) {
      window.history.replaceState({}, '', window.location.pathname)
      exchangeToken(token, refresh).then(() => navigate('/', { replace: true }))
    }
  }, [navigate])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const openPopup = async () => {
    setStatus('opening')
    setError('')
    try {
      const state = Math.random().toString(36).slice(2)
      localStorage.setItem('neo_id_state', state)
      const callbackURL = `${window.location.origin}/auth/neo-id/callback`

      let loginURL = ''
      try {
        const resp = await apiClient.post(`${API_URL}/api/v1/auth/neo-id/login`, {
          redirect_url: callbackURL, state, popup: true,
        })
        loginURL = resp.data?.login_url || resp.data?.data?.login_url || ''
      } catch {
        const neoIDBase = (import.meta.env.VITE_NEO_ID_URL || 'https://id.neomovies.ru').replace(/\/$/, '')
        const apiKey = import.meta.env.VITE_NEO_ID_API_KEY || ''
        if (!apiKey) { setError('NEO_ID_API_KEY not configured'); setStatus('error'); return }
        const resp = await fetch(`${neoIDBase}/api/site/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ redirect_url: callbackURL, state, mode: 'popup' }),
        })
        const data = await resp.json()
        const raw = data.login_url || ''
        loginURL = raw.startsWith('/') ? `${neoIDBase}${raw}` : raw
      }

      if (!loginURL) { setError('Failed to get login URL'); setStatus('error'); return }

      const w = 480, h = 640
      const left = window.screenX + (window.outerWidth - w) / 2
      const top = window.screenY + (window.outerHeight - h) / 2
      const popup = window.open(loginURL, 'neo_id_auth',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`)

      if (!popup) {
        // Popup blocked — fallback to redirect
        window.location.href = loginURL
        return
      }

      popupRef.current = popup
      setStatus('waiting')

      timerRef.current = setInterval(() => {
        if (popup.closed) {
          clearInterval(timerRef.current!)
          setStatus((s) => s === 'waiting' ? 'idle' : s)
        }
      }, 500)
    } catch (err: any) {
      setError(err?.message || 'Failed to open Neo ID')
      setStatus('error')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ textAlign: 'center', maxWidth: 360, px: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#fff' }}>
          Neo<span style={{ color: '#e53935' }}>Movies</span>
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', mb: 4 }}>
          Sign in with your Neo ID account
        </Typography>

        {status === 'waiting' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={32} sx={{ color: '#e53935' }} />
            <Typography variant="body2" sx={{ color: '#888' }}>
              Complete sign in in the popup window
            </Typography>
            <Button variant="text" size="small" onClick={() => popupRef.current?.focus()} sx={{ color: '#666', fontSize: '0.75rem' }}>
              Click here if the window is hidden
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {error && (
              <Typography variant="body2" sx={{ color: '#e53935', mb: 1 }}>{error}</Typography>
            )}
            <Button
              variant="contained"
              fullWidth
              disabled={status === 'opening'}
              onClick={openPopup}
              sx={{ bgcolor: '#e53935', '&:hover': { bgcolor: '#c62828' }, height: 44, fontWeight: 600 }}
            >
              {status === 'opening'
                ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                : 'Sign in with Neo ID'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}

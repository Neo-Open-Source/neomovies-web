import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Typography, Button } from '@mui/material'
import { apiClient, setAuthTokens } from '../api/client'

const NEO_ID_URL = (import.meta.env.VITE_NEO_ID_URL || 'https://id.neomovies.ru').replace(/\/$/, '')
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1$/, '')

function storeTokens(token: string, refreshToken: string, user: any) {
  setAuthTokens(token, refreshToken)
  if (user?.email) localStorage.setItem('userEmail', user.email)
  if (user?.name) localStorage.setItem('userName', user.name)
  if (user?.avatar) localStorage.setItem('userAvatar', user.avatar)
  localStorage.setItem('acceptedTerms', 'true')
  window.dispatchEvent(new Event('auth-changed'))
}

async function exchangeNeoToken(neoToken: string, neoRefresh: string): Promise<void> {
  const resp = await apiClient.post(`${API_URL}/api/v1/auth/neo-id/callback`, {
    token: neoToken,
    refresh_token: neoRefresh || '',
  })
  const data = resp.data?.data || resp.data
  if (data.neoAccess) localStorage.setItem('neo_id_access_token', data.neoAccess)
  if (data.neoRefresh) localStorage.setItem('neo_id_refresh_token', data.neoRefresh)
  storeTokens(data.token, data.refreshToken, data.user)
}

export const NeoIDAuth = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'opening' | 'waiting' | 'error'>('idle')
  const [error, setError] = useState('')
  const popupRef = useRef<Window | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // If already logged in — go home
  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/', { replace: true })
  }, [])

  // Handle postMessage from popup
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (e.data?.type !== 'neo_id_auth') return
      const { access_token, refresh_token } = e.data
      if (!access_token) { setError('No token received'); setStatus('error'); return }
      try {
        setStatus('idle')
        await exchangeNeoToken(access_token, refresh_token || '')
        navigate('/', { replace: true })
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Failed to complete Neo ID sign in')
        setStatus('error')
      }
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
      exchangeNeoToken(pending, pendingRefresh || '')
        .then(() => navigate('/', { replace: true }))
        .catch((err: any) => {
          setError(err?.response?.data?.error || err?.message || 'Failed to complete Neo ID sign in')
          setStatus('error')
        })
    }
  }, [navigate])

  // Handle token in URL hash (redirect flow)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.slice(1))
    const token = params.get('access_token') || params.get('token')
    const refresh = params.get('refresh_token') || ''
    if (token) {
      window.history.replaceState({}, '', window.location.pathname)
      exchangeNeoToken(token, refresh)
        .then(() => navigate('/', { replace: true }))
        .catch((err: any) => {
          setError(err?.response?.data?.error || err?.message || 'Failed to complete Neo ID sign in')
          setStatus('error')
        })
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

      // Get login URL via neomovies-api backend (keeps API key server-side)
      const resp = await apiClient.post(`${API_URL}/api/v1/auth/neo-id/login`, {
        redirect_url: callbackURL,
        state,
        popup: true,
      })
      const data = resp.data?.data || resp.data
      const rawURL: string = data.login_url || ''
      if (!rawURL) throw new Error('No login_url returned')

      const loginURL = rawURL.startsWith('/') ? `${NEO_ID_URL}${rawURL}` : rawURL

      const finalURL = loginURL

      // Open popup
      const w = 480, h = 640
      const left = window.screenX + (window.outerWidth - w) / 2
      const top = window.screenY + (window.outerHeight - h) / 2
      const popup = window.open(
        finalURL, 'neo_id_auth',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      )

      if (!popup) {
        window.location.href = finalURL
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
            <Button
              variant="text" size="small"
              onClick={() => popupRef.current?.focus()}
              sx={{ color: '#666', fontSize: '0.75rem' }}
            >
              Click here if the window is hidden
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {error && (
              <Typography variant="body2" sx={{ color: '#e53935', mb: 1, fontSize: '0.8rem' }}>
                {error}
              </Typography>
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

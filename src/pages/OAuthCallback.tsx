import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'

export const OAuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const provider = searchParams.get('provider')

    if (!token || !provider) {
      navigate('/auth', { replace: true })
      return
    }

    try {
      // decode payload for optional info
      const [, payloadPart] = token.split('.')
      if (payloadPart) {
        const payload = JSON.parse(atob(payloadPart))
        localStorage.setItem('userEmail', payload.email || `${provider}_user`)
        localStorage.setItem('userName', payload.name || payload.email?.split('@')[0] || provider)
      }
    } catch {
      /* ignore decode errors */
    }

    // store tokens
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', token)

    // also cookie for SSR cross-tab
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    document.cookie = `token=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
    document.cookie = `refreshToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`

    // notify listeners
    window.dispatchEvent(new Event('auth-changed'))

    // mark terms accepted automatically for registered users
    localStorage.setItem('acceptedTerms', 'true')

    navigate('/', { replace: true })
  }, [navigate, searchParams])

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  )
}

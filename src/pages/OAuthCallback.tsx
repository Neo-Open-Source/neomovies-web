import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { apiClient } from '../api'

export const OAuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get('token')
      const provider = searchParams.get('provider')

      if (!token || !provider) {
        navigate('/auth', { replace: true })
        return
      }

      try {
        // store token
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', token)

        // set auth header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`

        // fetch user profile from API
        const response = await apiClient.get('/api/v1/auth/profile')
        const user = response.data

        // store user info
        if (user?.email) localStorage.setItem('userEmail', user.email)
        if (user?.name) localStorage.setItem('userName', user.name)

        // also cookie for cross-tab (30 days)
        const expires = new Date()
        expires.setDate(expires.getDate() + 30)
        document.cookie = `token=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax; Secure`
        document.cookie = `refreshToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax; Secure`

        // mark terms accepted automatically for registered users
        localStorage.setItem('acceptedTerms', 'true')

        // notify listeners
        window.dispatchEvent(new Event('auth-changed'))
      } catch (error) {
        // if profile fetch fails, still proceed with token
        localStorage.setItem('acceptedTerms', 'true')
        window.dispatchEvent(new Event('auth-changed'))
      } finally {
        navigate('/', { replace: true })
      }
    }

    run()
  }, [navigate, searchParams])

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Container,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material'

export const NeoIDAuth = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Обработка callback от Neo ID
  useEffect(() => {
    const token = searchParams.get('token')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(`Ошибка авторизации: ${errorParam}`)
      return
    }

    if (token) {
      handleNeoIDCallback(token)
    }
  }, [searchParams])

  const handleNeoIDCallback = async (token: string) => {
    try {
      setLoading(true)
      
      // Декодируем JWT для получения информации о пользователе
      const parts = token.split('.')
      const payload = JSON.parse(atob(parts[1]))
      
      // Сохраняем токен
      localStorage.setItem('token', token)
      localStorage.setItem('userEmail', payload.email || 'neo_id_user')
      localStorage.setItem('userName', payload.name || payload.email?.split('@')[0] || 'Neo ID User')
      
      // Сохраняем в cookies
      const expiresIn = new Date()
      expiresIn.setDate(expiresIn.getDate() + 7)
      document.cookie = `token=${token}; path=/; expires=${expiresIn.toUTCString()}; SameSite=Lax`
      
      // Dispatch auth event
      window.dispatchEvent(new Event('auth-changed'))
      
      navigate('/')
    } catch (err) {
      setError('Ошибка при обработке авторизации Neo ID')
    } finally {
      setLoading(false)
    }
  }

  const loginWithNeoID = (provider: 'google' | 'github') => {
    const neoIdBaseUrl = import.meta.env.VITE_NEO_ID_URL || 'https://neo-id.vercel.app'
    const redirectUrl = `${window.location.origin}/auth/callback`
    const state = Math.random().toString(36).slice(2)
    
    const loginUrl = `${neoIdBaseUrl}/api/auth/login?provider=${provider}&redirect_url=${encodeURIComponent(redirectUrl)}&state=${state}`
    window.location.href = loginUrl
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#121212', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Box sx={{ py: { xs: 4, sm: 8 } }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  textAlign: 'center', 
                  mb: 3,
                  color: '#fff',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                }}
              >
                <span style={{ color: '#fff' }}>Neo</span><span style={{ color: '#ff0000' }}>Movies</span>
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: '#ccc' }}>
                Войдите через Neo ID — единый сервис авторизации
              </Typography>

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mb: 2,
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                  py: 1.2,
                }}
                onClick={() => loginWithNeoID('google')}
                disabled={loading}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                  <Box
                    component="img"
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%23ffffff' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23ffffff' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23ffffff' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E"
                    sx={{ width: 20, height: 20 }}
                    alt="Google"
                  />
                  Войти через Google
                </Box>
              </Button>

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mb: 2,
                  backgroundColor: '#333',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#555',
                  },
                  py: 1.2,
                }}
                onClick={() => loginWithNeoID('github')}
                disabled={loading}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                  <Box
                    component="img"
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/%3E%3C/svg%3E"
                    sx={{ width: 20, height: 20 }}
                    alt="GitHub"
                  />
                  Войти через GitHub
                </Box>
              </Button>

              <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: '#666' }}>
                Neo ID обеспечивает безопасную авторизацию для всех сервисов Neo
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}

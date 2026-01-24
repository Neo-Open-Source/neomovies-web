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
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  const neoIdBaseUrl = import.meta.env.VITE_NEO_ID_URL || 'https://id.neomovies.ru'
  const neoIdApiKey = import.meta.env.VITE_NEO_ID_API_KEY || ''

  // Обработка callback от Neo ID
  useEffect(() => {
    const token = searchParams.get('token')
    const errorParam = searchParams.get('error')
    const stateParam = searchParams.get('state')

    if (errorParam) {
      setError(`Ошибка авторизации: ${errorParam}`)
      return
    }

    if (token) {
      handleNeoIDCallback(token, stateParam)
      return
    }

    // Если токена нет — сразу редиректим на страницу логина Neo ID,
    // где пользователь выберет провайдера (Google/GitHub/и т.д.)
    void (async () => {
      try {
        if (!neoIdApiKey) {
          setError('Не настроен ключ интеграции Neo ID (VITE_NEO_ID_API_KEY)')
          return
        }

        const callbackUrl = `${window.location.origin}/auth/callback`
        const state = Math.random().toString(36).slice(2)
        localStorage.setItem('neo_id_state', state)

        setLoading(true)

        const resp = await fetch(`${neoIdBaseUrl}/api/site/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': neoIdApiKey,
          },
          body: JSON.stringify({
            redirect_url: callbackUrl,
            state,
          }),
        })

        if (!resp.ok) {
          const text = await resp.text()
          throw new Error(text || `HTTP ${resp.status}`)
        }

        const data = await resp.json()
        const rawLoginUrl = data.login_url
        if (!rawLoginUrl) {
          throw new Error('Neo ID не вернул login_url')
        }

        const base = neoIdBaseUrl.replace(/\/$/, '')
        const loginUrl = rawLoginUrl.startsWith('/') ? `${base}${rawLoginUrl}` : rawLoginUrl

        setRedirectUrl(loginUrl)
        window.location.replace(loginUrl)
      } catch (e: any) {
        setLoading(false)
        setError(e?.message || 'Ошибка при запросе ссылки входа Neo ID')
      }
    })()
  }, [searchParams])

  const handleNeoIDCallback = async (token: string, stateParam: string | null) => {
    try {
      setLoading(true)

      const savedState = localStorage.getItem('neo_id_state')
      if (savedState && stateParam && savedState !== stateParam) {
        setError('Ошибка авторизации: некорректный state')
        return
      }
      
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

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography sx={{ color: '#ccc' }}>Перенаправляем в Neo ID…</Typography>
          {redirectUrl ? (
            <Button variant="outlined" onClick={() => window.location.assign(redirectUrl)}>
              Открыть Neo ID вручную
            </Button>
          ) : null}
        </Box>
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
                Нажмите кнопку, чтобы открыть Neo ID и войти в аккаунт
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
                onClick={() => {
                  window.location.assign('/auth')
                }}
              >
                Открыть Neo ID
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

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material'
import { apiClient } from '../api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export const Auth = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)

  // Обработка OAuth callback
  useEffect(() => {
    const token = searchParams.get('token')
    const provider = searchParams.get('provider')

    if (token && provider) {
      handleOAuthCallback(token, provider)
    }
  }, [searchParams])

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  // Register state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })

  // Verification state
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')

  const handleOAuthCallback = async (token: string, provider: string) => {
    try {
      setLoading(true)
      
      // Декодируем JWT для получения информации о пользователе
      const parts = token.split('.')
      const payload = JSON.parse(atob(parts[1]))
      
      // Сохраняем токены
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', token)
      localStorage.setItem('userEmail', payload.email || `${provider}_user`)
      localStorage.setItem('userName', payload.name || payload.email?.split('@')[0] || provider)
      
      // Сохраняем в cookies
      const expiresIn = new Date()
      expiresIn.setDate(expiresIn.getDate() + 7)
      document.cookie = `token=${token}; path=/; expires=${expiresIn.toUTCString()}; SameSite=Lax`
      document.cookie = `refreshToken=${token}; path=/; expires=${expiresIn.toUTCString()}; SameSite=Lax`
      
      // Dispatch auth event
      window.dispatchEvent(new Event('auth-changed'))
      
      navigate('/')
    } catch (err) {
      setError('Ошибка при обработке OAuth callback')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        email: loginData.email,
        password: loginData.password,
      })

      const { token, refreshToken, user } = response.data
      
      // Сохраняем токены в localStorage и cookies
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('userEmail', loginData.email)
      localStorage.setItem('userName', user?.name || loginData.email.split('@')[0])
      
      // Сохраняем токен в cookies
      const expiresIn = new Date()
      expiresIn.setDate(expiresIn.getDate() + 7)
      document.cookie = `token=${token}; path=/; expires=${expiresIn.toUTCString()}; SameSite=Lax`
      document.cookie = `refreshToken=${refreshToken}; path=/; expires=${expiresIn.toUTCString()}; SameSite=Lax`

      // Dispatch auth event for other components
      window.dispatchEvent(new Event('auth-changed'))
      
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    try {
      await apiClient.post('/api/v1/auth/register', {
        email: registerData.email,
        password: registerData.password,
        name: registerData.name,
      })

      setSuccess('Проверьте вашу почту для подтверждения')
      setVerificationEmail(registerData.email)
      setVerificationSent(true)
      setRegisterData({ email: '', password: '', confirmPassword: '', name: '' })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await apiClient.post('/api/v1/auth/verify-email', {
        email: verificationEmail,
        code: verificationCode,
      })

      setSuccess('Email подтвержден! Теперь вы можете войти')
      setVerificationSent(false)
      setVerificationCode('')
      setTabValue(0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка подтверждения')
    } finally {
      setLoading(false)
    }
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
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {verificationSent ? (
              <Box component="form" onSubmit={handleVerifyEmail}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Код подтверждения отправлен на {verificationEmail}
                </Typography>
                <TextField
                  fullWidth
                  label="Код подтверждения"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  margin="normal"
                  disabled={loading}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Подтвердить'}
                </Button>
              </Box>
            ) : (
              <>
                <Tabs
                  value={tabValue}
                  onChange={(_, newValue) => setTabValue(newValue)}
                  aria-label="auth tabs"
                  sx={{ mb: 2 }}
                >
                  <Tab label="Вход" id="auth-tab-0" aria-controls="auth-tabpanel-0" />
                  <Tab label="Регистрация" id="auth-tab-1" aria-controls="auth-tabpanel-1" />
                </Tabs>

                {/* Login Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Box component="form" onSubmit={handleLogin}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      margin="normal"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': { borderColor: '#333' },
                          '&:hover fieldset': { borderColor: '#555' },
                          '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                        },
                        '& .MuiInputLabel-root': { color: '#999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Пароль"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      margin="normal"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': { borderColor: '#333' },
                          '&:hover fieldset': { borderColor: '#555' },
                          '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                        },
                        '& .MuiInputLabel-root': { color: '#999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
                      }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Войти'}
                    </Button>
                    
                    <Box sx={{ position: 'relative', my: 2 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: '1px',
                          backgroundColor: '#333',
                        }}
                      />
                      <Typography
                        sx={{
                          position: 'relative',
                          textAlign: 'center',
                          backgroundColor: '#1a1a1a',
                          display: 'inline-block',
                          width: '100%',
                          color: '#999',
                          fontSize: '0.85rem',
                        }}
                      >
                        или
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        mt: 2,
                        mb: 2,
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                        py: 1.2,
                      }}
                      onClick={() => {
                        // Google OAuth implementation
                        window.location.href = `${import.meta.env.VITE_API_URL || 'https://api.neomovies.ru'}/api/v1/auth/google/login`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <Box
                          component="img"
                          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%23ffffff' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23ffffff' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23ffffff' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E"
                          sx={{ width: 20, height: 20 }}
                          alt="Google"
                        />
                        Продолжить с Google
                      </Box>
                    </Button>
                  </Box>
                </TabPanel>

                {/* Register Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Box component="form" onSubmit={handleRegister}>
                    <TextField
                      fullWidth
                      label="Имя"
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      margin="normal"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': { borderColor: '#333' },
                          '&:hover fieldset': { borderColor: '#555' },
                          '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                        },
                        '& .MuiInputLabel-root': { color: '#999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      margin="normal"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': { borderColor: '#333' },
                          '&:hover fieldset': { borderColor: '#555' },
                          '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                        },
                        '& .MuiInputLabel-root': { color: '#999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Пароль"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      margin="normal"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': { borderColor: '#333' },
                          '&:hover fieldset': { borderColor: '#555' },
                          '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                        },
                        '& .MuiInputLabel-root': { color: '#999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Подтвердите пароль"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      margin="normal"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': { borderColor: '#333' },
                          '&:hover fieldset': { borderColor: '#555' },
                          '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                        },
                        '& .MuiInputLabel-root': { color: '#999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
                      }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
                    </Button>
                    
                    <Box sx={{ position: 'relative', my: 2 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: '1px',
                          backgroundColor: '#333',
                        }}
                      />
                      <Typography
                        sx={{
                          position: 'relative',
                          textAlign: 'center',
                          backgroundColor: '#1a1a1a',
                          display: 'inline-block',
                          width: '100%',
                          color: '#999',
                          fontSize: '0.85rem',
                        }}
                      >
                        или
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        mt: 2,
                        mb: 2,
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                        py: 1.2,
                      }}
                      onClick={() => {
                        // Google OAuth implementation
                        window.location.href = `${import.meta.env.VITE_API_URL || 'https://api.neomovies.ru'}/api/v1/auth/google/login`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <Box
                          component="img"
                          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%23ffffff' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23ffffff' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23ffffff' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E"
                          sx={{ width: 20, height: 20 }}
                          alt="Google"
                        />
                        Продолжить с Google
                      </Box>
                    </Button>
                  </Box>
                </TabPanel>
              </>
            )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}

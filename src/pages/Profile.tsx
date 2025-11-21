import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material'
import { apiClient } from '../api'

export const Profile = () => {
  const navigate = useNavigate()
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const email = localStorage.getItem('userEmail')
    const name = localStorage.getItem('userName')

    if (!token) {
      navigate('/auth')
      return
    }

    setUserEmail(email || '')
    setUserName(name || email?.split('@')[0] || '')
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    navigate('/')
    window.location.reload()
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    setError('')

    try {
      await apiClient.delete('/api/v1/auth/account')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      navigate('/')
      window.location.reload()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при удалении аккаунта')
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: { xs: 4, sm: 8 } }}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#1976d2',
                  fontSize: '2rem',
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" component="h1" gutterBottom>
                {userName}
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Card variant="outlined" sx={{ mb: 3, backgroundColor: '#0a0a0a' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Email
                    </Typography>
                    <Typography variant="body1">{userEmail}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Имя пользователя
                    </Typography>
                    <Typography variant="body1">{userName}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleLogout}
                disabled={loading}
              >
                Выход
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                Удалить аккаунт
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#fff',
          },
        }}
      >
        <DialogTitle>Удалить аккаунт?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#ccc' }}>
            Это действие необратимо. Все ваши данные будут удалены.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Отмена
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

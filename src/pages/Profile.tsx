import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Card, CardContent, Typography, Button,
  Avatar, Stack, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Alert, Skeleton, Chip
} from '@mui/material'
import { apiClient } from '../api'
import { clearAuthState } from '../api/client'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  neo_id?: string
  is_admin?: boolean
  created_at?: string
}

export const Profile = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/auth'); return }
    loadProfile()
  }, [navigate])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const resp = await apiClient.get('/api/v1/auth/profile')
      const user = resp.data
      setProfile(user)
      if (user.name) localStorage.setItem('userName', user.name)
      if (user.email) localStorage.setItem('userEmail', user.email)
      if (user.avatar) localStorage.setItem('userAvatar', user.avatar)
    } catch {
      setProfile({
        id: '',
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        avatar: localStorage.getItem('userAvatar') || '',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthState()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setError('')
    try {
      await apiClient.delete('/api/v1/auth/delete-account')
      handleLogout()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || '?'

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: { xs: 3, sm: 6 } }}>
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>

            {/* Avatar + name */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {loading ? (
                <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
              ) : (
                <Avatar
                  src={profile?.avatar || ''}
                  imgProps={{ referrerPolicy: 'no-referrer' }}
                  sx={{ width: 80, height: 80, bgcolor: '#1976d2', fontSize: '1.75rem', mx: 'auto', mb: 2 }}
                >
                  {!profile?.avatar && initials}
                </Avatar>
              )}
              {loading ? (
                <Skeleton width={160} height={28} sx={{ mx: 'auto' }} />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {profile?.name || profile?.email?.split('@')[0]}
                </Typography>
              )}
              <Chip
                label="via Neo ID"
                size="small"
                sx={{ mt: 0.75, fontSize: '0.7rem', height: 20, bgcolor: '#1a1a1a', border: '1px solid #333' }}
              />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Info */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: '#0d0d0d', border: '1px solid #222' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                      Email
                    </Typography>
                    {loading ? <Skeleton width={200} /> : (
                      <Typography variant="body2" sx={{ mt: 0.25 }}>{profile?.email || '—'}</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                      Name
                    </Typography>
                    {loading ? <Skeleton width={140} /> : (
                      <Typography variant="body2" sx={{ mt: 0.25 }}>{profile?.name || '—'}</Typography>
                    )}
                  </Box>
                  {profile?.neo_id && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                        Neo ID
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25, fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                        {profile.neo_id}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Stack spacing={1.5}>
              <Button fullWidth variant="outlined" onClick={handleLogout}>
                Sign out
              </Button>
              <Button fullWidth variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)}>
                Delete account
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { bgcolor: '#1a1a1a' } }}>
        <DialogTitle>Delete account?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#aaa' }}>
            This is permanent. All your data including favorites will be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

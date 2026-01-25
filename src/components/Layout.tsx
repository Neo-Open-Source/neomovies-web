import { useState, useEffect, useRef } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  Container,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Menu,
  MenuItem,
  Paper,
  CircularProgress,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import { useNavigate } from 'react-router-dom'
import { getImageUrl, moviesAPI } from '../api'
import { filterValidMovies } from '../utils/filterMovies'
import type { Movie } from '../types'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRequestIdRef = useRef(0)
  const searchCommittedRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const email = localStorage.getItem('userEmail')
    const name = localStorage.getItem('userName')
    
    if (token && email) {
      setUserEmail(email)
      setUserName(name || email.split('@')[0])
    }
  }, [])

  const handleSearchInput = async (value: string) => {
    searchCommittedRef.current = false
    setSearchQuery(value)

    if (value.length >= 3) {
      setSearchLoading(true)
      const requestId = ++searchRequestIdRef.current
      try {
        const res = await moviesAPI.searchMovies(value, 1)
        if (requestId !== searchRequestIdRef.current || searchCommittedRef.current) {
          return
        }
        const allResults = res.data.results || []
        const validMovies = filterValidMovies(allResults).slice(0, 5)
        setSearchResults(validMovies)
        setShowSearchResults(true)
      } catch (error) {
        console.error('Search error:', error)
        if (requestId !== searchRequestIdRef.current || searchCommittedRef.current) {
          return
        }
        setSearchResults([])
      } finally {
        if (requestId === searchRequestIdRef.current && !searchCommittedRef.current) {
          setSearchLoading(false)
        }
      }
    } else {
      setShowSearchResults(false)
      setSearchResults([])
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchCommittedRef.current = true
      searchRequestIdRef.current++
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setShowSearchResults(false)
      setSearchResults([])
    }
  }

  const handleSelectMovie = (movie: Movie) => {
    const id = movie.kinopoisk_id ? `kp_${movie.kinopoisk_id}` : movie.id
    searchCommittedRef.current = true
    searchRequestIdRef.current++
    navigate(`/movie/${id}`)
    setSearchQuery('')
    setShowSearchResults(false)
    setSearchResults([])
  }

  const getSearchPosterUrl = (movie: Movie) => {
    const raw = movie.posterUrlPreview || movie.poster_path || ''
    const optimized = typeof raw === 'string' ? raw.replace('/kp_big/', '/kp_small/') : raw
    return getImageUrl(optimized)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header */}
      <AppBar position="sticky" elevation={0} sx={{ backgroundColor: '#0f0f10', borderBottom: '1px solid #222' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 0.5, px: { xs: 1, sm: 2 }, gap: 1, minHeight: 'auto' }}>
          {/* Logo */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              cursor: 'pointer',
              fontSize: { xs: '1rem', sm: '1.3rem' },
              fontWeight: 700,
              letterSpacing: '0em',
              color: '#fff',
              transition: 'opacity 0.2s',
              fontFamily: '"Inter", sans-serif',
              flexShrink: 0,
              '&:hover': {
                opacity: 0.8,
              },
              '& .neo-text': {
                color: '#fff',
              },
              '& .movies-text': {
                color: '#ff0000',
              },
            }}
          >
            <span className="neo-text">Neo</span><span className="movies-text">Movies</span>
          </Box>

          {/* Search Bar - Center */}
          <Box component="form" onSubmit={handleSearch} sx={{ position: 'relative', flex: 1, mx: { xs: 1, sm: 2 }, minWidth: 0, maxWidth: 450 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '10px',
                  fontSize: { xs: '0.8rem', sm: '0.95rem' },
                  height: 38,
                  '& fieldset': {
                    borderColor: '#333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#555',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#666', mr: 0.5, fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderTop: 'none',
                  borderRadius: '0 0 10px 10px',
                  maxHeight: 300,
                  overflowY: 'auto',
                  zIndex: 1000,
                }}
              >
                {searchLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : searchResults.length > 0 ? (
                  searchResults.map((movie) => {
                    const rating = (movie as any).rating || movie.vote_average || movie.ratingKinopoisk || 0
                    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : movie.year
                    return (
                      <Box
                        key={movie.id}
                        onClick={() => handleSelectMovie(movie)}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          p: 1.5,
                          borderBottom: '1px solid #222',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#222',
                          },
                          '&:last-child': {
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={getSearchPosterUrl(movie)}
                          alt={movie.title}
                          loading="lazy"
                          decoding="async"
                          sx={{
                            width: 45,
                            height: 65,
                            objectFit: 'cover',
                            borderRadius: '2px',
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Box sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {movie.title || movie.nameRu || movie.nameOriginal}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                            <Box sx={{ color: '#999', fontSize: '0.75rem' }}>
                              {year}
                            </Box>
                            {rating > 0 && (
                              <Box sx={{ color: '#ffd700', fontSize: '0.75rem', fontWeight: 500 }}>
                                ★ {rating.toFixed(1)}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )
                  })
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
                    Ничего не найдено
                  </Box>
                )}
              </Paper>
            )}
          </Box>

          {/* Right Actions */}
          {userName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <Button
                onClick={(e: any) => setAnchorEl(e.currentTarget)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: '#fff',
                  textTransform: 'none',
                  fontSize: { xs: '0.7rem', sm: '0.85rem' },
                  p: 0.3,
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <PersonIcon
                  sx={{
                    width: { xs: 24, sm: 28 },
                    height: { xs: 24, sm: 28 },
                    color: '#1976d2',
                  }}
                />
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{userName}</Box>
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                sx={{
                  '& .MuiPaper-root': {
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    minWidth: 200,
                  },
                }}
              >
                <MenuItem disabled sx={{ color: '#999' }}>
                  {userEmail}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    navigate('/profile')
                    setAnchorEl(null)
                  }}
                >
                  Профиль
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('refreshToken')
                    localStorage.removeItem('userEmail')
                    localStorage.removeItem('userName')
                    setUserName(null)
                    setUserEmail(null)
                    setAnchorEl(null)
                    navigate('/')
                  }}
                  sx={{ color: '#ff6b6b' }}
                >
                  Выход
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/auth')}
              sx={{
                backgroundColor: '#1976d2',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: { xs: '0.7rem', sm: '0.85rem' },
                px: { xs: 1, sm: 1.5 },
                py: { xs: 0.3, sm: 0.5 },
                flexShrink: 0,
                '&:hover': { backgroundColor: '#1565c0' },
              }}
            >
              Войти
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Bar */}
      <Box sx={{ backgroundColor: '#0f0f10', borderBottom: '1px solid #222', py: 0.75, overflowX: 'auto' }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={{ xs: 1, sm: 3 }} sx={{ overflowX: 'auto', pb: 0.5 }}>
            <Button
              sx={{
                color: '#999',
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                p: 0,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&:hover': { color: '#fff' },
              }}
              onClick={() => navigate('/')}
            >
              Популярное
            </Button>
            <Button
              sx={{
                color: '#999',
                textTransform: 'none',
                fontSize: { xs: '0.7rem', sm: '0.95rem' },
                p: 0,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&:hover': { color: '#fff' },
              }}
              onClick={() => navigate('/movies-top')}
            >
              Топ Фильмов
            </Button>
            <Button
              sx={{
                color: '#999',
                textTransform: 'none',
                fontSize: { xs: '0.7rem', sm: '0.95rem' },
                p: 0,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&:hover': { color: '#fff' },
              }}
              onClick={() => navigate('/tv-top')}
            >
              Топ Сериалов
            </Button>
            <Button
              sx={{
                color: '#999',
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                p: 0,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&:hover': { color: '#fff' },
              }}
              onClick={() => {
                const token = localStorage.getItem('token')
                if (!token) {
                  navigate('/auth')
                } else {
                  navigate('/favorites')
                }
              }}
            >
              Избранное
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 0 },
          backgroundColor: '#0f0f10',
          minHeight: '100%'
        }}
      >
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  )
}

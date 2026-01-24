import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TermsGuard } from './components/TermsGuard'
import { Home, Search, MovieDetails, MoviesTop, TVTop, NeoIDAuth, Profile, Favorites, Terms } from './pages'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { useEffect } from 'react'
import './App.css'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5b7cfa',
    },
    secondary: {
      main: '#ff4d7d',
    },
    background: {
      default: '#0b0f19',
      paper: 'rgba(255,255,255,0.06)',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 800, letterSpacing: -0.6 },
    h5: { fontWeight: 800, letterSpacing: -0.4 },
    h6: { fontWeight: 750, letterSpacing: -0.2 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(1200px 800px at 20% 10%, rgba(88,101,242,0.18), transparent 60%), radial-gradient(900px 700px at 80% 20%, rgba(25,118,210,0.16), transparent 55%), radial-gradient(900px 700px at 50% 90%, rgba(255,77,125,0.12), transparent 55%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255,255,255,0.10)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(14px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 14,
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.06)',
        },
        notchedOutline: {
          borderColor: 'rgba(255,255,255,0.14)',
        },
      },
    },
  },
})

// Компонент для обработки событий авторизации
function AuthHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthExpired = () => {
      // Очищаем токены
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userName')
      localStorage.removeItem('userEmail')
      
      // Очищаем cookies
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax'
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax'
      
      // Перенаправляем на страницу авторизации
      navigate('/auth')
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [navigate])

  return null
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <TermsGuard>
          <FavoritesProvider>
            <AuthHandler />
            <Routes>
              <Route path="/auth" element={<NeoIDAuth />} />
              <Route path="/auth/callback" element={<NeoIDAuth />} />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/movies-top" element={<MoviesTop />} />
                      <Route path="/tv-top" element={<TVTop />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/movie/:id" element={<MovieDetails />} />
                      <Route path="/tv/:id" element={<MovieDetails />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/favorites" element={<Favorites />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </FavoritesProvider>
        </TermsGuard>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

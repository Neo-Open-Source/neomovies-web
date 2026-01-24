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
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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

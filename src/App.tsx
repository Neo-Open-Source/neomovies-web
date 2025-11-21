import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home, Search, MovieDetails, MoviesTop, TVTop, Auth, Profile, Favorites } from './pages'
import { FavoritesProvider } from './contexts/FavoritesContext'
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FavoritesProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
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
        </BrowserRouter>
      </FavoritesProvider>
    </ThemeProvider>
  )
}

export default App

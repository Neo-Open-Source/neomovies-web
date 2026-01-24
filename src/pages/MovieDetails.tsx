import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Stack,
  Rating,
  Chip,
  IconButton,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { moviesAPI, getImageUrl, playersAPI, favoritesAPI } from '../api'
import { TorrentSelector } from '../components/TorrentSelector'
import type { Movie } from '../types'

export const MovieDetails = () => {
  const { id } = useParams<{ id: string }>()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<'lumex' | 'collaps'>('lumex')
  const [playerUrl, setPlayerUrl] = useState<string | null>(null)
  const [playerHtml, setPlayerHtml] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  // Sync favorite status with cache
  useEffect(() => {
    if (!movie) return

    const checkFavorite = () => {
      const favorite = favoritesAPI.checkIsFavorite(movie.id, 'movie')
      setIsFavorite(favorite)
    }

    checkFavorite()

    const unsubscribe = favoritesAPI.subscribe(() => {
      checkFavorite()
    })

    return () => unsubscribe()
  }, [movie])

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        setLoading(true)
        // Parse kp_ prefix if present
        const movieId = id.startsWith('kp_') ? id : `kp_${id}`
        const res = await moviesAPI.getMovieById(movieId)
        setMovie(res.data)
        
        // Auto-load default player after movie is loaded
        setTimeout(() => {
          loadPlayer(res.data, 'lumex')
        }, 500)
      } catch (error) {
        // silent fail
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const loadPlayer = async (movieData: any, player: 'lumex' | 'collaps') => {
    try {
      const kpId = movieData.externalIds?.kp || movieData.kinopoisk_id || movieData.filmId
      
      if (!kpId) {
        return
      }

      let response = ''
      if (player === 'lumex') {
        const res = await playersAPI.getLumexPlayer('kp', kpId)
        response = res.data
      } else if (player === 'collaps') {
        const res = await playersAPI.getCollapsPlayer('kp', kpId)
        response = res.data
      }

      // Check if response is HTML or URL
      if (response.startsWith('<')) {
        // It's HTML, extract iframe src
        const srcMatch = response.match(/src="([^"]+)"/i)
        if (srcMatch && srcMatch[1]) {
          setPlayerUrl(srcMatch[1])
          setPlayerHtml(null)
        } else {
          // Try to extract from data-src or other attributes
          const dataSrcMatch = response.match(/data-src="([^"]+)"/i)
          if (dataSrcMatch && dataSrcMatch[1]) {
            setPlayerUrl(dataSrcMatch[1])
            setPlayerHtml(null)
          } else {
            // Fallback: use HTML directly
            setPlayerHtml(response)
            setPlayerUrl(null)
          }
        }
      } else if (response && response.trim()) {
        // It's a URL
        setPlayerUrl(response)
        setPlayerHtml(null)
      }
    } catch (error) {
      // silent fail
    }
  }

  const handlePlayerChange = (player: 'lumex' | 'collaps') => {
    if (!movie) return
    setSelectedPlayer(player)
    loadPlayer(movie, player)
  }

  const handleFavoriteClick = async () => {
    if (!isLoggedIn) {
      alert('Пожалуйста, авторизуйтесь, чтобы добавить фильм в избранное')
      return
    }

    if (!movie) return

    try {
      const movieId = typeof movie.id === 'string' ? parseInt(movie.id) : movie.id
      if (isFavorite) {
        await favoritesAPI.removeFromFavorites(movieId, 'movie')
      } else {
        const title = movie.title || movie.nameRu || movie.nameOriginal || movie.name || 'Unknown'
        const posterPath = movie.poster_path || movie.posterUrlPreview || movie.posterUrl
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : movie.year || 0
        await favoritesAPI.addToFavorites(movieId, 'movie', {
          title,
          nameRu: title,
          nameEn: (movie as any).original_title || (movie as any).originalTitle || '',
          posterPath,
          year: typeof year === 'number' ? year : 0,
        })
      }
      // state will update via cache subscription
    } catch (error) {
      alert('Ошибка при обновлении избранного')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!movie) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Фильм не найден</Typography>
      </Box>
    )
  }

  const title = movie.title || movie.nameRu || movie.nameOriginal || 'Unknown'
  const rating = (movie as any).rating || movie.vote_average || movie.ratingKinopoisk || 0
  const posterPath = movie.poster_path || movie.posterUrlPreview || movie.posterUrl
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : movie.year

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr', md: '1fr 3fr' },
          gap: { xs: 2, sm: 4 },
        }}
      >
        {/* Poster */}
        <Box>
          <Box
            component="img"
            src={getImageUrl(posterPath)}
            alt={title}
            sx={{
              width: '100%',
              aspectRatio: '2/3',
              objectFit: 'cover',
            }}
          />
        </Box>

        {/* Info */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
            <IconButton
              onClick={handleFavoriteClick}
              sx={{
                color: isFavorite ? '#ff0000' : '#999',
                '&:hover': {
                  color: '#ff0000',
                },
              }}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Rating value={rating / 2} readOnly />
            <Typography variant="body1">{rating.toFixed(1)}</Typography>
            {year && (
              <Typography variant="body2" color="text.secondary">
                {year}
              </Typography>
            )}
          </Box>

          {movie.genres && movie.genres.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {movie.genres.map((genre) => (
                  <Chip key={genre.id} label={genre.name} variant="outlined" size="small" />
                ))}
              </Stack>
            </Box>
          )}

          <Typography variant="body1" paragraph>
            {movie.overview || movie.description || 'Описание недоступно'}
          </Typography>

          {movie.runtime && (
            <Typography variant="body2" color="text.secondary" paragraph>
              Длительность: {movie.runtime} минут
            </Typography>
          )}

          {/* Players */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Смотреть онлайн
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ mb: 3, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
              <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant={selectedPlayer === 'lumex' ? 'contained' : 'outlined'}
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handlePlayerChange('lumex')}
                  size="small"
                >
                  Lumex
                </Button>
                <Button
                  variant={selectedPlayer === 'collaps' ? 'contained' : 'outlined'}
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handlePlayerChange('collaps')}
                  size="small"
                >
                  Collaps
                </Button>
              </Stack>
              <Box sx={{ display: { xs: 'block', sm: 'inline' } }}>
                <TorrentSelector
                  imdbId={movie.imdbId || movie.imdb_id || movie.externalIds?.imdb}
                  type={movie.type === 'tv' || movie.media_type === 'tv' ? 'tv' : 'movie'}
                  title={title}
                  originalTitle={movie.originalTitle || movie.original_title}
                />
              </Box>
            </Stack>

            {playerUrl && !playerUrl.includes('blob:') && (
              <Box
                component="iframe"
                src={playerUrl}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                sx={{
                  width: '100%',
                  height: { xs: 300, sm: 400, md: 600 },
                  border: 'none',
                }}
              />
            )}
            {playerHtml && (
              <iframe
                srcDoc={playerHtml}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                style={{
                  width: '100%',
                  height: window.innerWidth < 600 ? 300 : window.innerWidth < 960 ? 400 : 600,
                  border: 'none',
                  backgroundColor: '#000',
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

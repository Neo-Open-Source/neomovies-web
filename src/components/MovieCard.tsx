import { useState, useEffect } from 'react'
import { Card, CardMedia, CardContent, Typography, Box, Rating, Skeleton, IconButton } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { getImageUrl, favoritesAPI } from '../api'
import type { Movie } from '../types'

interface MovieCardProps {
  movie: Movie
  onClick?: (movie: Movie) => void
  hideFavoriteButton?: boolean
}

export const MovieCard = ({ movie, onClick, hideFavoriteButton = false }: MovieCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const title = movie.title || movie.name || movie.nameRu || movie.nameOriginal || 'Unknown'
  const rating = (movie as any).rating || movie.vote_average || movie.ratingKinopoisk || 0
  const posterPath = movie.poster_path || movie.posterUrlPreview || movie.posterUrl

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  // Проверяем статус избранного из кеша
  useEffect(() => {
    const checkFavorite = () => {
      const favorite = favoritesAPI.checkIsFavorite(movie.id, 'movie')
      setIsFavorite(favorite)
    }

    checkFavorite()

    // Подписываемся на изменения кеша
    const unsubscribe = favoritesAPI.subscribe(() => {
      checkFavorite()
    })

    return () => unsubscribe()
  }, [movie.id])

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isLoggedIn) {
      return
    }

    try {
      setIsUpdating(true)
    const movieIdNum = typeof movie.id === 'string' ? Number(movie.id) : movie.id
    if (isFavorite) {
      await favoritesAPI.removeFromFavorites(movieIdNum, 'movie')
    } else {
      await favoritesAPI.addToFavorites(movieIdNum, 'movie', {
        title,
        nameRu: title,
        nameEn: movie.original_title || '',
        posterPath,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
        })
      }
      // Состояние обновится через подписку на кеш
    } catch (error) {
      console.error('Error updating favorite:', error)
      alert('Ошибка при обновлении избранного')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card
      onClick={() => onClick?.(movie)}
      sx={{
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 6,
        },
      }}
    >
      <Box sx={{ position: 'relative', height: 300, width: '100%', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        {!imageLoaded && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{ position: 'absolute', top: 0, left: 0 }}
          />
        )}
        <CardMedia
          component="img"
          height="300"
          image={getImageUrl(posterPath)}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          sx={{
            display: 'block',
            width: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
        {!hideFavoriteButton && (
          <IconButton
            onClick={handleFavoriteClick}
            disabled={isUpdating}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: isFavorite ? '#ff0000' : '#fff',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
          >
            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={rating / 2} readOnly size="small" />
          <Typography variant="body2" color="text.secondary">
            {rating.toFixed(1)}
          </Typography>
        </Box>
        {(movie.release_date || movie.first_air_date) && (
          <Typography variant="caption" color="text.secondary">
            {new Date(movie.release_date || movie.first_air_date || '').getFullYear()}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

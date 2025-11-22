import { useState, useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { BsMagnetFill } from 'react-icons/bs'
import { playersAPI } from '../api'

interface TorrentSelectorProps {
  imdbId?: string
  type: 'movie' | 'tv'
  title?: string
  originalTitle?: string
}

interface Torrent {
  title: string
  magnet: string
  size?: string
  seeds?: number
  peers?: number
  quality?: string
  season?: number
}

export const TorrentSelector = ({ imdbId, type, title, originalTitle }: TorrentSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [seasons, setSeasons] = useState<number[]>([])
  const [, setCopied] = useState<string | null>(null)
  const [forceByTitle, setForceByTitle] = useState(false)
  const [selectedQualities, setSelectedQualities] = useState<string[]>([])

  const fetchTorrents = async () => {
    setLoading(true)
    setError(null)
    try {
      let response
      let data: any[] = []
      
      // Стратегия поиска: IMDB ID (приоритет) -> originalTitle -> title
      
      // 1. Пытаемся по IMDB ID
      if (!forceByTitle && imdbId) {
        try {
          response = await playersAPI.getTorrents(imdbId, type)
          data = Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
        } catch (err) {
          data = []
        }
      }

      // 2. Если по IMDB ID не нашли или forceByTitle - ищем по названию (originalTitle приоритет)
      if (data.length === 0 && (originalTitle || title)) {
        const searchTitle = (originalTitle || title) as string
        try {
          response = await playersAPI.getTorrentsByTitle(searchTitle, searchTitle, 0, type)
          data = Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
        } catch (err) {
          data = []
        }
      }

      // 3. Если ничего не нашли - ищем через обычный поиск по названию
      if (data.length === 0 && (originalTitle || title)) {
        const searchTitle = (originalTitle || title) as string
        try {
          response = await playersAPI.getTorrentsByTitle(searchTitle, '', 0, type)
          data = Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
        } catch (err) {
          data = []
        }
      }

      if (data.length === 0) {
        setError('Торренты не найдены. Попробуйте позже или используйте другой поисковик.')
        setLoading(false)
        return
      }
      setTorrents(data)
      setSelectedQualities([]) // Сбрасываем фильтры качества при загрузке новых торрентов

      // Извлекаем уникальные сезоны для сериалов
      if (type === 'tv') {
        const uniqueSeasons = [...new Set(data.map((t: any) => t.season).filter(Boolean))] as number[]
        setSeasons(uniqueSeasons.sort((a, b) => a - b))
        if (uniqueSeasons.length > 0) {
          setSelectedSeason(uniqueSeasons[0])
        }
      }
    } catch (err: any) {
      setError(`Ошибка при загрузке торрентов: ${err.message}`)
      console.error('Torrent fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    if (torrents.length === 0) {
      fetchTorrents()
    }
  }

  // Переполучаем торренты когда forceByTitle меняется
  useEffect(() => {
    if (forceByTitle && open && torrents.length === 0) {
      fetchTorrents()
    }
  }, [forceByTitle, open])

  const handleCopyMagnet = (magnet: string) => {
    navigator.clipboard.writeText(magnet)
    setCopied(magnet)
    setTimeout(() => setCopied(null), 2000)
  }

  // Получаем уникальные качества из торрентов
  const availableQualities = Array.from(
    new Set(torrents.map((t) => t.quality).filter(Boolean) as string[])
  ).sort((a: string, b: string) => {
    // Сортируем по качеству: 4K, 1080p, 720p, 480p и т.д.
    const qualityOrder: Record<string, number> = {
      '4K': 0,
      '2160p': 0,
      '1440p': 1,
      '1080p': 2,
      '720p': 3,
      '480p': 4,
      '360p': 5,
    }
    return (qualityOrder[a] ?? 999) - (qualityOrder[b] ?? 999)
  })

  // Фильтруем торренты по сезону и качеству
  const filteredTorrents = torrents.filter((t) => {
    const seasonMatch = !selectedSeason || t.season === selectedSeason
    const qualityMatch = selectedQualities.length === 0 || selectedQualities.includes(t.quality || '')
    return seasonMatch && qualityMatch
  })

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpen}
        startIcon={<BsMagnetFill style={{ fontSize: '0.875rem' }} />}
      >
        Торренты
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Торренты {title && `- ${title}`}</DialogTitle>
        <DialogContent>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && torrents.length > 0 && (
            <>
              {/* Фильтры качества */}
              {availableQualities.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Качество:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {availableQualities.map((quality) => (
                      <Button
                        key={quality}
                        variant={selectedQualities.includes(quality) ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => {
                          setSelectedQualities((prev) =>
                            prev.includes(quality)
                              ? prev.filter((q) => q !== quality)
                              : [...prev, quality]
                          )
                        }}
                      >
                        {quality}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}

              {type === 'tv' && seasons.length > 0 && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Сезон</InputLabel>
                  <Select
                    value={selectedSeason || ''}
                    label="Сезон"
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  >
                    {seasons.map((season) => (
                      <MenuItem key={season} value={season}>
                        Сезон {season}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <List>
                {filteredTorrents.map((torrent, idx) => (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          onClick={() => handleCopyMagnet(torrent.magnet)}
                          title="Копировать magnet"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          href={`magnet:?${torrent.magnet}`}
                          title="Открыть в торрент клиенте"
                        >
                          <BsMagnetFill style={{ fontSize: '0.875rem' }} />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={torrent.title}
                      secondary={
                        <>
                          {torrent.quality && <Typography variant="caption">Качество: {torrent.quality}</Typography>}
                          {torrent.size && <Typography variant="caption"> • Размер: {torrent.size}</Typography>}
                          {torrent.seeds !== undefined && (
                            <Typography variant="caption"> • Сиды: {torrent.seeds}</Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {/* Показываем кнопку "Показать все результаты" если есть ID и название */}
          {!forceByTitle && imdbId && title && (
            <Button
              variant="contained"
              onClick={() => {
                setForceByTitle(true)
                setTorrents([])
                setError(null)
              }}
            >
              Показать все результаты
            </Button>
          )}
          <Button onClick={() => setOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

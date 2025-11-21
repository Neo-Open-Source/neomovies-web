import { apiClient } from './client'
import type { TVResponse, TVShow } from '../types'

export const tvAPI = {
  // Получение популярных сериалов
  getPopular(page = 1) {
    return apiClient.get<TVResponse>('/api/v1/tv/popular', { 
      params: { page },
      timeout: 30000
    })
  },

  // Получение сериалов с высоким рейтингом
  getTopRated(page = 1) {
    return apiClient.get<TVResponse>('/api/v1/tv/top-rated', { 
      params: { page },
      timeout: 30000
    })
  },

  // Получение сериалов в эфире
  getOnTheAir(page = 1) {
    return apiClient.get<TVResponse>('/api/v1/tv/on-the-air', { 
      params: { page },
      timeout: 30000
    })
  },

  // Получение сериалов, которые выходят сегодня
  getAiringToday(page = 1) {
    return apiClient.get<TVResponse>('/api/v1/tv/airing-today', { 
      params: { page },
      timeout: 30000
    })
  },

  // Получение данных о сериале по ID
  getTVById(id: string | number) {
    return apiClient.get<TVShow>(`/api/v1/tv/${id}`, { timeout: 30000 })
  },

  // Поиск сериалов
  searchTVShows(query: string, page = 1) {
    return apiClient.get<TVResponse>('/api/v1/tv/search', {
      params: {
        query,
        page
      },
      timeout: 30000
    })
  },

  // Получение IMDB и других external ids
  getExternalIds(id: string | number) {
    return apiClient.get(`/api/v1/tv/${id}/external-ids`, { timeout: 30000 }).then(res => res.data)
  }
}

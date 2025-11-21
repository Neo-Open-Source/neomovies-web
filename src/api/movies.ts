import { apiClient } from './client'
import type { MovieResponse, Movie } from '../types'

export const moviesAPI = {
  // Получение популярных фильмов
  getPopular(page = 1) {
    return apiClient.get<MovieResponse>('/api/v1/movies/popular', { 
      params: { page },
      timeout: 30000
    })
  },

  // Получение фильмов с высоким рейтингом
  getTopRated(page = 1) {
    return apiClient.get<MovieResponse>('/api/v1/movies/top-rated', {
      params: { page },
      timeout: 30000
    })
  },

  // Получение данных о фильме по ID
  getMovieById(id: string | number) {
    return apiClient.get<Movie>(`/api/v1/movie/${id}`, { timeout: 30000 })
  },

  // Поиск фильмов
  searchMovies(query: string, page = 1) {
    return apiClient.get<MovieResponse>('/api/v1/movies/search', {
      params: {
        query,
        page
      },
      timeout: 30000
    })
  },

  // Получение IMDB и других external ids
  getExternalIds(id: string | number) {
    return apiClient.get(`/api/v1/movies/${id}/external-ids`, { timeout: 30000 }).then(res => res.data)
  }
}

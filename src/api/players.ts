import { apiClient } from './client'

export const playersAPI = {
  // Alloha плеер
  getAllohaPlayer(idType: 'kp' | 'tmdb', id: string | number) {
    return apiClient.get(`/api/v1/players/alloha/${idType}/${id}`, { timeout: 30000 })
  },

  // Lumex плеер
  getLumexPlayer(idType: 'kp' | 'tmdb', id: string | number) {
    return apiClient.get(`/api/v1/players/lumex/${idType}/${id}`, { timeout: 30000 })
  },

  // HDVB плеер
  getHDVBPlayer(idType: 'kp' | 'tmdb', id: string | number) {
    return apiClient.get(`/api/v1/players/hdvb/${idType}/${id}`, { timeout: 30000 })
  },

  // Торренты по KP ID или IMDB ID
  getTorrents(id: string | number, type: 'movie' | 'tv', idType: 'kp' | 'imdb' = 'kp') {
    const typeParam = type === 'tv' ? 'tv' : 'movie'
    return apiClient.get(`/api/v1/torrents/search/${idType}/${id}?type=${typeParam}`, { timeout: 30000 })
  },

  // Торренты по названию
  getTorrentsByTitle(title: string, originalTitle: string, year: number, type: 'movie' | 'tv') {
    const params = new URLSearchParams()
    params.append('title', title)
    if (originalTitle) params.append('originalTitle', originalTitle)
    if (year) params.append('year', year.toString())
    params.append('type', type)
    return apiClient.get(`/api/v1/torrents/search/by-title?${params.toString()}`, { timeout: 30000 })
  },

  // Collaps плеер
  getCollapsPlayer(idType: 'kp' | 'tmdb', id: string | number) {
    return apiClient.get(`/api/v1/players/collaps/${idType}/${id}`, { timeout: 30000 })
  }
}

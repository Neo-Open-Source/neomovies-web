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
  }
}

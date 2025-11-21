import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

// Создание экземпляра Axios с базовыми настройками
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000
})

// Функция для получения токена из cookies
const getTokenFromCookie = (): string | null => {
  try {
    const name = 'token='
    const decodedCookie = decodeURIComponent(document.cookie)
    const cookieArray = decodedCookie.split(';')
    for (let cookie of cookieArray) {
      cookie = cookie.trim()
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length)
      }
    }
  } catch {
    return null
  }
  return null
}

// Перехватчик запросов
apiClient.interceptors.request.use(
  (config) => {
    // Получение токена сначала из cookies, потом из localStorage
    let token: string | null = null
    try {
      token = getTokenFromCookie() || localStorage.getItem('token')
    } catch {
      token = null
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Добавляем язык по умолчанию (только русский)
    if (!config.params) {
      config.params = {}
    }
    if (!config.params.lang && !config.params.language) {
      config.params.lang = 'ru'
    }
    
    // Логика для пагинации
    if (config.params?.page) {
      const page = parseInt(config.params.page)
      if (isNaN(page) || page < 1) {
        config.params.page = 1
      }
    }
    
    if (import.meta.env.DEV) {
      console.log('🔵 Making request to:', (config.baseURL || '') + (config.url || ''), 'Params:', config.params)
    }
    return config
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('❌ Request Error:', error)
    }
    return Promise.reject(error)
  }
)

// Функция для обновления токена
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshTokenValue = getTokenFromCookie() || localStorage.getItem('refreshToken')
    if (!refreshTokenValue) {
      return null
    }

    const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
      refreshToken: refreshTokenValue
    })

    const data = response.data.data || response.data
    const newAccessToken = data.accessToken
    const newRefreshToken = data.refreshToken

    if (newAccessToken && newRefreshToken) {
      localStorage.setItem('token', newAccessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      
      // Сохраняем в cookies
      const expiresIn = new Date()
      expiresIn.setDate(expiresIn.getDate() + 7)
      document.cookie = `token=${newAccessToken}; path=/; expires=${expiresIn.toUTCString()}; SameSite=Lax`
      document.cookie = `refreshToken=${newRefreshToken}; path=/; expires=${expiresIn.toUTCString()}; SameSite=Lax`
      
      return newAccessToken
    }

    return null
  } catch (error) {
    console.error('Failed to refresh token:', error)
    // Очищаем токены при ошибке обновления
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    
    // Очищаем cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax'
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax'
    
    // Отправляем событие для обновления UI
    window.dispatchEvent(new Event('auth-changed'))
    
    return null
  }
}

// Перехватчик ответов
apiClient.interceptors.response.use(
  (response) => {
    // Не обрабатываем изображения и плееры
    const url = response.config?.url || ''
    const shouldUnwrap = !url.includes('/images/') &&
                        !url.includes('/players/')
    
    if (shouldUnwrap && response.data && response.data.success && response.data.data !== undefined) {
      response.data = response.data.data
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Проверяем на 401 ошибку и что запрос еще не был повторен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const newToken = await refreshToken()
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } else {
        // Если не удалось обновить токен, перенаправляем на авторизацию
        window.location.href = '/auth'
      }
    }

    if (import.meta.env.DEV) {
      console.error('❌ Response Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        data: error.response?.data
      })
    }
    return Promise.reject(error)
  }
)

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '/images/placeholder.jpg'

  // Extract type and ID from Kinopoisk URL
  const kpPattern = /kinopoiskapiunofficial\.tech\/images\/posters\/(kp|kp_small|kp_big)\/(\d+)\.jpg/
  const match = path.match(kpPattern)
  
  if (match) {
    const type = match[1]
    const id = match[2]
    return `${API_URL}/api/v1/images/${type}/${id}`
  }

  // Already proxied path
  const proxyMatch = path.match(/^(?:https?:\/\/[^/]+)?\/?api\/v1\/images\/(kp|kp_small|kp_big)\/(\d+)$/)
  if (proxyMatch) {
    return `${API_URL}/api/v1/images/${proxyMatch[1]}/${proxyMatch[2]}`
  }

  // Fallback: return as is or placeholder
  return path.startsWith('http') ? path : '/images/placeholder.jpg'
}

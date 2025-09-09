// API модуль для аутентификации

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
  role?: string
  phone_number?: string
  iin?: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: {
    id: number
    username: string
    email: string
  }
}

/**
 * Вход пользователя
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Login failed')
  }

  const data = await response.json()
  
  // Сохраняем токены в localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
  }

  return data
}

/**
 * Регистрация пользователя
 */
export async function register(userData: RegisterData): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error('Validation failed')
  }

  return response.json()
}

/**
 * Выход пользователя
 */
export async function logout(): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Logout failed')
  }

  // Удаляем токены из localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  return response.json()
}

/**
 * Получение текущего пользователя
 */
export async function getCurrentUser(): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  
  if (!token) {
    throw new Error('No access token')
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/user/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get user')
  }

  return response.json()
}

/**
 * Обновление токена
 */
export async function refreshToken(): Promise<{ access: string }> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
  
  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  const data = await response.json()
  
  // Сохраняем новый токен
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.access)
  }

  return data
}

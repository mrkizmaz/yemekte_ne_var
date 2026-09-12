import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { getCurrentLang, msg } from './i18n/translations'
import type { Meal } from './types'

export type AuthUser = {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'user'
}

export type Catalog = {
  meals: import('./types').Meal[]
  ratings: import('./types').Rating[]
  comments: import('./types').Comment[]
  mealVotes: import('./types').MealVote[]
  suggestions: import('./types').Suggestion[]
  publishedWeeks: string[]
  users: import('./types').PublicUser[]
}

export type SessionPayload = {
  user: AuthUser
  data: Catalog
  token?: string
}

const TOKEN_KEY = 'ne-var-token'
let memoryToken = ''

function defaultApiBase() {
  const env = String(process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '')
  if (env) return env
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      if (host === 'localhost' || host === '127.0.0.1') return 'http://127.0.0.1:3001'
      return ''
    }
    return ''
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3001`
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001'
  return 'http://127.0.0.1:3001'
}

function apiUrl(path: string) {
  return `${defaultApiBase()}${path}`
}

export async function hydrateToken() {
  memoryToken = (await AsyncStorage.getItem(TOKEN_KEY)) || ''
}

function rememberToken(token?: string) {
  if (!token) return
  memoryToken = token
  void AsyncStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  memoryToken = ''
  void AsyncStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(apiUrl(path), {
      ...options,
      signal: AbortSignal.timeout(8000),
      headers: {
        'Content-Type': 'application/json',
        'X-Lang': getCurrentLang(),
        'Accept-Language': getCurrentLang(),
        ...(memoryToken ? { Authorization: `Bearer ${memoryToken}` } : {}),
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error(msg('connectionError'))
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: string; token?: string }
  if (!res.ok) {
    throw new Error(body.error || msg('requestFailed'))
  }
  rememberToken(body.token)
  return body
}

export const api = {
  me: () => request<SessionPayload>('/api/me'),
  register: (username: string, password: string) =>
    request<SessionPayload>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<SessionPayload>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => {
    clearToken()
    return request<{ ok: boolean }>('/api/logout', { method: 'POST' })
  },
  deleteAccount: () => request<{ ok: boolean }>('/api/delete-account', { method: 'POST' }),
  addMeal: (meal: object) =>
    request<{ data: Catalog }>('/api/meals', { method: 'POST', body: JSON.stringify(meal) }),
  updateMeal: (meal: Meal) =>
    request<{ data: Catalog }>('/api/meal-update', {
      method: 'POST',
      body: JSON.stringify(meal),
    }),
  deleteMeal: (id: string) =>
    request<{ data: Catalog }>('/api/meal-delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  rate: (mealId: string, stars: number) =>
    request<{ data: Catalog }>('/api/ratings', {
      method: 'POST',
      body: JSON.stringify({ mealId, stars }),
    }),
  comment: (mealId: string, text: string) =>
    request<{ data: Catalog }>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ mealId, text }),
    }),
  suggest: (slot: string, text: string) =>
    request<{ data: Catalog }>('/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({ slot, text }),
    }),
  voteMeal: (mealId: string, value: 'like' | 'dislike') =>
    request<{ data: Catalog }>('/api/vote', {
      method: 'POST',
      body: JSON.stringify({ mealId, value }),
    }),
  voteSuggestion: (id: string, value: 'like' | 'dislike') =>
    request<{ data: Catalog }>('/api/suggestion-vote', {
      method: 'POST',
      body: JSON.stringify({ id, value }),
    }),
  markSuggestion: (id: string) =>
    request<{ data: Catalog }>('/api/suggestion-mark', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  deleteSuggestion: (id: string) =>
    request<{ data: Catalog }>('/api/suggestion-delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  reset: () => request<{ data: Catalog }>('/api/reset', { method: 'POST' }),
  publishWeek: (start: string, published: boolean) =>
    request<{ data: Catalog }>('/api/week-publish', {
      method: 'POST',
      body: JSON.stringify({ start, published }),
    }),
}

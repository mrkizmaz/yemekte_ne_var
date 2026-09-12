import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, clearToken, hydrateToken, type Catalog } from './api'
import { msg } from './i18n/translations'
import type { AppState, Comment, Meal, MealSlot, SuggestionVote } from './types'

const emptyCatalog: Catalog = {
  meals: [],
  ratings: [],
  comments: [],
  mealVotes: [],
  suggestions: [],
  publishedWeeks: [],
  users: [],
}

type Store = AppState & {
  ready: boolean
  username: string
  registerUser: (username: string, password: string) => Promise<string | null>
  loginUser: (username: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  deleteAccount: () => Promise<string | null>
  addMeal: (meal: Omit<Meal, 'id'>) => Promise<void>
  updateMeal: (meal: Meal) => Promise<void>
  deleteMeal: (id: string) => Promise<void>
  rateMeal: (mealId: string, stars: number) => Promise<void>
  addComment: (mealId: string, text: string) => Promise<void>
  addSuggestion: (slot: MealSlot, text: string) => Promise<void>
  voteSuggestion: (id: string, value: 'like' | 'dislike') => Promise<void>
  voteMeal: (mealId: string, value: SuggestionVote) => Promise<void>
  markSuggestion: (id: string) => Promise<void>
  deleteSuggestion: (id: string) => Promise<void>
  resetDemo: () => Promise<void>
  publishWeek: (start: string, published: boolean) => Promise<void>
  avgStars: (mealId: string) => number
  myRating: (mealId: string) => number
  commentsFor: (mealId: string) => Comment[]
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState<AppState>({
    userName: '',
    isAdmin: false,
    ...emptyCatalog,
  })
  const [username, setUsername] = useState('')

  const applySession = useCallback(
    (payload: { user: { displayName: string; username: string; role: string }; data: Catalog }) => {
      setUsername(payload.user.username)
      setState({
        userName: payload.user.username,
        isAdmin: payload.user.role === 'admin',
        ...payload.data,
      })
    },
    [],
  )

  const applyData = useCallback((data: Catalog) => {
    setState((s) => ({ ...s, ...data }))
  }, [])

  useEffect(() => {
    let cancelled = false
    hydrateToken()
      .then(() => api.me())
      .then((payload) => {
        if (!cancelled) applySession(payload)
      })
      .catch(() => {
        if (!cancelled) {
          setUsername('')
          setState({ userName: '', isAdmin: false, ...emptyCatalog })
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [applySession])

  const registerUser = useCallback(
    async (user: string, password: string) => {
      try {
        applySession(await api.register(user, password))
        return null
      } catch (err) {
        return err instanceof Error ? err.message : msg('registerFailed')
      }
    },
    [applySession],
  )

  const loginUser = useCallback(
    async (user: string, password: string) => {
      try {
        applySession(await api.login(user, password))
        return null
      } catch (err) {
        return err instanceof Error ? err.message : msg('loginFailed')
      }
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    setUsername('')
    setState({ userName: '', isAdmin: false, ...emptyCatalog })
    await api.logout().catch(() => undefined)
  }, [])

  const deleteAccount = useCallback(async () => {
    try {
      await api.deleteAccount()
      clearToken()
    } catch (err) {
      return err instanceof Error ? err.message : msg('accountDeleteFailed')
    }
    setUsername('')
    setState({ userName: '', isAdmin: false, ...emptyCatalog })
    return null
  }, [])

  const addMeal = useCallback(
    async (meal: Omit<Meal, 'id'>) => {
      applyData((await api.addMeal(meal)).data)
    },
    [applyData],
  )

  const updateMeal = useCallback(
    async (meal: Meal) => {
      applyData((await api.updateMeal(meal)).data)
    },
    [applyData],
  )

  const deleteMeal = useCallback(
    async (id: string) => {
      applyData((await api.deleteMeal(id)).data)
    },
    [applyData],
  )

  const rateMeal = useCallback(
    async (mealId: string, stars: number) => {
      applyData((await api.rate(mealId, stars)).data)
    },
    [applyData],
  )

  const addComment = useCallback(
    async (mealId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      applyData((await api.comment(mealId, trimmed)).data)
    },
    [applyData],
  )

  const addSuggestion = useCallback(
    async (slot: MealSlot, text: string) => {
      applyData((await api.suggest(slot, text)).data)
    },
    [applyData],
  )

  const voteSuggestion = useCallback(
    async (id: string, value: 'like' | 'dislike') => {
      applyData((await api.voteSuggestion(id, value)).data)
    },
    [applyData],
  )

  const voteMeal = useCallback(
    async (mealId: string, value: SuggestionVote) => {
      applyData((await api.voteMeal(mealId, value)).data)
    },
    [applyData],
  )

  const markSuggestion = useCallback(
    async (id: string) => {
      applyData((await api.markSuggestion(id)).data)
    },
    [applyData],
  )

  const deleteSuggestion = useCallback(
    async (id: string) => {
      applyData((await api.deleteSuggestion(id)).data)
    },
    [applyData],
  )

  const resetDemo = useCallback(async () => {
    applyData((await api.reset()).data)
  }, [applyData])

  const publishWeek = useCallback(
    async (start: string, published: boolean) => {
      applyData((await api.publishWeek(start, published)).data)
    },
    [applyData],
  )

  const avgStars = useCallback(
    (mealId: string) => {
      const list = state.ratings.filter((r) => r.mealId === mealId)
      if (!list.length) return 0
      return list.reduce((a, r) => a + r.stars, 0) / list.length
    },
    [state.ratings],
  )

  const myRating = useCallback(
    (mealId: string) => {
      return state.ratings.find((r) => r.mealId === mealId && r.userName === state.userName)?.stars ?? 0
    },
    [state.ratings, state.userName],
  )

  const commentsFor = useCallback(
    (mealId: string) =>
      state.comments
        .filter((c) => c.mealId === mealId)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [state.comments],
  )

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      username,
      registerUser,
      loginUser,
      logout,
      deleteAccount,
      addMeal,
      updateMeal,
      deleteMeal,
      rateMeal,
      addComment,
      addSuggestion,
      voteSuggestion,
      voteMeal,
      markSuggestion,
      deleteSuggestion,
      resetDemo,
      publishWeek,
      avgStars,
      myRating,
      commentsFor,
    }),
    [
      state,
      ready,
      username,
      registerUser,
      loginUser,
      logout,
      deleteAccount,
      addMeal,
      updateMeal,
      deleteMeal,
      rateMeal,
      addComment,
      addSuggestion,
      voteSuggestion,
      voteMeal,
      markSuggestion,
      deleteSuggestion,
      resetDemo,
      publishWeek,
      avgStars,
      myRating,
      commentsFor,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Store missing')
  return ctx
}

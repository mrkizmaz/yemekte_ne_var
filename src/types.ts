export type MealSlot = 'kahvalti' | 'ogle' | 'aksam'

export type Tab = 'bugun' | 'oneriler' | 'admin' | 'adminOneriler' | 'profil'

export type PublicUser = {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'user'
}

export type Meal = {
  id: string
  date: string
  slot: MealSlot
  name: string
  description: string
  ingredients: string
  emoji: string
  recipe?: string
}

export type Rating = {
  id: string
  mealId: string
  userName: string
  stars: number
}

export type Comment = {
  id: string
  mealId: string
  userName: string
  text: string
  createdAt: number
}

export type SuggestionVote = 'like' | 'dislike'

export type MealVote = {
  id: string
  mealId: string
  userName: string
  value: SuggestionVote
}

export type Suggestion = {
  id: string
  userName: string
  slot: MealSlot
  text: string
  createdAt: number
  status: 'yeni' | 'incelendi'
  votes: Record<string, SuggestionVote>
}

export function likesOf(s: Suggestion) {
  return Object.values(s.votes || {}).filter((v) => v === 'like').length
}

export function dislikesOf(s: Suggestion) {
  return Object.values(s.votes || {}).filter((v) => v === 'dislike').length
}

export type AppState = {
  userName: string
  isAdmin: boolean
  meals: Meal[]
  ratings: Rating[]
  comments: Comment[]
  mealVotes: MealVote[]
  suggestions: Suggestion[]
  publishedWeeks: string[]
  users: PublicUser[]
}

export const SLOTS: { id: MealSlot; label: string; hint: string; icon: string }[] = [
  { id: 'kahvalti', label: 'Kahvaltı', hint: 'Sabah', icon: '🥐' },
  { id: 'ogle', label: 'Öğle', hint: 'Günorta', icon: '🍜' },
  { id: 'aksam', label: 'Akşam', hint: 'Akşam', icon: '🍲' },
]

export function slotOf(id: MealSlot) {
  return SLOTS.find((s) => s.id === id) ?? SLOTS[0]
}

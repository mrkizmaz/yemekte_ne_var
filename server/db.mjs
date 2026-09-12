import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { comments, buildMeals, mealVotes, publishedWeeksForSeed, ratings, suggestions } from './seed-data.mjs'
import { isoDate, isPublishedDate, weekStart } from './dates.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.VERCEL ? '/tmp/ne-var-data' : join(root, '..', 'data')
const dbPath = join(dataDir, 'db.json')

export const ADMIN_USERNAME = 'admin'
export const ADMIN_PASSWORD = 'Admin123'

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyCatalog() {
  return {
    meals: buildMeals(),
    ratings: structuredClone(ratings),
    comments: structuredClone(comments),
    mealVotes: structuredClone(mealVotes),
    suggestions: structuredClone(suggestions),
    publishedWeeks: publishedWeeksForSeed(),
  }
}

export async function createEmptyDb() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  return {
    users: [
      {
        id: 'u-admin',
        username: ADMIN_USERNAME,
        displayName: 'Yönetici',
        passwordHash,
        role: 'admin',
      },
    ],
    ...emptyCatalog(),
  }
}

let cache = null

function migrate(db) {
  const today = isoDate()
  if (!Array.isArray(db.publishedWeeks)) db.publishedWeeks = []
  const seedMeals = Object.fromEntries(buildMeals().map((m) => [m.id, m]))
  for (const meal of db.meals || []) {
    if (!meal.date) meal.date = seedMeals[meal.id]?.date || today
    meal.recipe = meal.recipe || seedMeals[meal.id]?.recipe || ''
    delete meal.calories
  }
  if (!db.publishedWeeks.length) {
    db.publishedWeeks = publishedWeeksForSeed()
  }
  if (!Array.isArray(db.mealVotes) || db.mealVotes.length === 0) {
    db.mealVotes = structuredClone(mealVotes)
  }
  return db
}

export function loadDb() {
  if (cache) return cache
  try {
    cache = migrate(JSON.parse(readFileSync(dbPath, 'utf8')))
    writeFileSync(dbPath, JSON.stringify(cache, null, 2))
    return cache
  } catch {
    return null
  }
}

export function saveDb(db) {
  cache = db
  try {
    mkdirSync(dataDir, { recursive: true })
    writeFileSync(dbPath, JSON.stringify(db, null, 2))
  } catch (err) {
    if (process.env.VERCEL) return
    throw err
  }
}

export async function ensureDb() {
  const existing = loadDb()
  if (existing?.users?.length) {
    const week = weekStart()
    const weeks = existing.publishedWeeks || []
    if (!weeks.includes(week)) {
      existing.publishedWeeks = [...new Set([...weeks, week, ...publishedWeeksForSeed()])]
      saveDb(existing)
    }
    return existing
  }
  const fresh = await createEmptyDb()
  saveDb(fresh)
  return fresh
}

export function publicData(db, isAdmin = false) {
  const weeks = db.publishedWeeks || []
  const meals = (isAdmin ? db.meals : (db.meals || []).filter((m) => isPublishedDate(m.date, weeks))).map(
    (m) => {
      if (isAdmin) return m
      const { recipe, ...rest } = m
      return rest
    },
  )
  return {
    meals,
    ratings: (db.ratings || []).filter((r) => meals.some((m) => m.id === r.mealId)),
    comments: (db.comments || []).filter((c) => meals.some((m) => m.id === c.mealId)),
    mealVotes: (db.mealVotes || []).filter((v) => meals.some((m) => m.id === v.mealId)),
    suggestions: (db.suggestions || []).map((s) => ({
      ...s,
      votes: s.votes && typeof s.votes === 'object' ? s.votes : {},
    })),
    publishedWeeks: weeks,
    users: isAdmin ? (db.users || []).map(publicUser) : [],
  }
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  }
}

export { createId, emptyCatalog }

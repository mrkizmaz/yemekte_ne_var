import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { comments, buildMeals, mealVotes, publishedWeeksForSeed, ratings, suggestions } from './seed-data.mjs'
import { isoDate, isPublishedDate, weekStart } from './dates.mjs'
import { hasRemoteStore, readRemoteDb, writeRemoteDb } from './persist.mjs'

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
  if (!Array.isArray(db.mealVotes)) db.mealVotes = []
  return db
}

function readLocalFile() {
  try {
    return migrate(JSON.parse(readFileSync(dbPath, 'utf8')))
  } catch {
    return null
  }
}

function writeLocalFile(db) {
  mkdirSync(dataDir, { recursive: true })
  writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

export function loadDb() {
  return cache
}

export async function saveDb(db) {
  cache = db
  if (hasRemoteStore()) {
    await writeRemoteDb(db)
    return
  }
  if (process.env.VERCEL) {
    console.warn('Kalıcı veri yok: UPSTASH_REDIS_REST_URL ve UPSTASH_REDIS_REST_TOKEN ekle.')
    try {
      writeLocalFile(db)
    } catch {
      // /tmp dolu veya yazılamaz
    }
    return
  }
  writeLocalFile(db)
}

export async function ensureDb() {
  if (hasRemoteStore()) {
    const remote = await readRemoteDb()
    if (remote?.users?.length) {
      cache = migrate(remote)
      return cache
    }
    const fresh = await createEmptyDb()
    await saveDb(fresh)
    return fresh
  }

  if (process.env.VERCEL) {
    console.warn('Kalıcı veri yok: Vercel /tmp gece silinir. Upstash Redis ekle.')
  }

  if (cache?.users?.length) return cache
  const existing = readLocalFile()
  if (existing?.users?.length) {
    cache = existing
    const week = weekStart()
    const weeks = existing.publishedWeeks || []
    if (!weeks.includes(week)) {
      existing.publishedWeeks = [...new Set([...weeks, week, ...publishedWeeksForSeed()])]
      await saveDb(existing)
    }
    return existing
  }
  const fresh = await createEmptyDb()
  await saveDb(fresh)
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

function nameKeys(value) {
  const raw = String(value || '').trim()
  if (!raw) return []
  return [raw, raw.toLocaleLowerCase('tr')]
}

export function purgeUserData(db, user) {
  const names = new Set([...nameKeys(user.username), ...nameKeys(user.displayName)])
  const matches = (value) => {
    const raw = String(value || '').trim()
    return names.has(raw) || names.has(raw.toLocaleLowerCase('tr'))
  }

  db.users = (db.users || []).filter((u) => u.id !== user.id)
  db.ratings = (db.ratings || []).filter((r) => !matches(r.userName))
  db.comments = (db.comments || []).filter((c) => !matches(c.userName))
  db.mealVotes = (db.mealVotes || []).filter((v) => !matches(v.userName))
  db.suggestions = (db.suggestions || [])
    .filter((s) => !matches(s.userName))
    .map((s) => {
      const votes = { ...(s.votes && typeof s.votes === 'object' ? s.votes : {}) }
      for (const key of Object.keys(votes)) {
        if (matches(key)) delete votes[key]
      }
      return { ...s, votes }
    })
}

export { createId, emptyCatalog, hasRemoteStore }

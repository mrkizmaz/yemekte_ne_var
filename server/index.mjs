import cookieParser from 'cookie-parser'
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ADMIN_USERNAME,
  createId,
  emptyCatalog,
  ensureDb,
  loadDb,
  publicData,
  publicUser,
  saveDb,
} from './db.mjs'
import { isoDate, isPastDate, isPublishedDate, weekStart } from './dates.mjs'

const PORT = Number(process.env.PORT || 3001)
const JWT_SECRET = process.env.JWT_SECRET || 'ne-var-dev-secret-change-me'
const TOKEN_COOKIE = 'ne_var_token'
const isProd = process.env.NODE_ENV === 'production'
const rootDir = dirname(fileURLToPath(import.meta.url))
const distDir = join(rootDir, '..', 'dist')

function catalog(db, user) {
  return publicData(db, user?.role === 'admin')
}

function assertCanInteract(res, meal, user) {
  if (!meal) {
    res.status(404).json({ error: 'Yemek bulunamadı.' })
    return false
  }
  if (isPastDate(meal.date)) {
    res.status(403).json({ error: 'Geçmiş menü yalnızca görüntülenir.' })
    return false
  }
  if (user?.role !== 'admin') {
    const db = loadDb()
    if (!isPublishedDate(meal.date, db.publishedWeeks || [])) {
      res.status(403).json({ error: 'Bu menü henüz yayınlanmadı.' })
      return false
    }
  }
  return true
}

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})
app.use(express.json({ limit: '200kb' }))
app.use(cookieParser())

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

function readUser(req) {
  const header = req.headers.authorization
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : ''
  const token = req.cookies?.[TOKEN_COOKIE] || bearer
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const db = loadDb()
    return db?.users.find((u) => u.id === payload.id) || null
  } catch {
    return null
  }
}

function requireAuth(req, res, next) {
  const user = readUser(req)
  if (!user) {
    res.status(401).json({ error: 'Giriş yapman gerekiyor.' })
    return
  }
  req.user = user
  next()
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Bu işlem yalnızca yönetici için.' })
      return
    }
    next()
  })
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 6
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/register', async (req, res) => {
  const username = normalizeUsername(req.body?.username)
  const password = String(req.body?.password || '')

  if (username.length < 3) {
    res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalı.' })
    return
  }
  if (!validPassword(password)) {
    res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' })
    return
  }
  if (username === ADMIN_USERNAME) {
    res.status(400).json({ error: 'Bu kullanıcı adı alınamaz.' })
    return
  }

  const db = loadDb()
  if (db.users.some((u) => u.username === username)) {
    res.status(409).json({ error: 'Bu kullanıcı adı dolu.' })
    return
  }

  const user = {
    id: createId(),
    username,
    displayName: username,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'user',
  }
  db.users.push(user)
  saveDb(db)
  const token = signToken(user)
  setAuthCookie(res, token)
  res.status(201).json({ user: publicUser(user), data: catalog(db, user), token })
})

app.post('/api/login', async (req, res) => {
  const username = normalizeUsername(req.body?.username)
  const password = String(req.body?.password || '')

  const db = loadDb()
  const user = db.users.find((u) => u.username === username)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' })
    return
  }

  const token = signToken(user)
  setAuthCookie(res, token)
  res.json({ user: publicUser(user), data: catalog(db, user), token })
})

app.post('/api/logout', (_req, res) => {
  res.clearCookie(TOKEN_COOKIE)
  res.json({ ok: true })
})

app.delete('/api/me', requireAuth, (req, res) => {
  if (req.user.role === 'admin' || req.user.username === ADMIN_USERNAME) {
    res.status(403).json({ error: 'Yönetici hesabı silinemez.' })
    return
  }
  const db = loadDb()
  const who = req.user.username
  db.users = (db.users || []).filter((u) => u.id !== req.user.id)
  db.ratings = (db.ratings || []).filter((r) => r.userName !== who)
  db.comments = (db.comments || []).filter((c) => c.userName !== who)
  db.mealVotes = (db.mealVotes || []).filter((v) => v.userName !== who)
  db.suggestions = (db.suggestions || []).filter((s) => s.userName !== who)
  saveDb(db)
  res.clearCookie(TOKEN_COOKIE)
  res.json({ ok: true })
})

app.get('/api/me', requireAuth, (req, res) => {
  const db = loadDb()
  res.json({ user: publicUser(req.user), data: catalog(db, req.user) })
})

app.patch('/api/me', requireAuth, (req, res) => {
  const displayName = String(req.body?.displayName || '').trim()
  if (displayName.length < 2) {
    res.status(400).json({ error: 'Görünen ad en az 2 karakter olmalı.' })
    return
  }
  const db = loadDb()
  const user = db.users.find((u) => u.id === req.user.id)
  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı.' })
    return
  }
  user.displayName = displayName
  saveDb(db)
  res.json({ user: publicUser(user), data: catalog(db, req.user) })
})

app.post('/api/meals', requireAdmin, (req, res) => {
  const db = loadDb()
  const meal = {
    id: createId(),
    date: String(req.body.date || isoDate()),
    slot: req.body.slot,
    name: String(req.body.name || '').trim(),
    description: String(req.body.description || '').trim(),
    ingredients: String(req.body.ingredients || '').trim(),
    emoji: String(req.body.emoji || '🍽️').trim() || '🍽️',
    recipe: String(req.body.recipe || '').trim(),
  }
  if (!meal.name || !['kahvalti', 'ogle', 'aksam'].includes(meal.slot)) {
    res.status(400).json({ error: 'Yemek adı ve öğün gerekli.' })
    return
  }
  db.meals.unshift(meal)
  saveDb(db)
  res.status(201).json({ data: catalog(db, req.user) })
})

app.put('/api/meals/:id', requireAdmin, (req, res) => {
  const db = loadDb()
  const idx = db.meals.findIndex((m) => m.id === req.params.id)
  if (idx < 0) {
    res.status(404).json({ error: 'Yemek bulunamadı.' })
    return
  }
  db.meals[idx] = {
    ...db.meals[idx],
    date: String(req.body.date || db.meals[idx].date || isoDate()),
    slot: req.body.slot,
    name: String(req.body.name || '').trim(),
    description: String(req.body.description || '').trim(),
    ingredients: String(req.body.ingredients || '').trim(),
    emoji: String(req.body.emoji || '🍽️').trim() || '🍽️',
    recipe: String(req.body.recipe || db.meals[idx].recipe || '').trim(),
    id: req.params.id,
  }
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.delete('/api/meals/:id', requireAdmin, (req, res) => {
  const db = loadDb()
  db.meals = db.meals.filter((m) => m.id !== req.params.id)
  db.ratings = db.ratings.filter((r) => r.mealId !== req.params.id)
  db.comments = db.comments.filter((c) => c.mealId !== req.params.id)
  db.mealVotes = (db.mealVotes || []).filter((v) => v.mealId !== req.params.id)
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.post('/api/meals/:id/vote', requireAuth, (req, res) => {
  const value = req.body.value
  if (value !== 'like' && value !== 'dislike') {
    res.status(400).json({ error: 'Oy geçersiz.' })
    return
  }
  const db = loadDb()
  const meal = db.meals.find((m) => m.id === req.params.id)
  if (!assertCanInteract(res, meal, req.user)) return
  if (!Array.isArray(db.mealVotes)) db.mealVotes = []
  const who = req.user.username
  const existing = db.mealVotes.find((v) => v.mealId === meal.id && v.userName === who)
  if (existing && existing.value === value) {
    db.mealVotes = db.mealVotes.filter((v) => v !== existing)
  } else if (existing) {
    existing.value = value
  } else {
    db.mealVotes.push({ id: createId(), mealId: meal.id, userName: who, value })
  }
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.post('/api/ratings', requireAuth, (req, res) => {
  const stars = Number(req.body.stars)
  const mealId = String(req.body.mealId || '')
  if (!mealId || stars < 1 || stars > 5) {
    res.status(400).json({ error: 'Geçerli bir puan seç.' })
    return
  }
  const db = loadDb()
  const meal = db.meals.find((m) => m.id === mealId)
  if (!assertCanInteract(res, meal, req.user)) return
  const userName = req.user.username
  const existing = db.ratings.find((r) => r.mealId === mealId && r.userName === userName)
  if (existing) existing.stars = stars
  else db.ratings.push({ id: createId(), mealId, userName, stars })
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.post('/api/comments', requireAuth, (req, res) => {
  const text = String(req.body.text || '').trim()
  const mealId = String(req.body.mealId || '')
  if (!text || !mealId) {
    res.status(400).json({ error: 'Yorum boş olamaz.' })
    return
  }
  const db = loadDb()
  const meal = db.meals.find((m) => m.id === mealId)
  if (!assertCanInteract(res, meal, req.user)) return
  db.comments.unshift({
    id: createId(),
    mealId,
    userName: req.user.username,
    text,
    createdAt: Date.now(),
  })
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.post('/api/suggestions', requireAuth, (req, res) => {
  const text = String(req.body.text || '').trim()
  const slot = req.body.slot
  if (!text || !['kahvalti', 'ogle', 'aksam'].includes(slot)) {
    res.status(400).json({ error: 'Öğün ve öneri gerekli.' })
    return
  }
  const db = loadDb()
  db.suggestions.unshift({
    id: createId(),
    userName: req.user.username,
    slot,
    text,
    createdAt: Date.now(),
    status: 'yeni',
    votes: {},
  })
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.post('/api/suggestions/:id/vote', requireAuth, (req, res) => {
  const value = req.body.value
  if (value !== 'like' && value !== 'dislike') {
    res.status(400).json({ error: 'Beğeni geçersiz.' })
    return
  }
  const db = loadDb()
  const item = db.suggestions.find((s) => s.id === req.params.id)
  if (!item) {
    res.status(404).json({ error: 'Öneri bulunamadı.' })
    return
  }
  if (!item.votes || typeof item.votes !== 'object') item.votes = {}
  const who = req.user.username
  if (item.votes[who] === value) delete item.votes[who]
  else item.votes[who] = value
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.patch('/api/suggestions/:id', requireAdmin, (req, res) => {
  const db = loadDb()
  const item = db.suggestions.find((s) => s.id === req.params.id)
  if (!item) {
    res.status(404).json({ error: 'Öneri bulunamadı.' })
    return
  }
  item.status = 'incelendi'
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.delete('/api/suggestions/:id', requireAdmin, (req, res) => {
  const db = loadDb()
  db.suggestions = db.suggestions.filter((s) => s.id !== req.params.id)
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.post('/api/weeks/:start/publish', requireAdmin, (req, res) => {
  const start = weekStart(String(req.params.start || isoDate()))
  const on = req.body.published !== false
  const db = loadDb()
  const set = new Set(db.publishedWeeks || [])
  if (on) set.add(start)
  else set.delete(start)
  db.publishedWeeks = [...set]
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

app.post('/api/reset', requireAdmin, (req, res) => {
  const db = loadDb()
  const fresh = emptyCatalog()
  db.meals = fresh.meals
  db.ratings = fresh.ratings
  db.comments = fresh.comments
  db.mealVotes = fresh.mealVotes
  db.suggestions = fresh.suggestions
  db.publishedWeeks = fresh.publishedWeeks
  saveDb(db)
  res.json({ data: catalog(db, req.user) })
})

await ensureDb()

if (!process.env.VERCEL && existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      next()
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next()
      return
    }
    res.sendFile(join(distDir, 'index.html'))
  })
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Ne Var? http://localhost:${PORT}`)
    if (!isProd) {
      console.log(`Yönetici: ${ADMIN_USERNAME} / ${process.env.ADMIN_PASSWORD || 'Admin123'}`)
    }
    if (isProd && JWT_SECRET === 'ne-var-dev-secret-change-me') {
      console.warn('Uyarı: JWT_SECRET üretimde değiştirilmeli.')
    }
  })
}

export default app

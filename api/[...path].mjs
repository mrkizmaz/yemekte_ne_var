import app from '../server/index.mjs'

function originalPath(req) {
  const forwarded = String(req.headers['x-forwarded-uri'] || '').split('?')[0]
  const q = req.query?.path
  if (Array.isArray(q) && q.length) return '/api/' + q.join('/')
  if (typeof q === 'string' && q && q !== 'undefined') {
    return q.startsWith('/api') ? q.split('?')[0] : '/api/' + q.replace(/^\/+/, '')
  }
  if (forwarded.startsWith('/api')) return forwarded
  const url = String(req.url || '/api')
  const path = url.split('?')[0]
  if (path.startsWith('/api')) return url
  return '/api' + (path.startsWith('/') ? path : `/${path}`)
}

export default async function handler(req, res) {
  req.url = originalPath(req)
  if (typeof req.body === 'string' && req.body) {
    try {
      req.body = JSON.parse(req.body)
    } catch {
      req.body = {}
    }
  }
  await new Promise((resolve, reject) => {
    const done = () => resolve()
    res.on('finish', done)
    res.on('close', done)
    try {
      const maybe = app(req, res)
      if (maybe && typeof maybe.then === 'function') {
        maybe.then(resolve, reject)
      }
    } catch (err) {
      reject(err)
    }
  })
}

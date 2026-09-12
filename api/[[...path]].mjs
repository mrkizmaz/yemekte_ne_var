import app from '../server/index.mjs'

function withApiPrefix(url = '/') {
  const [path, query] = url.split('?')
  if (path === '/api' || path.startsWith('/api/')) return url
  const prefixed = path === '/' ? '/api' : `/api${path.startsWith('/') ? path : `/${path}`}`
  return query ? `${prefixed}?${query}` : prefixed
}

export default function handler(req, res) {
  const segments = req.query?.path
  const parts = Array.isArray(segments) ? segments : segments ? [segments] : []
  if (parts.length) {
    req.url = withApiPrefix(`/${parts.join('/')}`)
  } else {
    req.url = withApiPrefix(req.url || '/')
  }

  return app(req, res)
}

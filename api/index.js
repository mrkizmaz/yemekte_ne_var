async function runExpress(req, res) {
  const { default: app } = await import('../server/index.mjs')
  const forwarded = String(req.headers['x-forwarded-uri'] || '').split('?')[0]
  const q = req.query?.path
  let url = String(req.url || '/api').split('?')[0]
  if (typeof q === 'string' && q) url = '/api/' + q.replace(/^\/+/, '')
  else if (Array.isArray(q) && q.length) url = '/api/' + q.join('/')
  else if (forwarded.startsWith('/api')) url = forwarded
  else if (!url.startsWith('/api')) url = '/api' + (url.startsWith('/') ? url : `/${url}`)
  req.url = url

  await new Promise((resolve, reject) => {
    const done = () => resolve()
    res.on('finish', done)
    res.on('close', done)
    try {
      const maybe = app(req, res)
      if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject)
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = async function handler(req, res) {
  try {
    await runExpress(req, res)
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err?.message || 'Sunucu hatası' }))
    }
  }
}

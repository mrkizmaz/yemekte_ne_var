async function runApp(req, res) {
  const { default: app } = await import('../server/index.mjs')
  const forwarded = String(req.headers['x-forwarded-uri'] || '').split('?')[0]
  const raw = String(req.url || '')
  const path = raw.split('?')[0]
  if (forwarded.startsWith('/api')) req.url = forwarded + (raw.includes('?') ? '?' + raw.split('?')[1] : '')
  else if (!path.startsWith('/api')) req.url = '/api' + (path.startsWith('/') ? path : `/${path}`)

  await new Promise((resolve, reject) => {
    const finish = () => resolve()
    res.on('finish', finish)
    res.on('close', finish)
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
    await runApp(req, res)
  } catch (err) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err?.message || 'Sunucu hatası' }))
  }
}

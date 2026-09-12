async function runApp(req, res, url) {
  const { default: app } = await import('../server/index.mjs')
  req.url = url
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
    await runApp(req, res, '/api/vote')
  } catch (err) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err?.message || 'Sunucu hatası' }))
  }
}

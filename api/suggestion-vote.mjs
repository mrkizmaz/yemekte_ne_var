import app from '../server/index.mjs'

export default async function handler(req, res) {
  req.url = '/api/suggestion-vote'
  await new Promise((resolve, reject) => {
    res.on('finish', resolve)
    res.on('close', resolve)
    try {
      const maybe = app(req, res)
      if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject)
    } catch (err) {
      reject(err)
    }
  })
}

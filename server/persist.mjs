const KEY = 'ne-var-db'

function redisUrl() {
  return String(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').replace(/\/$/, '')
}

function redisToken() {
  return String(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '')
}

export function hasRemoteStore() {
  return Boolean(redisUrl() && redisToken())
}

async function redis(command) {
  const res = await fetch(redisUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Redis ${res.status}: ${text}`)
  }
  return res.json()
}

export async function readRemoteDb() {
  const { result } = await redis(['GET', KEY])
  if (result == null || result === '') return null
  return typeof result === 'string' ? JSON.parse(result) : result
}

export async function writeRemoteDb(db) {
  await redis(['SET', KEY, JSON.stringify(db)])
}

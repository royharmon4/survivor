import { getStore } from '@netlify/blobs'

const CAST_IDS = [
  'thien-an-nguyen', 'jenna-greenawalt', 'eric-macksoud', 'michael-pinsky', 'alexis-levine',
  'patt-cannaday', 'angelica-loblack', 'aaliyah-puglia', 'maggie-nestor', 'cristian-chavez',
  'carter-krull', 'daniel-kilby', 'sharonda-renee', 'ana-sani', 'rob-antonson',
  'linnea-capobianco', 'kristin-flickinger', 'devin-way', 'ori-jean-charles', 'lewis-kelly', 'brady-booker'
]

export default async (request, context) => {
  const user = context.clientContext?.user

  if (!user?.sub) {
    return json({ error: 'Sign in required.' }, 401)
  }

  const store = getStore('private-survivor-rankings')
  const key = `users/${user.sub}.json`

  if (request.method === 'GET') {
    const saved = await store.get(key, { type: 'json' })
    return json(saved || { ranking: CAST_IDS, updatedAt: null })
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null)
    const ranking = normalizeRanking(body?.ranking)

    const payload = {
      userId: user.sub,
      email: user.email || null,
      ranking,
      updatedAt: new Date().toISOString()
    }

    await store.setJSON(key, payload)
    return json(payload)
  }

  return json({ error: 'Method not allowed.' }, 405)
}

function normalizeRanking(input) {
  const seen = new Set()
  const valid = Array.isArray(input)
    ? input.filter((id) => CAST_IDS.includes(id) && !seen.has(id) && seen.add(id))
    : []
  const missing = CAST_IDS.filter((id) => !seen.has(id))
  return [...valid, ...missing]
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

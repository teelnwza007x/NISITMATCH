// Deploy: supabase functions deploy itunes-search
// Requires authenticated requests (default JWT verification).
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })
  try {
    const body = await request.json()
    const query = String(body?.query ?? '').trim().slice(0, 100)
    if (query.length < 2) return Response.json({ results: [] }, { headers: cors })
    const params = new URLSearchParams({ term: query, media: 'music', entity: 'song', country: 'TH', limit: '20' })
    const upstream = await fetch(`https://itunes.apple.com/search?${params}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'NisitMatch/1.0' },
      signal: AbortSignal.timeout(9000),
    })
    if (!upstream.ok) return Response.json({ error: 'Music provider unavailable' }, { status: 502, headers: cors })
    const data = await upstream.json()
    return Response.json({ results: Array.isArray(data.results) ? data.results : [] }, {
      headers: { ...cors, 'Cache-Control': 'public, max-age=90' },
    })
  } catch {
    return Response.json({ error: 'Music search failed' }, { status: 502, headers: cors })
  }
})

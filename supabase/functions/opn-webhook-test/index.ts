// Payments temporarily disabled. Do not create or fulfill charges.
Deno.serve((_req) => new Response(JSON.stringify({error:'Payments temporarily unavailable'}), {status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}))

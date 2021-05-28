import { serve } from 'https://deno.land/std/http/server.ts'
const s = serve({ port: 8000 })
console.log(`🦕 Deno server running at http://localhost:8000/ 🦕`)
const image=Deno.readFile('favicon.svg');
for await (const req of s) {
  req.respond({ body: image  })
}
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json()
  const response = await fetch(`http://localhost:7801/API/${data.api}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data.params)
  })
  const res = await response.json()
  return json(res)
}

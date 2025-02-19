import { json } from '@sveltejs/kit'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()
    const json_str = await readFile(join('data', data.path), 'utf8')
    const json_obj = JSON.parse(json_str)

    return json({ success: true, json_obj })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return json({ success: false, error: message }, { status: 500 })
  }
}

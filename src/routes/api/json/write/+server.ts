import { json } from '@sveltejs/kit'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()
    const json_str = JSON.stringify(data.json, null, 2)

    await writeFile(join('data', data.path), json_str)

    return json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return json({ success: false, error: message }, { status: 500 })
  }
}

import { json } from '@sveltejs/kit'
import * as yaml from 'yaml'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const req = await request.json()
    const data = await readFile(join('data', req.path), 'utf8')
    if (req.type === 'json') {
      return json({ success: true, data: JSON.parse(data) })
    } else if (req.type === 'yaml') {
      return json({ success: true, data: yaml.parse(data) })
    } else {
      return json({ success: true, data: data })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return json({ success: false, error: message }, { status: 500 })
  }
}

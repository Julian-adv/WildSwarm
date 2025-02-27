import { json } from '@sveltejs/kit'
import * as yaml from 'yaml'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const req = await request.json()
    let data
    if (req.type === 'json') {
      data = JSON.stringify(req.data, null, 2)
    } else if (req.type === 'yaml') {
      data = yaml.stringify(req.data)
    } else {
      data = req.data
    }

    const filePath = join('data', req.path)
    const dirPath = dirname(filePath)

    // Create directory if it doesn't exist
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true })
    }

    await writeFile(filePath, data)

    return json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return json({ success: false, error: message }, { status: 500 })
  }
}

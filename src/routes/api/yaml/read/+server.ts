import { json } from '@sveltejs/kit'
import * as yaml from 'yaml'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RequestHandler } from '../$types'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()
    const yamlStr = await readFile(join('data', data.path), 'utf8')
    const yaml_obj = yaml.parse(yamlStr)

    return json({ success: true, yaml_obj })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return json({ success: false, error: message }, { status: 500 })
  }
}

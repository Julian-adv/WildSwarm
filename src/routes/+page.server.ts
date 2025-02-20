import type { PageServerLoad } from './$types'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as yaml from 'yaml'

export const load: PageServerLoad = async ({ fetch, params }) => {
  console.log('loading page')
  const json_str = await readFile(join('data', 'settings.json'), 'utf8')
  const settings = JSON.parse(json_str)
  const yaml_str = await readFile(join('data', 'wildcards.yaml'), 'utf8')
  const wildcards = yaml.parse(yaml_str)

  return {
    wildcards: wildcards,
    settings: settings
  }
}

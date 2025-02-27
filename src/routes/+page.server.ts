import { default_model_settings, default_danbooru_settings, type Settings } from '$lib/settings'
import type { PageServerLoad } from './$types'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as yaml from 'yaml'

export const load: PageServerLoad = async ({ fetch, params }) => {
  console.log('loading page')
  let settings: Settings = {}
  try {
    const json_str = await readFile(join('data', 'settings.json'), 'utf8')
    settings = JSON.parse(json_str)
  } catch (error) {
    console.log(error)
    settings = {}
  }

  let wildcards = {}
  try {
    const yaml_str = await readFile(join('data', 'wildcards.yaml'), 'utf8')
    wildcards = yaml.parse(yaml_str)
  } catch (error) {
    console.log('defaulting to empty wildcards')
    wildcards = {}
  }

  if (!settings.model_settings) {
    settings.model_settings = { ...default_model_settings }
  }
  if (!settings.danbooru_settings) {
    settings.danbooru_settings = { ...default_danbooru_settings }
  }
  return {
    wildcards: wildcards,
    settings: settings
  }
}

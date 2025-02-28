import { default_model_settings, default_danbooru_settings } from '$lib/settings'
import type { Settings, DanbooruSettings } from '$lib/settings'
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

  let danbooru_settings: DanbooruSettings = default_danbooru_settings
  try {
    const json_str = await readFile(join('data', 'danbooru_settings.json'), 'utf8')
    danbooru_settings = JSON.parse(json_str)
    if (!danbooru_settings.group) {
      danbooru_settings.group = {}
    }
  } catch (error) {
    console.log(error)
    danbooru_settings = default_danbooru_settings
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
  return {
    wildcards: wildcards,
    settings: settings,
    danbooru_settings: danbooru_settings
  }
}

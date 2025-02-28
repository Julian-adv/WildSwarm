export interface ModelSettings {
  refinermodel: string
  positiveprompt: string
  negativeprompt: string
  steps: number
  cfgscale: number
  sampler: string
  scheduler: string
  refinercontrolpercentage: number
  refinermethod: string
  refinerupscalemethod: string
  refinercfgscale: number
  refinerupscale: number
  automaticvae: boolean
  vae: string
}

export interface DanbooruSettings {
  max_tags: number
  num_tags: number
  banned_tags: { [key: string]: boolean }
  group: { [key: string]: number }
}

export interface Settings {
  model_settings?: any
  danbooru_settings?: DanbooruSettings
}

export const default_model_settings: ModelSettings = {
  refinermodel: '',
  positiveprompt: '',
  negativeprompt: '',
  steps: 30,
  cfgscale: 4.5,
  sampler: 'euler_ancestral',
  scheduler: 'simple',
  refinercontrolpercentage: 0.3,
  refinermethod: '',
  refinerupscalemethod: '',
  refinercfgscale: 4.5,
  refinerupscale: 1.5,
  automaticvae: true,
  vae: ''
}

export const default_danbooru_settings: DanbooruSettings = {
  max_tags: 5000,
  num_tags: 15,
  banned_tags: {},
  group: {}
}

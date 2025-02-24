<script lang="ts">
  import Select from '$lib/Select.svelte'
  import { process_wildcards } from '$lib/wildcards'
  import { save_json } from '$lib/file'
  import { onMount } from 'svelte'
  import type { PageProps } from './$types'
  import SlotList from './SlotList.svelte'

  let session: any = $state({})
  let image: string = $state('')
  let preview_image: string = $state('')
  let params: any = $state({})
  let images: any = $state({})
  let status_message: string = $state('')
  let overall_percent: number = $state(0)
  let current_percent: number = $state(0)
  let { data }: PageProps = $props()
  let wildcards: any = $state(data.wildcards)
  let settings: any = $state(data.settings)
  let aspect_ratio_labels: string[] = $state([])
  let aspect_ratios: string[] = $state([])
  const width_heights: { [key: string]: { width: number; height: number } } = {
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1152, height: 896 },
    '3:2': { width: 1216, height: 832 },
    '8:5': { width: 1216, height: 768 },
    '16:9': { width: 1344, height: 768 },
    '21:9': { width: 1536, height: 640 },
    '3:4': { width: 896, height: 1152 },
    '2:3': { width: 832, height: 1216 },
    '5:8': { width: 768, height: 1216 },
    '9:16': { width: 768, height: 1344 },
    '9:21': { width: 640, height: 1536 },
    Custom: { width: 1024, height: 1024 }
  }
  let sampler_labels: string[] = $state([])
  let samplers: string[] = $state([])
  let scheduler_labels: string[] = $state([])
  let schedulers: string[] = $state([])
  let refiner_method_labels: string[] = $state([])
  let refiner_methods: string[] = $state([])
  let refiner_upscale_method_labels: string[] = $state([])
  let refiner_upscale_methods: string[] = $state([])
  let vaes: string[] = $state([])
  let vae_labels: string[] = $state([])

  $effect(() => {
    if (width_heights[settings.aspectratio]) {
      settings.width = width_heights[settings.aspectratio].width
      settings.height = width_heights[settings.aspectratio].height
    }
  })

  async function handle_keypress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Handle the enter key press
    }
  }

  async function get_new_session() {
    const response = await fetch('/api/swarmui', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api: 'GetNewSession',
        params: {}
      })
    })
    const data = await response.json()
    console.log(data)
    return data
  }

  async function list_t2i_params() {
    const response = await fetch('/api/swarmui', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api: 'ListT2IParams',
        params: {
          session_id: session.session_id
        }
      })
    })
    const data = await response.json()
    console.log(data)
    return data
  }

  async function list_images() {
    const response = await fetch('/api/swarmui', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api: 'ListImages',
        params: {
          session_id: session.session_id,
          path: '',
          depth: 2,
          sortBy: 'Date',
          sortReverse: false
        }
      })
    })
    const data = await response.json()
    console.log(data)
    return data
  }

  async function handle_generate() {
    save_json(settings, 'settings.json')
    // save_yaml(wildcards, 'wildcards.yaml')
    // Create WebSocket connection
    const ws = new WebSocket('ws://localhost:7801/API/GenerateText2ImageWS')

    ws.onopen = () => {
      const { prompt, selections } = process_wildcards(settings.template, wildcards, settings)
      settings.prompt = prompt
      settings.selections = selections
      save_json(settings, 'settings.json')
      // Send parameters once connected
      ws.send(
        JSON.stringify({
          session_id: session.session_id,
          images: 1,
          prompt: prompt,
          negativeprompt: settings.negativeprompt,
          model: settings.model,
          seed: settings.seed,
          steps: settings.steps,
          cfgscale: settings.cfgscale,
          aspectratio: settings.aspectratio,
          width: settings.width,
          height: settings.height,
          sampler: settings.sampler,
          scheduler: settings.scheduler,
          refinermodel: settings.refinermodel,
          refinercontrolpercentage: settings.refinercontrolpercentage,
          refinermethod: settings.refinermethod,
          refinerupscalemethod: settings.refinerupscalemethod,
          refinercfgscale: settings.refinercfgscale,
          refinerupscale: settings.refinerupscale,
          automaticvae: settings.automaticvae,
          vae: settings.vae
        })
      )
    }

    ws.onmessage = (event) => {
      const wsData = JSON.parse(event.data)
      if (wsData.backend_status) {
        status_message = `Status: ${wsData.backend_status.status}`
      }
      if (wsData.gen_progress) {
        status_message = ''
        overall_percent = Math.round(wsData.gen_progress.overall_percent * 100)
        current_percent = Math.round(wsData.gen_progress.current_percent * 100)
        if (wsData.gen_progress.preview) {
          preview_image = wsData.gen_progress.preview
        }
      }
      if (wsData.image) {
        image = 'http://localhost:7801/' + wsData.image
        ws.close()
        overall_percent = 0
        preview_image = ''
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
    }
  }

  function set_params(params: any) {
    for (const param of params.list) {
      if (param.id === 'aspectratio') {
        aspect_ratios = param.values
        aspect_ratio_labels = param.value_names
      } else if (param.id === 'refinermethod') {
        refiner_methods = param.values
        refiner_method_labels = param.value_names
      } else if (param.id === 'refinerupscalemethod') {
        refiner_upscale_methods = param.values
        refiner_upscale_method_labels = param.value_names
      } else if (param.id === 'sampler') {
        samplers = param.values
        sampler_labels = param.value_names
      } else if (param.id === 'scheduler') {
        schedulers = param.values
        scheduler_labels = param.value_names
      } else if (param.id === 'vae') {
        vaes = param.values
        vae_labels = param.value_names
      }
    }
  }

  onMount(async () => {
    wildcards = data.wildcards
    settings = data.settings
    if (!settings.selection) {
      settings.selection = {}
      for (const slot of Object.keys(wildcards)) {
        settings.selection[slot] = 'random'
      }
    }
    session = await get_new_session()
    params = await list_t2i_params()
    set_params(params)
    images = await list_images()
    if (images.files.length > 0) {
      image = 'http://localhost:7801/View/local/' + images.files[0].src
      const metadata = JSON.parse(images.files[0].metadata)
      // settings = { ...settings, ...metadata.sui_image_params }
    }
  })
</script>

<div class="grid grid-cols-[20rem_1fr] gap-2">
  <div class="scrollbar-none flex max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto">
    <h1 class="text-3xl font-bold">Wild Swarm</h1>
    {#if session}
      <div class="text-zinc-400">SwarmUI version: <em>{session.version}</em></div>
    {/if}
    <SlotList bind:wildcards bind:settings />
    <button class="primary m-[2px] mt-4 border-1 text-sm" onclick={handle_generate}>Generate</button>
    <label class="mt-2 text-sm"
      ><input type="checkbox" class="translate-y-[1px]" bind:checked={settings.auto_template} />Auto template</label
    >
    <label class="mt-2 text-sm"
      ><input type="checkbox" class="translate-y-[1px]" bind:checked={settings.show_selection} />Show chosen selection</label
    >
    {#if !settings.auto_template}
      <label class="mt-2 text-sm"
        >Template
        <textarea class="mt-1 h-60 w-full" bind:value={settings.template} onkeypress={handle_keypress}
        ></textarea></label
      >
    {/if}
    <label class="m-[2px] mt-2 text-sm"
      >Prompt
      <textarea class="mt-1 h-50 w-full" bind:value={settings.prompt} onkeypress={handle_keypress}></textarea></label
    >
    {#if params.models}
      <label class="m-[2px] mt-2 text-sm"
        >Model
        <Select
          iclass="max-w-79"
          items={params.models['Stable-Diffusion'].map((x: any) => x.replace('.safetensors', ''))}
          bind:value={settings.model}
        />
      </label>
      <label class="m-[2px] mt-2 text-sm"
        >Refiner Model
        <Select
          iclass="max-w-79"
          items={params.models['Stable-Diffusion'].map((x: any) => x.replace('.safetensors', ''))}
          bind:value={settings.refinermodel}
        />
      </label>
    {/if}
    <label class="m-[2px] mt-2 text-sm"
      >Negative prompt
      <textarea class="mt-1 h-20 w-full" bind:value={settings.negativeprompt} onkeypress={handle_keypress}
      ></textarea></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Seed
      <input class="mt-1 w-full" type="number" bind:value={settings.seed} /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Steps
      <input class="mt-1 w-full" type="number" bind:value={settings.steps} /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >CFG Scale
      <input class="mt-1 w-full" type="number" bind:value={settings.cfgscale} step="0.5" /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Aspect Ratio
      <Select
        iclass="mt-1 w-full"
        items={aspect_ratios}
        labels={aspect_ratio_labels}
        bind:value={settings.aspectratio}
      /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Width
      <input class="mt-1 w-full" type="number" bind:value={settings.width} /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Height
      <input class="mt-1 w-full" type="number" bind:value={settings.height} /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Sampler
      <Select iclass="mt-1 w-full" items={samplers} labels={sampler_labels} bind:value={settings.sampler} /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Scheduler
      <Select
        iclass="mt-1 w-full"
        items={schedulers}
        labels={scheduler_labels}
        bind:value={settings.scheduler}
      /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Refiner control percentage
      <input class="mt-1 w-full" type="number" bind:value={settings.refinercontrolpercentage} step="0.1" />
    </label>
    <label class="m-[2px] mt-2 text-sm"
      >Refiner method
      <Select
        iclass="mt-1 w-full"
        items={refiner_methods}
        labels={refiner_method_labels}
        bind:value={settings.refinermethod}
      /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Refiner upscale method
      <Select
        iclass="mt-1 w-full"
        items={refiner_upscale_methods}
        labels={refiner_upscale_method_labels}
        bind:value={settings.refinerupscalemethod}
      /></label
    >
    <label class="m-[2px] mt-2 text-sm"
      >Refiner CFG scale
      <input class="mt-1 w-full" type="number" bind:value={settings.refinercfgscale} step="0.5" />
    </label>
    <label class="m-[2px] mt-2 text-sm"
      >Refiner upscale
      <input class="mt-1 w-full" type="number" bind:value={settings.refinerupscale} step="0.1" />
    </label>
    <label class="mt-2 text-sm"
      ><input type="checkbox" class="translate-y-[1px]" bind:checked={settings.automaticvae} />Automatic VAE</label
    >
    <label class="m-[2px] mt-2 text-sm"
      >VAE
      <Select iclass="mt-1 w-full" items={vaes} labels={vae_labels} bind:value={settings.vae} /></label
    >
  </div>
  <div>
    <div class="relative inline-block h-[calc(100vh-1rem)] w-full align-top leading-none">
      <img src={image} alt="generated" class="max-h-[calc(100vh-1rem)]" />
      {#if status_message}
        <div class="absolute bottom-0 left-0 p-1 text-sm">{status_message}</div>
      {/if}
      {#if preview_image}
        <img src={preview_image} alt="preview" class="absolute bottom-0 left-0 h-50" />
      {/if}
      {#if overall_percent > 0}
        <div class="absolute right-0 bottom-0 left-0 h-2">
          <div class="h-1 bg-green-600 transition-all" style={`width: ${current_percent}%`}></div>
          <div class="h-1 bg-sky-600 transition-all" style={`width: ${overall_percent}%`}></div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
</style>

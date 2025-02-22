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
      settings.prompt = process_wildcards(settings.template, wildcards, settings)
      // Send parameters once connected
      ws.send(
        JSON.stringify({
          session_id: session.session_id,
          images: 1,
          prompt: settings.prompt,
          negativeprompt:
            'text, watermark, low-quality, signature, monochrome, 3d, censored, muscles, lores, worst quality, censored, mosaic',
          model: settings.model,
          seed: -1,
          steps: 50,
          cfgscale: 5.5,
          aspectratio: '2:3',
          width: 832,
          height: 1216,
          sampler: 'euler_ancestral',
          scheduler: 'simple',
          refinermodel: settings.refinermodel,
          refinercontrolpercentage: 0.2,
          refinermethod: 'PostApply',
          refinerupscalemethod: 'pixel-lanczos',
          automaticvae: true,
          vae: 'sdxlvae',
          refinercfgscale: 3.5,
          refinerupscale: 1.5
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
    images = await list_images()
    if (images.files.length > 0) {
      image = 'http://localhost:7801/View/local/' + images.files[0].src
      const metadata = JSON.parse(images.files[0].metadata)
      settings = { ...settings, ...metadata.sui_image_params }
      console.log(settings.model)
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
    <button class="primary mt-4 border-1 text-sm" onclick={handle_generate}>Generate</button>
    <label class="mt-2 text-sm"><input type="checkbox" bind:checked={settings.auto_template} />Auto template</label>
    {#if !settings.auto_template}
      <label class="mt-2 text-sm"
        >Template
        <textarea class="mt-1 h-60 w-full" bind:value={settings.template} onkeypress={handle_keypress}
        ></textarea></label
      >
    {/if}
    <label class="mt-2 text-sm"
      >Prompt
      <textarea class="mt-1 h-60 w-full" bind:value={settings.prompt} onkeypress={handle_keypress}></textarea></label
    >
    {#if params.models}
      <label class="mt-2 text-sm"
        >Model
        <Select
          inner_class="max-w-80"
          items={params.models['Stable-Diffusion'].map((x: any) => x.replace('.safetensors', ''))}
          bind:value={settings.model}
        />
      </label>
      <label class="mt-2 text-sm"
        >Refiner Model
        <Select
          inner_class="max-w-80"
          items={params.models['Stable-Diffusion'].map((x: any) => x.replace('.safetensors', ''))}
          bind:value={settings.refinermodel}
        />
      </label>
    {/if}
  </div>
  <div>
    <div class="relative inline-block align-top leading-none">
      <img src={image} alt="generated" class="max-h-[calc(100vh-2rem)]" />
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
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-none {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>

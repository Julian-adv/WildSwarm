<script lang="ts">
  import Select from '$lib/Select.svelte'
  import { onMount } from 'svelte'

  let session: any = $state({})
  let image: string = $state('')
  let params: any = $state({})
  let images: any = $state({})
  let settings: any = $state({})

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
    // Create WebSocket connection
    const ws = new WebSocket('ws://localhost:7801/API/GenerateText2ImageWS')

    ws.onopen = () => {
      // Send parameters once connected
      ws.send(
        JSON.stringify({
          session_id: session.session_id,
          images: 1,
          prompt:
            'score_9, score_8_up, score_7_up, score_6_up, content_explicit, source_anime, high quality, high contrast, realistic, 2girls, maid',
          negativeprompt:
            'text, watermark, low-quality, signature, monochrome, 3d, censored, muscles, lores, worst quality, censored, mosaic',
          model: settings.model,
          seed: 790918513,
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
      console.log(wsData)
      if (wsData.image) {
        image = 'http://localhost:7801/' + wsData.image
        ws.close()
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
    session = await get_new_session()
    params = await list_t2i_params()
    images = await list_images()
    if (images.files.length > 0) {
      image = 'http://localhost:7801/View/local/' + images.files[0].src
      const metadata = JSON.parse(images.files[0].metadata)
      settings = { ...metadata.sui_image_params }
      console.log(settings.model)
    }
  })
</script>

<div class="flex flex-row gap-4">
  <div class="flex max-w-80 flex-col">
    <h1 class="text-3xl font-bold">Wild Swarm</h1>
    {#if session}
      <div class="text-zinc-400">SwarmUI version: <em>{session.version}</em></div>
    {/if}
    <label class="mt-4"
      >Prompt
      <textarea class="h-96 w-full" bind:value={settings.prompt} onkeypress={handle_keypress}></textarea></label
    >
    {#if params.models}
      <label class="mt-4"
        >Model
        <Select
          inner_class="max-w-80"
          items={params.models['Stable-Diffusion'].map((x: any) => x.replace('.safetensors', ''))}
          bind:value={settings.model}
        />
      </label>
      <label class="mt-4"
        >Refiner Model
        <Select
          inner_class="max-w-80"
          items={params.models['Stable-Diffusion'].map((x: any) => x.replace('.safetensors', ''))}
          bind:value={settings.refinermodel}
        />
      </label>
      <button class="mt-4 border-1" onclick={handle_generate}>Generate</button>
    {/if}
  </div>
  <div class="flex-grow">
    <img src={image} alt="generated" class="max-h-[97vh]" />
  </div>
</div>

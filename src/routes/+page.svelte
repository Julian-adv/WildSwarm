<script lang="ts">
  import { onMount } from 'svelte'

  let prompt: string = $state('')
  let session: any = $state({})
  let image: string = $state('')
  let params: any = $state({})

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

  async function handle_generate() {
    // Create WebSocket connection
    const ws = new WebSocket('ws://localhost:7801/API/GenerateText2ImageWS')

    ws.onopen = () => {
      // Send parameters once connected
      ws.send(
        JSON.stringify({
          session_id: session.session_id,
          images: 1,
          prompt: prompt,
          model: 'Illustrious/uncannyValley_ilxl10Noob',
          width: 832,
          height: 1216
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
  })
</script>

<h1 class="text-3xl font-bold">Wild Swarm</h1>
{#if session}
  <div class="text-zinc-400">SwarmUI version: <em>{session.version}</em></div>
{/if}
<label class="mt-4 block"
  >Prompt
  <textarea class="h-96 w-full" bind:value={prompt} onkeypress={handle_keypress}></textarea></label
>
<button class="mt-4 border-1" onclick={handle_generate}>Generate</button>

<img src={image} alt="generated" />

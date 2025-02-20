<script lang="ts">
  import Dialog from './Dialog.svelte'
  import { onMount } from 'svelte'
  import ShiftIcon from './keyboard-shift-svgrepo-com.svg'
  import EnterIcon from './keyboard-enter-svgrepo-com.svg'

  interface Props {
    open: boolean
    slot_name: string
    slot_values: string[]
    onok: () => void
  }
  let { open = $bindable(), slot_name = $bindable(), slot_values = $bindable(), onok }: Props = $props()
  let slot_name_input: HTMLInputElement

  $effect(() => {
    if (open) {
      slot_name_input.focus()
    }
  })

  function add_value() {
    slot_values = [...slot_values, '']
  }
</script>

<Dialog bind:open title="Add slot" ok_button="Add slot" {onok}>
  <div class="flex flex-col">
    <div class="mt-2 grid grid-cols-[10rem_1fr] gap-2">
      <div class="">Name</div>
      <div><input class="xs w-full" bind:value={slot_name} bind:this={slot_name_input} /></div>
      <div class="">Values</div>
      <div class="flex flex-col gap-2">
        {#each slot_values as _, i (i)}
          <input class="xs w-full" bind:value={slot_values[i]} />
        {/each}
        <button class="w-40" onclick={add_value}
          >Add
          <div class="inline font-mono">⇧+⏎</div>
        </button>
      </div>
    </div>
  </div>
</Dialog>

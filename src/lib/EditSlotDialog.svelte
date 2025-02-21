<script lang="ts">
  import Dialog from './Dialog.svelte'

  interface Props {
    open: boolean
    title: string
    slot_name: string
    slot_values: string[]
    ok_button: string
    onok: () => void
  }

  let {
    open = $bindable(),
    title,
    slot_name = $bindable(),
    slot_values = $bindable(),
    ok_button,
    onok
  }: Props = $props()
  let slot_name_input: HTMLInputElement
  let last_value_input: HTMLInputElement

  $effect(() => {
    if (open) {
      slot_name_input.focus()
    }
  })

  function add_value() {
    slot_values = [...slot_values, '']
    // Focus the new input after the next render
    setTimeout(() => last_value_input?.focus(), 0)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault()
      add_value()
    }
  }

  function handleInputRef(element: HTMLInputElement, index: number) {
    if (index === slot_values.length - 1) {
      last_value_input = element
    }
  }
</script>

<Dialog bind:open {title} {ok_button} {onok}>
  <div class="flex flex-col">
    <div class="mt-2 grid grid-cols-[10rem_1fr] gap-2">
      <div class="">Name</div>
      <div><input class="xs w-full" bind:value={slot_name} bind:this={slot_name_input} /></div>
      <div class="">Values</div>
      <div class="flex flex-col gap-2">
        {#each slot_values as _, i (i)}
          <input class="xs w-full" bind:value={slot_values[i]} use:handleInputRef={i} onkeydown={handleKeydown} />
        {/each}
        <button class="w-40" onclick={add_value}
          >Add
          <div class="inline font-mono">⇧+⏎</div>
        </button>
      </div>
    </div>
  </div>
</Dialog>

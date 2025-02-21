<script lang="ts">
  import Dialog from '$lib/Dialog.svelte'
  import { Trash } from 'svelte-heros-v2'

  interface Props {
    open: boolean
    title: string
    slot_name: string
    slot_values: string[]
    ok_button: string
    on_ok: (slot_name: string, slot_values: string[]) => string
    on_delete?: (slot_name: string) => void
  }

  let {
    open = $bindable(),
    title,
    slot_name = $bindable(),
    slot_values = $bindable(),
    ok_button,
    on_ok,
    on_delete
  }: Props = $props()
  let slot_name_input: HTMLInputElement
  let last_value_input: HTMLInputElement
  let dialog: Dialog

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

  function internal_on_ok() {
    return on_ok?.(slot_name, slot_values)
  }

  function delete_slot() {
    if (confirm('Do you want to delete this slot?')) {
      const err = on_delete?.(slot_name)
      if (err) {
        dialog.set_error_message(err)
      } else {
        open = false
      }
    }
  }
</script>

<Dialog bind:this={dialog} bind:open {title} {ok_button} on_ok={internal_on_ok}>
  <div class="flex flex-col">
    <div class="mt-2 grid grid-cols-[10rem_1fr] gap-2">
      <div class="">Name</div>
      <div class="flex items-center gap-1">
        <input class="xs w-full" bind:value={slot_name} bind:this={slot_name_input} />{#if on_delete}<button
            class="border-none p-1"
            onclick={delete_slot}><Trash size="20" /></button
          >{/if}
      </div>
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

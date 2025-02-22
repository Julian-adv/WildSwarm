<script lang="ts">
  import Dialog from '$lib/Dialog.svelte'
  import { Trash } from 'svelte-heros-v2'

  let open = $state(false)
  let title = $state('')
  let slot_name = $state('')
  let slot_values: { prob: string; value: string; disables: string }[] = $state([])
  let ok_button = $state('')
  let on_ok: (slot_name: string, slot_values: string[]) => string
  let on_delete: ((slot_name: string) => void) | undefined = $state(undefined)
  let slot_name_input: HTMLInputElement
  let last_value_input: HTMLInputElement
  let dialog: Dialog

  export function open_dialog(
    title_arg: string,
    slot_name_arg: string,
    slot_values_arg: string[],
    ok_button_arg: string,
    on_ok_arg: (slot_name: string, slot_values: string[]) => string,
    on_delete_arg?: (slot_name: string) => void
  ) {
    open = true
    title = title_arg
    slot_name = slot_name_arg
    slot_values = slot_values_arg.map((str) => {
      let prob = ''
      let value = str
      let disables = ''

      // Check if first part is a number (probability)
      const parts = str.split(',', 2)
      if (parts.length > 1 && /^\d+$/.test(parts[0])) {
        prob = parts[0]
        value = parts[1]
      }

      // Extract disables if exists
      const disablesParts = value.split('<disable>')
      if (disablesParts.length > 1) {
        value = disablesParts[0].trim()
        disables = disablesParts[1].trim()
      }

      return { prob, value, disables }
    })
    ok_button = ok_button_arg
    on_ok = on_ok_arg
    on_delete = on_delete_arg
    setTimeout(() => slot_name_input.focus(), 1)
  }

  function add_value() {
    slot_values = [...slot_values, { prob: '', value: '', disables: '' }]
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
    const combined_values = slot_values.map(({ prob, value, disables }) => {
      let result = value
      if (prob) {
        result = `${prob},${result}`
      }
      if (disables) {
        result = `${result} <disable> ${disables}`
      }
      return result
    })
    return on_ok?.(slot_name, combined_values)
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

  function delete_value(i: number) {
    return () => {
      slot_values.splice(i, 1)
      slot_values = slot_values
    }
  }

  let drag_source_index: number | null = null
  let drag_target_index: number | null = $state(null)

  function handleDragStart(index: number) {
    return (e: DragEvent) => {
      drag_source_index = index
      e.dataTransfer?.setData('text/plain', '') // Required for Firefox
    }
  }

  function handleDragOver(index: number) {
    return (e: DragEvent) => {
      e.preventDefault()
      drag_target_index = index
    }
  }

  function handleDragEnd() {
    if (drag_source_index !== null && drag_target_index !== null && drag_source_index !== drag_target_index) {
      const [moved_item] = slot_values.splice(drag_source_index, 1)
      const adjusted_target = drag_target_index > drag_source_index ? drag_target_index - 1 : drag_target_index
      slot_values.splice(adjusted_target, 0, moved_item)
      slot_values = slot_values
    }
    drag_source_index = null
    drag_target_index = null
  }

  function handleDragLeave() {
    drag_target_index = null
  }
</script>

<Dialog bind:this={dialog} bind:open {title} {ok_button} on_ok={internal_on_ok}>
  <div class="flex flex-col text-sm">
    <div class="mt-2 flex items-center gap-2">
      <div class="">Name</div>
      <input class="xs w-full" bind:value={slot_name} bind:this={slot_name_input} />
      {#if on_delete}
        <button class="border-none p-1" onclick={delete_slot}><Trash size="20" /></button>
      {/if}
    </div>
    <div class="mt-2 flex flex-col gap-1">
      <div class="flex gap-1">
        <div class="w-2"></div>
        <div class="w-8 text-right">%</div>
        <div class="grow-2">Values</div>
        <div class="grow-1">Disable slots</div>
        <div class="w-14"></div>
      </div>
      {#each slot_values as value, i (i)}
        <div
          class="flex cursor-move items-center gap-1 text-right"
          draggable="true"
          ondragstart={handleDragStart(i)}
          ondragover={handleDragOver(i)}
          ondragleave={handleDragLeave}
          ondragend={handleDragEnd}
          class:drag-over={drag_target_index === i}
          role="button"
          aria-label="Drag to reorder"
          tabindex="0"
        >
          <div class="w-2 min-w-2">⋮</div>
          <input class="xs w-8 text-right" bind:value={value.prob} />
          <input class="xs grow-2" bind:value={value.value} use:handleInputRef={i} onkeydown={handleKeydown} />
          <input class="xs grow-1" bind:value={value.disables} />
          <button class="border-none p-1" onclick={delete_value(i)}><Trash size="20" /></button>
        </div>
      {/each}
      <button class="ml-3 w-40" onclick={add_value}
        >Add
        <div class="inline font-mono">⇧+⏎</div>
      </button>
    </div>
  </div>
</Dialog>

<style>
  .drag-over {
    position: relative;
  }
  .drag-over::after {
    content: '';
    position: absolute;
    left: 0px;
    right: 0px;
    top: -2px;
    height: 2px;
    background-color: #4299e1;
    transform: translateY(-50%);
  }
</style>

<script lang="ts">
  import Dialog from '$lib/Dialog.svelte'
  import { Trash } from 'svelte-heros-v2'
  import { flip } from 'svelte/animate'
  import DragList from '$lib/DragList.svelte'

  let open = $state(false)
  let title = $state('')
  let slot_name = $state('')
  let slot_values: { prob: string; prefixes: string[]; value: string; disables: string }[] = $state([])
  let ok_button = $state('')
  let on_ok: (slot_name: string, slot_values: string[]) => string
  let on_delete: ((slot_name: string) => void) | undefined = $state(undefined)
  let slot_name_input: HTMLInputElement
  let last_value_input: HTMLInputElement
  let dialog: Dialog
  let prefix_input_refs: HTMLInputElement[][] = $state([])
  let original_prefixes: string[] | null = null

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
      let prefixes: string[] = ['']
      let value = str
      let disables = ''

      // Check if first part is a number (probability)
      const parts = str.split(',', 2)
      if (parts.length > 1 && /^\d+$/.test(parts[0])) {
        prob = parts[0]
        value = parts[1]
      }

      // Check for {abc|def|ghi} pattern
      const match = value.match(/\{([^}]+)\} */)
      if (match) {
        const content = match[1]
        prefixes = content.split('|')
        value = value.replace(match[0], '')
      }

      // Extract disables if exists
      const disablesParts = value.split('<disable>')
      if (disablesParts.length > 1) {
        value = disablesParts[0].trim()
        disables = disablesParts[1].trim()
      }

      return { prob, prefixes, value, disables }
    })
    ok_button = ok_button_arg
    for (let i = 0; i < slot_values.length; i++) {
      prefix_input_refs[i] = []
    }
    on_ok = on_ok_arg
    on_delete = on_delete_arg
    setTimeout(() => slot_name_input.focus(), 1)
  }

  function add_value() {
    slot_values = [...slot_values, { prob: '', prefixes: [''], value: '', disables: '' }]
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
    const combined_values = slot_values.map(({ prob, prefixes, value, disables }) => {
      let result = value
      if (prefixes && prefixes.length > 0 && !(prefixes.length === 1 && prefixes[0] === '')) {
        result = `{${prefixes.join('|')}} ${result}`
      }
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

  function handlePrefixInput(event: KeyboardEvent, i: number, j: number) {
    if (event.key === '|') {
      event.preventDefault()
      slot_values[i].prefixes.splice(j + 1, 0, '')
      slot_values = slot_values
    }
  }

  function delete_prefix(i: number, j: number) {
    return () => {
      if (slot_values[i].prefixes.length === 1) {
        return
      }
      slot_values[i].prefixes.splice(j, 1)
      slot_values = slot_values
      // Wait for Svelte to update the DOM
      setTimeout(() => {
        prefix_input_refs[i]?.[j + 1]?.focus()
      })
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

  let prefix_drag_source: { row: number; col: number } | null = $state(null)
  let prefix_drag_target: { row: number; col: number } | null = $state(null)
  let prefix_drag_source_elem: string | null = $state(null)
  let prefix_drag_target_elem: string | null = $state(null)

  function handlePrefixDragStart(row: number, col: number) {
    return (e: DragEvent) => {
      e.stopPropagation()
      prefix_drag_source = { row, col }
      prefix_drag_source_elem = slot_values[row].prefixes[col]
      original_prefixes = [...slot_values[row].prefixes]
      e.dataTransfer?.setData('text/plain', '')
    }
  }

  function handlePrefixDragOver(row: number, col: number) {
    return (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log(row, col, slot_values[row].prefixes)
      prefix_drag_target_elem = slot_values[row].prefixes[col]
      if (
        prefix_drag_source &&
        original_prefixes &&
        row === prefix_drag_source.row &&
        col !== prefix_drag_source.col &&
        prefix_drag_source_elem !== prefix_drag_target_elem
      ) {
        console.log(row, col, prefix_drag_source_elem, prefix_drag_target_elem)
        prefix_drag_target = { row, col }
        const prefixes = [...original_prefixes]
        const [moved_item] = prefixes.splice(prefix_drag_source.col, 1)
        const adjusted_target = col > prefix_drag_source.col ? col - 1 : col
        prefixes.splice(adjusted_target, 0, moved_item)
        slot_values[row].prefixes = prefixes
        slot_values = slot_values
        console.log(slot_values[row].prefixes)
      }
    }
  }

  function handlePrefixDragEnd() {
    if (
      prefix_drag_source &&
      prefix_drag_target &&
      original_prefixes &&
      prefix_drag_source.row !== prefix_drag_target.row
    ) {
      // Restore original order if drag was cancelled
      slot_values[prefix_drag_source.row].prefixes = original_prefixes
      slot_values = slot_values
    }
    prefix_drag_source = null
    prefix_drag_target = null
    original_prefixes = null
  }

  function handlePrefixDragLeave() {
    // if (original_prefixes && prefix_drag_source) {
    //   // Restore original order when dragging outside
    //   slot_values[prefix_drag_source.row].prefixes = original_prefixes
    //   slot_values = slot_values
    // }
    // prefix_drag_target = null
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
    <div class="mt-2 flex flex-col">
      <div class="flex gap-1">
        <div class="w-2 shrink-0"></div>
        <div class="w-8 shrink-0 text-right">%</div>
        <div class="w-full grow-1 pl-1">Prefixes</div>
        <div class="w-40 shrink-0">Values</div>
        <div class="w-40 shrink-0">Disable slots</div>
        <div class="w-7 shrink-0"></div>
      </div>
      {#each slot_values as value, i (i)}
        <div
          class="flex cursor-move items-center gap-1 text-right even:bg-slate-100"
          draggable="true"
          ondragstart={handleDragStart(i)}
          ondragover={handleDragOver(i)}
          ondragleave={handleDragLeave}
          ondragend={handleDragEnd}
          class:drag-over={drag_target_index === i && prefix_drag_source === null}
          role="button"
          aria-label="Drag to reorder"
          tabindex="0"
        >
          <div class="w-2 min-w-2">⋮</div>
          <input class="xs w-8 text-right" bind:value={value.prob} />
          <DragList
            container_class="xs scrollbar-1 flex w-full grow-1 flex-wrap gap-1 p-[2px]"
            draggable_class="flex cursor-move items-center gap-[3px] rounded border-1 border-stone-300"
            bind:items={value.prefixes}
          >
            {#snippet children(j)}
              {#if value.prefixes.length > 1}
                <div class="w-3">⋮</div>
              {/if}
              <input
                class="xs min-w-8 border-none"
                size={value.prefixes[j].length || 1}
                bind:value={value.prefixes[j]}
                bind:this={prefix_input_refs[i][j]}
                onkeydown={(e) => handlePrefixInput(e, i, j)}
              />
              {#if value.prefixes.length > 1}
                <button class="border-none p-0 text-stone-300" onclick={delete_prefix(i, j)}><Trash size="16" /></button
                >
              {/if}
            {/snippet}
          </DragList>
          <input class="xs w-40" bind:value={value.value} use:handleInputRef={i} />
          <input class="xs w-40" bind:value={value.disables} />
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
    top: -1px;
    height: 2px;
    background-color: #4299e1;
  }

  .prefix-drag-over {
    opacity: 0.1;
  }
</style>

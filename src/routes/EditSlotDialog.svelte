<script lang="ts">
  import Dialog from '$lib/Dialog.svelte'
  import { Trash } from 'svelte-heros-v2'
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
    prefix_input_refs = [...prefix_input_refs, []]
    // Focus the new input after the next render
    setTimeout(() => last_value_input?.focus(), 0)
  }

  function handle_keydown(event: KeyboardEvent) {
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
      setTimeout(() => prefix_input_refs[i][j + 1]?.focus(), 0)
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
    <DragList
      container_class="mt-2 flex flex-col"
      draggable_class="flex cursor-move items-center gap-1 text-right even:bg-slate-100"
      bind:items={slot_values}
    >
      {#snippet header()}
        <div class="flex gap-1">
          <div class="w-2 shrink-0"></div>
          <div class="w-8 shrink-0 text-right">%</div>
          <div class="w-full grow-1 pl-1">Prefixes</div>
          <div class="w-40 shrink-0">Values</div>
          <div class="w-40 shrink-0">Disable slots</div>
          <div class="w-7 shrink-0"></div>
        </div>
      {/snippet}
      {#snippet children(value, i)}
        <div class="w-2 min-w-2">⋮</div>
        <input class="xs w-8 text-right" bind:value={value.prob} />
        <DragList
          container_class="xs scrollbar-1 flex w-full grow-1 flex-wrap gap-1 p-[2px]"
          draggable_class="flex cursor-move items-center gap-[3px] rounded border-1 border-stone-300"
          bind:items={value.prefixes}
        >
          {#snippet children(prefix, j)}
            {#if value.prefixes.length > 1}
              <div class="w-3">⋮</div>
            {/if}
            <input
              class="xs min-w-8 border-none"
              size={prefix.length || 1}
              bind:value={value.prefixes[j]}
              bind:this={prefix_input_refs[i][j]}
              onkeydown={(e) => handlePrefixInput(e, i, j)}
            />
            {#if value.prefixes.length > 1}
              <button class="border-none p-0 text-stone-300" onclick={delete_prefix(i, j)}><Trash size="16" /></button>
            {/if}
          {/snippet}
        </DragList>
        <input class="xs w-40" bind:value={value.value} use:handleInputRef={i} onkeydown={handle_keydown} />
        <input class="xs w-40" bind:value={value.disables} />
        <button class="border-none p-1" onclick={delete_value(i)}><Trash size="20" /></button>
      {/snippet}
    </DragList>
    <button class="ml-3 w-40" onclick={add_value}
      >Add
      <div class="inline font-mono">⇧+⏎</div>
    </button>
  </div>
</Dialog>

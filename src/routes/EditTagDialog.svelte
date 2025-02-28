<script lang="ts">
  import Dialog from '$lib/Dialog.svelte'

  let open = $state(false)
  let title = $state('')
  let ok_button = $state('')
  let on_ok: (slot_name: string) => string
  let slot_name = $state('')
  let slot_name_input: HTMLInputElement

  export function open_dialog(title_arg: string, ok_button_arg: string, on_ok_arg: (slot_name: string) => string) {
    open = true
    title = title_arg
    slot_name = ''
    ok_button = ok_button_arg
    on_ok = on_ok_arg
    setTimeout(() => slot_name_input?.focus(), 1)
  }

  function internal_on_ok() {
    return on_ok?.(slot_name)
  }

  function handle_keydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      internal_on_ok()
      open = false
    }
  }
</script>

<Dialog bind:open {title} iclass="max-w-xl" {ok_button} on_ok={internal_on_ok}>
  <div class="mt-2 grid grid-cols-2 items-center gap-2 text-right">
    <div>Slot name</div>
    <input type="text" class="w-full" bind:value={slot_name} bind:this={slot_name_input} onkeydown={handle_keydown} />
  </div>
</Dialog>

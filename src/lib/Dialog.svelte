<script lang="ts">
  import { XMark } from 'svelte-heros-v2'
  interface Props {
    open: boolean
    title: string
    ok_button: string
    onok?: () => void
    children: any
  }
  let { open = $bindable(), title, ok_button, onok, children }: Props = $props()

  function close_dialog() {
    open = false
  }

  function ok_clicked() {
    close_dialog()
    onok?.()
  }

  function handle_keydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      close_dialog()
    }
  }
</script>

{#if open}
  <div
    class="fixed top-0 left-0 z-50 h-full w-full bg-black/60"
    class:hidden={!open}
    onclick={close_dialog}
    onkeydown={handle_keydown}
    tabindex="0"
    role="button"
    aria-label="Close dialog"
  ></div>

  <div
    class="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform rounded bg-white p-4"
  >
    <h2 class="w-full text-center">{title}</h2>
    <button class="absolute top-2 right-2 border-none px-0 py-0" onclick={close_dialog}><XMark size="24" /></button>
    {@render children()}
    <div class="mt-4 flex flex-row justify-end gap-4">
      <button class="primary w-auto" onclick={ok_clicked}>{ok_button}</button>
      <button class="w-auto" onclick={close_dialog}>Cancel</button>
    </div>
  </div>
{/if}

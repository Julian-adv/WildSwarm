<script lang="ts">
  import Dialog from '$lib/Dialog.svelte'
  import type { DanbooruSettings } from '$lib/settings'

  let open = $state(false)
  let title = $state('')
  let ok_button = $state('')
  let on_ok: (settings: DanbooruSettings) => string
  let danbooru_settings = $state({ max_tags: 5000, num_tags: 15 })

  export function open_dialog(
    title_arg: string,
    ok_button_arg: string,
    on_ok_arg: (settings: DanbooruSettings) => string
  ) {
    open = true
    title = title_arg
    ok_button = ok_button_arg
    on_ok = on_ok_arg
  }

  function internal_on_ok() {
    return on_ok?.(danbooru_settings)
  }
</script>

<Dialog bind:open {title} iclass="max-w-xl" {ok_button} on_ok={internal_on_ok}>
  <div class="mt-2 grid grid-cols-2 items-center gap-2">
    <div class="text-right">Number of tags to consider</div>
    <input type="number" class="w-full" bind:value={danbooru_settings.max_tags} />
    <div class="text-right">Number of tags to select</div>
    <input type="number" class="w-full" bind:value={danbooru_settings.num_tags} />
  </div></Dialog
>

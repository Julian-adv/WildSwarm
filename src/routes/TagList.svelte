<script lang="ts">
  import { AdjustmentsHorizontal, ArrowPathRoundedSquare } from 'svelte-heros-v2'
  import EditTagsDialog from './EditTagsDialog.svelte'
  import type { DanbooruSettings } from '$lib/settings'
  import { load_text } from '$lib/file'

  interface Props {
    tags: string[]
    settings: any
  }
  let { tags = $bindable(), settings = $bindable() }: Props = $props()

  let dialog: EditTagsDialog
  let lines: string[] = $state([])

  function edit_tags() {
    dialog.open_dialog('Edit tags', tags, 'Save', edit_tags_ok)
  }

  export async function populate() {
    await populate_tags(settings.danbooru_settings.max_tags, settings.danbooru_settings.num_tags)
  }

  async function populate_tags(max_tags: number, num_tags: number) {
    if (lines.length === 0) {
      const result = await load_text('danbooru_tags.txt')
      if (!result.success) {
        return
      }
      lines = result.data.split('\n')
    }

    if (lines.length > 0) {
      tags = get_random_elements(lines, max_tags, num_tags)
    }
  }

  function get_random_elements(array: string[], max_count: number, count: number) {
    const result: string[] = []
    const len = array.length

    // Handle the case where the count is larger than the array length
    if (count >= len) return [...array]
    if (max_count > len) max_count = len
    if (count > max_count) count = max_count

    // Select random indices without duplication
    const indices = new Set<number>()
    while (indices.size < count) {
      const randomIndex = Math.floor(Math.random() * max_count)
      indices.add(randomIndex)
    }

    // Return elements at the selected indices
    for (const index of indices) {
      result.push(array[index])
    }

    return result
  }

  function edit_tags_ok(danbooru_settings: DanbooruSettings) {
    settings.danbooru_settings = { ...danbooru_settings }
    populate_tags(danbooru_settings.max_tags, danbooru_settings.num_tags)
    return ''
  }
</script>

<div class="flex flex-col">
  {#each tags as tag}
    <div>{tag}</div>
  {/each}
  <div class="flex items-center">
    <button class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs" onclick={edit_tags}
      ><AdjustmentsHorizontal size="16" />Edit tags</button
    >
    <button
      class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs"
      onclick={(e) => populate_tags(settings.danbooru_settings.max_tags, settings.danbooru_settings.num_tags)}
      ><ArrowPathRoundedSquare size="16" />Populate</button
    >
  </div>
</div>
<EditTagsDialog bind:this={dialog}></EditTagsDialog>

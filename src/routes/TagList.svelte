<script lang="ts">
  import { AdjustmentsHorizontal, ArrowPathRoundedSquare, ChevronLeft, ChevronRight, XMark } from 'svelte-heros-v2'
  import EditTagsDialog from './EditTagsDialog.svelte'
  import type { DanbooruSettings } from '$lib/settings'
  import { load_text, save_json } from '$lib/file'

  interface Props {
    tags: string[]
    danbooru_settings: DanbooruSettings
  }
  let { tags = $bindable(), danbooru_settings = $bindable() }: Props = $props()

  let dialog: EditTagsDialog
  let lines: string[] = $state([])

  function edit_tags() {
    dialog.open_dialog('Edit tags', danbooru_settings, 'Save', edit_tags_ok)
  }

  export async function populate() {
    await populate_tags(danbooru_settings.max_tags, danbooru_settings.num_tags)
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
      await save_json(danbooru_settings, 'danbooru_settings.json')
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
    const groups = new Set<number>()
    while (indices.size < count) {
      const randomIndex = Math.floor(Math.random() * max_count)
      if (
        !danbooru_settings.banned_tags[array[randomIndex]] &&
        !groups.has(danbooru_settings.group[array[randomIndex]])
      ) {
        indices.add(randomIndex)
        if (danbooru_settings.group[array[randomIndex]]) {
          groups.add(danbooru_settings.group[array[randomIndex]])
        }
      }
    }

    // Return elements at the selected indices
    for (const index of indices) {
      result.push(array[index])
    }

    return result
  }

  function edit_tags_ok(params: DanbooruSettings) {
    danbooru_settings.max_tags = params.max_tags
    danbooru_settings.num_tags = params.num_tags
    populate_tags(danbooru_settings.max_tags, danbooru_settings.num_tags)
    return ''
  }

  function ban_tag(tag: string) {
    return async () => {
      if (!danbooru_settings.banned_tags) danbooru_settings.banned_tags = {}
      if (danbooru_settings.banned_tags[tag]) {
        delete danbooru_settings.banned_tags[tag]
      } else {
        danbooru_settings.banned_tags[tag] = true
      }
      danbooru_settings.banned_tags = danbooru_settings.banned_tags
      await save_json(danbooru_settings, 'danbooru_settings.json')
    }
  }

  function group_tag(tag: string, delta: number) {
    return async () => {
      if (!danbooru_settings.group) danbooru_settings.group = {}
      if (danbooru_settings.group[tag]) {
        danbooru_settings.group[tag] = danbooru_settings.group[tag] + delta
        if (danbooru_settings.group[tag] === 0) delete danbooru_settings.group[tag]
      } else {
        const max_group = Math.max(...Object.values(danbooru_settings.group))
        danbooru_settings.group[tag] = max_group + 1
      }
      danbooru_settings.group = danbooru_settings.group
      await save_json(danbooru_settings, 'danbooru_settings.json')
    }
  }

  function color_tag(tag: string) {
    if (danbooru_settings.banned_tags[tag]) {
      return 'bg-red-400/50'
    }
    const colors = [
      'bg-blue-400/50',
      'bg-green-400/50',
      'bg-yellow-400/50',
      'bg-red-400/50',
      'bg-purple-400/50',
      'bg-orange-400/50',
      'bg-teal-400/50',
      'bg-slate-400/50'
    ]
    if (danbooru_settings.group[tag]) {
      return colors[danbooru_settings.group[tag] % colors.length]
    }
    return 'even:bg-slate-50'
  }
</script>

<div class="mt-2 flex flex-col text-sm">
  <div class="font-bold">Tags</div>
  {#each tags as tag}
    <div class="flex items-center {color_tag(tag)}">
      {tag}
      <div class="grow-1"></div>
      <button class="border-none p-0 text-zinc-500 ring-0 focus:ring-0" onclick={group_tag(tag, -1)}>
        <ChevronLeft size="16" /></button
      >
      <div class="w-8">{danbooru_settings.group[tag] ?? ''}</div>
      <button class="border-none p-0 text-zinc-500 ring-0 focus:ring-0" onclick={group_tag(tag, 1)}>
        <ChevronRight size="16" /></button
      >
      <button class="border-none p-0 text-zinc-500 ring-0 focus:ring-0" onclick={ban_tag(tag)}>
        <XMark size="16" /></button
      >
    </div>
  {/each}
  <div class="flex items-center">
    <button class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs" onclick={edit_tags}
      ><AdjustmentsHorizontal size="16" />Edit tags</button
    >
    <button class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs" onclick={(e) => populate()}
      ><ArrowPathRoundedSquare size="16" />Populate</button
    >
  </div>
</div>
<EditTagsDialog bind:this={dialog}></EditTagsDialog>

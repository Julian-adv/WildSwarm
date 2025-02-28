<script lang="ts">
  import { AdjustmentsHorizontal, ArrowPathRoundedSquare, ChevronLeft, ChevronRight, XMark } from 'svelte-heros-v2'
  import EditTagsDialog from './EditTagsDialog.svelte'
  import type { DanbooruSettings } from '$lib/settings'
  import { load_text, save_json } from '$lib/file'
  import DropDown from '$lib/DropDown.svelte'
  import EditTagDialog from './EditTagDialog.svelte'

  interface Props {
    tags: string[]
    danbooru_settings: DanbooruSettings
  }
  let { tags = $bindable(), danbooru_settings = $bindable() }: Props = $props()

  let dialog: EditTagsDialog
  let tag_dialog: EditTagDialog
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
    const slots = new Set<string>()
    while (indices.size < count) {
      const randomIndex = Math.floor(Math.random() * max_count)
      if (
        !danbooru_settings.banned_tags[array[randomIndex]] &&
        !slots.has(danbooru_settings.slot[array[randomIndex]])
      ) {
        indices.add(randomIndex)
        if (danbooru_settings.slot[array[randomIndex]]) {
          slots.add(danbooru_settings.slot[array[randomIndex]])
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

  function color_tag(tag: string) {
    if (danbooru_settings.banned_tags[tag]) {
      return 'bg-red-400/50'
    }
    return 'even:bg-slate-50'
  }

  function edit_tag_ok(tag: string) {
    return (slot_name: string) => {
      if (!danbooru_settings.slots.includes(slot_name)) {
        danbooru_settings.slots.push(slot_name)
      }
      danbooru_settings.slot[tag] = slot_name
      save_json(danbooru_settings, 'danbooru_settings.json')
      return ''
    }
  }

  const add_slot_name = 'Add ...'
  const remove_slot_name = 'Remove'

  function assign_slot(tag: string) {
    return (slot: string): boolean => {
      if (slot === add_slot_name) {
        tag_dialog.open_dialog('Add slot', 'Save', edit_tag_ok(tag))
        return false
      } else if (slot === remove_slot_name) {
        delete danbooru_settings.slot[tag]
        save_json(danbooru_settings, 'danbooru_settings.json')
        return false
      } else {
        danbooru_settings.slot[tag] = slot
        save_json(danbooru_settings, 'danbooru_settings.json')
        return true
      }
    }
  }
</script>

<div class="mt-2 flex flex-col text-xs">
  <div class="font-bold">Tags</div>
  {#each tags as tag}
    <div class="mt-[1px] flex items-center px-1 py-[1px] {color_tag(tag)}">
      {tag}
      <div class="grow-1"></div>
      <DropDown
        items={danbooru_settings.slots.concat([remove_slot_name, add_slot_name])}
        bind:value={danbooru_settings.slot[tag]}
        iclass="max-w-60 xs ring-0 truncate min-w-8 min-h-[17px]"
        onchange={assign_slot(tag)}
      />
      <button class="border-none p-0 text-zinc-500 ring-0 focus:ring-0" onclick={ban_tag(tag)}>
        <XMark size="16" /></button
      >
    </div>
  {/each}
  <div class="flex items-center">
    <button class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs" onclick={edit_tags}
      ><AdjustmentsHorizontal size="16" />Settings</button
    >
    <button class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs" onclick={(e) => populate()}
      ><ArrowPathRoundedSquare size="16" />Populate</button
    >
  </div>
</div>
<EditTagsDialog bind:this={dialog}></EditTagsDialog>
<EditTagDialog bind:this={tag_dialog}></EditTagDialog>

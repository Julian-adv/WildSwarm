<script lang="ts">
  import { AdjustmentsHorizontal, ArrowPathRoundedSquare, ChevronLeft, ChevronRight, XMark } from 'svelte-heros-v2'
  import EditTagsDialog from './EditTagsDialog.svelte'
  import type { DanbooruSettings } from '$lib/settings'
  import { load_text, save_json } from '$lib/file'
  import DropDown from '$lib/DropDown.svelte'
  import EditTagDialog from './EditTagDialog.svelte'
  import DragList from '$lib/DragList.svelte'

  interface Props {
    tags: string[]
    danbooru_settings: DanbooruSettings
  }
  let { tags = $bindable(), danbooru_settings = $bindable() }: Props = $props()

  let dialog: EditTagsDialog
  let tag_dialog: EditTagDialog
  let lines: string[] = $state([])
  let danbooruWindow: Window | null = null

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

  function set_contains_list(set: Set<string>, list: string[]) {
    for (const item of list) {
      if (set.has(item)) return true
    }
    return false
  }

  function set_add_list(set: Set<string>, list: string[]) {
    for (const item of list) {
      set.add(item)
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
      const tag = array[randomIndex]
      if (!danbooru_settings.banned_tags[tag] && !groups.has(danbooru_settings.groups[tag])) {
        indices.add(randomIndex)
        if (danbooru_settings.groups[tag]) {
          groups.add(danbooru_settings.groups[tag])
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

  function group_to_color(group: number) {
    // Use the hash to select from a set of predefined pastel colors
    const colors = [
      'bg-blue-200/70',
      'bg-green-200/70',
      'bg-yellow-200/70',
      'bg-purple-200/70',
      'bg-pink-200/70',
      'bg-indigo-200/70',
      'bg-cyan-200/70',
      'bg-orange-200/70',
      'bg-lime-200/70'
    ]

    const colorIndex = Math.abs(group) % colors.length
    return colors[colorIndex]
  }

  function color_tag(tag: string): string {
    if (danbooru_settings.banned_tags[tag]) {
      return 'bg-red-400/50'
    }

    return 'even:bg-slate-50'
  }

  function group_color_tag(tag: string): string {
    if (danbooru_settings.groups[tag]) {
      return group_to_color(danbooru_settings.groups[tag])
    }
    return ''
  }

  function edit_tag_ok(tag: string) {
    return (group_name: string) => {
      return ''
    }
  }

  const add_slot_name = 'Add ...'
  const remove_slot_name = 'Remove'

  function openDanbooruTag(tag: string) {
    // URL-encode the tag to handle special characters
    const encodedTag = encodeURIComponent(tag)
    const url = `https://danbooru.donmai.us/posts?tags=${encodedTag}`

    // Try to focus existing window if it exists and isn't closed
    if (danbooruWindow && !danbooruWindow.closed) {
      danbooruWindow.location.href = url
      danbooruWindow.focus()
    } else {
      // Open new window and store reference
      danbooruWindow = window.open(url, '_blank')
    }

    return false // Prevent default link behavior
  }

  function new_group_number() {
    const max =
      danbooru_settings.group_list.length > 0
        ? danbooru_settings.group_list.reduce((max, current) => (current > max ? current : max), 0)
        : 0
    return max + 1
  }

  function reorder_tags(new_order: number[], drag_source: number | null, drag_target: number | null) {
    if (drag_source !== null && drag_target !== null) {
      if (drag_target > drag_source) {
        drag_target--
      }
      // Get the tags from source and target
      const sourceTag = tags[drag_source]
      const targetTag = tags[drag_target]

      // Create a group name based on combined tags if not already in a group
      const group_number =
        danbooru_settings.groups[sourceTag] || danbooru_settings.groups[targetTag] || new_group_number()

      // Assign both tags to the same group
      danbooru_settings.groups[sourceTag] = group_number
      danbooru_settings.groups[targetTag] = group_number

      // Make sure the group name is in the slots list
      if (!danbooru_settings.group_list.includes(group_number)) {
        danbooru_settings.group_list.push(group_number)
      }

      // Save the updated settings
      save_json(danbooru_settings, 'danbooru_settings.json')
    }
  }

  function drag_target_class(drag_target: number | null, index: number) {
    if (drag_target === null) return ''
    return drag_target + 1 === index ? 'border-1 border-sky-500 rounded' : ''
  }

  function same_group(index: number, tag: string) {
    return (
      danbooru_settings.groups[tag] !== undefined &&
      danbooru_settings.groups[tag] === danbooru_settings.groups[tags[index - 1]]
    )
  }
</script>

<DragList
  container_class="mt-2 text-xs"
  draggable_class="mt-1 flex cursor-move items-center gap-1 px-1 even:bg-slate-50"
  items={tags}
  ondrop={reorder_tags}
>
  {#snippet header()}
    <div class="flex justify-between px-1">
      <div class="font-bold">Tag</div>
      <div class="pr-6 font-bold">Slot</div>
    </div>
  {/snippet}
  {#snippet children(tag, index, drag_source, drag_target)}
    <div class="relative flex w-full gap-1 {color_tag(tag)}">
      {#if (drag_target !== null && drag_target + 1 === index) || same_group(index, tag)}
        <div
          class="pointer-events-none absolute -top-[22px] right-0 bottom-0 left-0 rounded border-1 border-sky-500 {group_color_tag(
            tag
          )}"
        ></div>
      {/if}
      <button class="xs max-w-72 truncate border-none focus:ring-0" onclick={() => openDanbooruTag(tag)}>{tag}</button>
      <div class="grow-1"></div>
      <button class="border-none p-0 text-zinc-500 ring-0 focus:ring-0" onclick={ban_tag(tag)}>
        <XMark size="16" /></button
      >
    </div>
  {/snippet}
</DragList>
<div class="flex items-center">
  <button class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs" onclick={edit_tags}
    ><AdjustmentsHorizontal size="16" />Settings</button
  >
  <button class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs" onclick={(e) => populate()}
    ><ArrowPathRoundedSquare size="16" />Populate</button
  >
</div>
<EditTagsDialog bind:this={dialog}></EditTagsDialog>
<EditTagDialog bind:this={tag_dialog}></EditTagDialog>

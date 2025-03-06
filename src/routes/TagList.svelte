<script lang="ts">
  import { AdjustmentsHorizontal, ArrowPathRoundedSquare, ChevronLeft, ChevronRight, XMark } from 'svelte-heros-v2'
  import EditTagsDialog from './EditTagsDialog.svelte'
  import type { DanbooruSettings } from '$lib/settings'
  import { load_text, save_json } from '$lib/file'
  import DropDown from '$lib/DropDown.svelte'
  import EditTagDialog from './EditTagDialog.svelte'
  import DragList from '$lib/DragList.svelte'

  interface Props {
    danbooru_settings: DanbooruSettings
  }
  let { danbooru_settings = $bindable() }: Props = $props()

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
      danbooru_settings.current_tags = get_random_elements(lines, max_tags, num_tags)
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
      'bg-blue-200/30',
      'bg-green-200/30',
      'bg-yellow-200/30',
      'bg-pink-200/30',
      'bg-indigo-200/30',
      'bg-cyan-200/30',
      'bg-orange-200/30',
      'bg-lime-200/30',
      'bg-red-200/30',
      'bg-violet-200/30',
      'bg-teal-200/30'
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

  function reorder_tags(original_items: string[], drag_source: number | null, drag_target: number | null) {
    if (drag_source !== null && drag_target !== null) {
      if (drag_target === drag_source) {
        drag_target += 1
      }
      // Get the tags from source and target
      const sourceTag = original_items[drag_source]
      const targetTag = original_items[drag_target]

      const source_group = danbooru_settings.groups[sourceTag]
      const target_group = danbooru_settings.groups[targetTag]

      // Only proceed with group assignment if at least one tag doesn't have a group
      if (!(source_group && target_group)) {
        // Determine which group number to use
        const group_number = source_group || target_group || new_group_number()

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
  }

  // Returns the height of a group at a given index
  // 0 if not in a group or not the last tag in the group
  function group_height(index: number, tag: string, drag_source: number | null, drag_target: number | null) {
    if (!danbooru_settings.groups[tag]) return 0

    const current_group = danbooru_settings.groups[tag]
    const next_tag =
      index + 1 < danbooru_settings.current_tags.length ? danbooru_settings.current_tags[index + 1] : null

    // If next tag exists and is in the same group, this is not the last
    if (next_tag && danbooru_settings.groups[next_tag] === current_group) {
      return 0
    }

    // Count previous tags in the same group
    let count = 1
    for (let i = index - 1; i >= 0; i--) {
      if (danbooru_settings.groups[danbooru_settings.current_tags[i]] === current_group) {
        count++
      } else {
        break
      }
    }

    return count
  }
</script>

<DragList
  container_class="mt-2 text-xs"
  draggable_class="mt-1 flex cursor-move items-center gap-1 px-1 even:bg-slate-50"
  bind:items={danbooru_settings.current_tags}
  ondrop={reorder_tags}
>
  {#snippet header()}
    <div class="flex justify-between px-1">
      <div class="font-bold">Tag</div>
      <div class="pr-6 font-bold">Slot</div>
    </div>
  {/snippet}
  {#snippet children(tag, index, drag_source, drag_target)}
    {@const h = group_height(index, tag, drag_source, drag_target)}
    <div class="relative flex w-full gap-1 {color_tag(tag)}">
      {#if h > 0}
        <div
          class="pointer-events-none absolute right-0 bottom-0 left-0 rounded border-1 border-sky-500 {group_color_tag(
            tag
          )}"
          style="top: {-22 * (h - 1)}px;"
        ></div>
      {/if}
      {#if drag_target !== null && drag_target + 1 === index}
        <div
          class="pointer-events-none absolute right-0 bottom-0 left-0 z-1 rounded border-1 border-red-500 bg-sky-200/20"
          style="top: {-22}px;"
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

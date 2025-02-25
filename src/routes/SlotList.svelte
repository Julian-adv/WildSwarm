<script lang="ts">
  import { save_json, save_yaml } from '$lib/file'
  import DropDown from '$lib/DropDown.svelte'
  import DragList from '$lib/DragList.svelte'
  import EditSlotDialog from './EditSlotDialog.svelte'
  import { PencilSquare, Plus } from 'svelte-heros-v2'

  interface Props {
    wildcards: any
    settings: any
  }

  let { wildcards = $bindable(), settings = $bindable() }: Props = $props()

  let hide_tooltip: string | null = $state(null)

  let original_slot_name: string
  let dialog: EditSlotDialog

  function reorder_slots(items: string[]) {
    const newWildcards: typeof wildcards = {}
    items.forEach((slot) => {
      newWildcards[slot] = wildcards[slot]
    })
    wildcards = newWildcards
    save_yaml(wildcards, 'wildcards.yaml')
  }

  function check_slot_name(slot: string): string {
    if (!slot) {
      return 'Slot name is required'
    }
    if (wildcards[slot]) {
      return 'Slot name already exists'
    }
    return ''
  }

  function add_slot() {
    dialog.open_dialog('Add slot', '', [''], 'Add', add_slot_ok)
  }

  function add_slot_ok(slot_name: string, slot_values: string[]): string {
    const err = check_slot_name(slot_name)
    if (err) {
      return err
    }
    wildcards[slot_name] = slot_values
    settings.selection[slot_name] = 'random'
    save_yaml(wildcards, 'wildcards.yaml')
    save_json(settings, 'settings.json')
    return ''
  }

  function edit_slot(slot: string) {
    return () => {
      original_slot_name = slot
      dialog.open_dialog('Edit slot', slot, wildcards[slot], 'Save', edit_slot_ok, delete_slot)
    }
  }

  function edit_slot_ok(slot_name: string, slot_values: string[]): string {
    if (!slot_name) {
      return 'Slot name is required'
    }
    wildcards[slot_name] = slot_values
    if (slot_name !== original_slot_name) {
      delete wildcards[original_slot_name]
      delete settings.selection[original_slot_name]
      settings.selection[slot_name] = 'random'
      settings = settings
    }
    save_yaml(wildcards, 'wildcards.yaml')
    save_json(settings, 'settings.json')
    return ''
  }

  function delete_slot(slot: string) {
    if (!slot) {
      return 'Slot name is required'
    }
    if (!wildcards[slot]) {
      return 'Slot name not found'
    }
    delete wildcards[slot]
    wildcards = wildcards
    delete settings.selection[slot]
    settings = settings
    save_yaml(wildcards, 'wildcards.yaml')
    save_json(settings, 'settings.json')
    return ''
  }

  function wildcards_values(slot: string) {
    return ['disabled', 'random', ...wildcards[slot]]
  }
</script>

<DragList
  container_class="mt-2 text-xs"
  draggable_class="mt-1 flex cursor-move items-center gap-1 px-1 even:bg-slate-50"
  items={Object.keys(wildcards)}
  ondrop={reorder_slots}
>
  {#snippet header()}
    <div class="flex flex-row px-1">
      <div class="font-bold">Slot</div>
      <div class="grow-1"></div>
      <div class="pr-6 font-bold">Value</div>
    </div>
  {/snippet}
  {#snippet children(slot, index)}
    <div
      role="listitem"
      class="relative flex w-full"
      onmouseenter={() => (hide_tooltip = slot)}
      onmouseleave={() => (hide_tooltip = null)}
    >
      <div>{slot}</div>
      <div class="grow-1"></div>
      <DropDown
        iclass="max-w-60 xs ring-0 truncate"
        popup_class="max-w-70"
        items={wildcards_values(slot)}
        bind:value={settings.selection[slot]}
      />
      {#if settings.show_selection && settings.selections && settings.selection[slot] === 'random' && hide_tooltip !== slot}
        <div
          class="xs absolute top-0 right-0 min-h-5 max-w-60 min-w-13 truncate rounded border-1 border-stone-300 bg-slate-50 {settings
            .selections[slot] === 'disabled'
            ? 'text-pink-500'
            : 'text-teal-600'}"
        >
          {settings.selections[slot]}
        </div>
      {/if}
    </div>
    <button class="border-none p-0" onclick={edit_slot(slot)}
      ><PencilSquare size="16" color="var(--color-zinc-500)" /></button
    >
  {/snippet}
</DragList>
<button class="mt-2 ml-1 flex w-fit items-center gap-1 text-xs" onclick={add_slot}><Plus size="16" />Add slot</button>
<EditSlotDialog bind:this={dialog}></EditSlotDialog>

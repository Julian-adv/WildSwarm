<script lang="ts">
  import { save_json, save_yaml } from '$lib/file'
  import DropDown from '$lib/DropDown.svelte'
  import EditSlotDialog from '$lib/EditSlotDialog.svelte'
  import { PencilSquare } from 'svelte-heros-v2'

  interface Props {
    wildcards: any
    settings: any
  }

  let { wildcards, settings }: Props = $props()

  let slot_dialog: {
    open: boolean
    title: string
    slot_name: string
    slot_values: string[]
    ok_button: string
    on_ok: (slot_name: string, slot_values: string[]) => string
    on_delete?: (slot_name: string) => void
  } = $state({
    open: false,
    title: '',
    slot_name: '',
    slot_values: [''],
    ok_button: '',
    on_ok: () => '',
    on_delete: () => ''
  })

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
    slot_dialog.open = true
    slot_dialog.title = 'Add slot'
    slot_dialog.slot_name = ''
    slot_dialog.slot_values = ['']
    slot_dialog.ok_button = 'Add'
    slot_dialog.on_ok = add_slot_ok
    slot_dialog.on_delete = undefined
  }

  function add_slot_ok(slot_name: string, slot_values: string[]): string {
    const err = check_slot_name(slot_name)
    if (err) {
      return err
    }
    wildcards[slot_name] = [...slot_values]
    settings.selection[slot_name] = 'random'
    save_yaml(wildcards, 'wildcards.yaml')
    save_json(settings, 'settings.json')
    return ''
  }

  function edit_slot(slot: string) {
    return () => {
      slot_dialog.open = true
      slot_dialog.title = 'Edit slot'
      slot_dialog.slot_name = slot
      slot_dialog.slot_values = [...wildcards[slot]]
      slot_dialog.ok_button = 'Save'
      slot_dialog.on_ok = edit_slot_ok
      slot_dialog.on_delete = delete_slot
    }
  }

  function edit_slot_ok(slot_name: string, slot_values: string[]): string {
    const err = check_slot_name(slot_name)
    if (err) {
      return err
    }
    wildcards[slot_name] = [...slot_values]
    if (slot_name !== slot_dialog.slot_name) {
      delete settings.selection[slot_dialog.slot_name]
      settings.selection[slot_name] = 'random'
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
    delete settings.selection[slot]
    save_yaml(wildcards, 'wildcards.yaml')
    save_json(settings, 'settings.json')
    return ''
  }

  function wildcards_values(slot: string) {
    return ['disabled', 'random', ...wildcards[slot]]
  }
</script>

<div class="mt-2 text-xs text-zinc-600">
  Wildcards
  {#each Object.keys(wildcards) as slot}
    <div class="mt-1 flex items-center gap-1">
      <div class="text-zinc-600">{slot}</div>
      <div class="grow-1"></div>
      <DropDown
        iclass="max-w-80 xs ring-0 text-zinc-800"
        items={wildcards_values(slot)}
        bind:value={settings.selection[slot]}
      />
      <button class="border-none p-0" onclick={edit_slot(slot)}
        ><PencilSquare size="16" color="var(--color-zinc-500)" /></button
      >
    </div>
  {/each}
  <button class="mt-2" onclick={add_slot}>Add slot</button>
</div>
<EditSlotDialog
  bind:open={slot_dialog.open}
  title={slot_dialog.title}
  slot_name={slot_dialog.slot_name}
  slot_values={slot_dialog.slot_values}
  ok_button={slot_dialog.ok_button}
  on_ok={slot_dialog.on_ok}
  on_delete={slot_dialog.on_delete}
></EditSlotDialog>

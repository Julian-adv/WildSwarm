<script lang="ts">
  import { flip } from 'svelte/animate'

  interface Props {
    items: any[]
    container_class: string
    draggable_class: string
    ondrop?: (items: any[], drag_source: number | null, drag_target: number | null) => void
    header?: () => any
    children: (item: any, i: number, drag_source: number | null, drag_target: number | null) => any
  }
  let { items = $bindable(), container_class, draggable_class, ondrop, header, children }: Props = $props()
  let drag_source: number | null = $state(null)
  let drag_target: number | null = $state(null)
  let original_items: any[] | null = $state(null)

  function handle_drag_start(i: number) {
    return (e: DragEvent) => {
      e.stopPropagation()
      drag_source = i
      original_items = [...items]
      e.dataTransfer?.setData('text/plain', '')
    }
  }

  function handle_drag_over(i: number) {
    return (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (drag_source !== null && original_items && i !== drag_target) {
        drag_target = i
        const temp_items = [...original_items]
        const [moved_item] = temp_items.splice(drag_source, 1)
        temp_items.splice(i, 0, moved_item)
        items = temp_items
      }
    }
  }

  function handle_drag_end() {
    if (ondrop && original_items && drag_target !== null && drag_source !== null) {
      ondrop(original_items, drag_source, drag_target)
    }
    drag_source = null
    drag_target = null
    original_items = null
  }
</script>

<div class={container_class}>
  {#if header}
    {@render header()}
  {/if}
  {#each items as item, i (i)}
    <div
      class={draggable_class}
      class:drag-over={drag_target === i}
      draggable="true"
      ondragstart={handle_drag_start(i)}
      ondragover={handle_drag_over(i)}
      ondragend={handle_drag_end}
      role="button"
      aria-label="Drag to reorder prefix"
      tabindex="0"
      animate:flip={{ duration: 100 }}
    >
      {@render children(item, i, drag_source, drag_target)}
    </div>
  {/each}
</div>

<style>
  .drag-over {
    opacity: 0;
  }
</style>

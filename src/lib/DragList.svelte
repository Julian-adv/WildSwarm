<script lang="ts">
  import { flip } from 'svelte/animate'

  interface Props {
    items: any[]
    container_class: string
    draggable_class: string
    children: (i: number) => any
  }
  let { items = $bindable(), container_class, draggable_class, children }: Props = $props()
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
      if (drag_source && original_items && i !== drag_source && i !== drag_target) {
        drag_target = i
        const temp_items = [...original_items]
        const [moved_item] = temp_items.splice(drag_source, 1)
        const adjusted_target = i > drag_source ? i - 1 : i
        temp_items.splice(adjusted_target, 0, moved_item)
        items = temp_items
        console.log(items)
      }
    }
  }

  function handle_drag_end() {
    drag_source = null
    drag_target = null
    original_items = null
  }
</script>

<div class={container_class}>
  {#each items as item, i (item)}
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
      animate:flip={{ duration: 200 }}
    >
      {@render children(i)}
    </div>
  {/each}
</div>

<style>
  .drag-over {
    opacity: 0.1;
  }
</style>

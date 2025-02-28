<script lang="ts">
  interface Props {
    items: string[]
    value?: string
    iclass: string
    popup_class?: string
    onchange?: (value: string) => boolean
  }
  let { items, value = $bindable(), iclass, popup_class = '', onchange }: Props = $props()
  let show = $state(false)

  function clickOutside(node: HTMLElement) {
    const handleClick = (event: MouseEvent) => {
      if (!node.contains(event.target as Node)) {
        show = false
      }
    }

    document.addEventListener('click', handleClick, true)

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true)
      }
    }
  }

  function select_item(item: string) {
    return () => {
      show = false
      if (onchange?.(item)) {
        value = item
      }
    }
  }
</script>

<div class="relative" use:clickOutside>
  <button class={iclass} onclick={() => (show = !show)}>{value ?? ' '}</button>
  <div
    class="bg-background scrollbar-1 absolute right-0 z-10 flex max-h-100 w-fit flex-col overflow-y-auto rounded border-1 px-0 py-1 focus:ring-0 {popup_class} {show
      ? ''
      : 'hidden'}"
  >
    <div>
      {#each items as item}
        <button
          class="w-full truncate rounded-none border-none object-contain text-left ring-0"
          onclick={select_item(item)}>{item}</button
        >
      {/each}
    </div>
  </div>
</div>

<script lang="ts">
  interface Props {
    items: string[]
    value?: string
    iclass: string
  }
  let { items, value = $bindable(), iclass }: Props = $props()
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
      value = item
      show = false
    }
  }
</script>

<div class="relative" use:clickOutside>
  <button class={iclass} onclick={() => (show = !show)}>{value}</button>
  <div
    class="bg-background absolute right-0 z-10 flex w-fit flex-col rounded border-1 px-0 py-1 focus:ring-0 {show
      ? ''
      : 'hidden'}"
  >
    {#each items as item}
      <button
        class="w-full rounded-none border-none object-contain text-left whitespace-nowrap ring-0"
        onclick={select_item(item)}>{item}</button
      >
    {/each}
  </div>
</div>

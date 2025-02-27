<script lang="ts">
  interface Props {
    items: string[]
    labels?: string[]
    value?: string
    iclass: string
    onchange?: (value: string) => void
  }
  let { items, labels = items, value = $bindable(), iclass, onchange }: Props = $props()
</script>

<select bind:value class={iclass} onchange={() => (value ? onchange?.(value) : undefined)}>
  {#each items as item, i}
    <option value={item}>{labels[i]}</option>
  {/each}
</select>

<script lang="ts">
  interface Props {
    items: string[]
    labels?: string[]
    value?: string
    iclass: string
  }
  let { items, labels = items, value = $bindable(), iclass }: Props = $props()
</script>

<select bind:value class={iclass}>
  {#each items as item, i}
    <option value={item}>{labels[i]}</option>
  {/each}
</select>

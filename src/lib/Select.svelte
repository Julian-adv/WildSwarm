<script lang="ts">
  interface Props {
    items: string[]
    value?: string
    inner_class: string
  }
  let { items, value = $bindable(), inner_class }: Props = $props()
</script>

<select bind:value class={inner_class}>
  {#each items as item}
    <option value={item}>{item}</option>
  {/each}
</select>

<script lang="ts">
  import '../app.css'

  let { children } = $props()
</script>

<div class="h-full min-h-screen p-2">
  {@render children()}
</div>

<script lang="ts">
  import '../app.css'

  let { children } = $props()
</script>

<div class="min-h-screen h-full p-4">
  {@render children()}
</div>

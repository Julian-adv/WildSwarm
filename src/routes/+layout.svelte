<script lang="ts">
	import '../app.css';

	export const ssr = false;

	let { children } = $props();
</script>

<div class="p-4">
	{@render children()}
</div>

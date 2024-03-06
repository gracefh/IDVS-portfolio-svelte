<script>
  export let projectList = [];

  import Project from "$lib/Project.svelte";
</script>

{#each projectList as p}
  <Project info={p} />
{/each}

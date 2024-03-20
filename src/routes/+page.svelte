<script>
  import projects from "$lib/projects.json";
  import Projects from "$lib/Projects.svelte";
  import { onMount } from "svelte";
  import Stats from "../lib/Stats.svelte";

  //   let data = {
  //     public_repos: 12,
  //     followers: 0,
  //     following: 0,
  //     public_gists: 0,
  //   };

  let data;
  let stats;

  onMount(async () => {
    let res = await fetch("https://api.github.com/users/gracefh");
    data = await res.json();
    stats = [{title: "Public Repos", value: data.public_repos}, {title: "Followers", value: data.followers}, {title: "Following", value: data.following}, {title: "Public Gists", value: data.public_gists}]
  });
</script>

<h1>Grace Huang</h1>
<img
  src="./images/dinodino.jpeg"
  alt="some of my plushies!"
  style="width:60%"
/>
<p>
  Currently trying to achieve a better sleep schedule and to spend more time
  going on outdoor adventures, despite how cold it currently is in Cambridge.
  Also consuming large amounts of snacks while trying to debug code.
</p>

<h2>My Latest Projects!</h2>
<div class="projects highlights">
  <Projects projectList={projects.slice(0, 3)} hlevel={3} />
</div>

{#if data}
  <h2>My GitHub S T A T S</h2>
  <Stats data={stats} />
{:else}
  <div>No GitHub data to show</div>
{/if}

<style>
</style>

<script>
  import projects from "$lib/projects.json";
  import Projects from "$lib/Projects.svelte";
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
    <Projects projectList={projects.slice(0, 3)}/>
</div>

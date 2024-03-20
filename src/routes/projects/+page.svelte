<script>
  import projects from "$lib/projects.json";
  import Projects from "$lib/Projects.svelte";
  import * as d3 from "d3";
  import Pie from "$lib/Pie.svelte";

  let query = "";

  let selectedYearIndex = -1;
  let selectedYear;

  let pieData = {};

  $: selectedYear = selectedYearIndex > -1 ? pieData[selectedYearIndex].label : null;

  let filterByYear;
  
  let filteredProjects;
  $: filteredProjects = projects.filter((project) => {
    if (query) {
      let values = Object.values(project).join("\n").toLowerCase();
      return values.includes(query.toLowerCase());
    }

    return true;
  });
  $: filteredByYear = filteredProjects.filter((project) => {
    if(selectedYear) {
      return project.year === selectedYear
    }

    return true;
  })
  let rolledData;
  $: {
    rolledData = d3.rollups(
      filteredProjects,
      (v) => v.length,
      (d) => d.year
    );
    pieData = rolledData.map(([year, count]) => {
      return { value: count, label: year };
    });
  }

</script>

<h1>{projects.length} Projects</h1>
<Pie data={pieData} bind:selectedIndex={selectedYearIndex}/>
<div>
  🔍 <input
    type="search"
    bind:value={query}
    aria-label="Search projects"
    placeholder="Search projects…"
  />
</div>
<div class="projects">
  <Projects projectList={filteredByYear} />
</div>

<style>
  input {
    font: inherit;
  }
</style>

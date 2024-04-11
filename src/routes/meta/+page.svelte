<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import Stats from "../../lib/Stats.svelte";
  import { computePosition, autoPlacement, offset } from "@floating-ui/dom";
  import Pie from "$lib/Pie.svelte";
  import Scatterplot from "$lib/Scatterplot.svelte";

  let data = [];
  $: commits = d3.sort(
    d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let ret = {
          id: commit,
          // Replace with your own username and repo
          url:
            "https://github.com/gracefh/IDVS-portfolio-svelte/commit/" + commit,
          author: first.author,
          date: first.date,
          time: first.time,
          timezone: first.timezone,
          datetime: first.datetime,
          totalLines: lines.length,

          hourFrac:
            first.datetime.getHours() + first.datetime.getMinutes() / 60,
        };

        // Like ret.lines = lines
        // but non-enumerable so it doesn’t show up in JSON.stringify
        Object.defineProperty(ret, "lines", {
          value: lines,
          configurable: true,
          writable: true,
          enumerable: false,
        });

        return ret;
      }),
    (d) => d.datetime,
    d3.ascending
  );

  onMount(async () => {
    data = await d3.csv("loc.csv", (row) => ({
      ...row,
      line: Number(row.line),
      depth: Number(row.depth),
      date: new Date(row.date + "T00:00" + row.timezone),
      datetime: new Date(row.datetime),
    }));
    commits = d3.sort(commits, (d) => -d.totalLines);
  });

  // Filter

  let timeScale;
  $: timeScale = d3
    .scaleTime()
    .domain(d3.extent(commits.map((d) => d.datetime)))
    .range([0, 100]);

  let commitProgress = 100;
  $: commitMaxTime = timeScale.invert(commitProgress);

  $: filteredCommits = commits.filter(
    (commit) => commit.datetime < commitMaxTime
  );
  $: filteredLines = data.filter((line) => line.datetime < commitMaxTime);

  // summary statistics
  let stats;

  let commits;
  let fileLengths;

  $: fileLengths = d3
    .groups(filteredLines, (d) => d.file)
    .map(([file, lines]) => ({ name: file, lines: lines.length }));
  $: stats = [
    { title: "Total LOC", value: filteredLines.length },
    {
      title: "Average File Length",
      value:
        Math.round(
          d3.mean(
            d3
              .groups(filteredLines, (d) => d.file)
              .map(([file, lines]) => lines.length)
          ) * 100
        ) / 100,
    },
    {
      title: "Maximum File Length",
      value: d3.max(
        d3
          .groups(filteredLines, (d) => d.file)
          .map(([file, lines]) => lines.length)
      ),
    },
    {
      title: "Longest File",
      value: (
        fileLengths[d3.maxIndex(fileLengths, (d) => d.lines)] ?? { name: "" }
      ).name,
    },
  ];
  // Graph dimensions

  let selectedCommits = [];

  $: hasSelection = selectedCommits.length > 0;
  $: selectedLines = (hasSelection ? selectedCommits : commits).flatMap(
    (d) => d.lines
  );
  $: languageBreakdown = d3.flatRollup(
    selectedLines,
    (d) => d.length,
    (d) => d.type
  );
</script>

<h1>Meta Stats</h1>
<Stats data={stats} />

<div class="filter">
  <label
    ><input
      type="range"
      class="filter-input"
      bind:value={commitProgress}
    /></label
  >
  <time
    >{commitMaxTime.toLocaleString("en", {
      dateStyle: "long",
      timeStyle: "short",
    })}</time
  >
</div>

<h2>Commits by Time of Day</h2>
<Scatterplot commits={filteredCommits} bind:selectedCommits={selectedCommits} />
<p>
  {hasSelection ? selectedCommits.length : "No"} commit{selectedCommits.length ===
  1
    ? ""
    : "s"} selected
</p>
<Pie
  data={Array.from(languageBreakdown).map(([language, lines]) => ({
    label: language,
    value: lines,
  }))}
/>
<div>
  <h3>Language Breakdown</h3>
  <!-- 
  <Stats
    data={(languageBreakdown ?? []).map(([language, lines]) => ({
      title: language,
      value: Math.round((lines / selectedLines.length) * 100) / 100,
    }))}
  /> -->
  <dl class="breakdown">
    {#each languageBreakdown as [language, lines]}
      <div>
        <dt>{language}</dt>
        <dd>
          {lines} lines ({d3.format(".1~%")(lines / selectedLines.length)})
        </dd>
      </div>
    {/each}
  </dl>
</div>

<style>
  .breakdown {
    display: flex;
    justify-content: space-around;
  }

  .breakdown dt {
    font-size: 125%;
    font-weight: 500;
  }

  .filter {
    display: flex;
    flex-direction: column;
  }
  .filter-input {
    flex: 1;
  }

  .filter time {
    text-align: right;
  }
</style>

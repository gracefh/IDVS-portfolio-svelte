<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import Stats from "../../lib/Stats.svelte";

  let data = [];
  let stats;
  onMount(async () => {
    data = await d3.csv("loc.csv", (row) => ({
      ...row,
      line: Number(row.line),
      depth: Number(row.depth),
      date: new Date(row.date + "T00:00" + row.timezone),
      datetime: new Date(row.datetime),
    }));
  });

  let commits;
  let fileLengths;

  $: fileLengths = d3
    .groups(data, (d) => d.file)
    .map(([file, lines]) => ({ name: file, lines: lines.length }));
  $: stats = [
    { title: "Total LOC", value: data.length },
    {
      title: "Average File Length",
      value: d3.mean(
        d3.groups(data, (d) => d.file).map(([file, lines]) => lines.length)
      ),
    },
    {
      title: "Maximum File Length",
      value: d3.max(
        d3.groups(data, (d) => d.file).map(([file, lines]) => lines.length)
      ),
    },
    {
      title: "Longest File",
      value: (
        fileLengths[d3.maxIndex(fileLengths, (d) => d.lines)] ?? { name: "" }
      ).name,
    },
  ];
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

  let width = 1000,
    height = 600;

  let margin = { top: 10, right: 10, bottom: 75, left: 20 };

  $: xScale = d3
    .scaleTime()
    .domain(d3.extent(commits.map((d) => d.datetime)))
    .range([margin.left, width - margin.right])
    .nice();

  $: yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

  let xAxis, yAxis;

  $: {
    d3.select(xAxis).call(d3.axisBottom(xScale));
    d3.select(yAxis).call(
      d3.axisLeft(yScale).tickFormat((d) => String(d).padStart(2, "0") + ":00")
    );
  }

  let yAxisGridlines;
  let xAxisGridlines;
  $: {
    d3.select(yAxisGridlines).call(
      d3
        .axisLeft(yScale)
        .tickFormat("")
        .tickSize(-width + margin.left + margin.right)
    );
    d3.select(xAxisGridlines).call(
      d3
        .axisBottom(xScale)
        .tickFormat("")
        .tickSize(-height + margin.top + margin.bottom)
    );
  }
  let hoveredIndex = -1;
  $: hoveredCommit = commits[hoveredIndex] ?? {};
</script>

<p>Total lines of code: {data.length}</p>
<Stats data={stats} />

<svg viewBox="0 0 {width} {height}">
  <g
    class="gridlines"
    transform="translate(0, {height - margin.bottom})"
    bind:this={xAxisGridlines}
  />
  <g
    class="gridlines"
    transform="translate({margin.left}, 0)"
    bind:this={yAxisGridlines}
  />
  <g transform="translate(0, {height - margin.bottom})" bind:this={xAxis} />
  <g transform="translate({margin.left}, 0)" bind:this={yAxis} />
  {#each commits as commit, index}
    <circle
      cx={xScale(commit.datetime)}
      cy={yScale(commit.datetime.getHours())}
      r="5"
      fill="steelblue"
    />
  {/each}</svg
>

<style>
  svg {
    overflow: visible;
  }

  .gridlines {
    stroke-opacity: 0.2;
  }
</style>

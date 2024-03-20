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
      value:
        Math.round(
          d3.mean(
            d3.groups(data, (d) => d.file).map(([file, lines]) => lines.length)
          ) * 100
        ) / 100,
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

  let cursor = { x: 0, y: 0 };
</script>

<h1>Meta Stats</h1>
<p>Total lines of code: {data.length}</p>
<Stats data={stats} />

<h2>Commits by Time of Day</h2>
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
      on:mouseenter={(evt) => {
        hoveredIndex = index;
        cursor = { x: evt.x, y: evt.y };
      }}
      on:mouseleave={(evt) => (hoveredIndex = -1)}
    />
  {/each}</svg
>

<dl
  class="info"
  hidden={hoveredIndex === -1}
  style="top: {cursor.y}px; left: {cursor.x}px"
>
  <dt>COMMIT</dt>
  <dd><a href={hoveredCommit.url} target="_blank">{hoveredCommit.id}</a></dd>

  <dt>AUTHOR</dt>
  <dd>{hoveredCommit.author}</dd>
  <dt>DATE</dt>
  <dd>{hoveredCommit.datetime?.toLocaleString("en", { date: "full" })}</dd>

  <dt>LINES EDITED</dt>
  <dd>{hoveredCommit.lines?.length}</dd>
  <!-- Add: Time, author, lines edited -->
</dl>

<style>
  svg {
    overflow: visible;
  }

  .gridlines {
    stroke-opacity: 0.2;
  }

  dl.info {
    background-color: rgba(178, 227, 200, 0.2);
    
    position: fixed;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 1em;

    width:auto;
    padding:1em;

    transition-duration: 200ms;
    transition-property: opacity, visibility;

    &[hidden]:not(:hover, :focus-within) {
      opacity: 0;
      visibility: hidden;

      /* Don’t allow interaction with it when it’s hidden */
      pointer-events: none;

      /* Don’t hide it immediately when we mouse away */
      transition-delay: 500ms;
    }
  }

  .info dt {
    font-weight:500
  }
  dd {
    margin-inline: 0;
  }

  circle {
    transition: 200ms;

    transform-origin: 50% 50%;
    transform-box: fill-box;

    &:hover {
      transform: scale(1.2);
      /* transform-origin: 50% 50%; */
      /* transition:.3s; */
    }
  }
</style>

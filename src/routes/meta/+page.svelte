<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import Stats from "../../lib/Stats.svelte";
  import { computePosition, autoPlacement, offset } from "@floating-ui/dom";
  import Pie from "$lib/Pie.svelte";

  let data = [];
  let stats;

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
  let width = 1000,
    height = 600;

  let margin = { top: 10, right: 10, bottom: 75, left: 20 };

  $: xScale = d3
    .scaleTime()
    .domain(d3.extent(commits.map((d) => d.datetime)))
    .range([margin.left, width - margin.right])
    .nice();

  $: yScale = d3
    .scaleSqrt()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

  $: rScale = d3
    .scaleLinear()
    .domain(d3.extent(commits.map((d) => d.totalLines)))
    .range([5, 30]);

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
  let showTooltip = false;
  $: hoveredCommit = commits[hoveredIndex] ?? {};

  let commitTooltip;
  let tooltipPosition = { x: 0, y: 0 };
  async function dotInteraction(index, evt) {
    let hoveredDot = evt.target;
    hoveredIndex = index;
    // code will go here
    if (evt.type === "mouseenter" || evt.type === "focus") {
      showTooltip = true;
      tooltipPosition = await computePosition(hoveredDot, commitTooltip, {
        strategy: "fixed", // because we use position: fixed
        middleware: [
          offset(5), // spacing from tooltip to dot
          autoPlacement(), // see https://floating-ui.com/docs/autoplacement
        ],
      });
      // dot hovered
    } else if (evt.type === "mouseleave" || evt.type === "blur") {
      // dot unhovered

      showTooltip = false;
    }
  }

  let brushSelection;
  $: brushSelection = undefined;
  function brushed(evt) {
    brushSelection = evt.selection;
  }

  function isCommitSelected(commit) {
    if (!brushSelection) {
      return false;
    }

    let x = xScale(commit.datetime);
    let y = yScale(commit.datetime.getHours());
    return (
      brushSelection[0][0] <= x &&
      brushSelection[1][0] >= x &&
      brushSelection[0][1] <= y &&
      brushSelection[1][1] >= y
    );
  }
  let svg;
  $: {

    d3.select(svg).call(d3.brush().on("start brush end", brushed));
    // d3.select(svg).call(d3.brush());
    d3.select(svg).selectAll(".overlay ~ *, .dots").raise();
  }

  $: selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
  $: hasSelection = brushSelection && selectedCommits.length > 0;
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

<h2>Commits by Time of Day</h2>
<svg viewBox="0 0 {width} {height}" bind:this={svg}>
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
  <g class="dots">
    {#each commits as commit, index}
      <circle
        cx={xScale(commit.datetime)}
        cy={yScale(commit.datetime.getHours())}
        r={rScale(commit.totalLines)}
        class:selected={isCommitSelected(commit)}
        fill="steelblue"
        on:mouseenter={(evt) => dotInteraction(index, evt)}
        on:mouseleave={(evt) => dotInteraction(index, evt)}
        tabindex="0"
        aria-describedby="commit-tooltip"
        aria-haspopup="true"
        role="button"
        on:focus={(evt) => dotInteraction(index, evt)}
        on:blur={(evt) => dotInteraction(index, evt)}
      />
    {/each}
  </g>
</svg>
<p>
  {hasSelection ? selectedCommits.length : "No"} commit{selectedCommits.length ===
  1
    ? ""
    : "s"} selected
</p>
<Pie data={Array.from(languageBreakdown).map(([language, lines]) => ({label: language, value: lines}))} />
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
        <dd>{lines} lines ({d3.format(".1~%")(lines/selectedLines.length)})</dd>
      </div>
    {/each}
  </dl>
</div>

<dl
  class="info"
  hidden={!showTooltip}
  style="top: {tooltipPosition.y}px; left: {tooltipPosition.x}px"
  bind:this={commitTooltip}
  role="tooltip"
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
    background-color: rgb(196, 227, 210);
    border-radius: 1em;

    position: fixed;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 1em;

    width: auto;
    padding: 1em;

    transition-duration: 200ms;
    transition-property: opacity, visibility;

    &[hidden]:not(:hover, :focus-within) {
      opacity: 0;
      visibility: hidden;

      /* Don’t allow interaction with it when it’s hidden */
      pointer-events: none;

      /* Don’t hide it immediately when we mouse away */
      transition-delay: 200ms;
    }
  }

  .info dt {
    font-weight: 500;
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

  circle {
    opacity: 0.8;
  }

  @keyframes marching-ants {
    to {
      stroke-dashoffset: -8; /* 5 + 3 */
    }
  }

  svg :global(.selection) {
    fill-opacity: 10%;
    stroke: var(--color-accent);
    stroke-opacity: 70%;
    stroke-dasharray: 5 3;
    animation: marching-ants 2s linear infinite;
  }

  .selected {
    fill: var(--color-accent);
  }

  .breakdown {
    display: flex;
    justify-content:space-around;
  }

  .breakdown dt {
    font-size: 125%;
    font-weight:500;
  }
</style>

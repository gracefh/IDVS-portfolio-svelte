<script>
  import * as d3 from "d3";

  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  export let data = [];
  export let selectedIndex = -1;

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData;
  let arcs;
  $: arcData = sliceGenerator(data);
  $: arcs = arcData.map((d) => arcGenerator(d));
  let colors = d3.scaleOrdinal(d3.schemePastel1);

  const toggleWedge = (index, event) => {
    if (!event.key || event.key === "Enter") {
      selectedIndex = selectedIndex === index ? -1 : index;
    }
  };
</script>

<div class="container">
  <svg viewBox="-50 -50 100 100">
    {#each arcs as arc, i}
      <path
        d={arc}
        style="
            --start-angle: {arcData[i]?.startAngle}rad;
            --end-angle: {arcData[i]?.endAngle}rad;"
        fill={colors(i)}
        class:selected={selectedIndex === i}
        tabindex="0"
        role="button"
        on:keyup={(e) => toggleWedge(i, e)}
        on:click={(e) => toggleWedge(i, e)}
      />
    {/each}
  </svg>
  <ul class="legend">
    {#each data as d, index}
      <li style="--color: {colors(index)}">
        <span class="swatch"></span>
        <div>
          {d.label} <em>({d.value})</em>
        </div>
      </li>
    {/each}
  </ul>
</div>

<style>
  svg {
    max-width: 20em;
    margin-block: 2em;

    /* Don't clip shapes outside the viewBox */
    overflow: visible;
  }
  .selected {
    --color: oklch(60% 45% 0) !important;

    &:is(path) {
      fill: var(--color);
    }
  }

  path {
    --angle: calc(var(--end-angle) - var(--start-angle));
    --mid-angle: calc(var(--start-angle) + var(--angle) / 2);
    transition: 300ms;
    cursor: pointer;
    outline: none;

    transform: rotate(var(--mid-angle)) translateY(0)
      rotate(calc(-1 * var(--mid-angle)));

    &.selected {
      transform: rotate(var(--mid-angle)) translateY(-6px) scale(1.1)
        rotate(calc(-1 * var(--mid-angle)));
    }
  }

  svg:has(path:hover, path:focus-visible) {
    path:not(:hover, :focus-visible) {
      opacity: 50%;
    }
  }
  .container {
    display: flex;
    gap: 3em;
  }
  .legend {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9em, 1fr));
    padding: 1em;
    border: 1px solid black;
  }

  li {
    display: flex;
    gap: 1em;
    padding: 5px;
    align-items: center;
  }
  .swatch {
    width: 1.5em;
    aspect-ratio: 1/1;
    background-color: var(--color);
  }
</style>

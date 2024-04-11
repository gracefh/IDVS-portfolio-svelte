<script>
  import * as d3 from "d3";

  export let data = [];
  export let selectedIndex = -1;

  let sliceGenerator = d3
    .pie()
    .value((d) => d.value)
    .sort(null);

  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  let arcData;
  let arcs;
  let colors = d3.scaleOrdinal(d3.schemePastel1);
  let transitionDuration = 500;

  let oldData = [];

  let wedges = {};
  const toggleWedge = (index, event) => {
    if (!event.key || event.key === "Enter") {
      selectedIndex = selectedIndex === index ? -1 : index;
    }
  };

  let pieData = [];
  $: {
    oldData = pieData;
    pieData = d3.sort(data, (d) => d.label);
    arcData = sliceGenerator(pieData);
    arcs = arcData.map((d) => arcGenerator(d));
    pieData = pieData.map((d, i) => ({ ...d, ...arcData[i], arc: arcs[i] }));
    transitionArcs();
  }

  function getEmptyArc(label, data = pieData) {
    // Union of old and new labels in the order they appear
    let labels = d3.sort(new Set([...oldData, ...pieData].map((d) => d.label)));
    let labelIndex = labels.indexOf(label);
    let sibling;
    for (let i = labelIndex - 1; i >= 0; i--) {
      sibling = data.find((d) => d.label === labels[i]);
      if (sibling) {
        break;
      }
    }

    let angle = sibling?.endAngle ?? 0;
    return { startAngle: angle, endAngle: angle };
  }

  function sameArc(arc1, arc2) {
    return (
      (!arc1 && !arc2) ||
      (arc1?.startAngle === arc2?.startAngle &&
        arc1?.endAngle === arc2?.endAngle)
    );
  }
  function transitionArc(wedge, label) {
    label ??= Object.entries(wedges).find(([label, w]) => w === wedge)[0];
    let d = pieData.find((d) => d.label === label);
    let d_old = oldData.find((d) => d.label === label);

    if (sameArc(d_old, d)) {
      return null;
    }

    // Always clone objects first, see note in https://d3js.org/d3-interpolate/value#interpolateObject
    let from = d_old ? { ...d_old } : getEmptyArc(label, oldData);
    let to = d ? { ...d } : getEmptyArc(label);

    // let type = d ? (d_old ? "update" : "in") : "out";
    let type = d ? (d_old ? "update" : "in") : "out";

    let angleInterpolator = d3.interpolate(from, to);

    let interpolator = (t) => `path("${arcGenerator(angleInterpolator(t))}")`;

    return { d, d_old, from, to, interpolator, type };
  }

  function transitionArcs() {
    let wedgeElements = Object.values(wedges);

    d3.selectAll(wedgeElements)
      .transition("arc")
      .duration(transitionDuration)
      .styleTween("d", function (_, index) {
        let wedge = this;
        let label = Object.keys(wedges)[index];
        let transition = transitionArc(wedge, label);
        return transition?.interpolator;
      })
      .ease(d3.easeLinear);
  }

  function arc(wedge) {
    // Calculations that will only be done once per element go here
    const transition = transitionArc(wedge);
    if (!transition) {
      return;
    }
    return {
      duration: transitionDuration,
      css: (t, u) => {
        return `d: ${transition.interpolator(transition.type === "out" ? u : t)}`;
        // t is a number between 0 and 1 that represents the transition progress; u is 1 - t
        // TODO return CSS to be applied for the current t as a string
      },
    };
  }
</script>

<div class="container">
  <svg viewBox="-50 -50 100 100">
    {#each pieData as d, index (d.label)}
      <path
        d={d.arc}
        fill={colors(d.label)}
        style="
            --start-angle: {d.startAngle}rad;
            --end-angle: {d.endAngle}rad;"
        class:selected={selectedIndex === index}
        tabindex="0"
        role="button"
        on:keyup={(e) => toggleWedge(index, e)}
        on:click={(e) => toggleWedge(index, e)}
        bind:this={wedges[d.label]}
        transition:arc
      />
    {/each}
  </svg>
  <ul class="legend">
    {#each data as d, index}
      <li style="--color: {colors(d.label)}">
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

    cursor: pointer;
    outline: none;

    transform: rotate(var(--mid-angle)) translateY(0)
      rotate(calc(-1 * var(--mid-angle)));
    transition-duration: 3000ms;
    transition-property: transform;

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

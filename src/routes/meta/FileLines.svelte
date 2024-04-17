<script>
  import * as d3 from "d3";
  import { flip as originalFlip } from "svelte/animate";
  import { crossfade, fade, scale, slide } from "svelte/transition";

  export let lines = [];
  export let colors = d3.scaleOrdinal(d3.schemePastel1);

  let files = [];
  $: {
    files = d3
      .groups(lines, (d) => d.file)
      .map(([name, lines]) => {
        return { name, lines };
      });
    files = d3.sort(files, (d) => -d.lines.length);
  }

  function getFlip() {
    return originalFlip;
  }
  $: flip = getFlip(files);
</script>

<dl class="files" in:fade>
  {#each files as file (file.name)}
    <div animate:flip>
      <dt>
        <code>{file.name}</code>
      </dt>
      <dd>
        {#each file.lines as line (line.line)}
          <div class="line" style="--color: {colors(line.type)}" in:scale></div>
        {/each}
      </dd>
    </div>
  {/each}
</dl>

<style>
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1em 2em;
    & > div {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: subgrid;
      background: hsl(0 0% 100% / 90%);
      box-shadow: 0 0 0.2em 0.2em hsl(0 0% 100% / 90%);
    }
  }

  .line {
    display: flex;
    width: 0.5em;
    aspect-ratio: 1;
    background: var(--color);
    border-radius: 50%;
    transition: 300ms background;
  }

  dd {
    grid-column: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    padding-top: 0.6em;
    gap: 0.15em;
    margin-left: 0;
  }
</style>

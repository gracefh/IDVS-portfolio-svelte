<script>
  import * as d3 from "d3";
  import { flip } from "svelte/animate";
  import { crossfade, fade, scale, slide } from "svelte/transition";

  export let lines = [];
  export let colors = d3.scaleOrdinal(d3.schemePastel1);

  export let files = [];
//   $: {
//     files = d3
//       .sort(
//         d3
//           .groups(lines, (d) => d.file)
//           .map(([name, lines]) => {
//             return { name, lines };
//           }),
//         (d) => -d.lines.length
//       )
//       .map((file) => {
//         file.lines = d3.sort(file.lines, (d) => d.line);
//         return file;
//       });
//   }
</script>

<dl class="files">
  {#each files as file (file.name)}
    <div transition:crossfade={{duration:400, delay:400}} animate:flip={{ duration: 400}}>
      <dt>
        <code>{file.name}</code>
      </dt>
      <dd>
        {#each file.lines as line (line.line)}
          <div
            class="line"
            style="--color: {colors(line.type)}"
            in:fade={{ duration: 400 }}
            out:fade={{ duration: 400 }}
          ></div>
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

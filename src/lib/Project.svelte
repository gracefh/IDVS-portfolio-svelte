<script>
  export let info = {};
  export let hlevel = 2;
</script>

<article>
  <svelte:element this={"h" + hlevel}>{info.title}</svelte:element>

  <img src={info.image} alt="" />
  <div>
    <p>
      {info.description}
    </p>
    <p class="year">{info.year}</p>
  </div>
</article>

<style>
  h2,
  h3 {
    margin: 0;
  }
  article {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3;
  }

  .year {
    color: gray;
  }
</style>

<script>
  export let data = []; // expects data of form [{title: __, value: ___}]
</script>

<dl>
  {#each data as item}
    <div>
      <dt>{item.title}</dt>
      <dd>
        {item.value}
      </dd>
    </div>
  {/each}
</dl>
<style>

  dl {
    display: flex;
    justify-content: space-around;
  }

  dl div {
    text-align: right;
  }
  dt {
    font-family:
      Josefin Sans,
      sans-serif;
    color: rgb(95, 123, 139);
    font-size: 120%;
  }

  dd {
    font-size: 200%;
  }
</style>
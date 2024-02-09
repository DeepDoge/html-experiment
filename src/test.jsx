function Counter() {
  return (
    <>
      <script type="module">const abc = 123;</script>

      <template>
        <div class="counter">
          <button on:click="(event) => $root(this).$increment()">+</button>
          <span bind:count="(value) => this.textContent = value"></span>
          <button on:click="(event, { $decrement }) => $decrement()">-</button>
        </div>
      </template>

      <style>
        {`
    .counter {
        display: grid;
        grid-auto-flow: column;
        gap: 1em;
      }
    
      button {
        border-color: red;
      }
  `}
      </style>
    </>
  );
}

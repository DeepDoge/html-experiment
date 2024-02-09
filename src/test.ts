function Counter() {
  return html`
    <script type="module">
      const abc: string = 123;
      abc.split("");
    </script>

    <template>
      <div class="counter">
        <button on:click="(event) => $root(this).$increment()">+</button>
        <span bind:count="(value) => this.textContent = value"></span>
        <button on:click="(event, { $decrement }) => $decrement()">-</button>
      </div>
    </template>

    <style>
      .counter {
        display: grid;
        grid-auto-flow: column;
        gap: 1em;
      }

      button {
        border-color: red;
      }
    </style>
  `;
}

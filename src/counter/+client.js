import { sayHello } from "../external.js";

sayHello();

export function alertHello() {
  alert("Hello from counter module");
}

/* {
  let count = 0;
  const self = ($self.$count = {
    get ref() {
      return count;
    },
    set ref(value) {
      count = value;
      self.ping();
    },
    ping() {
      // mock behavior, normally attribute itself should find the value by name and bind to it
      // this can probably be done with the `export` keyword, but I'm not sure how to do it
      $self.shadowRoot
        .querySelectorAll(`[bind\\:count]`)
        .forEach((element) =>
          new Function(`return ${element.getAttribute("bind:count")}`).call(
            element
          )(count)
        );
    },
  });
  self.ping();
} 

// find a way to access exported variables from outside the module
// so we can simplify things
export let helloWorld = "Hello World";

$self.$increment = () => {
  $self.$count.ref++;
};

$self.$decrement = () => {
  $self.$count.ref--;
};

*/
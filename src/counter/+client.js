import { sayHello } from "/external.js";
import { ref } from "/ref.js";

sayHello();

export function alertHello() {
  alert("Hello from counter module");
}

export const count = ref(0);

export function increment() {
  count.ref++;
}

export function decrement() {
  count.ref--;
}

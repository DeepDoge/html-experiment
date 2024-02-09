export function ref(initial) {
  return {
    get ref() {
      return initial;
    },
    set ref(value) {
      initial = value;
    },
  };
}

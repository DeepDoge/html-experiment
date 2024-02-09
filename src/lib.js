Object.assign(window, { $customElement, $root, $dispatchEvent });

const tagNameToConstructor = new Map();
const usedTags = new Set();
/**
 * @type {WeakMap<HTMLElement, Record<string, unknown>>}
 */
const elementModules = new WeakMap();
async function $customElement(tagName, path) {
  if (usedTags.has(tagName)) return;
  usedTags.add(tagName);

  // later these can be provided as arguments like html, sheet, context
  // we dont say module, but say context, because it doesnt have to be a module
  // reason being we dont wanna say how to do what and how to place files etc.
  // that will be the job of the meta framework or the user's own system.
  const [html, sheet] = await Promise.all([
    fetch(`${path}/+template.html`).then((res) => res.text()),
    fetch(`${path}/+style.css`)
      .then((res) => res.text())
      .then(async (css) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(css);
        return sheet;
      }),
  ]);

  // if we dont have it inside a <template>, <script> tags not executing when cloned and appended for some reasons
  const parser = new DOMParser();
  /** @type {DocumentFragment} */
  const fragmentBlueprint = parser
    .parseFromString(`<template>${html}</template>`, "text/html")
    .querySelector("template").content;

  class CustomElement extends HTMLElement {
    static instances = new WeakRefMap();
    constructor() {
      super();
      const id = Math.random().toString(36).slice(2);
      import(`${path}/+client.js?x-${id}`).then((module) => {
        elementModules.set(this, module);
        if (module.$onReady)
          this.addEventListener(":ready", () => module.$onReady(this));

        const shadowRoot = this.attachShadow({ mode: "open" });
        observer.observe(shadowRoot, {
          attributes: true,
          subtree: true,
          childList: true,
        });

        {
          const properties = Object.getOwnPropertyDescriptors(module);
          for (const [key, descriptor] of Object.entries(properties)) {
            if (typeof descriptor.value === "object") {
              const subProperties = Object.getOwnPropertyDescriptors(
                descriptor.value
              );
              for (const [subKey, subDescriptor] of Object.entries(
                subProperties
              )) {
                if (subDescriptor.get || subDescriptor.set) {
                  function update(value) {
                    shadowRoot
                      .querySelectorAll(`[bind\\:${key}]`)
                      .forEach((element) => {
                        console.log(element);
                        new Function(
                          `return (${element.getAttribute(`bind:${key}`)})`
                        ).call(element)(value);
                      });
                  }

                  Object.defineProperty(descriptor.value, subKey, {
                    get: subDescriptor.get,
                    set(value) {
                      const oldValue = subDescriptor.get();
                      subDescriptor.set(value);
                      if (value === oldValue) return;
                      update(value);
                    },
                  });
                  this.addEventListener(":ready", () =>
                    update(subDescriptor.get())
                  );
                }
              }
            }
          }
        }

        shadowRoot.adoptedStyleSheets.push(sheet);
        shadowRoot.appendChild(fragmentBlueprint.cloneNode(true));
        $dispatchEvent(this, ":ready");
      });
    }

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
      $dispatchEvent(this, ":connected");
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }

      $dispatchEvent(this, ":disconnected");
    }
  }

  customElements.define(tagName, CustomElement);

  return CustomElement;
}

function $root(thisArg) {
  const root = thisArg.getRootNode();
  if (root instanceof ShadowRoot) {
    return root.host;
  }
  return root;
}

function $dispatchEvent(element, ...eventArgs) {
  const event = new CustomEvent(...eventArgs);
  element.dispatchEvent(event);
}

/**
 * @type {WeakMap<Element, Map<string, Function>>}
 */
const oldEventsMap = new WeakMap();

/**
 *
 * @param {Element} element
 * @param {string} attributeName
 * @param {string} oldValue
 * @param {string} newValue
 */
function hydrateElementAttribute(element, attributeName, oldValue, newValue) {
  if (element instanceof HTMLTemplateElement) return;
  if (attributeName.startsWith("@")) {
    const eventName = attributeName.slice(1);
    let oldEvents = oldEventsMap.get(element);
    if (!oldEvents) oldEventsMap.set(element, (oldEvents = new Map()));

    const oldEvent = oldEvents.get(eventName);
    if (oldEvent) {
      element.removeEventListener(eventName, oldEvent);
    }

    const fn = (event) =>
      new Function(`return (${newValue})`).call(element)(
        event,
        elementModules.get($root(element))
      );
    element.addEventListener(eventName, fn);
    oldEvents.set(eventName, fn);
  }
}
const hydratedElements = new WeakSet();
function tryHydrateElement(element) {
  if (element instanceof HTMLTemplateElement) return;
  if (hydratedElements.has(element)) return;
  hydratedElements.add(element);

  for (const attribute of element.attributes) {
    hydrateElementAttribute(element, attribute.name, null, attribute.value);
  }
}
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "attributes") {
      const { target, attributeName, oldValue } = mutation;
      const newValue = target.getAttribute(attributeName);
      hydrateElementAttribute(target, attributeName, oldValue, newValue);
    }
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) =>
        node.querySelectorAll?.("*").forEach(tryHydrateElement)
      );
    }
  }
});

class WeakRefMap {
  #cacheMap = new Map();
  #finalizer = new FinalizationRegistry((key) => this.#cacheMap.delete(key));

  set(key, value) {
    const cache = this.get(key);
    if (cache) {
      if (cache === value) return;
      this.#finalizer.unregister(cache);
    }
    this.#cacheMap.set(key, new WeakRef(value));
    this.#finalizer.register(value, key, value);
  }

  get(key) {
    return this.#cacheMap.get(key)?.deref() ?? null;
  }
}

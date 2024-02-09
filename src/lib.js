{
  Object.assign(globalThis, { $importElement, $root, $dispatchEvent });

  const tagNameToConstructor = new Map();
  const definedCustomElements = new Set();
  async function $importElement(tagName, url, extendsTagName) {
    if (definedCustomElements.has(tagName)) return;
    definedCustomElements.add(tagName);

    let extendsConstructor;
    if (extendsTagName) {
      extendsConstructor = tagNameToConstructor.get(extendsTagName);
      if (!extendsConstructor) {
        const constructor = document.createElement(extendsTagName).constructor;
        tagNameToConstructor.set(extendsTagName, constructor);
        extendsConstructor = constructor;
      }
    }

    return await fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(
          `<template>${html}</template>`,
          "text/html"
        );
        const template = doc.querySelector("template");

        const sheet = new CSSStyleSheet();
        const style = template.content.querySelector("style");
        if (style) {
          style.remove();
          sheet.replaceSync(style.textContent);
        }

        class CustomElement extends (extendsConstructor ?? HTMLElement) {
          static newInstances = new WeakRefMap();
          constructor() {
            super();
            const shadowRoot = this.attachShadow({ mode: "open" });

            const fragment = template.content.cloneNode(true);
            const id = Math.random().toString(36).slice(2);
            CustomElement.newInstances.set(id, this);
            fragment
              .querySelectorAll('script[type="module"]')
              .forEach((script) => {
                script.append(
                  `$dispatchEvent($self, new CustomEvent(":ready"));`
                );
                script.firstChild.before(
                  `const $Self=customElements.get("${tagName}");`,
                  `const $self=$Self.newInstances.get("${id}");`
                );
              });

            shadowRoot.adoptedStyleSheets.push(sheet);
            shadowRoot.appendChild(fragment);
            $dispatchEvent(this, new CustomEvent(":ready"));

            // enchancedMutationObserver.observe(this, { attributes: true });
          }

          connectedCallback() {
            if (super.connectedCallback) {
              super.connectedCallback();
            }
            $dispatchEvent(this, new CustomEvent(":connected"));
          }

          disconnectedCallback() {
            if (super.disconnectedCallback) {
              super.disconnectedCallback();
            }

            $dispatchEvent(this, new CustomEvent(":disconnected"));
          }
        }

        customElements.define(
          tagName,
          CustomElement,
          extendsConstructor ? { extends: extendsTagName } : undefined
        );
      });
  }

  function $root(thisArg) {
    const root = thisArg.getRootNode();
    if (root instanceof ShadowRoot) {
      return root.host;
    }
    return root;
  }

  function $dispatchEvent(element, event) {
    element.dispatchEvent(event);
    element[`on${event.type}`]?.(event);
    (function () {
      eval(element.getAttribute(`on${event.type}`) ?? "");
    }).call(element, event);
  }

  /*   const enchancedMutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const { target, attributeName, oldValue } = mutation;
        const newValue = target.getAttribute(attributeName);
        if (attributeName.startsWith("@")) {
          target.addEventListener(
            attributeName.slice(1),
            function (event) {
              eval(newValue).call(this, event);
            }.bind(target)
          );
        }
      }
    }
  });
 */
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
}

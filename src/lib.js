{
  Object.assign(globalThis, { $customElement, $root, $dispatchEvent });

  const tagNameToConstructor = new Map();
  const usedTags = new Set();
  async function $customElement(tagName, html, extendsTagName) {
    if (usedTags.has(tagName)) return;
    usedTags.add(tagName);

    let extendsConstructor;
    if (extendsTagName) {
      extendsConstructor = tagNameToConstructor.get(extendsTagName);
      if (!extendsConstructor) {
        const constructor = document.createElement(extendsTagName).constructor;
        tagNameToConstructor.set(extendsTagName, constructor);
        extendsConstructor = constructor;
      }
    }

    const parser = new DOMParser();
    const root = parser
      .parseFromString(`<template>${html}</template>`, "text/html")
      .querySelector("template").content;

    const template = root.querySelector("template");
    template?.content.append(...root.querySelectorAll("script"));

    const styles = root.querySelectorAll("style");
    const sheets = new Array(styles.length);
    {
      let index = 0;
      for (const style of styles) {
        let sheet = style.sheet;
        if (!sheet) {
          sheet = new CSSStyleSheet();
          await sheet.replace(style.textContent);
        }
        sheets[index] = sheet;
        style.remove();
        index++;
      }
    }

    class CustomElement extends (extendsConstructor ?? HTMLElement) {
      static instances = new WeakRefMap();
      constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });

        const fragment = template?.content.cloneNode(true);
        const id = Math.random().toString(36).slice(2);
        CustomElement.instances.set(id, this);
        fragment
          ?.querySelectorAll('script[type="module"]')
          .forEach((script) => {
            script.firstChild?.before(
              `const $self=customElements.get("${tagName}").instances.get("${id}");`
            );
          });
        shadowRoot.adoptedStyleSheets.push(...sheets);
        if (fragment) shadowRoot.appendChild(fragment);
        $dispatchEvent(this, ":ready");
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

    customElements.define(
      tagName,
      CustomElement,
      extendsConstructor ? { extends: extendsTagName } : undefined
    );
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

  {
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
    function hydrateElementAttribute(
      element,
      attributeName,
      oldValue,
      newValue
    ) {
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
            $root(element)
          );
        element.addEventListener(eventName, fn);
        oldEvents.set(eventName, fn);
      }
    }
    const hydratedElements = new WeakSet();
    function tryHydrateElement(element) {
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
          for (const node of mutation.addedNodes) {
            if (node instanceof Element) {
              node.querySelectorAll("*").forEach(tryHydrateElement);
            }
          }
        }
      }
    });
    observer.observe(document, {
      attributes: true,
      subtree: true,
      childList: true,
    });
    const originalAttachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (...args) {
      const shadowRoot = originalAttachShadow.apply(this, args);
      observer.observe(shadowRoot, {
        attributes: true,
        subtree: true,
        childList: true,
      });
      return shadowRoot;
    };
  }

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

# What is this?

This is some experimental way to build sites using native vanilla js apis and web components. Just trying and experimenting with some ideas. And how can i make it work.

## Update
Ok so this idea might shift to [here](https://github.com/DeepDoge/experiment-idk)

## Duck

- Not needing any build step.
- Everything should be done with html and attributes and some js.
- It should always have SSR, but server side code shouldn't relay on any runtime such as Node.js, or Bun.
  So if it's a SPA, server side code should just run at a service worker. So there should always be a "server" code.
- Right now it's hard to support TypeScript, because we use HTML files. But perhaps we can use some kind of preprocessor to support it. Not sure yet. Also in the future if JS supports types, we can use that. Basically IDE part is suck right now and not production ready because of the type safety.
- Main point is being able to clone and snippet of HTML and it should work. So it should be easy to use and understand.
- We might switch to jsx/tsx for type safety and better IDE support. But it should always be optional. So we should be able to use it without any build step.
- Since we will be about generating a html text, tsx return type issues is not a problem. Because tsx will not return and Element type, it will return string always or some object.
- SSR part should be separated from the client side package. So core non-ssr part can be used with any other framework.
- No real full hydration. I mean no code running twice. Client code runs on the client, server code runs on the server. So no need to run the same code twice. But we should be able to run the same code twice if we want to. So it should be optional.
- Since everything is attribute based, SSR side can just pass the state as an attribute by codifying it. So it should be easy to pass the state to the client side. And client side should be able to read the state from the attributes. So it should be easy to hydrate the state.
- Basically we shouldn't mix client code with server code. Similar to htmx we should give the html, it should run the rest, server can inject values in the HTML, client can read the values from the HTML. So it should be easy to pass the state from server to client.
- But ShadowRoot are not designed for SSR. So that's a problem. As a server, i dont wanna modify the client side code for SSR.
- So perhaps by default shadowRoot method should not be used. It should be intentionally used. So for styles, we should use new `@scope` css feature. SSR side probably gonna use its own components probably anyway. custom elements will only be used to run a code for each CustomElement without shadowRoot.
- I keep thinking about svelte's use:enchance server page loads, and actions.
- Ok we will still use custom-elements, but not shadowroot. Using custom elements lets us run client-side code for each custom element. So we can use it to hydrate the state. But we should be able to use it without any client side code. So it should be optional. By hydration I mean reading the attributes and applying them. Not real hydration.
- But all of these still requires JS, I want a system that works even without JS, but better with it. Similar to sveltekit with use:enchance PageServerLoad and Actions. Which, can, be, done with THIS APPROACH!!
- Server's job is generating the HTML, this html also includes the client side script, style, and template. HTML while generating the code can codify and inject stuff in with jsx. It can use a global Map and give each unique value an id and codifty them, then it can inject something like `$globalPageMap.get('id')` in the client code.
- Tbh for something like this we can even use tagged template literals, perhaps both. Server side code have many stuff.
- hmm it seems jsx doesnt like `<style>` and `<script>` tags. So we should use tagged template literals.
- but i dont think typing support will be good with tagged template literals. I have to think about this another time.
- tagged template literals works amazing, with style and the rest, and looks amazing too, highlight are working. But intellisense is not working at all with `<script>` tags. So maybe i might try to find a vite plugin or something or rollup plugin to seperate them. So these are neccery for ssr stuff.
- also i tried to to this `bind:` thingy here but a real signal might be necessary. So we might need to use a real signal for this. But

UPDATE:
Ok i started to came up with something, gotta clean these all when im done.
ok maybe i make a thing that doesnt need an ssr backend.
then i can make an ssr backend that uses it, which also can have service worker as ssr backend.

# What is this?

This is some experimental way to build sites using native vanilla js apis and web components. Just trying and experimenting with some ideas. And how can i make it work.

Idea is:

- Not needing any build step.
- Everything should be done with html and attributes and some js.
- It should always have SSR, but server side code shouldn't relay on any runtime such as Node.js, or Bun.
  So if it's a SPA, server side code should just run at a service worker. So there should always be a "server" code.
- Right now it's hard to support TypeScript, because we use HTML files. But perhaps we can use some kind of preprocessor to support it. Not sure yet. Also in the future if JS supports types, we can use that. Basically IDE part is suck right now and not production ready because of the type safety.
- Main point is being able to clone and snippet of HTML and it should work. So it should be easy to use and understand.
- We might switch to jsx/tsx for type safety and better IDE support. But it should always be optional. So we should be able to use it without any build step.
- Since we will be about generating a html text, tsx return type issues is not a problem. Because tsx will not return Element, it will return string. So we can use it without any build step. But we will lose the type safety. But we can use it for better IDE support. So it should be optional.

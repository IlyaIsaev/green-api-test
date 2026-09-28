# green-api-test

A browser app for sending and receiving WhatsApp messages through [GREEN-API](https://green-api.com). You enter instance credentials (`idInstance`, `apiTokenInstance`), pick a phone number that has WhatsApp, then chat using GREEN-API's HTTP API (`sendMessage`, `receiveNotification`, `deleteNotification`).

## Run locally

You need [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io) 12. If you use the global [`vp` CLI](https://viteplus.dev/guide/), it can manage Node and the package manager for you.

```sh
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). `vp install` and `vp dev` are equivalent if `vp` is on your PATH.

On load the app opens `/green-api`. Paste a GREEN-API instance `idInstance` and `apiTokenInstance` from [green-api.com](https://green-api.com), then a WhatsApp phone number, then chat.

To serve a production build locally: `pnpm build` then `pnpm preview`.

## Technologies

- [GREEN-API](https://green-api.com) — WhatsApp HTTP gateway
- [React](https://react.dev) 19 and [TypeScript](https://www.typescriptlang.org)
- [Vite+](https://viteplus.dev) (Vite, Oxlint, Oxfmt)
- [Reatom](https://reatom.dev) — state, routing, and forms
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com) (Base UI)
- [Valibot](https://valibot.dev) — request/response validation
- [Playwright](https://playwright.dev) — end-to-end tests
- [pnpm](https://pnpm.io)
- [Feature-Sliced Design (FSD)](https://feature-sliced.design) — `app` / `pages` / `entities` / `shared`

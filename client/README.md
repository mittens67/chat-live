# Chat Live — client

React 18 + Vite frontend for [Chat Live](../README.md). See the root README for
setup, environment variables, and architecture.

## Running

```bash
npm install
cp .env.example .env
npm run dev      # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:3000`, so the API must be
running too (`npm run dev` in the repo root).

## Scripts

| Command           | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the dev server with HMR      |
| `npm run build`   | Production build into `dist/`      |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | ESLint over `src/`                 |

## Structure

```
src/
├── components/
│   ├── Auth/        Login and registration forms
│   ├── Chat/        Chat list and window
│   └── ui/          Modals, message rendering, header
├── context/
│   ├── ChatProvider    App state (user, chats, theme)
│   └── SocketProvider  Owns the single socket connection
├── lib/
│   ├── api.js          Shared axios client with auth + 401 handling
│   ├── cloudinary.js   File upload helper
│   └── useUserSearch   Debounced user search hook
├── config/          View helpers (sender resolution, URL detection)
├── pages/           Route components
└── styles/          Sass partials
```

State lives in `ChatProvider`; the socket connection is owned solely by
`SocketProvider` and is torn down when the user logs out. All HTTP goes through
`lib/api.js`, which attaches the bearer token and logs the user out on a 401.

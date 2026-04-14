# {{projectName}}

A Vuloom application scaffolded by `create-vuloom`.

## Included examples

- `/` uses Vue `h()` render functions.
- `/jsx` uses Vue JSX/TSX.
- `/sfc` uses a Vue single-file component.
- `/blog/hello-world` shows a dynamic file route.

The template also supports:

- `app/loader.ts` for app-shell data exposed through `useAppData()`
- `app/middleware/*.ts` for named reusable middleware
- `app/pages/index/page.ts` for the root route component
- `app/pages/index/loader.ts` for the root route loader
- `app/pages/index/loading.ts` for the root route loading boundary
- `app/pages/index/action.ts` for the root route action
- `app/pages/**/middleware.ts` for directory-scoped route middleware
- `app/pages/blog/middleware.ts` for the blog subtree middleware
- `server/routes/**/*.ts` for raw HTTP handlers exported as plain objects
- `server/middleware/*.ts` for named reusable server middleware
- `server/routes/**/_middleware.ts` for directory-scoped server middleware
- `vuloom.config.ts -> server.middleware` for global server middleware
- `vuloom prepare` for generating `.vuloom/types/`

## Development

```bash
{{installCommand}}
{{devCommand}}
```

The scaffold also defines `pnpm prepare`, which runs `vuloom prepare` and refreshes `.vuloom/types/` so app/server middleware completion and generated app-route types stay current.

Server routes are path-owned: if a `server/routes` pattern overlaps with an `app/pages` pattern, Vuloom throws during scanning instead of splitting ownership by method.

## Build

```bash
{{installCommand}}
{{buildCommand}}
```

By default Vuloom writes the production build to:

- `.output/public/` for client assets
- `.output/server/index.js` for the server bundle

If you explicitly set `vite.build.outDir`, Vuloom will use that directory for the client build.

## Start

```bash
{{installCommand}}
{{startCommand}}
```

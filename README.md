# create-vuloom

Scaffold a new [Vuloom](https://github.com/hornjs/vuloom) application.

## Usage

With `pnpm`:

```bash
pnpm create vuloom my-app
cd my-app
pnpm install
pnpm dev
```

With `npm`:

```bash
npm create vuloom@latest my-app
cd my-app
npm install
npm run dev
```

With `yarn`:

```bash
yarn create vuloom my-app
cd my-app
yarn install
yarn dev
```

## Options

```
Usage: create-vuloom <project-dir> [options]

Options:
  --template <name>         Scaffold template name. Supported: default, zero-config
  --package-manager <name>  Package manager to suggest/install with: pnpm, npm, yarn, bun
  --install                 Install dependencies after scaffolding
  --force                   Allow writing into a non-empty target directory
  -h, --help                Show this help message
```

## Templates

- `default` - Full-featured template with examples for pages, middleware, loaders, and server routes.

## License

MIT

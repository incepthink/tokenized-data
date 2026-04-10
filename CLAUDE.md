# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:8080
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Run tests once (vitest)
npm run test:watch # Run tests in watch mode
npm run preview    # Preview production build
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.tsx
```

## Architecture

**NexVault** is a demo app for tokenized document management on Base Sepolia. It is entirely frontend — all data is mocked in `src/mock/data.ts` with no real backend or blockchain calls. The "minting" flow uses `setTimeout` to simulate async operations.

### Three-Persona System

The app models three distinct user roles, each with isolated route namespaces and dashboards:

- **Creator** (`/creator/*`) — Mints documents as NFTs, manages collections
- **Owner** (`/owner/*`) — Views owned documents, grants/revokes viewer access
- **Viewer** (`/viewer/*`) — Views documents shared with them, signs access

Authentication is mock-only: `AuthContext` stores the active `Persona` in React state (no persistence). Login/signup both resolve immediately from `MOCK_USERS`. `ProtectedRoute` enforces that the active persona matches the route's required persona.

### Routing

`BrowserRouter` uses `basename="/examples/tokenized-data"` — this must be preserved for the app to work when deployed at that subpath. Routes are defined in [src/App.tsx](src/App.tsx).

### Web3 Setup

Wagmi + RainbowKit is configured in [src/config/wagmi.ts](src/config/wagmi.ts) for Base Sepolia only. The wallet connection UI is present but wallet connection is optional — the mock auth system does not depend on an actual connected wallet.

### Mock Data

All entities live in [src/mock/data.ts](src/mock/data.ts):
- `MOCK_USERS`, `MOCK_COLLECTIONS`, `MOCK_DOCUMENTS` — core entities
- `MOCK_VIEWERS`, `MOCK_SHARED_WITH`, `MOCK_ACCESS_LOGS` — access control state
- `simulateDelay()` — used in page `useEffect` calls to fake loading states
- Type definitions (`Persona`, `MockDocument`, `DocumentCategory`, etc.) are exported from here

### UI Stack

- **shadcn/ui** components in `src/components/ui/` (Radix UI primitives + Tailwind)
- Custom Tailwind utilities used throughout: `gradient-primary`, `glow-primary`, `bg-card-elevated`, `animate-pulse-glow` — defined in the Tailwind config/CSS
- Dark theme enforced globally; `next-themes` is installed but the app defaults to dark
- `@` path alias resolves to `src/`

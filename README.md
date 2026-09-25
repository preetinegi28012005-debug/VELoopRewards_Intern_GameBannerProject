# VELOOP Games

VELOOP Games is a local-first rewards arcade built with React, TypeScript, Vite and Dexie. Players spend Tokens to enter arcade challenges, earn coins — Game Coin, Silver, Gold and Diamond — and exchange Game Coins for VELOOP rewards.

All gameplay, wallet balances, history, redemptions and contact messages are stored in the browser's IndexedDB. This prototype has no backend and does not send those records to a server.

## Features

- Two playable games: **Wormzy** (15 levels) and **Aqua Fill** (20 levels).
- Eleven additional game cards marked Coming Soon.
- Token entry fees (20 Tokens) and optional revives (10 Tokens).
- Four arcade coin tiers paid per run, based on the highest level actually cleared:
  1–4 → Game Coin, 5–9 → Silver, 10–(n-1) → Gold, all levels → Diamond.
- Every run also pays score-based Game Coins, so the balances move during play.
- A live **Rewards** page showing the Game Coin, Silver, Gold and Diamond balances, each with its own artwork. A card flashes when its balance changes.
- A **Spin** wheel that pays out all five currencies.
- Redemption options for VE, SVE, Gems, Tokens and Spins.
- Local game history with filtering and sorting.
- Local contact-message storage with client-side validation.
- Responsive navigation, accessible labels, keyboard-friendly controls and reduced-motion support.

## Routes

- `/games` - arcade hub and game catalogue
- `/games/vault-breaker` - Wormzy
- `/games/prism-drift` - Aqua Fill
- `/history` - play history and statistics
- `/redeem` - coin balances and redemption options
- `/redeem/history` - redemption history
- `/spin` - lucky-draw wheel
- `/contact` - validate and store a message locally

`/games/wormzy` and `/games/aqua-fill` are kept as aliases for the two live games.

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The app seeds a demo wallet on first launch with 150 Tokens, 50 Game Coins, 2 VE, 1 SVE, 8 Gems and 3 Spins. Data remains in that browser until the `Reset local data` action in the footer is used.

## Currencies

| Currency | Wallet field | Earned by |
| --- | --- | --- |
| Game Coins | `gameCoins` | Every run, and as part of every coin tier |
| Silver Coins | `sves` | Clearing 5+ levels, and the Spin wheel |
| Golden Coins | `ves` | Clearing 10+ levels, and the Spin wheel |
| Diamonds | `gems` | Clearing every level, and the Spin wheel |
| Tokens | `tokens` | Redeeming Game Coins, and the Spin wheel |
| Spins | `spins` | Redeeming Game Coins |

Balances are read through a single reactive wallet store. A game payout or a spin result writes to IndexedDB and emits an update event, so the navbar, the Rewards page and the Spin summary all refresh without a reload.

## Scripts

```bash
npm run dev                   # Start the Vite development server
npm run build                 # Type-check and create a production build
npm run lint                  # Run Oxlint
npm run format                # Format source files with Prettier
npm run preview               # Serve the production build locally
npm run verify:wormzy         # Wormzy level generation + reward tier checks
npm run verify:rewards        # Reward, economy and catalogue checks
npm run verify:wormzy:render  # Server-render checks for the games and Rewards page
```

## Project structure

```text
src/
  components/  Shared layout, game cards, artwork and UI primitives
  config/      Game catalogue, currency artwork, economy constants, reward options
  context/     App readiness and wallet state
  db/          Dexie database schema and initial seed data
  games/       Interactive game implementations and shared arcade rewards
  hooks/       Shared gameplay, action-lock and balance-flash hooks
  pages/       Route-level screens
  services/    Wallet, session, reward, redemption, contact and settings logic
  types/       Shared domain models
```

## Verification

`npm run build` type-checks and bundles the app, and `npm run lint` runs Oxlint. Three scripted suites cover the reward logic:

- `verify:wormzy` — every Wormzy level is solvable, deterministic, and maps to the right reward tier.
- `verify:rewards` — coin tiers, payout monotonicity, entry/revive economy, redemption solvency, score-based coin bounds, and catalogue integrity.
- `verify:wormzy:render` — renders the live routes to markup and asserts the game screens, result popups, hub links and the four Rewards coin cards.

Browser smoke testing should still cover first-load seeding, hub navigation, first-time game guides, token deduction, game completion, redemption confirmation, history updates, contact validation and the reset-local-data action.

## Notes

- This is a frontend prototype. Contact messages are saved locally and are not emailed.
- The demo wallet and all progress are browser-local and are not an account or server-backed balance.
- The React Compiler is not enabled in this project.

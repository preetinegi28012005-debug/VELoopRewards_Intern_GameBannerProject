# VELOOP Games

VELOOP Games is a local-first rewards arcade built with React, TypeScript, Vite and Dexie. Players spend Tokens to enter short arcade challenges, earn Game Coins, and exchange those coins for VELOOP rewards.

All gameplay, wallet balances, history, redemptions and contact messages are stored in the browser's IndexedDB. This prototype has no backend and does not send those records to a server.

## Features

- Five playable games: Speed Tapper, Memory Match, Number Rush, Color Reflex and Catch the Coin.
- Eight additional game cards marked Coming Soon.
- Token entry fees, optional revives and Game Coin rewards.
- Redemption options for VE, SVE, Gems, Tokens and Spins.
- Local game history with filtering and sorting.
- Local contact-message storage with client-side validation.
- Responsive navigation, accessible labels, keyboard-friendly controls and reduced-motion support for the game carousel.

## Routes

- `/games` - arcade hub and game catalogue
- `/games/speed-tapper` - Speed Tapper
- `/games/memory-match` - Memory Match
- `/games/number-rush` - Number Rush
- `/games/color-reflex` - Color Reflex
- `/games/catch-the-coin` - Catch the Coin
- `/history` - play history and statistics
- `/redeem` - convert Game Coins into rewards
- `/redeem/history` - redemption history
- `/contact` - validate and store a message locally

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The app seeds a demo wallet on first launch with 150 Tokens and 50 Game Coins. Data remains in that browser until the `Reset local data` action in the footer is used.

## Scripts

```bash
npm run dev      # Start the Vite development server
npm run build    # Type-check and create a production build
npm run lint     # Run Oxlint
npm run format   # Format source files with Prettier
npm run preview  # Serve the production build locally
```

## Project structure

```text
src/
  components/  Shared layout, game cards, artwork and UI primitives
  config/      Game catalogue, economy constants and reward options
  context/     App readiness and wallet state
  db/          Dexie database schema and initial seed data
  games/       Interactive game implementations
  hooks/       Shared gameplay and action-lock hooks
  pages/       Route-level screens
  services/    Wallet, session, reward, contact and settings logic
  types/       Shared domain models
```

## Verification

The project is checked with the production build and Oxlint. Browser smoke testing should cover first-load seeding, hub navigation, first-time game guides, token deduction, game completion, redemption confirmation, history updates, contact validation and the reset-local-data action.

## Notes

- This is a frontend prototype. Contact messages are saved locally and are not emailed.
- The demo wallet and all progress are browser-local and are not an account or server-backed balance.
- The React Compiler is not enabled in this project.

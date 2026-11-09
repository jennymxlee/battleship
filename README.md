# Battleship

Play classic Battleship against a computer opponent in your browser.

**Play:** https://jennymxlee.github.io/battleship/ · **Bug report:** [BUGS.md](./BUGS.md)

## Features

- Standard rules: 10×10 board, five ships (5, 4, 3, 3, 2), one shot per turn, sunk ships are announced.
- Place ships by drag-and-drop (mouse or touch) or click-to-place, rotate with the button or `R`, or randomize.
- Three AI levels: **Easy** (random), **Medium** (hunt/target), **Hard** (probability density).
- Keyboard play (arrow keys + Enter), screen-reader labels and announcements, symbols as well as colour (• miss, ✕ hit, ▧ sunk), and layouts down to 360px-wide phones.

## How it's built

Vite + React 19 + TypeScript. No backend: everything runs in the browser and is deployed to GitHub Pages by GitHub Actions on every push to `main`.

```
src/
  game/          Pure game rules, no React. Everything is unit tested here.
    board.ts       placement validation, firing, sunk detection, the attacker's view
    game.ts        gameReducer: turns, win detection; illegal actions return the same state
    ai/            easy / medium / hard opponents, plus a simulation harness
  hooks/         useGame (AI turn timing), usePlacement, usePlacementDrag
  components/    screens, Grid, announcements
```

Design decisions:

- **Rules live in a pure reducer.** The UI dispatches actions and the reducer refuses anything illegal (shooting out of turn, a repeat shot, shooting after game over). That way UI bugs like double-clicks can't break the rules.
- **The AI only sees what a player would.** `toTargetView(board)` reduces a board to unknown / miss / hit / sunk cells plus the remaining ship lengths. The AI is a stateless function of that view, so it can't cheat and has no memory that could go stale between games.
- **Seeded randomness.** Every random choice takes an `rng`, so tests and simulations are reproducible.

### The AI

- **Easy** fires at random unknown cells.
- **Medium** hunts on a checkerboard spaced to the smallest remaining ship. After a hit it targets the neighbours, then follows the line both ways. Hits left over when a touching ship sinks stay targeted.
- **Hard** counts every legal placement of every remaining ship (ones that cover no miss or sunk cell) and fires at the cell covered most often. When there are unresolved hits, placements through those hits are weighted heavily.

`npm run sim` plays 200 seeded games per level on identical fleets:

| Level | Avg shots to win | Median | Worst |
| --- | ---: | ---: | ---: |
| Easy | 95.2 | 97 | 100 |
| Medium | 49.5 | 50 | 65 |
| Hard | 45.5 | 44 | 70 |

## Development

Requires Node 22.

```sh
npm install
npm run dev     # http://localhost:5173/battleship/
npm test        # unit + component tests (Vitest, Testing Library)
npm run lint
npm run build
npm run sim     # AI strength simulation
```

## How it was made

Built with Devin. A coordinating session wrote the game engine and split the AI and the UI out to two parallel sessions, each delivering a reviewed PR. A third session with no prior context then bug-bashed the finished game. Every PR went through CI and automated review, and every bug fix has a regression test. See [BUGS.md](./BUGS.md).

# NFL God Squad

Build an all-time NFL roster from randomized historical team-eras, then simulate a 17-game season and chase perfection.

## Standard Mode

Required roster:

- QB
- RB
- WR
- WR
- TE
- FLEX: RB, WR, or TE
- O-Line: the team's best offensive line unit from that era
- Defense: the team's best full defensive unit from that era

## Gameplay

- Era rolls come from a validated roster-backed NFL catalog.
- GOAT and superteam eras are rarity-weighted so they stay obtainable but feel special.
- Team and era rerolls consume the same queue, so rerolls do not create duplicate free shots.
- Once Sim Season starts, draft manipulation is locked.
- The simulation endpoint canonicalizes submitted roster IDs against trusted server-side data, so forged ratings or stats are ignored.

## Local Development

```bash
npm install
npm run dev
```

The app runs at http://localhost:3001.

## Validation

```bash
npm run typecheck
npm test
npm run build
```

## Security

- No API key is required for the curated standalone NFL game.
- Environment files are ignored by Git.
- Server endpoints validate request shape and reject cross-site simulation mutations.
- Simulation requests are body-size limited and rate limited.
- Production security headers are configured in `next.config.mjs`.

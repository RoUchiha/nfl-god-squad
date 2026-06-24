# Troubleshooting

## Install Or Build Fails

1. Use a current Node runtime.
2. Reinstall dependencies:

```bash
npm install
```

3. Run the validation set:

```bash
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

## Player Pool Is Empty

The app only serves curated NFL team-eras from `lib/sports/nfl.ts`. Check that the requested `teamId` and `eraId` exist in `getCuratedNFLEraCatalog()`.

## Simulation Request Fails

The simulation API intentionally rejects malformed or forged rosters.

- `403`: cross-site request blocked.
- `415`: request is not `application/json`.
- `413`: body is too large.
- `429`: simulation rate limit exceeded.
- `400`: roster shape, slot, duplicate, or player ID validation failed.

## Rerolls Or Swaps Disappear

This is expected after `Sim Season` is pressed. Drafting, skipping, rerolls, swaps, and removals lock once simulation begins.

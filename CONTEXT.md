# NFL God Squad Context

NFL God Squad is a standalone football version of the original God Squad draft-and-sim formula.

## Current Product Shape

- Standard mode only.
- Roster slots: QB, RB, WR, WR, TE, FLEX, O-Line, Defense.
- O-Line and Defense are team-unit cards for the strongest line/defense from that era.
- GM mode is intentionally deferred.

## Data Model

- The playable queue is built from curated NFL team-era entries in `lib/sports/nfl.ts`.
- Curated player/unit data is scored through `lib/algorithms/powerRating.ts`.
- The simulation endpoint canonicalizes submitted roster data server-side before calculating results, so client-forged names, stats, or ratings are ignored.

## Security Notes

- No API key is required for the current standalone NFL app.
- There are no client-exposed secrets.
- Mutating simulation requests are same-site checked, content-type checked, body-size limited, rate limited, and served with no-store responses.
- Security headers are configured in `next.config.mjs`.

## Validation

Use these checks before publishing:

```bash
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

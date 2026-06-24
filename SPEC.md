# NFL God Squad Spec

## Goal

Build a standalone NFL team-era draft game using the God Squad formula: roll a historical team-era, draft one eligible card, fill a compact roster, then simulate a 17-game season.

## Standard Mode

Required slots:

- 1 QB
- 1 RB
- 2 WR
- 1 TE
- 1 FLEX accepting RB, WR, or TE
- 1 O-Line unit
- 1 Defense unit

GM mode is out of scope for this version.

## Team-Era Rolls

- Era rolls come from the local curated NFL catalog.
- Each queue entry is consumed once before it can appear again in a fresh queue.
- Team reroll and era reroll each have a single-use budget.
- High-end eras are still available, but their queue weights are reduced so superstar-heavy rolls feel special.

## Integrity Rules

- A player or unit must match the target slot.
- Duplicate players are rejected.
- Once `Sim Season` is pressed, drafting, skipping, rerolling, removing, and swapping are locked.
- The simulation API does not trust client-submitted ratings or stats. It validates the submitted slot shell, looks up each player/unit by canonical ID and team-era, then simulates from the server-side canonical roster.

## Security Rules

- Keep secrets server-side. The current NFL build does not require any API key.
- Do not commit `.env.local`, `.env`, Vercel project state, or generated secret files.
- Simulation requests must enforce same-site origin checks, JSON content type, request-size limits, rate limits, and no-store responses.
- Production responses should include security headers for framing, MIME sniffing, referrer policy, permissions policy, CSP, and HSTS.

## Acceptance Checks

- TypeScript passes.
- Unit tests pass.
- Production build completes.
- `npm audit --omit=dev` reports no production vulnerabilities.
- Local smoke confirms homepage and player API load.
- Forged simulation payloads cannot change canonical ratings or stats.

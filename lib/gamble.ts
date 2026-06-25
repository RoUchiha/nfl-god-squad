import type { FilledRosterSlot, Player } from './types';
import { effectivePlayerScore } from './effectivePlayerScore';
import { rosterHasPlayer, slotAcceptsPlayer } from './playerIdentity';

export function selectGambleReplacement(
  slots: FilledRosterSlot[],
  slotId: string,
  players: Player[]
): Player | null {
  const slot = slots.find(item => item.id === slotId);
  if (!slot) return null;

  return players
    .filter(player => slotAcceptsPlayer(slot, player))
    .filter(player => !rosterHasPlayer(slots, player))
    .sort((a, b) =>
      effectivePlayerScore(slot, b) - effectivePlayerScore(slot, a) ||
      a.name.localeCompare(b.name)
    )[0] ?? null;
}

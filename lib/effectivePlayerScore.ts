import type { FilledRosterSlot, Player } from './types';

export function effectivePlayerScore(slot: FilledRosterSlot, player: Player): number {
  if (Array.isArray(slot.position) && slot.id === 'flex') {
    if (player.position === 'RB' && (player.stats.receivingYards ?? 0) >= 500) return Math.min(99, player.playerScore + 2);
    if (player.position === 'TE' && (player.stats.receivingYards ?? 0) >= 900) return Math.min(99, player.playerScore + 2);
  }
  return player.playerScore;
}

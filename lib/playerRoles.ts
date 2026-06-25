import type { Player, Position } from './types';

export function playerEligiblePositions(player: Player): Position[] {
  return [player.position];
}

import type { FilledRosterSlot, Player } from './types';
import { playerEligiblePositions } from './playerRoles';

export function normalizePlayerName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019'.]/g, '')
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSamePlayer(a: Player, b: Player): boolean {
  const aName = normalizePlayerName(a.name);
  const bName = normalizePlayerName(b.name);
  return aName && bName ? aName === bName : a.id === b.id;
}

export function rosterHasPlayer(slots: FilledRosterSlot[], player: Player): boolean {
  return slots.some(slot => slot.player && isSamePlayer(slot.player, player));
}

export function slotAcceptsPlayer(slot: FilledRosterSlot, player: Player): boolean {
  const eligiblePositions = playerEligiblePositions(player);
  return Array.isArray(slot.position)
    ? slot.position.some(position => eligiblePositions.includes(position))
    : eligiblePositions.includes(slot.position);
}

export function isFlexSlot(slot: FilledRosterSlot): boolean {
  return Array.isArray(slot.position);
}

export function hasFilledPrimarySlot(slots: FilledRosterSlot[], player: Player): boolean {
  return slots.some(slot =>
    !Array.isArray(slot.position) &&
    playerEligiblePositions(player).includes(slot.position) &&
    slot.player !== null
  );
}

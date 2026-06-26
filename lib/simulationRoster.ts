import type { FilledRosterSlot, Position } from './types';
import { getRosterTemplates } from './constants';
import { getCuratedNFLPlayers, NFL_TEAMS } from './sports/nfl';
import { getCuratedNFLEraCatalog } from './sports/nfl';
import { normalizePlayerName } from './playerIdentity';

const REQUIRED_SLOTS = getRosterTemplates('nfl', 'combined');

function slotAcceptsPosition(slotPosition: Position | Position[], playerPosition: Position): boolean {
  return Array.isArray(slotPosition)
    ? slotPosition.includes(playerPosition)
    : slotPosition === playerPosition;
}

export function validateSimulationRoster(slots: FilledRosterSlot[]): string | null {
  if (slots.length !== REQUIRED_SLOTS.length) return 'A complete eight-slot NFL roster is required.';

  const slotIds = new Set(slots.map(slot => slot.id));
  if (slotIds.size !== slots.length || REQUIRED_SLOTS.some(template => !slotIds.has(template.id))) {
    return 'Roster slots do not match the NFL Standard Mode template.';
  }

  const playerNames = new Set<string>();
  for (const template of REQUIRED_SLOTS) {
    const slot = slots.find(item => item.id === template.id);
    if (!slot) return 'Roster slots do not match the NFL Standard Mode template.';
    if (slot.label !== template.label || slot.group !== template.group || slot.required !== template.required) {
      return 'Roster slots do not match the NFL Standard Mode template.';
    }
    if (JSON.stringify(slot.position) !== JSON.stringify(template.position)) {
      return 'Roster slots do not match the NFL Standard Mode template.';
    }
    if (!slot.player) return 'A complete eight-slot NFL roster is required.';
    if (!slotAcceptsPosition(template.position, slot.player.position)) {
      return `${slot.player.name} is not eligible for ${slot.label}.`;
    }

    const normalized = normalizePlayerName(slot.player.name);
    if (playerNames.has(normalized)) return 'Duplicate players are not allowed.';
    playerNames.add(normalized);
  }

  return null;
}

export function canonicalizeSimulationRoster(
  slots: FilledRosterSlot[]
): { slots: FilledRosterSlot[]; error: null } | { slots: null; error: string } {
  const canonicalSlots: FilledRosterSlot[] = [];

  for (const slot of slots) {
    const submitted = slot.player;
    if (!submitted?.teamId || !submitted.eraId) {
      return { slots: null, error: 'Every player or unit must come from a validated drafted team-era.' };
    }

    const team = NFL_TEAMS.find(item => item.id === submitted.teamId);
    const catalogEntry = getCuratedNFLEraCatalog().find(item => item.team.id === submitted.teamId && item.era.id === submitted.eraId);
    const canonicalPlayer = team && catalogEntry
      ? getCuratedNFLPlayers(team, catalogEntry.era)?.find(player => player.id === submitted.id)
      : undefined;

    if (!canonicalPlayer) {
      return { slots: null, error: 'Roster contains an unknown or invalid player.' };
    }

    canonicalSlots.push({ ...slot, player: canonicalPlayer });
  }

  return { slots: canonicalSlots, error: null };
}

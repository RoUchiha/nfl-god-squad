import type { FilledRosterSlot } from './types';
import { slotAcceptsPlayer } from './playerIdentity';

export function swapRosterSlots(slots: FilledRosterSlot[], fromSlotId: string, toSlotId: string): FilledRosterSlot[] | null {
  if (fromSlotId === toSlotId) return slots;

  const from = slots.find(slot => slot.id === fromSlotId);
  const to = slots.find(slot => slot.id === toSlotId);
  if (!from?.player || !to?.player) return null;
  if (!slotAcceptsPlayer(from, to.player) || !slotAcceptsPlayer(to, from.player)) return null;

  return slots.map(slot => {
    if (slot.id === fromSlotId) return { ...slot, player: to.player };
    if (slot.id === toSlotId) return { ...slot, player: from.player };
    return slot;
  });
}

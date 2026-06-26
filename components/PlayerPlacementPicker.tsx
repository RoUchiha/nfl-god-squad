'use client';

import type { Player, FilledRosterSlot } from '@/lib/types';

interface Props {
  player: Player;
  slots: FilledRosterSlot[];
  onPlace: (player: Player, slotId: string) => void;
  onCancel: () => void;
}

function scoreColor(score: number): string {
  if (score >= 85) return '#ffd700';
  if (score >= 70) return '#a855f7';
  if (score >= 55) return '#3b82f6';
  return '#6b7280';
}

function positionMatches(slotPos: Player['position'] | Player['position'][], playerPos: Player['position']): boolean {
  if (Array.isArray(slotPos)) return slotPos.includes(playerPos);
  return slotPos === playerPos;
}

export default function PlayerPlacementPicker({ player, slots, onPlace, onCancel }: Props) {
  const compatible = slots.filter(s => !s.player && positionMatches(s.position, player.position));
  const posLabel = player.position.replace('_MLB', '').replace('_NHL', '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm animate-slide-up overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/5 p-4">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-400">
                {posLabel}
              </span>
              {player.isLegend && <span className="text-[10px] font-bold text-yellow-500">HOF</span>}
            </div>
            <div className="truncate font-bold text-white">{player.name}</div>
            <div className="text-xs text-gray-500">{player.yearsWithTeam}</div>
          </div>
          <div className="text-2xl font-black" style={{ color: scoreColor(player.playerScore) }}>
            {Math.round(player.playerScore)}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 text-xs uppercase tracking-wider text-gray-500">
            {compatible.length > 0 ? `Place ${player.name} at:` : `No open ${posLabel} slots`}
          </div>

          {compatible.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-600">
              All {posLabel} slots are filled.<br />
              Pick a compatible player or cancel.
            </div>
          ) : (
            <div className="space-y-2">
              {compatible.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => onPlace(player, slot.id)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-xs font-bold text-gray-500">
                      {Array.isArray(slot.position)
                        ? slot.position.map(p => p.replace('_MLB', '').replace('_NHL', '')).join('/')
                        : slot.position.replace('_MLB', '').replace('_NHL', '')}
                    </span>
                    <span className="text-sm text-gray-300">{slot.label}</span>
                  </div>
                  <span className="text-xs text-gray-600">Place here</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onCancel}
            className="w-full rounded-xl border border-white/5 py-2.5 text-sm text-gray-500 transition-colors hover:border-white/10 hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

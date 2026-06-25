'use client';

import type { FilledRosterSlot, Sport, Player } from '@/lib/types';

interface Props {
  slots: FilledRosterSlot[];
  sport: Sport;
  onInspect: (player: Player) => void;
  onPositionSwap: (slotId: string) => void;
  onSwapSlotClick: (slotId: string) => void;
  onGamble?: (slotId: string) => void;
  positionSwapUsed: boolean;
  activeSwapSlotId?: string | null;
  gambleAvailable?: boolean;
  gamblePending?: boolean;
  locked?: boolean;
  justPlacedSlotId: string | null;
}

export default function TeamRoster({
  slots,
  sport,
  onInspect,
  onPositionSwap,
  onSwapSlotClick,
  onGamble,
  positionSwapUsed,
  activeSwapSlotId = null,
  gambleAvailable = false,
  gamblePending = false,
  locked = false,
  justPlacedSlotId,
}: Props) {
  const offenseSlots = slots.filter(s => s.group === 'offense');
  const defenseSlots = slots.filter(s => s.group === 'defense' || s.group === 'pitching' || s.group === 'goalie');

  return (
    <div className="flex flex-col">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">Your Roster</h2>

      <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(100vh-280px)]">
        {offenseSlots.length > 0 && (
          <SlotGroup
            label={sport === 'mlb' ? 'Lineup' : sport === 'nhl' ? 'Forwards' : 'Offense'}
            slots={offenseSlots}
            onInspect={onInspect}
            onPositionSwap={onPositionSwap}
            onSwapSlotClick={onSwapSlotClick}
            onGamble={onGamble}
            positionSwapUsed={positionSwapUsed}
            activeSwapSlotId={activeSwapSlotId}
            gambleAvailable={gambleAvailable}
            gamblePending={gamblePending}
            locked={locked}
            justPlacedSlotId={justPlacedSlotId}
          />
        )}
        {defenseSlots.length > 0 && (
          <SlotGroup
            label={sport === 'mlb' ? 'Pitching' : sport === 'nhl' ? 'Defense / G' : 'Defense'}
            slots={defenseSlots}
            onInspect={onInspect}
            onPositionSwap={onPositionSwap}
            onSwapSlotClick={onSwapSlotClick}
            onGamble={onGamble}
            positionSwapUsed={positionSwapUsed}
            activeSwapSlotId={activeSwapSlotId}
            gambleAvailable={gambleAvailable}
            gamblePending={gamblePending}
            locked={locked}
            justPlacedSlotId={justPlacedSlotId}
          />
        )}
      </div>
    </div>
  );
}

function SlotGroup({
  label,
  slots,
  onInspect,
  onPositionSwap,
  onSwapSlotClick,
  onGamble,
  positionSwapUsed,
  activeSwapSlotId,
  gambleAvailable,
  gamblePending,
  locked,
  justPlacedSlotId,
}: {
  label: string;
  slots: FilledRosterSlot[];
  onInspect: (player: Player) => void;
  onPositionSwap: (id: string) => void;
  onSwapSlotClick: (id: string) => void;
  onGamble?: (id: string) => void;
  positionSwapUsed: boolean;
  activeSwapSlotId: string | null;
  gambleAvailable: boolean;
  gamblePending: boolean;
  locked: boolean;
  justPlacedSlotId: string | null;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 px-1 text-[10px] uppercase tracking-widest text-gray-600">{label}</div>
      <div className="space-y-1">
        {slots.map(slot => (
          <RosterSlot
            key={slot.id}
            slot={slot}
            onInspect={onInspect}
            onPositionSwap={onPositionSwap}
            onSwapSlotClick={onSwapSlotClick}
            onGamble={onGamble}
            positionSwapUsed={positionSwapUsed}
            activeSwapSlotId={activeSwapSlotId}
            gambleAvailable={gambleAvailable}
            gamblePending={gamblePending}
            locked={locked}
            isJustPlaced={slot.id === justPlacedSlotId}
          />
        ))}
      </div>
    </div>
  );
}

function RosterSlot({
  slot,
  onInspect,
  onPositionSwap,
  onSwapSlotClick,
  onGamble,
  positionSwapUsed,
  activeSwapSlotId,
  gambleAvailable,
  gamblePending,
  locked,
  isJustPlaced,
}: {
  slot: FilledRosterSlot;
  isJustPlaced: boolean;
  onInspect: (player: Player) => void;
  onPositionSwap: (id: string) => void;
  onSwapSlotClick: (id: string) => void;
  onGamble?: (id: string) => void;
  positionSwapUsed: boolean;
  activeSwapSlotId: string | null;
  gambleAvailable: boolean;
  gamblePending: boolean;
  locked: boolean;
}) {
  const posLabel = Array.isArray(slot.position)
    ? slot.position.map(p => p.replace('_MLB', '').replace('_NHL', '')).join('/')
    : slot.position.replace('_MLB', '').replace('_NHL', '');
  const isSwapSource = activeSwapSlotId === slot.id;
  const swapActive = activeSwapSlotId !== null;

  if (!slot.player) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
          slot.required
            ? 'border-dashed border-white/15 bg-white/2'
            : 'border-dashed border-white/8 bg-white/1 opacity-60'
        }`}
      >
        <span className="w-8 flex-shrink-0 text-[10px] font-bold text-gray-600">{posLabel}</span>
        <span className="text-xs italic text-gray-700">{slot.required ? 'Open slot' : 'Optional'}</span>
      </div>
    );
  }

  const p = slot.player;
  return (
    <div
      className={`group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 ${
        isSwapSource
          ? 'border-yellow-500/70 bg-yellow-950/40'
          : isJustPlaced
            ? 'border-green-700/60 bg-green-950/40'
            : swapActive
              ? 'border-yellow-500/30 bg-white/7 hover:border-yellow-400/70'
              : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      <button
        onClick={() => swapActive ? onSwapSlotClick(slot.id) : onInspect(p)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="w-8 flex-shrink-0 text-[10px] font-bold text-gray-500">{posLabel}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{p.name}</div>
          <div className="text-[10px] text-gray-600">{p.yearsWithTeam}</div>
        </div>
        <span className="tabular-nums text-sm font-bold" style={{ color: scoreColor(p.playerScore) }}>
          {Math.round(p.playerScore)}
        </span>
      </button>

      {!locked && !positionSwapUsed && !swapActive && (
        <button
          onClick={() => onPositionSwap(slot.id)}
          title="Use position swap"
          className="px-1 text-[10px] text-yellow-600 opacity-0 transition-opacity hover:text-yellow-400 group-hover:opacity-100"
        >
          Swap
        </button>
      )}

      {!locked && gambleAvailable && onGamble && !swapActive && (
        <button
          onClick={() => onGamble(slot.id)}
          disabled={gamblePending}
          title="Gamble this slot against a random unseen team-era"
          className="px-1 text-[10px] text-red-500 transition-colors hover:text-red-300 disabled:opacity-30"
        >
          Gamble
        </button>
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 85) return '#ffd700';
  if (score >= 70) return '#a855f7';
  if (score >= 55) return '#3b82f6';
  return '#6b7280';
}

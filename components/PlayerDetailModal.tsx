'use client';

import type { Player, Sport } from '@/lib/types';
import type { ReactNode } from 'react';
import PlayerCard from './PlayerCard';

interface Props {
  player: Player;
  sport: Sport;
  title?: string;
  onClose: () => void;
  actions?: ReactNode;
}

export default function PlayerDetailModal({ player, sport, title = 'Player Details', onClose, actions }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass rounded-2xl border border-white/10 p-4 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-300">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400 hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>
        <PlayerCard
          player={player}
          sport={sport}
          isSelected={false}
          isHighlighted={true}
          onSelect={() => undefined}
        />
        {actions && <div className="mt-4 flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

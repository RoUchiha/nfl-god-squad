'use client';

import { useState, useCallback, useRef } from 'react';
import type { Player, Sport, DraftMode } from '@/lib/types';
import PlayerCard from './PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';

interface Props {
  players: Player[];
  isLoading: boolean;
  sport: Sport;
  mode?: DraftMode;
  onDraft: (player: Player) => void;
  onSkip: () => void;
}

const SKELETON_COUNT = 8;

export default function PlayerPool({ players, isLoading, sport, mode, onDraft, onSkip }: Props) {
  const [selected, setSelected] = useState<Player | null>(null);
  const [draftFired, setDraftFired] = useState(false);
  const draftFiredRef = useRef(false);

  const visiblePlayers = (sport === 'nfl' && mode && mode !== 'combined')
    ? players.filter(p => p.positionGroup === mode)
    : players;

  const handleCardClick = useCallback((player: Player) => {
    if (draftFiredRef.current) return;
    setSelected(player);
  }, []);

  const handleDraft = useCallback(() => {
    if (!selected || draftFiredRef.current) return;
    draftFiredRef.current = true;
    setDraftFired(true);
    onDraft(selected);
  }, [selected, onDraft]);

  const handleSkip = useCallback(() => {
    if (draftFiredRef.current) return;
    draftFiredRef.current = true;
    setDraftFired(true);
    onSkip();
  }, [onSkip]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Player Pool</h2>
          {selected && !draftFired && (
            <p className="mt-0.5 text-xs text-yellow-400">
              <span className="font-semibold">{selected.name}</span> ready to draft
            </p>
          )}
        </div>
        {!isLoading && visiblePlayers.length > 0 && (
          <span className="text-xs text-gray-600">{visiblePlayers.length} players</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 space-y-2">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
      ) : visiblePlayers.length === 0 ? (
        <div className="glass flex-1 rounded-lg p-8 text-center text-sm text-gray-600">
          No players loaded
        </div>
      ) : (
        <div className="max-h-[52vh] flex-1 space-y-1.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-300px)]">
          {visiblePlayers.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              sport={sport}
              isSelected={false}
              isHighlighted={selected?.id === player.id}
              onSelect={handleCardClick}
            />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="mt-3">
          <button
            onClick={handleSkip}
            disabled={draftFired}
            className="w-full rounded-xl border border-white/5 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-white/10 hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-30"
            title="Skip this era"
          >
            Skip Era
          </button>
        </div>
      )}

      {selected && !draftFired && (
        <PlayerDetailModal
          player={selected}
          sport={sport}
          title="Draft Player"
          onClose={() => setSelected(null)}
          actions={
            <>
              <button
                onClick={handleDraft}
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-black transition-transform hover:bg-gray-200 active:scale-[0.98]"
              >
                Draft
              </button>
              <button
                onClick={handleSkip}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 hover:border-white/20 hover:text-white"
              >
                Skip
              </button>
            </>
          }
        />
      )}
    </div>
  );
}

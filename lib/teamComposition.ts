import type { FilledRosterSlot, TeamCompositionAnalysis } from './types';

export function analyzeTeamComposition(slots: FilledRosterSlot[]): TeamCompositionAnalysis {
  const players = slots.map(slot => slot.player).filter(Boolean);
  const pros: string[] = [];
  const cons: string[] = [];
  const score = (position: string) => players.find(player => player?.position === position)?.playerScore ?? 0;
  const allScores = players.map(player => player!.playerScore);
  const eliteCount = allScores.filter(value => value >= 88).length;

  if (score('QB') >= 90) pros.push('Elite quarterback gives the roster a real undefeated ceiling.');
  else if (score('QB') < 78) cons.push('Quarterback play is the biggest cap on the season ceiling.');

  if (players.filter(player => player?.position === 'WR' && player.playerScore >= 85).length >= 2) {
    pros.push('Two high-end receivers stress every coverage shell.');
  }

  const rbFlex = players.filter(player => player?.position === 'RB').map(player => player!.playerScore);
  if (rbFlex.length >= 2 && Math.min(...rbFlex) >= 80) pros.push('Backfield depth keeps the offense efficient late in games.');

  if (score('OL') >= 85) pros.push('The offensive line raises both floor and explosiveness.');
  else if (score('OL') < 72) cons.push('Pass protection is a weak link against elite defenses.');

  if (score('DEF') >= 85) pros.push('A championship-caliber defense can steal low-margin games.');
  else if (score('DEF') < 72) cons.push('The defense may force the offense into shootouts.');

  if (eliteCount >= 5) pros.push('Multiple blue-chip roster spots create matchup-proof weeks.');
  if (allScores.length && Math.min(...allScores) < 65) cons.push('At least one starter grades as a targetable weak spot.');

  return { pros, cons };
}

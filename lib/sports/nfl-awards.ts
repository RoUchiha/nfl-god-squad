import type { Era, Player } from '../types';

const NFL_MVP_SEASONS_BY_PLAYER: Record<string, number[]> = {
  'John Brodie': [1970],
  'Alan Page': [1971],
  'Larry Brown': [1972],
  'O.J. Simpson': [1973],
  'Ken Stabler': [1974],
  'Fran Tarkenton': [1975],
  'Bert Jones': [1976],
  'Walter Payton': [1977],
  'Terry Bradshaw': [1978],
  'Earl Campbell': [1979],
  'Brian Sipe': [1980],
  'Ken Anderson': [1981],
  'Mark Moseley': [1982],
  'Joe Theismann': [1983],
  'Dan Marino': [1984],
  'Marcus Allen': [1985],
  'Lawrence Taylor': [1986],
  'John Elway': [1987],
  'Boomer Esiason': [1988],
  'Joe Montana': [1989, 1990],
  'Thurman Thomas': [1991],
  'Steve Young': [1992, 1994],
  'Emmitt Smith': [1993],
  'Brett Favre': [1995, 1996, 1997],
  'Barry Sanders': [1997],
  'Terrell Davis': [1998],
  'Kurt Warner': [1999, 2001],
  'Marshall Faulk': [2000],
  'Rich Gannon': [2002],
  'Peyton Manning': [2003, 2004, 2008, 2009, 2013],
  'Steve McNair': [2003],
  'Shaun Alexander': [2005],
  'LaDainian Tomlinson': [2006],
  'Tom Brady': [2007, 2010, 2017],
  'Adrian Peterson': [2012],
  'Aaron Rodgers': [2011, 2014, 2020, 2021],
  'Cam Newton': [2015],
  'Matt Ryan': [2016],
  'Patrick Mahomes': [2018, 2022],
  'Lamar Jackson': [2019, 2023],
  'Josh Allen': [2024],
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const NFL_MVP_SEASONS_BY_NORMALIZED_PLAYER = new Map(
  Object.entries(NFL_MVP_SEASONS_BY_PLAYER).map(([name, seasons]) => [normalizeName(name), seasons])
);

export function playerWonMvpInEra(playerName: string, era: Era): boolean {
  const seasons = NFL_MVP_SEASONS_BY_NORMALIZED_PLAYER.get(normalizeName(playerName)) ?? [];
  return seasons.some(season => season >= era.startYear && season <= era.endYear);
}

export function applyNflAwardFloors(player: Player, era: Era): Player {
  if (!playerWonMvpInEra(player.name, era)) return player;

  return {
    ...player,
    playerScore: Math.max(player.playerScore, 90),
    isAllStar: true,
  };
}

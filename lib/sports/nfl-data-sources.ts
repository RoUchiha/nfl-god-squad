export const NFL_DATA_SOURCES = [
  {
    name: 'nflverse player summary stats',
    url: 'https://github.com/nflverse/nflverse-data/releases/tag/stats_player',
    use: 'QB, RB, WR, and TE regular-season stat lines from 1999-2024.',
  },
  {
    name: 'nflverse team summary stats',
    url: 'https://github.com/nflverse/nflverse-data/releases/tag/stats_team',
    use: 'Team passing, rushing, sack, takeaway, pass-defense, and tackle-for-loss signals for O-line and defense units.',
  },
  {
    name: 'nflverse weekly rosters',
    url: 'https://github.com/nflverse/nflverse-data/releases/tag/weekly_rosters',
    use: 'Reference source for roster identity checks and future starter-depth expansion from 2002 onward.',
  },
  {
    name: 'nflreadr source index',
    url: 'https://nflreadr.nflverse.com/',
    use: 'Documents nflverse release access patterns plus upstream NFL, ESPN, and DynastyProcess data feeds.',
  },
] as const;

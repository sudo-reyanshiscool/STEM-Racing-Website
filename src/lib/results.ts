// Groups competition results for the table on the Teams page.

export type ResultEvent = 'Regionals' | 'Nationals' | 'World Finals';

export interface ResultData {
  season: string;
  team: string;
  event: ResultEvent;
  placing: string;
  awards: string[];
}

export interface SeasonResults {
  season: string;
  rows: ResultData[];
}

const EVENT_ORDER: Record<ResultEvent, number> = { 'World Finals': 0, Nationals: 1, Regionals: 2 };

export function worldFinalsCount(results: readonly ResultData[]): number {
  return results.filter((result) => result.event === 'World Finals').length;
}

export function groupResultsBySeason(results: readonly ResultData[]): SeasonResults[] {
  const seasons = [...new Set(results.map((result) => result.season))].sort((a, b) => b.localeCompare(a));
  return seasons.map((season) => ({
    season,
    rows: results
      .filter((result) => result.season === season)
      .sort((a, b) => EVENT_ORDER[a.event] - EVENT_ORDER[b.event] || a.team.localeCompare(b.team)),
  }));
}

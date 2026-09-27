// The site is built once and read for weeks. This keeps "Next up" and the dimmed
// past items correct for the day the page is opened.
import { isPast, seasonView, todayIso, type SeasonData } from '../lib/season';

const today = todayIso();

for (const list of document.querySelectorAll<HTMLElement>('[data-dim-past]')) {
  for (const item of list.querySelectorAll<HTMLElement>('[data-date]')) {
    item.classList.toggle('is-past', isPast(item.dataset.date, today));
  }
}

for (const panel of document.querySelectorAll<HTMLElement>('[data-season-status]')) {
  const raw = panel.dataset.season;
  if (!raw) continue;

  let season: SeasonData;
  try {
    season = JSON.parse(raw) as SeasonData;
  } catch {
    continue;
  }

  const view = seasonView(season, today);
  const write = (key: string, value: string) => {
    const element = panel.querySelector<HTMLElement>(`[data-status="${key}"]`);
    if (element) element.textContent = value;
  };
  write('registration', view.registration);
  write('next-label', view.nextLabel);
  write('next-title', view.nextTitle);
  write('next-date', view.nextDate);
}

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export const dataFile = (app) => `data/${app}.json`;

export function load(app) {
  const f = dataFile(app);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { days: [], reviews: [], rating: null, ratingCount: 0, updated: null };
}

export function save(app, data) {
  const f = dataFile(app);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(data, null, 1));
}

/** Add or replace one day's numbers, keep the last 120 days, oldest first. */
export function putDay(data, row) {
  const days = data.days.filter((d) => d.date !== row.date).concat(row).sort((a, b) => a.date.localeCompare(b.date));
  return { ...data, days: days.slice(-120) };
}

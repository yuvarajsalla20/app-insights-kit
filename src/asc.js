import { gunzipSync } from 'node:zlib';
import { parseSales } from './sales.js';

const BASE = 'https://api.appstoreconnect.apple.com';

async function get(path, token, binary) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: binary ? 'application/a-gzip' : 'application/json' } });
  if (res.status === 404 && binary) return null; // no report for that day
  if (!res.ok) throw new Error(`App Store Connect ${res.status} on ${path.split('?')[0]}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
}

const day = (d) => d.toISOString().slice(0, 10);

/** Downloads for one day (Apple publishes yesterday's report some hours after midnight Pacific). */
export async function downloadsFor(date, { appId, vendorNumber }, token) {
  const q = new URLSearchParams({ 'filter[frequency]': 'DAILY', 'filter[reportType]': 'SALES', 'filter[reportSubType]': 'SUMMARY', 'filter[vendorNumber]': vendorNumber, 'filter[reportDate]': day(date) });
  const gz = await get(`/v1/salesReports?${q}`, token, true);
  return { date: day(date), ...(gz ? parseSales(gunzipSync(gz).toString('utf8'), appId) : { first: 0, again: 0 }) };
}

/** The newest reviews (up to 50) and the rating, worked out from a larger sample. */
export async function reviewsFor({ appId }, token) {
  const j = await get(`/v1/apps/${appId}/customerReviews?sort=-createdDate&limit=200`, token);
  const all = (j.data ?? []).map((r) => ({ id: r.id, stars: r.attributes.rating, title: r.attributes.title, body: r.attributes.body, name: r.attributes.reviewerNickname, date: r.attributes.createdDate, country: r.attributes.territory }));
  const avg = all.length ? Math.round((all.reduce((s, r) => s + r.stars, 0) / all.length) * 10) / 10 : null;
  return { reviews: all.slice(0, 50), rating: avg, ratingCount: all.length };
}

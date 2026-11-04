/** Sales report columns we use. Product types 1, 1F, 1T, F1 are first-time downloads; 3, 3F, 3T are re-downloads. */
const FIRST = new Set(['1', '1F', '1T', 'F1']);
const AGAIN = new Set(['3', '3F', '3T']);

/** Turn one daily SALES/SUMMARY report (tab-separated text) into download counts for one app. */
export function parseSales(tsv, appleId) {
  const [header, ...rows] = tsv.trim().split('\n').map((l) => l.split('\t'));
  if (!header) return { first: 0, again: 0 };
  const col = (n) => header.indexOf(n);
  const type = col('Product Type Identifier'), units = col('Units'), apple = col('Apple Identifier');
  let first = 0, again = 0;
  for (const r of rows) {
    if (r[apple] !== String(appleId)) continue;
    const n = Number(r[units]) || 0;
    if (FIRST.has(r[type])) first += n;
    else if (AGAIN.has(r[type])) again += n;
  }
  return { first, again };
}

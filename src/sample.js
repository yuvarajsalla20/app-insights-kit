/** Made-up numbers so the page can be seen before any app is live. Clearly marked as sample on the page. */
export function sampleData(now = new Date()) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 864e5);
    const first = 4 + ((i * 7) % 11) + Math.floor(i / 3);
    return { date: d.toISOString().slice(0, 10), first, again: (i * 3) % 4 };
  });
  const reviews = [
    { id: 's1', stars: 5, title: 'Finally an alarm that wakes me', body: 'The buddies are cute and the ringing keeps going until I stop it.', name: 'sample', date: now.toISOString(), country: 'USA' },
    { id: 's2', stars: 3, title: 'Name box hard to see', body: 'Could not tell where to type the reminder name.', name: 'sample', date: new Date(now.getTime() - 864e5).toISOString(), country: 'USA' },
  ];
  return { days, reviews, rating: 4.0, ratingCount: 2, updated: now.toISOString(), sample: true };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { makeToken } from '../src/jwt.js';
import { parseSales } from '../src/sales.js';
import { putDay } from '../src/store.js';
import { renderPage } from '../src/page.js';
import { sampleData } from '../src/sample.js';

test('token is ES256 and verifies', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const t = makeToken({ keyId: 'K1', issuerId: 'I1', privateKey: pem, now: 1_700_000_000_000 });
  const [h, b, s] = t.split('.');
  assert.equal(JSON.parse(Buffer.from(h, 'base64url')).kid, 'K1');
  const body = JSON.parse(Buffer.from(b, 'base64url'));
  assert.equal(body.aud, 'appstoreconnect-v1');
  assert.equal(body.exp - body.iat, 900);
  assert.ok(verify('sha256', Buffer.from(`${h}.${b}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url')));
});

test('sales report: counts only this app, splits first-time and re-downloads', () => {
  const tsv = ['Apple Identifier\tProduct Type Identifier\tUnits', '111\t1F\t5', '111\t3F\t2', '111\t7\t9', '222\t1F\t50', '111\t1\t1'].join('\n');
  assert.deepEqual(parseSales(tsv, 111), { first: 6, again: 2 });
  assert.deepEqual(parseSales('', 111), { first: 0, again: 0 });
});

test('putDay replaces a day, sorts, and keeps 120', () => {
  let d = { days: [] };
  d = putDay(d, { date: '2026-01-02', first: 1, again: 0 });
  d = putDay(d, { date: '2026-01-01', first: 2, again: 0 });
  d = putDay(d, { date: '2026-01-02', first: 9, again: 0 });
  assert.deepEqual(d.days.map((x) => [x.date, x.first]), [['2026-01-01', 2], ['2026-01-02', 9]]);
  for (let i = 0; i < 150; i++) d = putDay(d, { date: `2027-01-${String(i).padStart(3, '0')}`, first: 0, again: 0 });
  assert.equal(d.days.length, 120);
});

test('page: review text cannot break out of the script tag', () => {
  const data = sampleData(new Date('2026-11-04T12:00:00Z'));
  data.reviews[0].body = '</script><script>alert(1)</script>';
  const html = renderPage([{ id: 'a', name: 'A', data }], '0.1.0', new Date('2026-11-04T20:00:00Z'));
  assert.equal(html.split('</script>').length - 1, 1);
  assert.match(html, /v0\.1\.0 \| Nov 4, 2026 \| 2:00 PM CT/);
});

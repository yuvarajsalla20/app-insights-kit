import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { makeToken } from './jwt.js';
import { downloadsFor, reviewsFor } from './asc.js';
import { load, save, putDay } from './store.js';
import { sampleData } from './sample.js';
import { renderPage } from './page.js';
import { KIT_VERSION } from './version.js';

const apps = () => readdirSync('apps').filter((f) => f.endsWith('.json')).map((f) => ({ id: f.slice(0, -5), ...JSON.parse(readFileSync(`apps/${f}`, 'utf8')) }));

async function pull() {
  const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY } = process.env;
  if (!ASC_KEY_ID || !ASC_ISSUER_ID || !ASC_PRIVATE_KEY) throw new Error('Set ASC_KEY_ID, ASC_ISSUER_ID and ASC_PRIVATE_KEY.');
  const token = makeToken({ keyId: ASC_KEY_ID, issuerId: ASC_ISSUER_ID, privateKey: ASC_PRIVATE_KEY.replace(/\\n/g, '\n') });
  for (const app of apps()) {
    if (app.appId.startsWith('REPLACE')) { console.log(`${app.name}: not set up yet, skipped.`); continue; }
    let data = load(app.id);
    // Re-fetch the last 3 days: Apple fills in late.
    for (let back = 1; back <= 3; back++) data = putDay(data, await downloadsFor(new Date(Date.now() - back * 864e5), app, token));
    data = { ...data, ...(await reviewsFor(app, token)), updated: new Date().toISOString(), sample: false };
    save(app.id, data);
    console.log(`${app.name}: updated.`);
  }
}

function build(useSample) {
  const list = apps().map((a) => ({ id: a.id, name: a.name, data: useSample ? sampleData() : load(a.id) }));
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/index.html', renderPage(list, KIT_VERSION, new Date()));
  console.log('dist/index.html written');
}

const cmd = process.argv[2];
if (cmd === 'pull') await pull();
else if (cmd === 'build') build(false);
else if (cmd === 'sample') build(true);
else console.log('Use: pull | build | sample');

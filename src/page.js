const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Data goes into a script tag as JSON; "<" is escaped so review text can never close the tag. */
const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const stamp = (d) => {
  const f = (o) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', ...o }).format(d);
  return `${f({ month: 'short', day: 'numeric', year: 'numeric' })} | ${f({ hour: 'numeric', minute: '2-digit' })} CT`;
};

/** One self-contained page: no libraries, no network calls. The apps' numbers are inside it. */
export function renderPage(apps, version, now) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>App insights</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;background-color:#1a0846;background-image:radial-gradient(ellipse 90% 46% at 100% 0%,#d9a3f7 0,transparent 62%),radial-gradient(ellipse 90% 55% at 0% 30%,#9a3dff 0,transparent 62%),radial-gradient(ellipse 115% 62% at 50% 100%,#4a1bd0 0,transparent 62%);background-attachment:fixed;color:#fff;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{flex:1;width:100%;max-width:880px;margin:0 auto;padding:28px 16px 48px}
h1{font-size:32px;letter-spacing:-.8px;margin:0 0 16px}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.tabs button{border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.18);color:#fff;border-radius:999px;padding:8px 16px;font:600 15px inherit;cursor:pointer}
.tabs button[aria-pressed=true]{background:#fff;color:#2a1062}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}
.card{background:rgba(44,22,112,.5);border:1px solid rgba(255,255,255,.35);border-top-color:rgba(255,255,255,.75);border-radius:22px;padding:16px;backdrop-filter:blur(18px)}
.card small{display:block;color:rgba(255,255,255,.8);font-weight:600}
.card b{display:block;font-size:34px;letter-spacing:-1px}
h2{font-size:18px;margin:22px 0 8px}
svg{width:100%;height:auto;display:block}
.rev{padding:12px 0;border-top:1px solid rgba(255,255,255,.22)}.rev:first-child{border-top:0}
.rev b{display:block;font-size:17px;letter-spacing:0}.rev .s{color:#ffd23f;letter-spacing:2px}.rev p{margin:4px 0 0;color:#f1e9ff;overflow-wrap:anywhere}
.note{color:rgba(255,255,255,.8);font-size:14px}
.tag{display:inline-block;background:#ffd23f;color:#2a1062;border-radius:999px;padding:2px 10px;font:700 12px inherit;margin-left:8px;vertical-align:middle}
footer{background:#5b606b;color:#f2f4fb;text-align:center;font-size:11px;padding:10px}
</style></head><body><main>
<h1>App insights</h1><div class="tabs" id="tabs"></div><div id="view"></div>
<p class="note">Downloads come from Apple's daily sales report. Apple publishes each day some hours after midnight Pacific, so the newest day can be missing or still rising. The rating is worked out from the newest reviews written in the App Store, not from star-only ratings.</p>
</main><footer>app-insights-kit v${esc(version)} | ${esc(stamp(now))}</footer>
<script>
const APPS=${safeJson(apps)};
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
function chart(days){
  const W=640,H=180,P=24,max=Math.max(1,...days.map(d=>d.first+d.again)),bw=(W-P*2)/Math.max(days.length,1);
  const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 '+W+' '+H);
  days.forEach((d,i)=>{[['first','#fff',d.first,0],['again','#4db3ff',d.again,d.first]].forEach(([k,c,v,base])=>{
    const h=(v/max)*(H-P*2),r=document.createElementNS(ns,'rect');
    r.setAttribute('x',P+i*bw+1);r.setAttribute('width',Math.max(bw-2,1));r.setAttribute('y',H-P-((base+v)/max)*(H-P*2));r.setAttribute('height',h);r.setAttribute('fill',c);r.setAttribute('rx',2);
    const t=document.createElementNS(ns,'title');t.textContent=d.date+': '+v+(k==='first'?' new':' re-downloads');r.appendChild(t);s.appendChild(r)})});
  return s}
function show(app){
  const v=document.getElementById('view');v.replaceChildren();const d=app.data,last=d.days.slice(-30);
  const sum=(a,k)=>a.reduce((n,x)=>n+x[k],0);
  const g=el('div','grid');
  [['New downloads (30 days)',sum(last,'first')],['Re-downloads (30 days)',sum(last,'again')],['Rating',d.rating==null?'–':d.rating.toFixed(1)],['Reviews counted',d.ratingCount]].forEach(([a,b])=>{const c=el('div','card');c.append(el('small','',a),el('b','',b));g.append(c)});
  v.append(g);
  const h=el('h2','','Downloads per day');if(d.sample)h.append(el('span','tag','SAMPLE DATA'));v.append(h);
  const c=el('div','card');c.append(last.length?chart(last):el('p','note','No data yet.'));v.append(c);
  v.append(el('h2','','Newest reviews'));const rc=el('div','card');
  if(!d.reviews.length)rc.append(el('p','note','No reviews yet.'));
  d.reviews.slice(0,20).forEach(r=>{const x=el('div','rev');x.append(el('div','s','★'.repeat(r.stars)+'☆'.repeat(5-r.stars)));x.append(el('b','',r.title||''));x.append(el('p','',r.body||''));x.append(el('p','note',[r.name,r.country,(r.date||'').slice(0,10)].filter(Boolean).join(' · ')));rc.append(x)});
  v.append(rc);if(d.updated)v.append(el('p','note','Updated '+new Date(d.updated).toLocaleString()))}
const tabs=document.getElementById('tabs');
APPS.forEach((a,i)=>{const b=el('button','',a.name);b.type='button';b.onclick=()=>{[...tabs.children].forEach(x=>x.setAttribute('aria-pressed',x===b));show(a)};tabs.append(b);if(i===0)b.click()});
</script></body></html>`;
}

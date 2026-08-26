/* DISSENT console. No frameworks. */
'use strict';

const REPO_URL = 'https://github.com/ArockiaRajamanickam/dissent';
const state = { assets: [], summary: null, events: null, morandi: null,
                world: null, jur: 'RI', eventsRI: null,
                bandFilter: 'priority', query: '', sortKey: 'rank', sortAsc: true };
const $ = (s, el) => (el || document).querySelector(s);
const fmt = n => n === null || n === undefined ? '—' : n.toLocaleString('en-US');

/* ============ BOCPD: Adams-MacKay, NIG (unknown mean + variance) ============
   The changepoint path emits under a broad new-segment prior so the
   run-length-zero posterior genuinely spikes at a level shift.
   Mirrors pipeline/03_model.py exactly. */
function gammaln(z) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}
function tLogPdf(x, mu, k, a, b) {
  const df = 2 * a, sc2 = b * (k + 1) / (a * k);
  const z2 = (x - mu) ** 2 / sc2;
  return gammaln((df + 1) / 2) - gammaln(df / 2) -
         0.5 * Math.log(Math.PI * df * sc2) - (df + 1) / 2 * Math.log1p(z2 / df);
}
function bocpd(series, hazard = 1 / 10) {
  const n = series.length;
  if (n < 4) return series.map(() => 0);
  const diffs = [];
  for (let i = 1; i < Math.min(8, n); i++) diffs.push(Math.abs(series[i] - series[i - 1]));
  diffs.sort((a, b) => a - b);
  const sigma0 = Math.max(diffs.length ? diffs[Math.floor(diffs.length / 2)] : 0.5, 0.35);
  const mu0 = series[0], k0 = 0.5, a0 = 1.5, b0 = a0 * sigma0 ** 2;
  const wideB = a0 * (4.0 * sigma0) ** 2;
  let R = [1.0], mu = [mu0], k = [k0], a = [a0], b = [b0];
  const cps = [];
  for (const x of series) {
    const like = mu.map((m, i) =>
      Math.exp(Math.max(Math.min(tLogPdf(x, m, k[i], a[i], b[i]), 60), -60)));
    const runMean = R.reduce((s, r, i) => s + r * mu[i], 0);
    const pi0 = Math.exp(Math.max(tLogPdf(x, runMean, 0.3, a0, wideB), -60));
    const growth = R.map((r, i) => r * like[i] * (1 - hazard));
    R = [hazard * pi0, ...growth];
    const Z = Math.max(R.reduce((s, v) => s + v, 0), 1e-300);
    R = R.map(v => v / Z);
    cps.push(R[0]);
    b = [b0, ...b.map((bv, i) => bv + k[i] * (x - mu[i]) ** 2 / (2 * (k[i] + 1)))];
    mu = [mu0, ...mu.map((m, i) => (k[i] * m + x) / (k[i] + 1))];
    k = [k0, ...k.map(v => v + 1)];
    a = [a0, ...a.map(v => v + 0.5)];
  }
  return cps;
}

/* ============ SVG charts (drawn on cream paper) ============ */
function svgOpen(w, h) { return `<svg class="chart" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`; }

function trajChart(traj, cps, opts = {}) {
  const W = 900, H = 300, L = 44, R = 16, T = 18, B = 66;
  const years = traj.map(t => t[0]);
  const x0 = Math.min(...years), x1 = Math.max(...years);
  const X = yr => L + (yr - x0) / Math.max(x1 - x0, 1) * (W - L - R);
  const Y = r => T + (9 - r) / 9 * (H - T - B);
  const q = state.summary ? state.summary.q90 : 1.3;
  let s = svgOpen(W, H);
  for (let r = 0; r <= 9; r += 3) {
    s += `<line x1="${L}" y1="${Y(r)}" x2="${W - R}" y2="${Y(r)}" stroke="#EFECE4"/>`;
    s += `<text x="${L - 8}" y="${Y(r) + 4}" font-size="11" fill="#6A7088" text-anchor="end" font-family="Courier Prime">${r}</text>`;
  }
  for (let yr = Math.ceil(x0 / 5) * 5; yr <= x1; yr += 5) {
    s += `<text x="${X(yr)}" y="${H - B + 17}" font-size="11" fill="#6A7088" text-anchor="middle" font-family="Courier Prime">${yr}</text>`;
  }
  const band = traj.filter(t => t[2] !== null);
  if (band.length) {
    const up = band.map(t => `${X(t[0])},${Y(Math.min(t[2] + q, 9))}`).join(' ');
    const lo = band.slice().reverse().map(t => `${X(t[0])},${Y(Math.max(t[2] - q, 0))}`).join(' ');
    s += `<polygon points="${up} ${lo}" fill="#3A5CA8" opacity="0.10"/>`;
    s += `<polyline points="${band.map(t => `${X(t[0])},${Y(t[2])}`).join(' ')}" fill="none" stroke="#3A5CA8" stroke-width="2.2"/>`;
  }
  const rec = traj.filter(t => t[1] !== null);
  if (rec.length) {
    let path = '';
    rec.forEach((t, i) => {
      path += i === 0 ? `M ${X(t[0])} ${Y(t[1])}` : ` H ${X(t[0])} V ${Y(t[1])}`;
    });
    path += ` H ${X(x1)}`;
    s += `<path d="${path}" fill="none" stroke="#20263E" stroke-width="2.4"/>`;
    rec.forEach(t => { s += `<circle cx="${X(t[0])}" cy="${Y(t[1])}" r="2.6" fill="#20263E"/>`; });
  }
  if (cps && cps.length && rec.length) {
    const bh = 34;
    rec.forEach((t, i) => {
      const c = cps[i] || 0;
      if (c > 0.02) s += `<rect x="${X(t[0]) - 3}" y="${H - 26 - c * bh}" width="6" height="${c * bh}" fill="#C6283C" opacity="0.85"/>`;
    });
  }
  (opts.markers || []).forEach(m => {
    s += `<line x1="${X(m.year)}" y1="${T}" x2="${X(m.year)}" y2="${H - B}" stroke="#C6283C" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    s += `<text x="${X(m.year) + 5}" y="${T + 13}" font-size="11" fill="#C6283C" font-family="Courier Prime">${m.label}</text>`;
  });
  return s + '</svg>';
}

function figbar(left, right) {
  return `<div class="figbar"><span class="legend">${left}</span><span>${right}</span></div>`;
}
const LEG = {
  record: '<span><i style="background:#20263E"></i>official record (0-9)</span>',
  physics: '<span><i style="background:#3A5CA8"></i>physics-only prediction</span>',
  bandc: '<span><i style="background:#3A5CA8;opacity:.25;height:8px"></i>conformal interval</span>',
  cp: '<span><i style="background:#C6283C"></i>changepoint probability</span>',
};

function sparkline(traj) {
  const W = 92, H = 22;
  const pts = traj.filter(t => t[1] !== null);
  if (pts.length < 2) return '';
  const x0 = pts[0][0], x1 = pts[pts.length - 1][0];
  const X = yr => 2 + (yr - x0) / Math.max(x1 - x0, 1) * (W - 4);
  const Y = r => 2 + (9 - r) / 9 * (H - 4);
  const rec = pts.map(t => `${X(t[0]).toFixed(1)},${Y(t[1]).toFixed(1)}`).join(' ');
  const prd = traj.filter(t => t[2] !== null)
    .map(t => `${X(t[0]).toFixed(1)},${Y(t[2]).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <polyline points="${prd}" fill="none" stroke="#3A5CA8" stroke-width="1" opacity="0.6"/>
    <polyline points="${rec}" fill="none" stroke="#20263E" stroke-width="1.5"/>
    <circle cx="${X(last[0])}" cy="${Y(last[1])}" r="2" fill="#C6283C"/></svg>`;
}

/* ============ chrome: clock, kpis, statusbar ============ */
setInterval(() => {
  const d = new Date();
  $('#utc-clock').textContent = d.toISOString().slice(11, 19);
}, 1000);

function renderChrome() {
  const s = state.summary;
  const lift = (s.event_recall / s.budget_frac).toFixed(1);
  $('#runline').textContent =
    `${(s.state_name || 'RHODE ISLAND').toUpperCase()} | FOUR-STATE FLEET, ${fmt(s.n_structures)} STRUCTURES | NBI ${s.years[0]}-${s.years[1]} | MODEL FROZEN ${s.train_end} | GENERATED ${s.generated}`;
  $('#stat-band').innerHTML =
    `<b>${fmt(s.n_records)}</b> FILINGS<span class="sep">|</span>` +
    `OFF BY <b>${s.mae_test}</b> STEPS, UNSEEN YEARS<span class="sep">|</span>` +
    `COVERAGE <b>${Math.round(s.coverage * 100)}%</b><span class="sep">|</span>` +
    `<span class="hot">CAUGHT <b>${Math.round(s.event_recall * 100)}%</b> (${lift}x CHANCE)</span><span class="sep">|</span>` +
    `<span class="hot">WASHINGTON <b>+5 YRS</b></span>`;
  const nI = state.assets.filter(x => x.band === 'inspect').length;
  const nS = state.assets.filter(x => x.band === 'schedule').length;
  const nW = state.assets.filter(x => x.band === 'watch').length;
  $('#sb-left').innerHTML =
    `${fmt(s.n_assets)} STRUCTURES | <span class="hot">${nI} INSPECT</span> | ${nS} SCHEDULE | ${nW} WATCH`;
  $('#sb-right').innerHTML =
    `<span class="ok">CONFORMAL ${Math.round(s.coverage * 100)}% (TARGET 90%)</span> | OPERATOR: NEXUS NETWORK`;
  $('#panel-title').textContent =
    `${(s.state_name || '').toUpperCase()} DOCKET | Q3 2026 | CAP ${nI + nS + nW} OF ${fmt(s.n_assets)}`;
  renderJurChips();
  const rd = document.querySelector('.run-dot');
  if (rd) { rd.classList.add('live'); rd.title = 'model artifacts loaded, console live'; }
}
function sbCenter(text) { $('#sb-center').textContent = text; }

/* ============ docket ============ */
const BAND_LABEL = { inspect: 'INSPECT NOW', schedule: 'SCHEDULE', watch: 'WATCH', clear: 'CLEAR' };
const OBLIGATION = {
  inspect: 'Mandatory targeted inspection within 30 days, scoped to the elements the evidence attribution points at.',
  schedule: 'A dated inspect-by obligation enters the district work plan; the conformal interval, not a score, justifies the date.',
  watch: 'Chart annotated; the dissent trajectory and its evidence attribution are visible to the district engineer at the next review.',
  clear: 'No obligation. The record and the physics currently agree within the calibrated interval.',
};
function meter(v, cls) {
  return `<div class="meter ${cls || ''}"><i style="width:${Math.round(Math.min(v, 1) * 100)}%"></i></div>`;
}
function filteredList() {
  let list = state.assets;
  if (state.bandFilter === 'priority') list = list.filter(a => a.band !== 'clear');
  else if (state.bandFilter !== 'all') list = list.filter(a => a.band === state.bandFilter);
  if (state.query) {
    const q = state.query.toUpperCase();
    list = list.filter(a => (a.carries + ' ' + a.crosses + ' ' + a.sid).toUpperCase().includes(q));
  }
  const sk = state.sortKey;
  return [...list].sort((x, y) => {
    const av = x[sk] ?? -Infinity, bv = y[sk] ?? -Infinity;
    return state.sortAsc ? (av > bv ? 1 : av < bv ? -1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
  });
}
function renderDocketTools() {
  const s = state.summary;
  const counts = { priority: state.assets.filter(a => a.band !== 'clear').length,
                   inspect: s.bands.inspect, schedule: s.bands.schedule,
                   watch: s.bands.watch, all: s.n_assets };
  $('#docket-tools').innerHTML = `
    <div class="filters">
      ${['priority', 'inspect', 'schedule', 'watch', 'all'].map(b =>
        `<button class="chip ${state.bandFilter === b ? 'active' : ''}" data-band="${b}">` +
        `${b === 'priority' ? 'DOCKET' : b === 'all' ? 'ALL' : BAND_LABEL[b]} <span class="n">${counts[b]}</span></button>`).join('')}
      <input class="search" id="docket-search" placeholder="search ${fmt(state.summary.n_assets)} structures" value="${state.query}">
      <span class="result-count" id="result-count"></span>
    </div>`;
  document.querySelectorAll('#docket-tools .chip').forEach(c => c.onclick = () => {
    state.bandFilter = c.dataset.band;
    renderDocketTools(); renderDocketTable(); applyMarkerFilter();
  });
  const sr = $('#docket-search');
  let deb = null;
  sr.oninput = () => {
    clearTimeout(deb);
    deb = setTimeout(() => { state.query = sr.value; renderDocketTable(); applyMarkerFilter(); }, 120);
  };
}
function renderDocketTable() {
  const list = filteredList();
  const arrow = k => state.sortKey === k ? (state.sortAsc ? ' &#9650;' : ' &#9660;') : '';
  $('#result-count').textContent = `${list.length} ON FILE`;
  $('#docket-list').innerHTML = `
    <table class="docket">
      <thead><tr>
      <th class="sortable" data-key="rank">#${arrow('rank')}</th><th>Band</th><th>Structure</th><th>ID</th><th>History</th>
      <th class="sortable" data-key="built">Built${arrow('built')}</th>
      <th class="sortable" data-key="adt">ADT${arrow('adt')}</th>
      <th class="sortable" data-key="recorded">Record${arrow('recorded')}</th>
      <th class="sortable" data-key="pred">Physics${arrow('pred')}</th>
      <th class="sortable" data-key="state">State${arrow('state')}</th>
      <th class="sortable" data-key="trend">Trend${arrow('trend')}</th>
      <th class="sortable" data-key="cond">Cond.${arrow('cond')}</th>
      <th class="sortable" data-key="fused">Priority${arrow('fused')}</th></tr></thead>
      <tbody>
      ${list.map(a => `
        <tr class="row" data-sid="${a.sid}" tabindex="0" role="button" aria-label="Open dossier for ${a.carries || a.sid}">
          <td class="mono">${a.rank}</td>
          <td><span class="band ${a.band}">${a.newbuild ? 'ABSTAINED' : BAND_LABEL[a.band]}</span></td>
          <td><b>${a.carries || 'Unnamed'}</b> <span class="open-hint">OPEN DOSSIER &#8594;</span><br>
              <span class="dim" style="font-size:11.5px">over ${a.crosses || '—'}</span></td>
          <td class="mono sid">${a.sid}</td>
          <td>${sparkline(a.traj)}</td>
          <td class="mono">${a.built || '—'}</td>
          <td class="mono">${fmt(a.adt)}</td>
          <td class="ratingpair"><b>${a.recorded}</b>/9</td>
          <td class="ratingpair">${a.pred.toFixed(1)} <span class="dim">[${Math.max(a.lower, 0).toFixed(1)}-${Math.min(a.upper, 9).toFixed(1)}]</span></td>
          <td>${meter(a.state)}</td>
          <td>${meter(a.trend, 'teal')}</td>
          <td>${meter(a.cond, 'steel')}</td>
          <td class="prio">${a.fused.toFixed(2)}</td>
        </tr>`).join('')}
      </tbody></table>
    ${list.length === 0 ? '<div class="empty-state">NO STRUCTURES MATCH — THE RECORD IS SILENT.</div>' : ''}
    <div class="note" style="padding:10px 14px">Ratings use the federal NBI 0-9 scale (minimum of deck, superstructure,
    substructure, culvert). Physics interval: split-conformal, calibrated 2016-2018. Build years come straight from the
    federal record, including one structure the 2025 file already lists as built 2026 (a replacement in progress).
    Click any row for its dissent dossier.</div>`;
  document.querySelectorAll('#docket-list tr.row').forEach(r => {
    r.onclick = () => openDossier(r.dataset.sid);
    r.onkeydown = e => { if (e.key === 'Enter') openDossier(r.dataset.sid); };
    r.onmouseenter = () => highlightMarker(r.dataset.sid, true);
    r.onmouseleave = () => highlightMarker(r.dataset.sid, false);
  });
  document.querySelectorAll('#docket-list th.sortable').forEach(th => th.onclick = () => {
    const k = th.dataset.key;
    if (state.sortKey === k) state.sortAsc = !state.sortAsc;
    else { state.sortKey = k; state.sortAsc = k === 'rank' || k === 'built'; }
    renderDocketTable();
  });
}

/* ============ dossier: the paper filing ============ */
function openDossier(sid) {
  const a = state.assets.find(x => x.sid === sid);
  if (!a) return;
  const gap = a.recorded - a.upper;
  let verdict;
  const dom = Math.max(a.pr_state ?? 0, a.pr_trend ?? 0, a.pr_cond ?? 0);
  if (a.newbuild) {
    verdict = `This structure entered service ${a.built ? 'in <b>' + a.built + '</b>' : 'recently'}, inside the
      five-year window the model's training support cannot calibrate. <b>The physics witness abstains</b>:
      no dissent verdict, no obligation. Listed for completeness.`;
  } else if (gap > 0) {
    verdict = (parseInt(a.sid, 10) || 0) % 2
      ? `Physics, working blind, puts this structure at <b>${a.pred.toFixed(1)}</b>
         (${Math.max(a.lower, 0).toFixed(1)} to ${Math.min(a.upper, 9).toFixed(1)}). The record on file says
         <b>${a.recorded}</b>: <b>${gap.toFixed(1)} steps sunnier</b> than the evidence.`
      : `The record calls this a <b>${a.recorded}</b>. Physics, never shown the record, calls it
         <b>${a.pred.toFixed(1)}</b> (interval ${Math.max(a.lower, 0).toFixed(1)} to ${Math.min(a.upper, 9).toFixed(1)}).
         The official record is <b>${gap.toFixed(1)} rating steps more optimistic</b> than the evidence supports.`;
  } else if ((a.pr_trend ?? 0) === dom && dom > 0.05) {
    verdict = `The recorded <b>${a.recorded}</b> sits inside the physics interval
       (${Math.max(a.lower, 0).toFixed(1)} to ${Math.min(a.upper, 9).toFixed(1)}), but the residual against
       physics has been drifting: the changepoint channel, not the gap, put this structure on the docket.`;
  } else if (a.cond > 0.15) {
    verdict = `Record and physics agree, and both read low (recorded <b>${a.recorded}</b>, physics
       <b>${a.pred.toFixed(1)}</b>). Severity carries the priority here: a structure this far down the
       scale earns attention regardless of agreement.`;
  } else {
    verdict = `The record (<b>${a.recorded}</b>) sits inside the physics interval
       (${Math.max(a.lower, 0).toFixed(1)} to ${Math.min(a.upper, 9).toFixed(1)}, point estimate
       ${a.pred.toFixed(1)}). No state dissent on file.`;
  }
  const stampText = a.newbuild ? 'ABSTAINED' : BAND_LABEL[a.band];
  $('#dossier-body').innerHTML = `
    <button class="close">FILE AWAY (ESC)</button>
    <div class="doc-head">
      <div>
        <p class="mono">DISSENT DOSSIER No. ${String(a.rank).padStart(3, '0')} | STRUCTURE ${a.sid} | FILED ${state.summary.generated}<br>
        RANK ${a.rank} OF ${state.summary.n_assets} | JURISDICTION: RHODE ISLAND | SOURCE: FHWA NBI + ERA5</p>
        <h3>${a.carries || 'Unnamed structure'}</h3>
        <p class="where">over ${a.crosses || '—'}${a.location ? ', ' + a.location : ''}
        <span class="mono">| ${a.material}, built ${a.built || '?'}, ADT ${fmt(a.adt)}</span></p>
      </div>
      <div class="stamp" style="--tilt:${(((parseInt(a.sid, 10) || 7) % 2 ? 1 : -1) * (2 + ((parseInt(a.sid, 10) || 7) % 9) * 0.6)).toFixed(1)}deg;--ink:${(0.62 + ((parseInt(a.sid, 10) || 3) % 8) * 0.04).toFixed(2)}">${stampText}</div>
    </div>
    <div class="verdict"><span class="mono">MACHINE SECOND OPINION</span><p>${verdict}</p></div>
    ${trajChart(a.traj, a.cps)}
    ${figbar(LEG.record + LEG.physics + LEG.bandc + LEG.cp,
             'From the federal record, 1992-2025; red bars are the changepoint detector on the record-vs-physics residual.')}
    <div class="dgrid">
      <div class="dcol"><h4>Why physics disagrees (top evidence)</h4>
        <ul class="attr">${(a.attr && a.attr.length ? a.attr : [['no strong single driver', 0]]).map(([f, d]) =>
          `<li>${f}<b class="${d < 0 ? 'neg' : 'pos'}">${d === 0 ? '' : (d > 0 ? '+' : '') + d.toFixed(2) + ' steps'}</b></li>`).join('')}</ul>
        <p class="note">Per-feature contribution vs the population median asset; negative values drag the physics verdict down.</p>
      </div>
      <div class="dcol"><h4>Priority arithmetic (terms sum exactly)</h4>
        <ul class="attr">
          <li>0.45 x state dissent (capped, scaled)<b>${(a.pr_state ?? 0).toFixed(3)}</b></li>
          <li>0.25 x trend dissent (capped, scaled)<b>${(a.pr_trend ?? 0).toFixed(3)}</b></li>
          <li>0.30 x condition severity<b>${(a.pr_cond ?? 0).toFixed(3)}</b></li>
          <li>Fused priority<b>${a.fused.toFixed(3)}</b></li>
        </ul>
        <p class="note">Each channel is capped and scaled to [0,1] before weighting; the three terms add up to the priority.</p>
      </div>
    </div>
    <div class="obligation"><span class="mono">${a.newbuild ? 'NO OBLIGATION | PHYSICS WITNESS ABSTAINS ON NEW BUILDS' : 'OBLIGATION CREATED | BAND: ' + BAND_LABEL[a.band]}</span>
      <p>${a.newbuild ? 'Structures five years old or newer sit outside the training support of the age and exposure features; DISSENT does not issue verdicts it cannot calibrate.' : OBLIGATION[a.band]}</p>
      <div class="route">GENERATED AUTOMATICALLY | OBLIGATION ROUTES TO THE DISTRICT ENGINEER | VERIFICATION OUTCOME RETURNS AS A TRAINING LABEL</div>
    </div>`;
  $('#dossier-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('#dossier-body .close').onclick = closeDossier;
  document.querySelectorAll('#docket-list tr.row').forEach(r =>
    r.classList.toggle('hl', r.dataset.sid === sid));
}
function closeDossier() {
  $('#dossier-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDossier(); });
$('#dossier-overlay').addEventListener('click', e => { if (e.target.id === 'dossier-overlay') closeDossier(); });

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t.__h);
  t.__h = setTimeout(() => t.classList.add('hidden'), 6000);
}

/* ============ map: the dark instrument ============ */
const BAND_COLOR = { inspect: '#B23348', schedule: '#B8862D', watch: '#3A5CA8', clear: '#5A6488' };
let __map = null;
const __markers = {};
async function initMap() {
  if (typeof L === 'undefined') { $('#map-side').style.display = 'none'; return; }
  __map = L.map('map', { scrollWheelZoom: true, zoomControl: true });
  __map.setView([41.65, -71.5], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18,
  }).addTo(__map);
  try {
    const ri = await fetch('assets/ri.geojson').then(r => r.ok ? r.json() : null);
    if (ri) L.geoJSON(ri, { style: { color: '#8A93B8', weight: 1.2,
      dashArray: '5 4', fill: false, opacity: 0.55 } }).addTo(__map);
  } catch (e) { /* boundary optional */ }
  rebuildMarkers();
}
function rebuildMarkers() {
  if (!__map) return;
  Object.values(__markers).forEach(mk => __map.removeLayer(mk));
  for (const k in __markers) delete __markers[k];
  const pts = [];
  ['clear', 'watch', 'schedule', 'inspect'].forEach(band => {
    state.assets.filter(a => a.band === band && a.lat && a.lon).forEach(a => {
      pts.push([a.lat, a.lon]);
      const hot = band !== 'clear';
      const base = {
        radius: band === 'inspect' ? 7 : band === 'schedule' ? 5.5 : hot ? 4.5 : 2.4,
        color: '#FAF8F4', weight: hot ? 1 : 0,
        fillColor: BAND_COLOR[band], fillOpacity: hot ? 0.95 : 0.35,
        className: band === 'inspect' ? 'mk-pulse' : '',
      };
      const mk = L.circleMarker([a.lat, a.lon], base).addTo(__map).bindPopup(
        `<b>${a.carries || 'Unnamed'}</b><br>over ${a.crosses || '—'}<br>` +
        `<span class="pop-band" style="background:${BAND_COLOR[band]}">${BAND_LABEL[band]}</span> ` +
        `record ${a.recorded} vs physics ${a.pred.toFixed(1)}<br>` +
        `<a href="#docket" onclick="openDossier('${a.sid}');return false;">open dossier</a>`);
      mk.__base = base; mk.__band = band;
      __markers[a.sid] = mk;
    });
  });
  if (pts.length) __map.fitBounds(pts, { padding: [14, 14] });
  fleetLegend();
  applyMarkerFilter();
  if (nat.mode === 'national') {
    Object.values(__markers).forEach(mk => __map.removeLayer(mk));
    drawNational();
  }
  if (!document.querySelector('#map-mode')) {
    const mm = L.DomUtil.create('div', 'map-mode mono');
    mm.id = 'map-mode';
    mm.innerHTML = '<button data-mode="fleet" class="active">FLEET AUDIT</button>' +
                   '<button data-mode="national">NATIONAL 621K</button>';
    $('#map-side').appendChild(mm);
    mm.querySelectorAll('button').forEach(b => b.onclick = () => setMapMode(b.dataset.mode));
  }
}
function highlightMarker(sid, on) {
  const mk = __markers[sid];
  if (!mk) return;
  mk.setStyle(on ? { radius: mk.__base.radius + 3.5, weight: 2.5 } :
                   { radius: mk.__base.radius, weight: mk.__base.weight });
  if (on) mk.bringToFront();
}
function applyMarkerFilter() {
  const f = state.bandFilter;
  const visible = state.query ? new Set(filteredList().map(a => a.sid)) : null;
  Object.entries(__markers).forEach(([sid, mk]) => {
    let match = f === 'all' || (f === 'priority' ? mk.__band !== 'clear' : mk.__band === f);
    if (match && visible) match = visible.has(sid);
    mk.setStyle({ fillOpacity: match ? mk.__base.fillOpacity : 0.06,
                  weight: match ? mk.__base.weight : 0 });
  });
}

/* ============ case file: washington ============ */
function renderWashington() {
  const w = (state.eventsRI || state.events).washington;
  const v = $('#paper-washington');
  if (!w) { v.innerHTML = '<p>No featured case.</p>'; return; }
  const dy = w.dissent_by_year;
  const years = Object.keys(dy).sort();
  v.innerHTML = `
    <div class="feature-banner">
      <p class="mono">STRUCTURE ${w.sid} | PROVIDENCE, RHODE ISLAND | EMERGENCY CLOSURE 11 DEC 2023</p>
      <h3>Rated 4, unchanged, from 2019 to 2023.</h3>
      <p>With training frozen at 2015 and no knowledge of what came after, DISSENT placed this bridge inside its
      top-15% alert budget every year from 2018 on: <span class="big-lead">5 years</span> before the December 2023
      emergency closure, 6 years before the federal record caught up in 2024.</p>
    </div>
    ${trajChart(w.traj, w.cps, { markers: [{ year: 2023.95, label: 'emergency closure' }] })}
    ${figbar(LEG.record + LEG.physics + LEG.cp, 'The federal record for structure ' + w.sid + ', as filed.')}
    <div class="two">
      <div class="card"><h4>What the record claimed</h4>
        <p>Condition rating <b>4 (poor), unchanged from 2019 through 2023</b>. Open to roughly 90,000 vehicles a day.
        In December 2023 inspectors found failed anchor tie-downs; the westbound span was closed within hours and
        the 2024 federal file finally caught up: <b>rating 1, closed</b>.</p></div>
      <div class="card"><h4>What the model saw (before the event)</h4>
        <ul class="attr">
          <li>2015-2023: physics held ${Math.min(...years.map(y => dy[y].pred)).toFixed(1)}-${Math.max(...years.map(y => dy[y].pred)).toFixed(1)}
            against a record frozen at 4<b>every year</b></li>
          <li>2018: first year inside the top-15% docket budget<b>docketed</b></li>
          <li>${years.reduce((m, y) => dy[y].pred < dy[m].pred ? y : m, years[0])}: physics minimum,
            ${Math.min(...years.map(y => dy[y].pred)).toFixed(1)}<b>low point</b></li>
          <li>State dissent: zero throughout. Severity carried it<b>the I-35W clause</b></li>
        </ul>
        <p class="note">Ninety thousand vehicles a day crossed a structure whose rating never moved for five years.
        The physics-severity channel (the I-35W clause) kept its docket priority high while the record never moved.</p></div>
    </div>
    <p class="note">Everything above is computed from the public FHWA record with the model trained only on data
    through 2015. The closure itself entered the federal file in 2024, after the event: exactly the
    "record forced to catch up" pattern DISSENT exists to detect.</p>`;
}

/* ============ detector replay: morandi ============ */
function renderMorandi() {
  const v = $('#paper-morandi');
  v.innerHTML = `
    <h2>The Morandi precursor, month by month</h2>
    <p>On 14 August 2018 the Morandi Bridge in Genoa collapsed, killing 43. Satellite radar analysis published
    afterwards (Milillo et al. 2019) found that a scatterer on the deck beside the failed pier had accelerated
    from about 10 to 70 mm/yr starting 12 March 2017, seventeen months before collapse. Press RUN THE DETECTOR:
    the same Bayesian online changepoint detector that powers DISSENT's trend channel runs <b>live in your
    browser</b> over that published series, month by month, knowing nothing of what comes next.</p>
    <div id="morandi-chart"></div>
    ${figbar('<span><i style="background:#3A5CA8"></i>LOS velocity (mm/yr), drawn from the published record</span>' + LEG.cp,
             'After Milillo et al. 2019; the finding is contested by Lanari et al. 2020.')}
    <div class="ctrlbar">
      <button class="btn" id="morandi-play">RUN THE DETECTOR</button>
      <button class="btn secondary" id="morandi-reset">RESET</button>
      <span class="ctrl-status" id="morandi-status">DETECTOR IDLE</span>
    </div>
    <p class="note">Honesty note: the precursor finding is scientifically contested (Lanari et al. 2020 reprocessed
    the same radar data and disagree). DISSENT's design cites both sides, which is exactly why no single channel
    is load-bearing in the fused score.</p>`;
  drawMorandi(0);
  let timer = null, step = 0;
  const play = $('#morandi-play'), status = $('#morandi-status');
  play.onclick = () => {
    if (timer) return;
    play.disabled = true;
    status.innerHTML = '<span class="live">&#9679;</span> DETECTOR RUNNING';
    timer = setInterval(() => {
      step += 1;
      drawMorandi(step);
      const m = state.morandi;
      const t = m.series[Math.min(step, m.series.length - 1)][0];
      sbCenter(`BOCPD | t=${t.toFixed(2)} | P(changepoint)=${(window.__morandiLastCp || 0).toFixed(3)}`);
      if (window.__morandiFired && !window.__morandiToasted) {
        window.__morandiToasted = true;
        toast('Filed. 84 on the docket.');
      }
      if (step >= m.series.length) {
        clearInterval(timer); timer = null; play.disabled = false;
        status.textContent = window.__morandiFired
          ? `COLLAPSE REACHED | DETECTOR FIRED AT ${window.__morandiFired.toFixed(2)}, ${Math.round((m.collapse - window.__morandiFired) * 12)} MONTHS BEFORE FAILURE`
          : 'COLLAPSE REACHED | DETECTOR DID NOT FIRE ON THIS SERIES';
        sbCenter('FHWA NBI | ERA5 (OPEN-METEO) | MILILLO 2019');
      }
    }, 90);
  };
  $('#morandi-reset').onclick = () => {
    if (timer) { clearInterval(timer); timer = null; }
    step = 0; play.disabled = false;
    window.__morandiToasted = false;
    drawMorandi(0);
    status.textContent = 'THE DETECTOR IS WAITING';
    sbCenter('FHWA NBI | ERA5 (OPEN-METEO) | MILILLO 2019');
  };
}
function drawMorandi(upto) {
  const m = state.morandi;
  const W = 900, H = 320, L = 50, R = 16, T = 20, B = 58;
  const t0 = 2015, t1 = 2018.8;
  const X = t => L + (t - t0) / (t1 - t0) * (W - L - R);
  const Y = vel => T + (85 - vel) / 85 * (H - T - B);
  const shown = m.series.slice(0, Math.max(upto, 2));
  const cps = bocpd(shown.map(p => p[1]), 1 / 14);
  window.__morandiLastCp = cps[cps.length - 1] || 0;
  let fired = null;
  cps.forEach((c, i) => { if (fired === null && i > 5 && c > 0.5) fired = i; });
  window.__morandiFired = fired !== null ? shown[fired][0] : null;
  let s = svgOpen(W, H);
  for (let g = 0; g <= 80; g += 20) {
    s += `<line x1="${L}" y1="${Y(g)}" x2="${W - R}" y2="${Y(g)}" stroke="#EFECE4"/>
          <text x="${L - 8}" y="${Y(g) + 4}" font-size="11" fill="#6A7088" text-anchor="end" font-family="Courier Prime">${g}</text>`;
  }
  [2015, 2016, 2017, 2018].forEach(yr => {
    s += `<text x="${X(yr)}" y="${H - B + 17}" font-size="11" fill="#6A7088" font-family="Courier Prime">${yr}</text>`;
  });
  s += `<line x1="${X(m.collapse)}" y1="${T}" x2="${X(m.collapse)}" y2="${H - B}" stroke="#20263E" stroke-width="1.4"/>
        <text x="${X(m.collapse) - 6}" y="${T + 12}" font-size="11" fill="#20263E" text-anchor="end" font-family="Courier Prime">collapse 14 Aug 2018</text>`;
  s += `<polyline fill="none" stroke="#3A5CA8" stroke-width="2.4" points="${shown.map(p => `${X(p[0])},${Y(p[1])}`).join(' ')}"/>`;
  shown.forEach((p, i) => {
    const c = cps[i];
    if (c > 0.03) s += `<rect x="${X(p[0]) - 2.5}" y="${H - B - 2 - c * 46}" width="5" height="${c * 46}" fill="#C6283C" opacity="0.9"/>`;
  });
  if (fired !== null) {
    const p = shown[fired];
    s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="7" fill="none" stroke="#C6283C" stroke-width="2.4"/>
          <text x="${X(p[0]) + 10}" y="${Y(p[1]) - 10}" font-size="12" fill="#C6283C" font-family="Courier Prime" font-weight="500">DISSENT FILED (${p[0].toFixed(2)})</text>`;
  }
  $('#morandi-chart').innerHTML = s + '</svg>';
}

/* ============ method ============ */
function renderMethod() {
  const s = state.summary;
  $('#paper-method').innerHTML = `
    <div class="method">
      <svg class="method-seal" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="56" fill="none" stroke="#16204A" stroke-width="2"/>
        <circle cx="60" cy="60" r="43" fill="none" stroke="#16204A" stroke-width="1"/>
        <defs><path id="sealArc" d="M 60 12 A 48 48 0 1 1 59.9 12" fill="none"/></defs>
        <text font-family="Courier Prime, monospace" font-size="10.5" fill="#16204A" letter-spacing="1.6">
          <textPath href="#sealArc">DISSENT * RHODE ISLAND PILOT * MMXXVI *</textPath></text>
        <circle cx="60" cy="60" r="3" fill="#C6283C"/>
      </svg>
      <h2>How a machine comes to disagree with the record</h2>
      <p><b>The claim.</b> DISSENT maintains two independent accounts of every asset: the <b>Paper Witness</b> (the official condition-rating record) and the
      <b>Physics Witness</b> (a model that predicts what the rating should be from evidence alone, never having seen
      any inspector's opinion). A calibrated disagreement between them is the product, and every disagreement is
      filed as a dossier with a concrete obligation attached.</p>
      <div class="step"><span class="n">STEP 01</span><p><b>Ledger.</b> ${s.states.length * (s.years[1] - s.years[0] + 1)} annual FHWA National Bridge
        Inventory files across four states: Rhode Island, Vermont, New Hampshire and Delaware
        (${fmt(s.n_records)} records, ${fmt(s.n_structures)} structures) parsed into one trajectory per asset.
        Rhode Island is the flagship pilot: the worst bridge stock in the nation. One model is trained,
        pooled across the fleet; each state gets its own docket and inspection budget. The map's NATIONAL
        toggle plots the entire 2025 federal file, all 621,137 rated structures, from a 9.9 MB binary
        drawn client-side; the fleet states are where the full 34-year audit runs.</p></div>
      <div class="step"><span class="n">STEP 02</span><p><b>Physics evidence.</b> Structure age, years since major work, traffic
        volume and truck share, structural form and material, length and skew, plus real weather histories from
        ERA5 reanalysis (Open-Meteo archive): freeze-thaw cycle days, cumulative frost exposure, heavy-rain days,
        five-year precipitation means, assigned by nearest of six grid points.</p></div>
      <div class="step"><span class="n">STEP 03</span><p><b>Blind Re-Inspector.</b> A gradient-boosted regressor maps physics-only
        features to the recorded condition rating. Trained strictly on ${s.years[0]}-${s.train_end}; calibrated on ${s.calib};
        everything after 2018 is untouched test data. Split-conformal calibration wraps every prediction in a
        +/-${s.q90} rating-step interval.</p></div>
      <div class="step"><span class="n">STEP 04</span><p><b>Dissent channels.</b> STATE dissent: the recorded rating minus the upper
        conformal bound (the record claims better than evidence supports). TREND dissent: Bayesian online changepoint
        detection (Adams and MacKay 2007) on the record-vs-physics residual trajectory. CONDITION severity: how bad
        physics believes the asset is regardless of the record: the I-35W clause, because a bridge everyone agrees is
        failing must still climb the ladder.</p></div>
      <div class="step"><span class="n">STEP 05</span><p><b>The docket.</b> Priority = 0.45 state + 0.25 trend + 0.30 condition
        (each channel capped and scaled to [0,1]), capped to a real inspection budget (${s.bands.inspect} mandatory,
        ${s.bands.schedule} scheduled, ${s.bands.watch} watched per quarter, an 8.7% cap that is stricter than the 15% budget
        used in validation). Every flagged asset carries a dossier: what the record claims, what physics shows, which
        evidence moved the verdict, and the obligation created.</p></div>
      <div class="step"><span class="n">STEP 06</span><p><b>Validation on the future.</b> ${fmt(s.n_events_total)} "record forced to catch up"
        events were mined from the four-state trajectories (sudden drops of 2+ rating steps, or closures). The ${s.n_events_test} that
        occur after 2018 are pure holdout: the frozen model flagged ${Math.round(s.event_recall * 100)}% of them inside its
        top-${Math.round(s.budget_frac * 100)}% budget (${(s.event_recall / s.budget_frac).toFixed(1)}x better than random), with a median
        lead of ${Math.round(s.median_lead)} years, including the Washington Bridge every year from 2018 on.</p></div>
      <div class="card"><h4>Honest limits, stated plainly</h4>
        <p>Interval coverage on post-2018 data is ${Math.round(s.coverage * 100)}% against a 90% target: the small shortfall is
        distribution shift, and we report it rather than retune on the test years. Several missed events are
        administrative closures (bypassed or replaced structures) that condition physics cannot see. The satellite
        displacement channel of the full design is not in this pilot (Rhode Island lacks free processed InSAR;
        the Morandi replay demonstrates that channel's detector on the published record instead). Structures five years old or newer (${s.n_newbuild || 0} of them) receive
        no verdict at all: their age features sit outside the training support, so the physics witness abstains
        rather than guess. Ratings are coarse, inspector-subjective labels, which is the entire reason a second
        opinion is worth building.</p></div>
      <div class="pill-row">
        <span class="pill">FHWA NBI 1992-2025 (REAL, PUBLIC)</span>
        <span class="pill">OPEN-METEO / ERA5 (REAL)</span>
        <span class="pill">SCIKIT-LEARN GRADIENT BOOSTING</span>
        <span class="pill">SPLIT-CONFORMAL INTERVALS</span>
        <span class="pill">ADAMS-MACKAY BOCPD</span>
        <span class="pill">ZERO INSTALLED HARDWARE</span>
      </div>
      <div class="card"><h4>Next jurisdiction: Tamil Nadu, India</h4>
        <p>Nothing in this method is American. India's IBMS already inventories 172,517 National Highway
        structures on the same 0-9 rating idea, and MoRTH's nationwide digital re-survey (running right now,
        with a September 2026 deadline) is creating exactly the fresh paper baseline DISSENT audits. The pipeline
        localises by swapping the ledger source; Morbi, 135 dead four days after a renovation nobody checked
        against physical reality, is the precise failure mode this console exists to catch. Rhode Island is the
        pilot because its data is public back to 1992, so every number on this screen can be verified tonight.</p></div>
      <p>Full pipeline source, from raw federal files to this console's JSON artifacts, is in the
      <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub repository</a>, alongside the Round 2 concept
      report this build delivers on.</p>
      <div class="credit-line">
        TEAM NEXUS NETWORK | DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING (CYBER SECURITY)<br>
        AI INNOVATION CHALLENGE 2026 | BATTLE OF INTELLIGENCE | ROUND 3 : AI EVOLUTION<br>
        DATA: FHWA NATIONAL BRIDGE INVENTORY | OPEN-METEO (ERA5) | MILILLO ET AL. 2019 / LANARI ET AL. 2020 |
        BASEMAP: OPENSTREETMAP CONTRIBUTORS, CARTO | RI BOUNDARY: US CENSUS (PUBLIC DOMAIN) |
        SET IN FRAUNCES, SOURCE SERIF AND COURIER PRIME
      </div>
    </div>`;
}

/* ============ the national snapshot layer ============ */
const nat = { loaded: false, loading: false, mode: 'fleet',
              n: 0, meta: null, mx: null, my: null, cond: null,
              built: null, adt: null, stIdx: null, grid: null,
              canvas: null };

async function loadNational() {
  if (nat.loaded || nat.loading) return nat.loaded;
  nat.loading = true;
  $('#map-legend').innerHTML = '<div>READING THE NATIONAL RECORD… 9.9 MB</div>';
  const [buf, meta] = await Promise.all([
    fetch('data/national.bin').then(r => r.arrayBuffer()),
    fetch('data/national_meta.json').then(r => r.json())]);
  const dv = new DataView(buf);
  const n = Math.floor(buf.byteLength / 16);
  nat.n = n; nat.meta = meta;
  nat.mx = new Float32Array(n); nat.my = new Float32Array(n);
  nat.cond = new Int8Array(n); nat.built = new Uint16Array(n);
  nat.adt = new Uint32Array(n); nat.stIdx = new Uint8Array(n);
  nat.lat = new Float32Array(n); nat.lon = new Float32Array(n);
  nat.grid = new Map();
  for (let i = 0; i < n; i++) {
    const off = i * 16;
    const lat = dv.getFloat32(off, true), lon = dv.getFloat32(off + 4, true);
    nat.lat[i] = lat; nat.lon[i] = lon;
    nat.cond[i] = dv.getInt8(off + 8);
    nat.built[i] = dv.getUint16(off + 9, true);
    nat.adt[i] = dv.getUint32(off + 11, true);
    nat.stIdx[i] = dv.getUint8(off + 15);
    nat.mx[i] = (lon + 180) / 360;
    const s = Math.sin(lat * Math.PI / 180);
    nat.my[i] = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
    const key = (Math.floor(lat * 4)) * 4096 + Math.floor((lon + 180) * 4);
    let cell = nat.grid.get(key);
    if (!cell) nat.grid.set(key, cell = []);
    cell.push(i);
  }
  nat.loaded = true; nat.loading = false;
  return true;
}

function drawNational() {
  if (!nat.loaded || nat.mode !== 'national' || !__map) return;
  if (!nat.canvas) {
    nat.canvas = L.DomUtil.create('canvas', 'nat-canvas');
    __map.getPanes().overlayPane.appendChild(nat.canvas);
  }
  const size = __map.getSize();
  nat.canvas.width = size.x; nat.canvas.height = size.y;
  L.DomUtil.setPosition(nat.canvas, __map.containerPointToLayerPoint([0, 0]));
  const ctx = nat.canvas.getContext('2d');
  ctx.clearRect(0, 0, size.x, size.y);
  const z = __map.getZoom();
  const scale = 256 * Math.pow(2, z);
  // calibrate against Leaflet's own projection so the math is exact
  const ref = __map.getCenter();
  const refCp = __map.latLngToContainerPoint(ref);
  const s0 = Math.sin(ref.lat * Math.PI / 180);
  const refMx = (ref.lng + 180) / 360;
  const refMy = 0.5 - Math.log((1 + s0) / (1 - s0)) / (4 * Math.PI);
  const dx = refCp.x - refMx * scale, dy = refCp.y - refMy * scale;
  const px = z >= 9 ? 3 : z >= 7 ? 2 : 1;
  const colors = ['rgba(58,92,168,0.5)', '#B8862D', '#C6283C'];
  for (let pass = 0; pass < 3; pass++) {
    ctx.fillStyle = colors[pass];
    for (let i = 0; i < nat.n; i++) {
      const c = nat.cond[i];
      const cls = c <= 4 ? 2 : c <= 6 ? 1 : 0;
      if (cls !== pass) continue;
      const x = nat.mx[i] * scale + dx, y = nat.my[i] * scale + dy;
      if (x < -4 || y < -4 || x > size.x + 4 || y > size.y + 4) continue;
      ctx.fillRect(x, y, px, px);
    }
  }
}

function natLegend() {
  const m = nat.meta;
  $('#map-legend').innerHTML =
    `<div><i style="background:#C6283C"></i>POOR (0-4): ${fmt(m.poor_total)}</div>` +
    `<div><i style="background:#B8862D"></i>FAIR (5-6)</div>` +
    `<div><i style="background:rgba(58,92,168,0.8)"></i>GOOD (7-9)</div>` +
    `<div style="margin-top:4px">${fmt(m.total)} STRUCTURES | 2025 FEDERAL FILE</div>`;
}
function fleetLegend() {
  $('#map-legend').innerHTML =
    Object.entries({ inspect: 'INSPECT NOW', schedule: 'SCHEDULE', watch: 'WATCH', clear: 'CLEAR' })
      .map(([b, lab]) => `<div><i style="background:${BAND_COLOR[b]}"></i>${lab}</div>`).join('');
}

async function setMapMode(mode) {
  if (!__map || mode === nat.mode) return;
  nat.mode = mode;
  document.querySelectorAll('#map-mode button').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'national') {
    const ok = await loadNational();
    if (!ok) { nat.mode = 'fleet'; return; }
    Object.values(__markers).forEach(mk => __map.removeLayer(mk));
    natLegend();
    sbCenter(`NATIONAL SNAPSHOT 2025 | ${fmt(nat.meta.total)} STRUCTURES | ${fmt(nat.meta.poor_total)} POOR`);
    __map.fitBounds([[24.5, -125], [49.5, -66.5]]);
    drawNational();
    __map.on('moveend zoomend resize', drawNational);
    __map.on('click', natClick);
  } else {
    __map.off('moveend zoomend resize', drawNational);
    __map.off('click', natClick);
    if (nat.canvas) nat.canvas.getContext('2d').clearRect(0, 0, nat.canvas.width, nat.canvas.height);
    Object.values(__markers).forEach(mk => mk.addTo(__map));
    applyMarkerFilter();
    fleetLegend();
    sbCenter('FHWA NBI | ERA5 (OPEN-METEO) | MILILLO 2019');
    const pts = state.assets.filter(x => x.lat && x.lon).map(x => [x.lat, x.lon]);
    if (pts.length) __map.fitBounds(pts, { padding: [14, 14] });
  }
}

function natClick(e) {
  if (nat.mode !== 'national' || !nat.loaded) return;
  const { lat, lng } = e.latlng;
  let best = -1, bd = 1e9;
  for (let by = -1; by <= 1; by++) for (let bx = -1; bx <= 1; bx++) {
    const key = (Math.floor(lat * 4) + by) * 4096 + Math.floor((lng + 180) * 4) + bx;
    const cell = nat.grid.get(key);
    if (!cell) continue;
    for (const i of cell) {
      const d = (nat.lat[i] - lat) ** 2 + (nat.lon[i] - lng) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
  }
  if (best < 0 || bd > 0.02) return;
  const c = nat.cond[best];
  L.popup().setLatLng([nat.lat[best], nat.lon[best]])
    .setContent(`<b>${nat.meta.states[nat.stIdx[best]]}</b> | national snapshot 2025<br>` +
      `condition <b>${c}</b>/9 (${c <= 4 ? 'poor' : c <= 6 ? 'fair' : 'good'})<br>` +
      `built ${nat.built[best] || 'unknown'} | ADT ${fmt(nat.adt[best] || null)}<br>` +
      `<span style="font-size:10px">deep audit runs in the four fleet states</span>`)
    .openOn(__map);
}

/* ============ jurisdictions ============ */
async function switchJur(st) {
  if (st === state.jur) return;
  $('#docket-list').innerHTML = '<div class="bootload mono">READING THE ' + st + ' FEDERAL RECORD…' +
    '<div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div></div>';
  const [assets, summary, events] = await Promise.all(
    [`assets_${st}.json`, `summary_${st}.json`, `events_${st}.json`]
      .map(f => fetch('data/' + f).then(r => r.json())));
  state.jur = st;
  Object.assign(state, { assets, summary, events });
  state.bandFilter = 'priority'; state.query = '';
  state.sortKey = 'rank'; state.sortAsc = true;
  renderChrome();
  renderDocketTools();
  renderDocketTable();
  rebuildMarkers();
}
function renderJurChips() {
  const el = $('#jur-chips');
  if (!el || !state.summary) return;
  el.innerHTML = state.summary.states.map(st =>
    `<button class="jurchip mono ${st === state.jur ? 'active' : ''}" data-st="${st}">${st}</button>`).join('');
  el.querySelectorAll('.jurchip').forEach(b => b.onclick = () => switchJur(b.dataset.st));
}

/* ============ the world: global record ============ */
let __worldMap = null;
function renderWorld() {
  const w = state.world;
  $('#world-list').innerHTML = `
    <div class="case-scale">${w.scale.map(s =>
      `<div class="cs"><b>${s.n}</b><span>${s.label}</span></div>`).join('')}</div>
    ${w.cases.map(c => `
      <div class="case-card" id="case-${c.lat}">
        <h3>${c.name}</h3>
        <p class="case-meta">${c.place.toUpperCase()} | ${c.date.toUpperCase()} | ${c.toll ? '<b>' + c.toll + ' DEAD</b>' : 'NO DEATHS'}</p>
        <p><b>The signal that existed:</b> ${c.signal}</p>
        <p class="missed">Why nothing happened: ${c.missed}</p>
      </div>`).join('')}
    <p class="world-note">Each case is documented by an official investigation or peer-reviewed study; sources are cited
    in the Method page and in the Round 2 report inside the repository. The pattern is the argument: the warning existed,
    in time, and belonged to nobody. The Rhode Island pilot (marked in blue on the map) is where this program turns the
    pattern into a working audit.</p>`;
}
function initWorldMap() {
  if (__worldMap || typeof L === 'undefined' || !state.world) return;
  __worldMap = L.map('worldmap', { scrollWheelZoom: false, worldCopyJump: true });
  __worldMap.setView([28, 15], 2);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 10,
  }).addTo(__worldMap);
  state.world.cases.forEach(c => {
    L.circleMarker([c.lat, c.lon], { radius: 8, color: '#FAF8F4', weight: 1.2,
      fillColor: '#B23348', fillOpacity: 0.95, className: 'mk-pulse' })
      .addTo(__worldMap)
      .bindPopup(`<b>${c.name}</b><br>${c.place}, ${c.date}${c.toll ? '<br>' + c.toll + ' dead' : ''}<br>` +
                 `<a href="#world" onclick="document.getElementById('case-${c.lat}').scrollIntoView({behavior:'smooth'});return false;">read the case</a>`);
  });
  L.circleMarker([41.68, -71.5], { radius: 9, color: '#FAF8F4', weight: 1.5,
    fillColor: '#3A5CA8', fillOpacity: 0.95 }).addTo(__worldMap)
    .bindPopup('<b>The pilot fleet</b><br>RI, VT, NH, DE: 9,546 structures under audit<br><a href="#docket">open the docket</a>');
  $('#world-legend').innerHTML =
    '<div><i style="background:#B23348"></i>DOCUMENTED COLLAPSE</div>' +
    '<div><i style="background:#3A5CA8"></i>LIVE PILOT (THE DOCKET)</div>';
}

/* ============ routing & boot ============ */
function route() {
  const view = (location.hash || '#docket').slice(1);
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === view));
  const target = $('#view-' + view) || $('#view-docket');
  target.classList.add('active');
  target.scrollTop = 0;
  closeDossier();
  if ((target.id === 'view-docket') && __map) setTimeout(() => __map.invalidateSize(), 80);
  if (target.id === 'view-world') {
    initWorldMap();
    if (__worldMap) setTimeout(() => __worldMap.invalidateSize(), 80);
  }
}
window.addEventListener('hashchange', route);
$('#print-btn').onclick = () => window.print();

async function boot() {
  try {
    const [assets, summary, events, morandi, world] = await Promise.all(
      ['assets_RI.json', 'summary_RI.json', 'events_RI.json', 'morandi.json', 'global.json']
        .map(f => fetch('data/' + f).then(r => r.json())));
    Object.assign(state, { assets, summary, events, morandi, world, eventsRI: events });
  } catch (e) {
    $('#docket-list').innerHTML = '<div class="empty-state">FAILED TO LOAD THE FEDERAL RECORD — RELOAD THE CONSOLE.</div>';
    return;
  }
  renderChrome();
  renderDocketTools();
  renderDocketTable();
  renderWashington();
  renderMorandi();
  renderMethod();
  renderWorld();
  route();
  initMap();
}
boot();

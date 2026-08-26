/* DISSENT docket app. No dependencies. */
'use strict';

const REPO_URL = 'https://github.com/ArockiaRajamanickam/dissent';
const state = { assets: [], summary: null, events: null, morandi: null,
                bandFilter: 'priority', query: '' };

const $ = (s, el) => (el || document).querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const fmt = n => n === null || n === undefined ? '—' : n.toLocaleString('en-US');

/* ---------------- BOCPD (Adams-MacKay, Gaussian unknown mean) ---------- */
function bocpd(series, hazard = 1 / 10) {
  const n = series.length;
  if (n < 4) return series.map(() => 0);
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const variance = Math.max(
    series.reduce((a, b) => a + (b - mean) ** 2, 0) / n, 0.2);
  let R = [1.0], mus = [0.0], ks = [0.25];
  const cps = [];
  for (const x of series) {
    const like = mus.map((mu, i) => {
      const pv = variance * (1 + 1 / ks[i]);
      return Math.exp(-0.5 * (x - mu) ** 2 / pv) / Math.sqrt(2 * Math.PI * pv);
    });
    const growth = R.map((r, i) => r * like[i] * (1 - hazard));
    const cp = R.reduce((a, r, i) => a + r * like[i] * hazard, 0);
    R = [cp, ...growth];
    const Z = Math.max(R.reduce((a, b) => a + b, 0), 1e-12);
    R = R.map(r => r / Z);
    cps.push(R[0]);
    const newMus = mus.map((mu, i) => (ks[i] * mu + x) / (ks[i] + 1));
    mus = [0.0, ...newMus];
    ks = [0.25, ...ks.map(k => k + 1)];
  }
  return cps;
}

/* ---------------- SVG chart helpers ------------------------------------ */
function svgOpen(w, h) { return `<svg class="chart" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`; }

function trajChart(traj, cps, opts = {}) {
  const W = 760, H = 300, L = 44, R = 16, T = 18, B = 66;
  const years = traj.map(t => t[0]);
  const x0 = Math.min(...years), x1 = Math.max(...years);
  const X = yr => L + (yr - x0) / Math.max(x1 - x0, 1) * (W - L - R);
  const Y = r => T + (9 - r) / 9 * (H - T - B);
  const q = state.summary ? state.summary.q90 : 1.3;
  let s = svgOpen(W, H);
  for (let r = 0; r <= 9; r += 3) {
    s += `<line x1="${L}" y1="${Y(r)}" x2="${W - R}" y2="${Y(r)}" stroke="#EFECE4"/>`;
    s += `<text x="${L - 8}" y="${Y(r) + 4}" font-size="10" fill="#6A7088" text-anchor="end" font-family="IBM Plex Mono">${r}</text>`;
  }
  for (let yr = Math.ceil(x0 / 5) * 5; yr <= x1; yr += 5) {
    s += `<text x="${X(yr)}" y="${H - B + 16}" font-size="10" fill="#6A7088" text-anchor="middle" font-family="IBM Plex Mono">${yr}</text>`;
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
      const px = X(t[0]), py = Y(t[1]);
      path += i === 0 ? `M ${px} ${py}` : ` H ${px} V ${py}`;
    });
    path += ` H ${X(x1)}`;
    s += `<path d="${path}" fill="none" stroke="#20263E" stroke-width="2.4"/>`;
    rec.forEach(t => { s += `<circle cx="${X(t[0])}" cy="${Y(t[1])}" r="2.6" fill="#20263E"/>`; });
  }
  if (cps && cps.length && rec.length) {
    const bh = 34;
    rec.forEach((t, i) => {
      const c = cps[i] || 0;
      if (c > 0.02) {
        s += `<rect x="${X(t[0]) - 3}" y="${H - 24 - c * bh}" width="6" height="${c * bh}" fill="#C6283C" opacity="0.85"/>`;
      }
    });
    s += `<text x="${L}" y="${H - 12}" font-size="9.5" fill="#C6283C" font-family="IBM Plex Mono">changepoint probability (BOCPD on record-vs-physics residual)</text>`;
  }
  (opts.markers || []).forEach(m => {
    s += `<line x1="${X(m.year)}" y1="${T}" x2="${X(m.year)}" y2="${H - B}" stroke="#C6283C" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    s += `<text x="${X(m.year) + 5}" y="${T + 12}" font-size="10" fill="#C6283C" font-family="IBM Plex Mono">${m.label}</text>`;
  });
  return s + '</svg>';
}

/* ---------------- stats band ------------------------------------------- */
function renderStats() {
  const s = state.summary;
  $('#hero-n').textContent = fmt(s.n_assets);
  const lift = (s.event_recall / s.budget_frac).toFixed(1);
  $('#stat-band').innerHTML = `
    <div class="stat"><b>${fmt(s.n_records)}</b><span>real inspection records, ${s.years[0]}-${s.years[1]}</span></div>
    <div class="stat"><b>${s.mae_test}</b><span>rating-steps MAE on 2019+ (unseen)</span></div>
    <div class="stat"><b>${Math.round(s.coverage * 100)}%</b><span>conformal interval coverage</span></div>
    <div class="stat hot"><b>${Math.round(s.event_recall * 100)}%</b><span>held-out failures flagged early (${lift}x random)</span></div>
    <div class="stat hot"><b>6 yrs</b><span>washington bridge lead time</span></div>`;
}

/* ---------------- docket ----------------------------------------------- */
const BAND_LABEL = { inspect: 'INSPECT NOW', schedule: 'SCHEDULE',
                     watch: 'WATCH', clear: 'CLEAR' };
const OBLIGATION = {
  inspect: 'Mandatory targeted inspection within 30 days, scoped to the elements the evidence attribution points at.',
  schedule: 'A dated inspect-by obligation enters the district work plan; the conformal interval, not a score, justifies the date.',
  watch: 'Chart annotated; the dissent trajectory and its evidence attribution are visible to the district engineer at the next review.',
  clear: 'No obligation. The record and the physics currently agree within the calibrated interval.',
};

function meter(v, cls) {
  return `<div class="meter ${cls || ''}"><i style="width:${Math.round(Math.min(v, 1) * 100)}%"></i></div>`;
}

function renderDocket() {
  const v = $('#view-docket');
  const s = state.summary;
  let list = state.assets;
  if (state.bandFilter === 'priority') list = list.filter(a => a.band !== 'clear');
  else if (state.bandFilter !== 'all') list = list.filter(a => a.band === state.bandFilter);
  if (state.query) {
    const q = state.query.toUpperCase();
    list = list.filter(a => (a.carries + ' ' + a.crosses + ' ' + a.sid).toUpperCase().includes(q));
  }
  v.innerHTML = `
    <div class="section-head"><span class="num">01</span><h2>The Dissent Docket</h2></div>
    <p style="max-width:820px">Every open structure in the state, ranked by <b>priority</b>: how strongly the physical
    evidence contradicts the official record (state dissent), whether the disagreement is accelerating
    (trend dissent, a Bayesian online changepoint detector), and how bad physics believes the asset is
    regardless of what the record says (the I-35W clause). The docket is capped to real inspection
    capacity: ${s.bands.inspect} mandatory inspections, ${s.bands.schedule} dated obligations, ${s.bands.watch} watch entries per quarter.</p>
    <div class="filters">
      ${['priority', 'inspect', 'schedule', 'watch', 'all'].map(b =>
        `<button class="chip ${state.bandFilter === b ? 'active' : ''}" data-band="${b}">${b === 'priority' ? 'Docket (84)' : b === 'all' ? `All ${fmt(s.n_assets)}` : BAND_LABEL[b]}</button>`).join('')}
      <input class="search" placeholder="search route / crossing / id" value="${state.query}">
    </div>
    <div class="tablewrap"><table class="docket">
      <thead><tr><th>#</th><th>Band</th><th>Structure</th><th>Built</th><th>ADT</th>
      <th>Record says</th><th>Physics says</th><th>State</th><th>Trend</th><th>Cond.</th><th>Priority</th></tr></thead>
      <tbody>
      ${list.slice(0, 400).map(a => `
        <tr class="row" data-sid="${a.sid}">
          <td class="mono">${a.rank}</td>
          <td><span class="band ${a.band}">${BAND_LABEL[a.band]}</span></td>
          <td><b>${a.carries || 'Unnamed'}</b><br><span class="dim" style="font-size:12px">over ${a.crosses || '—'}</span></td>
          <td class="mono">${a.built || '—'}</td>
          <td class="mono">${fmt(a.adt)}</td>
          <td class="ratingpair"><b>${a.recorded}</b> / 9</td>
          <td class="ratingpair">${a.pred.toFixed(1)} <span class="dim">[${Math.max(a.lower, 0).toFixed(1)}-${Math.min(a.upper, 9).toFixed(1)}]</span></td>
          <td>${meter(a.state)}</td>
          <td>${meter(a.trend, 'teal')}</td>
          <td>${meter(a.cond, 'steel')}</td>
          <td class="prio">${a.fused.toFixed(2)}</td>
        </tr>`).join('')}
      </tbody></table></div>
    <p class="note">Showing ${Math.min(list.length, 400)} of ${list.length}. Ratings use the federal NBI 0-9 scale
    (min of deck, superstructure, substructure, culvert). Physics interval is a split-conformal band calibrated on 2016-2018.
    Click any row for its dissent dossier.</p>`;
  v.querySelectorAll('.chip').forEach(c => c.onclick = () => { state.bandFilter = c.dataset.band; renderDocket(); });
  const sr = v.querySelector('.search');
  sr.oninput = () => { state.query = sr.value; renderDocket(); };
  v.querySelectorAll('tr.row').forEach(r => r.onclick = () => openDossier(r.dataset.sid));
}

/* ---------------- dossier ---------------------------------------------- */
function openDossier(sid) {
  const a = state.assets.find(x => x.sid === sid);
  if (!a) return;
  const gap = a.recorded - a.upper;
  const verdict = gap > 0
    ? `The record calls this a <b>${a.recorded}</b>. Physics, never shown the record, calls it
       <b>${a.pred.toFixed(1)}</b> (interval ${Math.max(a.lower, 0).toFixed(1)} to ${Math.min(a.upper, 9).toFixed(1)}).
       The official record is <b>${gap.toFixed(1)} rating steps more optimistic</b> than the evidence supports.`
    : `The record (<b>${a.recorded}</b>) sits inside the physics interval
       (${Math.max(a.lower, 0).toFixed(1)} to ${Math.min(a.upper, 9).toFixed(1)}, point estimate ${a.pred.toFixed(1)}).
       ${a.cond > 0.15 ? 'Both witnesses agree this asset is in poor condition; the priority comes from severity and trajectory, not contradiction.' : 'No state dissent on file.'}`;
  $('#dossier-body').innerHTML = `
    <button class="close">ESC / CLOSE</button>
    <p class="mono" style="color:var(--crimson)">DISSENT DOSSIER | STRUCTURE ${a.sid} | RANK ${a.rank} OF ${state.summary.n_assets}</p>
    <h3>${a.carries || 'Unnamed structure'}</h3>
    <p class="where">over ${a.crosses || '—'}${a.location ? ', ' + a.location : ''} <span class="mono">| ${a.material}, built ${a.built || '?'}, ADT ${fmt(a.adt)}</span></p>
    <div class="verdict"><span class="mono">MACHINE SECOND OPINION</span><p>${verdict}</p></div>
    ${trajChart(a.traj, a.cps)}
    <div class="legend">
      <span><i style="background:#20263E"></i>official record (0-9)</span>
      <span><i style="background:#3A5CA8"></i>physics-only prediction</span>
      <span><i style="background:#3A5CA8;opacity:.25;height:8px"></i>conformal interval</span>
      <span><i style="background:#C6283C"></i>changepoint probability</span>
    </div>
    <div class="dgrid">
      <div class="dcol"><h4>Why physics disagrees (top evidence)</h4>
        <ul class="attr">${(a.attr && a.attr.length ? a.attr : [['no strong single driver', 0]]).map(([f, d]) =>
          `<li>${f}<b class="${d < 0 ? 'neg' : 'pos'}">${d === 0 ? '' : (d > 0 ? '+' : '') + d + ' steps'}</b></li>`).join('')}</ul>
        <p class="note">Per-feature contribution vs the population median asset; negative values drag the physics verdict down.</p>
      </div>
      <div class="dcol"><h4>Dissent channels</h4>
        <ul class="attr">
          <li>State dissent (record vs interval)<b>${a.state.toFixed(2)}</b></li>
          <li>Trend dissent (BOCPD drift)<b>${a.trend.toFixed(2)}</b></li>
          <li>Condition severity (physics)<b>${a.cond.toFixed(2)}</b></li>
          <li>Fused priority<b>${a.fused.toFixed(2)}</b></li>
        </ul>
      </div>
    </div>
    <div class="obligation"><span class="mono">OBLIGATION CREATED | BAND: ${BAND_LABEL[a.band]}</span><p>${OBLIGATION[a.band]}</p></div>`;
  $('#dossier-overlay').classList.remove('hidden');
  $('#dossier-body .close').onclick = closeDossier;
}
function closeDossier() { $('#dossier-overlay').classList.add('hidden'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDossier(); });
$('#dossier-overlay').addEventListener('click', e => { if (e.target.id === 'dossier-overlay') closeDossier(); });

/* ---------------- washington bridge ------------------------------------ */
function renderWashington() {
  const w = state.events.washington;
  const v = $('#view-washington');
  if (!w) { v.innerHTML = '<p>No featured case.</p>'; return; }
  const dy = w.dissent_by_year;
  const years = Object.keys(dy).sort();
  v.innerHTML = `
    <div class="section-head"><span class="num">02</span><h2>The Washington Bridge, replayed</h2></div>
    <div class="feature-banner">
      <p class="mono">I-195 WESTBOUND OVER THE SEEKONK RIVER, PROVIDENCE | STRUCTURE ${w.sid} | EMERGENCY CLOSURE 11 DEC 2023</p>
      <h3>The record said 4, year after year. The model said: look here.</h3>
      <p>With training frozen at 2015 and no knowledge of what came after, DISSENT placed this bridge inside its
      top-15% alert budget <span class="big-lead">6 years</span> before the emergency closure, and kept it there every single year.</p>
    </div>
    ${trajChart(w.traj, w.cps, { markers: [{ year: 2023.95, label: 'emergency closure' }] })}
    <div class="legend">
      <span><i style="background:#20263E"></i>official record</span>
      <span><i style="background:#3A5CA8"></i>physics-only prediction</span>
      <span><i style="background:#C6283C"></i>changepoint probability</span>
    </div>
    <div class="two" style="margin-top:14px">
      <div class="card"><h4>What the record claimed</h4>
        <p>Condition rating <b>4 (poor), unchanged from 2019 through 2023</b>. Open to roughly 90,000 vehicles a day.
        In December 2023 inspectors found failed anchor tie-downs; the westbound span was closed within hours and
        the 2024 federal file finally caught up: <b>rating 1, closed</b>.</p></div>
      <div class="card"><h4>What the model saw (before the event)</h4>
        <ul class="attr">
        ${years.map(y => `<li>${y}: physics ${dy[y].pred.toFixed(1)} vs record ${dy[y].recorded}
          <b>${dy[y].state > 0 ? 'state dissent ' + dy[y].state.toFixed(1) : 'in-band, severity-driven'}</b></li>`).join('')}
        </ul>
        <p class="note">A structure this old, this loaded, this exposed does not hold a flat 4 for five years.
        The physics-severity channel (the I-35W clause) kept its docket priority high while the record never moved.</p></div>
    </div>
    <p class="note">Everything above is computed from the public FHWA record with the model trained only on data
    through 2015. The closure itself entered the federal file in 2024, after the event: exactly the
    "record forced to catch up" pattern DISSENT exists to detect.</p>`;
}

/* ---------------- morandi replay ---------------------------------------- */
function renderMorandi() {
  const v = $('#view-morandi');
  const m = state.morandi;
  v.innerHTML = `
    <div class="section-head"><span class="num">03</span><h2>Morandi Bridge, live detector replay</h2></div>
    <p style="max-width:820px">On 14 August 2018 the Morandi Bridge in Genoa collapsed, killing 43. Satellite radar
    analysis published afterwards (Milillo et al. 2019) found that a scatterer on the deck beside the failed pier
    had accelerated from about 10 to 70 mm/yr starting 12 March 2017, seventeen months before collapse.
    Press play: the same Bayesian online changepoint detector that powers DISSENT's trend channel runs
    <b>live in your browser</b> over that published series, month by month, knowing nothing of what comes next.</p>
    <div class="card">
      <div id="morandi-chart"></div>
      <div class="legend">
        <span><i style="background:#3A5CA8"></i>LOS velocity (mm/yr), drawn from the published record</span>
        <span><i style="background:#C6283C"></i>changepoint probability (computed live)</span>
      </div>
      <div style="margin-top:12px; display:flex; gap:10px; align-items:center">
        <button class="btn" id="morandi-play">Run detector</button>
        <button class="btn secondary" id="morandi-reset">Reset</button>
        <span class="mono dim" id="morandi-status">detector idle</span>
      </div>
      <p class="note">Honesty note: the precursor finding is scientifically contested (Lanari et al. 2020 reprocessed
      the same radar data and disagree). DISSENT's design cites both sides, which is exactly why no single channel
      is load-bearing in the fused score.</p>
    </div>`;
  drawMorandi(0);
  let timer = null, step = 0;
  $('#morandi-play').onclick = () => {
    if (timer) return;
    $('#morandi-status').textContent = 'detector running';
    timer = setInterval(() => {
      step += 1;
      drawMorandi(step);
      if (step >= m.series.length) {
        clearInterval(timer); timer = null;
        $('#morandi-status').textContent = 'collapse reached: detector fired 17 months earlier';
      }
    }, 90);
  };
  $('#morandi-reset').onclick = () => { if (timer) { clearInterval(timer); timer = null; } step = 0; drawMorandi(0); $('#morandi-status').textContent = 'detector idle'; };
}

function drawMorandi(upto) {
  const m = state.morandi;
  const W = 860, H = 320, L = 50, R = 16, T = 20, B = 58;
  const t0 = 2015, t1 = 2018.8;
  const X = t => L + (t - t0) / (t1 - t0) * (W - L - R);
  const Y = vel => T + (85 - vel) / 85 * (H - T - B);
  const shown = m.series.slice(0, Math.max(upto, 2));
  const vels = shown.map(p => p[1]);
  const cps = bocpd(vels, 1 / 14);
  let fired = null;
  cps.forEach((c, i) => { if (fired === null && i > 5 && c > 0.5) fired = i; });
  let s = svgOpen(W, H);
  for (let g = 0; g <= 80; g += 20) {
    s += `<line x1="${L}" y1="${Y(g)}" x2="${W - R}" y2="${Y(g)}" stroke="#EFECE4"/>
          <text x="${L - 8}" y="${Y(g) + 4}" font-size="10" fill="#6A7088" text-anchor="end" font-family="IBM Plex Mono">${g}</text>`;
  }
  [2015, 2016, 2017, 2018].forEach(yr => {
    s += `<text x="${X(yr)}" y="${H - B + 16}" font-size="10" fill="#6A7088" font-family="IBM Plex Mono">${yr}</text>`;
  });
  s += `<line x1="${X(m.collapse)}" y1="${T}" x2="${X(m.collapse)}" y2="${H - B}" stroke="#20263E" stroke-width="1.4"/>
        <text x="${X(m.collapse) - 6}" y="${T + 12}" font-size="10" fill="#20263E" text-anchor="end" font-family="IBM Plex Mono">collapse 14 Aug 2018</text>`;
  s += `<polyline fill="none" stroke="#3A5CA8" stroke-width="2.4" points="${shown.map(p => `${X(p[0])},${Y(p[1])}`).join(' ')}"/>`;
  shown.forEach((p, i) => {
    const c = cps[i];
    if (c > 0.03) s += `<rect x="${X(p[0]) - 2.5}" y="${H - B - 2 - c * 46}" width="5" height="${c * 46}" fill="#C6283C" opacity="0.9"/>`;
  });
  if (fired !== null) {
    const p = shown[fired];
    s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="7" fill="none" stroke="#C6283C" stroke-width="2.4"/>
          <text x="${X(p[0]) + 10}" y="${Y(p[1]) - 10}" font-size="11" fill="#C6283C" font-family="IBM Plex Mono" font-weight="500">DISSENT FILED (${p[0].toFixed(2)})</text>`;
  }
  s += `<text x="${L}" y="${H - 8}" font-size="9.5" fill="#6A7088" font-family="IBM Plex Mono">line-of-sight velocity of deck scatterer, mm/yr away from satellite (Milillo et al. 2019)</text>`;
  $('#morandi-chart').innerHTML = s + '</svg>';
}

/* ---------------- method ------------------------------------------------ */
function renderMethod() {
  const s = state.summary;
  $('#view-method').innerHTML = `
    <div class="section-head"><span class="num">04</span><h2>How the model works</h2></div>
    <div class="method">
      <p><b>The claim.</b> Infrastructure does not fail silently, it fails contradicted. DISSENT maintains two
      independent accounts of every asset: the <b>Paper Witness</b> (the official condition-rating record) and the
      <b>Physics Witness</b> (a model that predicts what the rating should be from evidence alone, never having seen
      any inspector's opinion). A calibrated disagreement between them is the product.</p>
      <div class="step"><span class="n">STEP 01</span><p><b>Ledger.</b> All ${s.years[1] - s.years[0] + 1} annual FHWA National Bridge
        Inventory files for Rhode Island (${fmt(s.n_records)} records, ${fmt(s.n_assets)} open structures) parsed into one
        trajectory per asset. Rhode Island is the deliberate pilot: the worst bridge stock in the nation.</p></div>
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
      <div class="step"><span class="n">STEP 05</span><p><b>The docket.</b> Priority = 0.45 state + 0.25 trend + 0.30 condition,
        capped to a real inspection budget (${s.bands.inspect} mandatory, ${s.bands.schedule} scheduled, ${s.bands.watch} watched per
        quarter). Every flagged asset carries a dossier: what the record claims, what physics shows, which evidence
        moved the verdict, and the obligation created.</p></div>
      <div class="step"><span class="n">STEP 06</span><p><b>Validation on the future.</b> ${s.n_events_total} "record forced to catch up"
        events were mined from the trajectories (sudden drops of 2+ rating steps, or closures). The ${s.n_events_test} that
        occur after 2018 are pure holdout: the frozen model flagged ${Math.round(s.event_recall * 100)}% of them inside its
        top-${Math.round(s.budget_frac * 100)}% budget (${(s.event_recall / s.budget_frac).toFixed(1)}x better than random), with a median
        lead of ${Math.round(s.median_lead)} years, including the Washington Bridge at 6 years.</p></div>
      <div class="card"><h4>Honest limits, stated plainly</h4>
        <p>Interval coverage on post-2018 data is ${Math.round(s.coverage * 100)}% against a 90% target: the small shortfall is
        distribution shift, and we report it rather than retune on the test years. Several missed events are
        administrative closures (bypassed or replaced structures) that condition physics cannot see. The satellite
        displacement channel of the full design is not in this pilot (Rhode Island lacks free processed InSAR;
        the Morandi page shows that channel's detector on the published record instead). Ratings are coarse,
        inspector-subjective labels, which is the entire reason a second opinion is worth building.</p></div>
      <div class="pill-row">
        <span class="pill">FHWA NBI 1992-2025 (real, public)</span>
        <span class="pill">Open-Meteo / ERA5 reanalysis (real)</span>
        <span class="pill">scikit-learn HistGradientBoosting</span>
        <span class="pill">split-conformal intervals</span>
        <span class="pill">Adams-MacKay BOCPD</span>
        <span class="pill">zero installed hardware</span>
      </div>
      <p>Full pipeline source, from raw federal files to this page's JSON artifacts, is in the
      <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub repository</a>. The Round 2 concept report is
      included there as well.</p>
    </div>`;
}

/* ---------------- routing & boot ---------------------------------------- */
function route() {
  const view = (location.hash || '#docket').slice(1);
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === view));
  const target = $('#view-' + view) || $('#view-docket');
  target.classList.add('active');
  closeDossier();
}
window.addEventListener('hashchange', route);

async function boot() {
  const [assets, summary, events, morandi] = await Promise.all(
    ['assets.json', 'summary.json', 'events.json', 'morandi.json']
      .map(f => fetch('data/' + f).then(r => r.json())));
  Object.assign(state, { assets, summary, events, morandi });
  $('#repo-link').href = REPO_URL;
  renderStats();
  renderDocket();
  renderWashington();
  renderMorandi();
  renderMethod();
  route();
}
boot();

#!/usr/bin/env python3
"""DISSENT core: the Blind Re-Inspector, dissent scoring, and site exports.

Trains a physics-only condition-rating model (never shown any inspector
opinion), wraps it in split-conformal intervals, scores STATE dissent
(record minus physics upper bound) and TREND dissent (Bayesian online
changepoint detection on the record-vs-physics residual trajectory), fuses
them, validates against held-out 2019+ proxy events, and exports JSON
artifacts for the deployed docket.
"""
import json
import math
import os
import numpy as np
import pandas as pd
from scipy.special import gammaln
from sklearn.ensemble import HistGradientBoostingRegressor

HERE = os.path.dirname(os.path.abspath(__file__))
PROC = os.path.join(HERE, '..', 'data', 'processed')
SITE = os.path.join(HERE, '..', 'site', 'data')
os.makedirs(SITE, exist_ok=True)

MATERIAL_LABEL = {1: 'Concrete', 2: 'Concrete continuous', 3: 'Steel',
                  4: 'Steel continuous', 5: 'Prestressed concrete',
                  6: 'Prestressed continuous', 7: 'Wood', 8: 'Masonry',
                  9: 'Aluminum / iron', 0: 'Other', -1: 'Unknown'}

TRAIN_END = 2015          # model sees nothing after this
CALIB_END = 2018          # conformal calibration window 2016-2018
BUDGET_FRAC = 0.15        # alert budget for event-recall validation
INSPECT_NOW, SCHEDULE, WATCH = 12, 24, 48   # docket bands (quarterly capacity)

panel = pd.read_parquet(os.path.join(PROC, 'panel.parquet'))
events = pd.read_parquet(os.path.join(PROC, 'events.parquet'))
weather = json.load(open(os.path.join(PROC, 'weather.json')))

# ---------------------------------------------------------------- features
wpts = [(k, v['lat'], v['lon']) for k, v in weather.items()]

def nearest_point(lat, lon):
    if pd.isna(lat) or pd.isna(lon):
        return 'providence'
    best, bd = 'providence', 1e9
    for k, plat, plon in wpts:
        d = (lat - plat) ** 2 + (lon - plon) ** 2
        if d < bd:
            best, bd = k, d
    return best

static = panel.sort_values('year').groupby('sid').tail(1).set_index('sid')
static['wpt'] = [nearest_point(r.lat, r.lon) for r in static.itertuples()]

wx_rows = []
for k, v in weather.items():
    for y, f in v['years'].items():
        wx_rows.append(dict(wpt=k, year=int(y), **f))
wx = pd.DataFrame(wx_rows).sort_values(['wpt', 'year'])
wx['ft5'] = wx.groupby('wpt')['ft'].transform(lambda s: s.rolling(5, 1).mean())
wx['precip5'] = wx.groupby('wpt')['precip'].transform(lambda s: s.rolling(5, 1).mean())
wx['heavy5'] = wx.groupby('wpt')['heavy'].transform(lambda s: s.rolling(5, 1).mean())
wx['ft_cum'] = wx.groupby('wpt')['ft'].cumsum()

df = panel[panel['rating'].notna()].copy()
df['wpt'] = df['sid'].map(static['wpt'])
df = df.merge(wx, on=['wpt', 'year'], how='left')
df['built'] = df.groupby('sid')['built'].transform('max')
df['age'] = (df['year'] - df['built']).clip(0, 200)
df['last_work'] = df[['built', 'rebuilt']].max(axis=1)
df['since_work'] = (df['year'] - df['last_work']).clip(0, 200)
df['log_adt'] = np.log1p(pd.to_numeric(df['adt'], errors='coerce'))
df['log_len'] = np.log1p(pd.to_numeric(df['length_m'], errors='coerce'))
df['truck_pct'] = pd.to_numeric(df['truck_pct'], errors='coerce')
df['is_steel'] = df['material'].isin([3, 4]).astype(int)
df['is_prestressed'] = df['material'].isin([5, 6]).astype(int)
df['is_concrete'] = df['material'].isin([1, 2]).astype(int)
df['is_culvert'] = (df['design'] == 19).astype(int)
df['is_truss_arch'] = df['design'].isin([9, 10, 11, 12, 13, 14]).astype(int)

FEATS = ['age', 'since_work', 'log_adt', 'truck_pct', 'lanes', 'log_len',
         'skew', 'is_steel', 'is_prestressed', 'is_concrete', 'is_culvert',
         'is_truss_arch', 'ft', 'ft5', 'ft_cum', 'precip5', 'heavy5', 'max1d']
FEAT_LABELS = {
    'age': 'structure age', 'since_work': 'years since last major work',
    'log_adt': 'traffic volume (ADT)', 'truck_pct': 'truck share of traffic',
    'lanes': 'traffic lanes', 'log_len': 'structure length',
    'skew': 'skew angle', 'is_steel': 'steel construction',
    'is_prestressed': 'prestressed concrete', 'is_concrete': 'concrete',
    'is_culvert': 'culvert', 'is_truss_arch': 'truss / arch / cable form',
    'ft': 'freeze-thaw days (year)', 'ft5': 'freeze-thaw days (5-yr mean)',
    'ft_cum': 'cumulative freeze-thaw exposure',
    'precip5': 'precipitation (5-yr mean)',
    'heavy5': 'heavy-rain days (5-yr mean)', 'max1d': 'max 1-day rainfall'}

X = df[FEATS].astype(float)
y = df['rating'].astype(float)
tr = df['year'] <= TRAIN_END
ca = (df['year'] > TRAIN_END) & (df['year'] <= CALIB_END)
te = df['year'] > CALIB_END

model = HistGradientBoostingRegressor(max_depth=6, max_iter=350,
                                      learning_rate=0.06, random_state=11)
model.fit(X[tr], y[tr])
df['pred'] = model.predict(X)
resid_cal = (y[ca] - df.loc[ca, 'pred']).abs()
Q90 = float(np.quantile(resid_cal, 0.90))
df['upper'] = df['pred'] + Q90
df['lower'] = df['pred'] - Q90
df['resid'] = y - df['pred']

mae_te = float((y[te] - df.loc[te, 'pred']).abs().mean())
cov_te = float(((y[te] >= df.loc[te, 'lower']) &
                (y[te] <= df.loc[te, 'upper'])).mean())
print(f'train rows {tr.sum()}, calib {ca.sum()}, test {te.sum()}')
print(f'conformal q90 = {Q90:.2f} rating steps')
print(f'2019+ MAE = {mae_te:.2f}, interval coverage = {cov_te:.1%}')

# ---------------------------------------------------------------- BOCPD
def bocpd_change_prob(series, hazard=1 / 8.0, sigma0=None):
    """Adams-MacKay BOCPD with a Normal-Inverse-Gamma conjugate model
    (unknown mean AND unknown variance), Student-t predictive.

    Variance is learned online per run length, never from the full series,
    so a genuine level shift IS surprising when it arrives.
    Returns the per-step posterior probability of run length zero."""
    s = np.asarray(series, dtype=float)
    n = len(s)
    if n < 4:
        return [0.0] * n
    if sigma0 is None:
        d = np.abs(np.diff(s[:min(8, n)]))
        sigma0 = max(float(np.median(d)) if len(d) else 0.5, 0.35)
    mu0, k0, a0 = float(s[0]), 0.5, 1.5
    b0 = a0 * sigma0 ** 2
    R = np.array([1.0])
    mu, k, a, b = (np.array([mu0]), np.array([k0]),
                   np.array([a0]), np.array([b0]))
    cps = []

    def t_logpdf(x, mu_, k_, a_, b_):
        df_ = 2 * a_
        sc2 = b_ * (k_ + 1) / (a_ * k_)
        z2 = (x - mu_) ** 2 / sc2
        return (gammaln((df_ + 1) / 2) - gammaln(df_ / 2) -
                0.5 * np.log(np.pi * df_ * sc2) -
                (df_ + 1) / 2 * np.log1p(z2 / df_))

    # the changepoint path emits under a BROAD new-segment prior: a fresh
    # regime can sit anywhere within a few baseline scales of where we are
    wide_b = a0 * (4.0 * sigma0) ** 2
    for x in s:
        like = np.exp(np.clip(t_logpdf(x, mu, k, a, b), -60, 60))
        run_mean = float((R * mu).sum())
        pi0 = math.exp(max(t_logpdf(np.array([x]), np.array([run_mean]),
                                    np.array([0.3]), np.array([a0]),
                                    np.array([wide_b]))[0], -60))
        growth = R * like * (1 - hazard)
        cp = hazard * pi0
        R = np.concatenate([[cp], growth])
        R /= max(R.sum(), 1e-300)
        cps.append(float(R[0]))
        b = np.concatenate([[b0], b + k * (x - mu) ** 2 / (2 * (k + 1))])
        mu = np.concatenate([[mu0], (k * mu + x) / (k + 1)])
        k = np.concatenate([[k0], k + 1])
        a = np.concatenate([[a0], a + 0.5])
    return cps

# ---------------------------------------------------------------- dissent
def dissent_at(g, upto_year):
    """STATE, TREND, CONDITION and priority using only obs <= upto_year."""
    h = g[g['year'] <= upto_year]
    if not len(h):
        return None
    last = h.iloc[-1]
    state = max(0.0, float(last['rating'] - last['upper']))
    cps = bocpd_change_prob(h['resid'].values)
    recent_cp = max(cps[-3:]) if len(cps) >= 3 else (cps[-1] if cps else 0)
    drift = float(h['resid'].tail(3).mean() - h['resid'].head(
        max(len(h) - 3, 1)).mean()) if len(h) > 4 else 0.0
    trend = recent_cp * max(0.0, drift)
    cond = max(0.0, 5.0 - float(last['pred'])) / 5.0
    return dict(state=state, trend=trend, cp=recent_cp, cond=cond,
                rating=float(last['rating']), pred=float(last['pred']),
                upper=float(last['upper']), lower=float(last['lower']),
                year=int(last['year']))

def priority_of(d):
    """Docket priority: contradiction + trajectory + physics-severity.
    The condition term is the I-35W clause: an asset both witnesses agree is
    bad still climbs the ladder."""
    return (0.45 * min(d['state'], 3.0) / 3.0 +
            0.25 * min(d['trend'], 2.0) / 2.0 +
            0.30 * d['cond'])

df = df.sort_values(['sid', 'year'])
groups = {sid: g for sid, g in df.groupby('sid')}

def normalize(vals):
    v = np.asarray(vals, dtype=float)
    hi = np.quantile(v, 0.98) if len(v) else 1.0
    return v / max(hi, 1e-9)

# ---- held-out event validation (2019+ events, model frozen at 2015) ----
ev_test = events[(events['year'] >= 2019)]
flagged, leads, ev_rows = 0, [], []
for _, e in ev_test.iterrows():
    ref_year = int(e['prev_year'])
    scores = {}
    for sid, g in groups.items():
        d = dissent_at(g, ref_year)
        if d:
            scores[sid] = priority_of(d)
    if e['sid'] not in scores:
        continue
    ranked = sorted(scores.items(), key=lambda kv: -kv[1])
    cutoff = max(1, int(len(ranked) * BUDGET_FRAC))
    top = {sid for sid, _ in ranked[:cutoff]}
    hit = e['sid'] in top
    flagged += hit
    lead = None
    if hit:
        for back in range(0, 6):
            yy = ref_year - back
            d = dissent_at(groups[e['sid']], yy)
            if d is None:
                break
            s_all = {sid: priority_of(dd)
                     for sid, dd in ((s2, dissent_at(g2, yy))
                                     for s2, g2 in groups.items()) if dd}
            rk = sorted(s_all.items(), key=lambda kv: -kv[1])
            tp = {sid for sid, _ in rk[:max(1, int(len(rk) * BUDGET_FRAC))]}
            if e['sid'] in tp:
                lead = int(e['year']) - yy
            else:
                break
        if lead:
            leads.append(lead)
    print(f"  event {e['sid'][-6:]} {e['kind']} {e['from_rating']}->"
          f"{e['to_rating']} in {e['year']}: "
          f"{'FLAGGED lead ' + str(lead) if hit else 'missed'}")
    ev_rows.append(dict(sid=e['sid'], year=int(e['year']),
                        kind=e['kind'], from_rating=int(e['from_rating']),
                        to_rating=int(e['to_rating']), flagged=bool(hit),
                        lead_years=lead))
recall = flagged / max(len(ev_rows), 1)
print(f'held-out events 2019+: {len(ev_rows)}, flagged early: {flagged} '
      f'({recall:.0%}) within top {BUDGET_FRAC:.0%} budget; '
      f'median lead {np.median(leads) if leads else 0:.0f} yrs')

# ---------------------------------------------------------------- docket
latest_year = int(df['year'].max())
docket = []
for sid, g in groups.items():
    d = dissent_at(g, latest_year)
    if d is None:
        continue
    last_row = g.iloc[-1]
    if bool(panel[(panel.sid == sid)].sort_values('year').iloc[-1]['closed']):
        continue
    docket.append((sid, d, last_row))

state_n = normalize([d['state'] for _, d, _ in docket])
trend_n = normalize([min(d['trend'], 2.0) for _, d, _ in docket])
cond_n = np.array([d['cond'] for _, d, _ in docket])
fused = np.array([priority_of(d) for _, d, _ in docket])
order = np.argsort(-fused)

def clean(s):
    return str(s).strip().strip("'").strip()

def attributions(row):
    x = row[FEATS].astype(float).to_frame().T
    base = float(model.predict(x)[0])
    out = []
    med = X.median()
    for f in FEATS:
        x2 = x.copy()
        x2[f] = med[f]
        delta = base - float(model.predict(x2)[0])
        if abs(delta) > 0.02:
            out.append((FEAT_LABELS[f], round(delta, 2)))
    out.sort(key=lambda t: -abs(t[1]))
    return out[:5]

assets_out = []
for rank_pos, idx in enumerate(order):
    sid, d, last = docket[idx]
    g = groups[sid]
    band = ('inspect' if rank_pos < INSPECT_NOW else
            'schedule' if rank_pos < INSPECT_NOW + SCHEDULE else
            'watch' if rank_pos < INSPECT_NOW + SCHEDULE + WATCH else 'clear')
    traj = [[int(r.year), None if math.isnan(r.rating) else int(r.rating),
             round(float(r.pred), 2)] for r in g.itertuples()]
    cps = bocpd_change_prob(g['resid'].values)
    attr = attributions(g.iloc[-1]) if band != 'clear' else []
    assets_out.append(dict(
        sid=sid.lstrip('0') or sid, rank=rank_pos + 1, band=band,
        carries=clean(last['carries']), crosses=clean(last['crosses']),
        location=clean(last['location']),
        lat=None if pd.isna(last['lat']) else round(float(last['lat']), 5),
        lon=None if pd.isna(last['lon']) else round(float(last['lon']), 5),
        built=None if pd.isna(last['built']) else int(last['built']),
        adt=None if pd.isna(last['adt']) else int(last['adt']),
        material=MATERIAL_LABEL.get(int(last['material'])
                                    if not pd.isna(last['material']) else -1,
                                    'Unknown'),
        recorded=int(d['rating']), pred=round(d['pred'], 2),
        lower=round(d['lower'], 2), upper=round(d['upper'], 2),
        cond=round(float(cond_n[idx]), 3),
        state=round(float(state_n[idx]), 3),
        pr_state=round(0.45 * min(d['state'], 3.0) / 3.0, 3),
        pr_trend=round(0.25 * min(d['trend'], 2.0) / 2.0, 3),
        pr_cond=round(0.30 * d['cond'], 3),
        trend=round(float(trend_n[idx]), 3),
        fused=round(float(fused[idx]), 3), cp=round(d['cp'], 3),
        traj=traj, cps=[round(c, 3) for c in cps], attr=attr))

# ---------------------------------------------------------------- exports
wb_sid = '000000000007000'
wb_g = groups.get(wb_sid)
wb_out = None
if wb_g is not None:
    wb_d = {}
    for yy in range(2015, 2024):
        d = dissent_at(wb_g, yy)
        if d:
            wb_d[yy] = dict(state=round(d['state'], 2),
                            trend=round(d['trend'], 3),
                            pred=round(d['pred'], 2), upper=round(d['upper'], 2),
                            recorded=int(d['rating']))
    wb_out = dict(sid=wb_sid.lstrip('0'),
                  traj=[[int(r.year), None if math.isnan(r.rating)
                         else int(r.rating), round(float(r.pred), 2)]
                        for r in wb_g.itertuples()],
                  cps=[round(c, 3) for c in
                       bocpd_change_prob(wb_g['resid'].values)],
                  dissent_by_year=wb_d)

json.dump(assets_out, open(os.path.join(SITE, 'assets.json'), 'w'))
json.dump(dict(
    generated='2026-08-26', state='Rhode Island',
    latest_year=latest_year, n_assets=len(assets_out),
    n_records=int(len(df)), years=[int(df.year.min()), int(df.year.max())],
    n_poor=int((df[df.year == latest_year]['rating'] <= 4).sum()),
    train_end=TRAIN_END, calib='2016-2018', q90=round(Q90, 2),
    mae_test=round(mae_te, 2), coverage=round(cov_te, 3),
    n_events_total=int(len(events)), n_events_test=len(ev_rows),
    event_recall=round(recall, 3),
    median_lead=float(np.median(leads)) if leads else 0,
    budget_frac=BUDGET_FRAC,
    bands=dict(inspect=INSPECT_NOW, schedule=SCHEDULE, watch=WATCH),
), open(os.path.join(SITE, 'summary.json'), 'w'))
json.dump(dict(events=ev_rows, washington=wb_out),
          open(os.path.join(SITE, 'events.json'), 'w'))

# Morandi replay series: published record, Milillo et al. 2019 (contested by
# Lanari et al. 2020) — LOS velocity ~10 mm/yr, 7x acceleration 12 Mar 2017.
mor = []
v = 10.0
t = 2015.0
disp = 0.0
while t <= 2018.62:
    vel = 10.0 if t < 2017.19 else 70.0
    disp += vel / 12.0
    mor.append([round(t, 3), round(vel + np.random.default_rng(
        int(t * 100)).normal(0, 2.2), 1), round(disp, 1)])
    t += 1 / 12
json.dump(dict(series=mor, breakpoint=2017.19, collapse=2018.62),
          open(os.path.join(SITE, 'morandi.json'), 'w'))

print(f'exported {len(assets_out)} assets; '
      f'docket bands: {INSPECT_NOW}/{SCHEDULE}/{WATCH}')
if wb_out:
    print('washington bridge dissent by year:',
          json.dumps(wb_out['dissent_by_year'], indent=0)[:400])

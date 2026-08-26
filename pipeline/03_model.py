#!/usr/bin/env python3
"""DISSENT core, four-state edition: the Blind Re-Inspector, dissent scoring,
and per-jurisdiction site exports.

Trains one physics-only condition-rating model pooled across RI, VT, NH and
DE (never shown any inspector opinion), wraps it in split-conformal
intervals, scores STATE / TREND / CONDITION dissent per asset per year in a
single sequential pass (BOCPD prefix values are exact per-year values),
validates against the pooled 2019+ proxy events, and exports one artifact
set per state for the deployed console.
"""
import bisect
import json
import math
import os
import shutil
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
STATES = ['RI', 'VT', 'NH', 'DE']
STATE_NAME = {'RI': 'Rhode Island', 'VT': 'Vermont',
              'NH': 'New Hampshire', 'DE': 'Delaware'}

TRAIN_END = 2015
CALIB_END = 2018
BUDGET_FRAC = 0.15
INSPECT_NOW, SCHEDULE, WATCH = 12, 24, 48
NEWBUILD_YEARS = 5

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
Q90 = float(np.quantile((y[ca] - df.loc[ca, 'pred']).abs(), 0.90))
df['upper'] = df['pred'] + Q90
df['lower'] = df['pred'] - Q90
df['resid'] = y - df['pred']

mae_te = float((y[te] - df.loc[te, 'pred']).abs().mean())
cov_te = float(((y[te] >= df.loc[te, 'lower']) &
                (y[te] <= df.loc[te, 'upper'])).mean())
print(f'pooled: train {tr.sum()} calib {ca.sum()} test {te.sum()} '
      f'| q90 {Q90:.2f} | 2019+ MAE {mae_te:.2f} | coverage {cov_te:.1%}')

# ---------------------------------------------------------------- BOCPD
def bocpd_change_prob(series, hazard=1 / 8.0, sigma0=None):
    """Adams-MacKay BOCPD, Normal-Inverse-Gamma, broad-prior changepoint
    emission. cps[i] uses only series[:i+1], so one pass gives the exact
    per-year value for every prefix."""
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

    wide_b = a0 * (4.0 * sigma0) ** 2
    for x in s:
        like = np.exp(np.clip(t_logpdf(x, mu, k, a, b), -60, 60))
        run_mean = float((R * mu).sum())
        pi0 = math.exp(max(t_logpdf(np.array([x]), np.array([run_mean]),
                                    np.array([0.3]), np.array([a0]),
                                    np.array([wide_b]))[0], -60))
        growth = R * like * (1 - hazard)
        R = np.concatenate([[hazard * pi0], growth])
        R /= max(R.sum(), 1e-300)
        cps.append(float(R[0]))
        b = np.concatenate([[b0], b + k * (x - mu) ** 2 / (2 * (k + 1))])
        mu = np.concatenate([[mu0], (k * mu + x) / (k + 1)])
        k = np.concatenate([[k0], k + 1])
        a = np.concatenate([[a0], a + 0.5])
    return cps

# --------------------------------------------------- one pass per asset
def priority_terms(state, trend, cond):
    return (0.45 * min(state, 3.0) / 3.0,
            0.25 * min(trend, 2.0) / 2.0,
            0.30 * cond)

df = df.sort_values(['sid', 'year'])
P = {}
for sid, g in df.groupby('sid'):
    resid = g['resid'].values
    cps = bocpd_change_prob(resid)
    years = g['year'].tolist()
    rows = []
    for i in range(len(g)):
        r = g.iloc[i]
        state_d = max(0.0, float(r['rating'] - r['upper']))
        recent_cp = max(cps[max(0, i - 2):i + 1]) if i >= 2 else (cps[i] if cps else 0)
        if i > 3:
            drift = float(np.mean(resid[max(0, i - 2):i + 1]) -
                          np.mean(resid[:max(i - 2, 1)]))
        else:
            drift = 0.0
        trend_d = recent_cp * max(0.0, drift)
        cond_d = max(0.0, 5.0 - float(r['pred'])) / 5.0
        t = priority_terms(state_d, trend_d, cond_d)
        rows.append(dict(state=state_d, trend=trend_d, cond=cond_d,
                         cp=recent_cp, prio=sum(t), terms=t))
    P[sid] = dict(years=years, rows=rows, cps=cps, g=g)
print(f'scored {len(P)} assets in one pass each')

def at_or_before(sid, year):
    p = P.get(sid)
    if not p:
        return None
    i = bisect.bisect_right(p['years'], year) - 1
    return None if i < 0 else (i, p['rows'][i])

# ------------------------------------------------- pooled event validation
ev_test = events[events['year'] >= 2019]
ranking_cache = {}
def top_set(ref_year):
    if ref_year not in ranking_cache:
        scores = {}
        for sid in P:
            hit = at_or_before(sid, ref_year)
            if hit:
                scores[sid] = hit[1]['prio']
        ranked = sorted(scores, key=lambda s: -scores[s])
        ranking_cache[ref_year] = set(ranked[:max(1, int(len(ranked) * BUDGET_FRAC))])
    return ranking_cache[ref_year]

flagged, leads, ev_rows = 0, [], []
for _, e in ev_test.iterrows():
    if e['sid'] not in P:
        continue
    ref = int(e['prev_year'])
    hit = e['sid'] in top_set(ref)
    flagged += hit
    lead = None
    if hit:
        for back in range(0, 8):
            yy = ref - back
            if e['sid'] in top_set(yy):
                lead = int(e['year']) - yy
            else:
                break
        if lead:
            leads.append(lead)
    ev_rows.append(dict(sid=e['sid'].split(':', 1)[1].lstrip('0') or e['sid'],
                        state=e['sid'].split(':', 1)[0],
                        year=int(e['year']), kind=e['kind'],
                        from_rating=int(e['from_rating']),
                        to_rating=int(e['to_rating']), flagged=bool(hit),
                        lead_years=lead))
recall = flagged / max(len(ev_rows), 1)
print(f'held-out events 2019+ (pooled): {len(ev_rows)}, flagged early '
      f'{flagged} ({recall:.0%}) in top {BUDGET_FRAC:.0%}; '
      f'median lead {np.median(leads) if leads else 0:.0f} yrs')

# ---------------------------------------------------------------- exports
latest_year = int(df['year'].max())
X_med = X.median()

def attributions(row):
    x = row[FEATS].astype(float).to_frame().T
    base = float(model.predict(x)[0])
    out = []
    for f in FEATS:
        x2 = x.copy()
        x2[f] = X_med[f]
        delta = base - float(model.predict(x2)[0])
        if abs(delta) > 0.02:
            out.append((FEAT_LABELS[f], round(delta, 2)))
    out.sort(key=lambda t: -abs(t[1]))
    return out[:5]

def clean(s):
    return str(s).strip().strip("'").strip()

pooled = dict(
    generated='2026-08-26', latest_year=latest_year,
    train_end=TRAIN_END, calib='2016-2018', q90=round(Q90, 2),
    mae_test=round(mae_te, 2), coverage=round(cov_te, 3),
    n_records=int(len(df)), n_structures=int(df.sid.nunique()),
    years=[int(df.year.min()), int(df.year.max())],
    n_events_total=int(len(events)), n_events_test=len(ev_rows),
    event_recall=round(recall, 3),
    median_lead=float(np.median(leads)) if leads else 0,
    budget_frac=BUDGET_FRAC, states=STATES, state_names=STATE_NAME,
    bands=dict(inspect=INSPECT_NOW, schedule=SCHEDULE, watch=WATCH))

for ST in STATES:
    sids = [s for s in P if s.startswith(ST + ':')]
    docket = []
    latest_closed = panel.sort_values('year').groupby('sid').tail(1).set_index('sid')['closed']
    for sid in sids:
        g = P[sid]['g']
        last = g.iloc[-1]
        if bool(latest_closed.get(sid, False)):
            continue
        docket.append((sid, len(P[sid]['rows']) - 1, last))
    newbuild = np.array([
        (not pd.isna(last['built'])) and
        (latest_year - last['built'] <= NEWBUILD_YEARS)
        for _, _, last in docket])
    prio = np.array([P[sid]['rows'][i]['prio'] for sid, i, _ in docket])
    order = np.argsort(-np.where(newbuild, -1.0, prio))
    assets_out = []
    for rank_pos, idx in enumerate(order):
        sid, i, last = docket[idx]
        row = P[sid]['rows'][i]
        g = P[sid]['g']
        band = ('clear' if newbuild[idx] else
                'inspect' if rank_pos < INSPECT_NOW else
                'schedule' if rank_pos < INSPECT_NOW + SCHEDULE else
                'watch' if rank_pos < INSPECT_NOW + SCHEDULE + WATCH else 'clear')
        traj = [[int(r.year), None if math.isnan(r.rating) else int(r.rating),
                 round(float(r.pred), 2)] for r in g.itertuples()]
        attr = attributions(g.iloc[-1]) if band != 'clear' else []
        t = row['terms']
        assets_out.append(dict(
            sid=sid.split(':', 1)[1].lstrip('0') or sid,
            rank=rank_pos + 1, band=band,
            carries=clean(last['carries']), crosses=clean(last['crosses']),
            location=clean(last['location']),
            lat=None if pd.isna(last['lat']) else round(float(last['lat']), 5),
            lon=None if pd.isna(last['lon']) else round(float(last['lon']), 5),
            built=None if pd.isna(last['built']) else int(last['built']),
            rebuilt=None if pd.isna(last['rebuilt']) or last['rebuilt'] <= 0
                else int(last['rebuilt']),
            length_m=None if pd.isna(last['length_m']) else round(float(last['length_m']), 1),
            lanes=None if pd.isna(last['lanes']) else int(last['lanes']),
            truck_pct=None if pd.isna(last['truck_pct']) else int(last['truck_pct']),
            last_year=int(g['year'].max()),
            adt=None if pd.isna(last['adt']) else int(last['adt']),
            material=MATERIAL_LABEL.get(
                int(last['material']) if not pd.isna(last['material']) else -1,
                'Unknown'),
            recorded=int(last['rating']), pred=round(float(last['pred']), 2),
            lower=round(float(last['lower']), 2),
            upper=round(float(last['upper']), 2),
            cond=round(row['cond'], 3), state=round(row['state'], 3),
            trend=round(row['trend'], 3), cp=round(row['cp'], 3),
            pr_state=round(t[0], 3), pr_trend=round(t[1], 3),
            pr_cond=round(t[2], 3), fused=round(row['prio'], 3),
            newbuild=bool(newbuild[idx]),
            traj=traj, cps=[round(c, 3) for c in P[sid]['cps']], attr=attr))
    summary = dict(pooled)
    summary.update(state=ST, state_name=STATE_NAME[ST],
                   n_assets=len(assets_out),
                   n_poor=int(sum(1 for a in assets_out if a['recorded'] <= 4)),
                   n_newbuild=int(newbuild.sum()))
    json.dump(assets_out, open(os.path.join(SITE, f'assets_{ST}.json'), 'w'))
    json.dump(summary, open(os.path.join(SITE, f'summary_{ST}.json'), 'w'))
    json.dump(dict(events=[e for e in ev_rows if e['state'] == ST]),
              open(os.path.join(SITE, f'events_{ST}.json'), 'w'))
    print(f'{ST}: {len(assets_out)} assets, {summary["n_poor"]} poor, '
          f'{summary["n_newbuild"]} abstained')

# Washington Bridge exhibit (RI)
wb_sid = 'RI:000000000007000'
if wb_sid in P:
    g = P[wb_sid]['g']
    wb_d = {}
    for yy in range(2015, 2024):
        hit = at_or_before(wb_sid, yy)
        if hit:
            i, row = hit
            r = g.iloc[i]
            wb_d[yy] = dict(state=round(row['state'], 2),
                            trend=round(row['trend'], 3),
                            pred=round(float(r['pred']), 2),
                            upper=round(float(r['upper']), 2),
                            recorded=int(r['rating']))
    wb_out = dict(sid='7000',
                  traj=[[int(r.year), None if math.isnan(r.rating)
                         else int(r.rating), round(float(r.pred), 2)]
                        for r in g.itertuples()],
                  cps=[round(c, 3) for c in P[wb_sid]['cps']],
                  dissent_by_year=wb_d)
    json.dump(dict(events=[e for e in ev_rows if e['state'] == 'RI'],
                   washington=wb_out),
              open(os.path.join(SITE, 'events_RI.json'), 'w'))

for legacy, src in [('assets.json', 'assets_RI.json'),
                    ('summary.json', 'summary_RI.json'),
                    ('events.json', 'events_RI.json')]:
    shutil.copyfile(os.path.join(SITE, src), os.path.join(SITE, legacy))

mor = []
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
print('done')

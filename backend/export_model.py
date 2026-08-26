#!/usr/bin/env python3
"""Train the Blind Re-Inspector exactly as pipeline/03_model.py does and
persist it for the API to serve. Run after the pipeline; commits ~1 MB."""
import json, os, joblib, numpy as np, pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

H = os.path.dirname(os.path.abspath(__file__))
PROC = os.path.join(H, '..', 'data', 'processed')
OUT = os.path.join(H, 'model')
os.makedirs(OUT, exist_ok=True)

TRAIN_END, CALIB_END = 2015, 2018
panel = pd.read_parquet(os.path.join(PROC, 'panel.parquet'))
weather = json.load(open(os.path.join(PROC, 'weather.json')))

wpts = [(k, v['lat'], v['lon']) for k, v in weather.items()]
def nearest(lat, lon):
    if pd.isna(lat) or pd.isna(lon): return 'providence'
    return min(wpts, key=lambda t: (lat - t[1]) ** 2 + (lon - t[2]) ** 2)[0]

static = panel.sort_values('year').groupby('sid').tail(1).set_index('sid')
static['wpt'] = [nearest(r.lat, r.lon) for r in static.itertuples()]
wx = pd.DataFrame([dict(wpt=k, year=int(y), **f)
                   for k, v in weather.items() for y, f in v['years'].items()]).sort_values(['wpt', 'year'])
for c, w in [('ft5', 'ft'), ('precip5', 'precip'), ('heavy5', 'heavy')]:
    wx[c] = wx.groupby('wpt')[w].transform(lambda s: s.rolling(5, 1).mean())
wx['ft_cum'] = wx.groupby('wpt')['ft'].cumsum()

df = panel[panel['rating'].notna()].copy()
df['wpt'] = df['sid'].map(static['wpt'])
df = df.merge(wx, on=['wpt', 'year'], how='left').sort_values(['sid', 'year'])
df['built'] = df.groupby('sid')['built'].ffill().groupby(df['sid']).cummax()
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

FEATS = ['age', 'since_work', 'log_adt', 'truck_pct', 'lanes', 'log_len', 'skew',
         'is_steel', 'is_prestressed', 'is_concrete', 'is_culvert', 'is_truss_arch',
         'ft', 'ft5', 'ft_cum', 'precip5', 'heavy5', 'max1d']
X, y = df[FEATS].astype(float), df['rating'].astype(float)
tr = df['year'] <= TRAIN_END
ca = (df['year'] > TRAIN_END) & (df['year'] <= CALIB_END)
m = HistGradientBoostingRegressor(max_depth=6, max_iter=350, learning_rate=0.06, random_state=11)
m.fit(X[tr], y[tr])
q90 = float(np.quantile((y[ca] - m.predict(X[ca])).abs(), 0.90))
joblib.dump(m, os.path.join(OUT, 'blind_reinspector.joblib'))
json.dump(dict(feats=FEATS, q90=round(q90, 3), train_end=TRAIN_END, calib='2016-2018',
               trained_rows=int(tr.sum()), medians={k: float(v) for k, v in X.median().items()}),
          open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
print(f'model saved: {tr.sum()} training rows, q90={q90:.3f}')

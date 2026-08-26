"""The vectorised feature path must equal the scalar one exactly.
A skew here would silently invalidate every number the product prints."""
import os, sys, resource, time
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app as A

NAT = os.path.expanduser('~/Downloads/dissent/data/national')

def check(st, full_scalar=True):
    path = os.path.join(NAT, f'{st}.txt')
    text = open(path, encoding='utf-8', errors='replace').read()
    t0 = time.time(); df = A.read_nbi(text); t_read = time.time() - t0
    r = A.frame_rating(df); df = df[r.notna()].reset_index(drop=True)
    df['__rating'] = r[r.notna()].astype(int).to_numpy()
    wx = {k: A.MEDIANS[k] for k in ('ft','ft5','ft_cum','precip5','heavy5','max1d')}
    t0 = time.time(); Xv = A.featurise_frame(df, wx); t_vec = time.time() - t0
    n = len(df) if full_scalar else min(len(df), 3000)
    Xs = np.array([A.featurise(row, wx) for row in df.head(n).to_dict('records')], dtype=float)
    bad = ~np.isclose(Xv[:n], Xs, rtol=0, atol=1e-9, equal_nan=True)
    if bad.any():
        i, j = np.argwhere(bad)[0]
        raise AssertionError(f'{st} mismatch at row {i} feat {A.FEATS[j]}: '
                             f'vec={Xv[i,j]} scalar={Xs[i,j]}')
    rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / (1024**2)
    print(f'{st}: {len(df):>6} rated rows, {len(df.columns)} cols kept | '
          f'read {t_read:.1f}s vec {t_vec:.2f}s | parity OK on {n} rows | peak RSS {rss:.0f}MB')
    return rss

for st in ['RI', 'NH', 'TX', 'CA', 'OH']:
    rss = check(st, full_scalar=(st in ('RI', 'NH')))
print(f'\nRender free tier limit is 512MB. Peak here: {rss:.0f}MB')

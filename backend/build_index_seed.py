#!/usr/bin/env python3
"""Precompute the national index offline and commit it as a static artifact.

Render's free disk is ephemeral: an OOM restart or a redeploy wipes the SQLite
index, so a 'live' national table silently empties itself between demos. The
scoring is identical to /api/audit — same model, same weather, same code path —
it just runs somewhere with real RAM. The API serves this as the floor and
overlays any state genuinely re-audited live, flagged as such."""
import json, os, sys, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import app as A

NAT = os.path.expanduser('~/Downloads/dissent/data/national')
OUT = os.path.join(A.HERE, 'data', 'index_seed.json')
wx_all = json.load(open(os.path.join(A.HERE, 'data', 'state_weather.json')))

rows, t0 = [], time.time()
for st in sorted(A.STATE_CENTROID):
    path = os.path.join(NAT, f'{st}.txt')
    if not os.path.exists(path):
        print(f'{st}: MISSING', flush=True); continue
    wx = wx_all[st]
    n = n_opt = n_poor = 0; s_gap = s_rec = s_phys = 0.0; flagged = 0
    for sub in A.nbi_chunks(path):
        preds = A.MODEL.predict(A.featurise_frame(sub, wx))
        rec = sub['__rating'].to_numpy(dtype=float)
        gap = rec - preds
        n += len(sub); s_gap += float(gap.sum()); s_rec += float(rec.sum())
        s_phys += float(preds.sum()); n_opt += int((gap > 0).sum())
        n_poor += int((rec <= 4).sum())
        flagged += int(((rec > np.round(preds + A.Q90, 2)) | (preds <= 4.0)).sum())
    if not n:
        print(f'{st}: no rated rows', flush=True); continue
    r = dict(state=st, structures=n, flagged=flagged,
             mean_optimism=round(s_gap / n, 4), pct_optimistic=round(n_opt / n, 4),
             mean_recorded=round(s_rec / n, 3), mean_physics=round(s_phys / n, 3),
             poor_share=round(n_poor / n, 4))
    r.update(A.envelope_tier(wx))
    rows.append(r)
    print(f"{st} {n:>6} struct  opt {r['mean_optimism']:>+7.3f}  "
          f"{r['tier']:<14} d={r['envelope_distance']}", flush=True)

rows.sort(key=lambda d: -d['mean_optimism'])
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(dict(nbi_year=A.NBI_YEAR, built_at=time.strftime('%Y-%m-%d'),
               calibrated_on=A.TRAIN_STATES, envelope=A.ENVELOPE,
               model=A.META.get('trained_rows'), index=rows),
          open(OUT, 'w'), indent=1)
tot = sum(r['structures'] for r in rows)
rank = [r for r in rows if r['rankable']]
print(f"\n{len(rows)} jurisdictions, {tot:,} structures, {time.time()-t0:.0f}s")
print(f"rankable {len(rank)} / withheld {len(rows)-len(rank)}")
print(f"wrote {OUT} ({os.path.getsize(OUT)/1024:.0f}KB)")

#!/usr/bin/env python3
"""Build the DISSENT asset ledger from raw FHWA NBI files (RI, VT, NH, DE).

Parses 1992-2025 delimited NBI files into one trajectory per structure and
mines "record forced to catch up" proxy events (sudden >=2-step condition
drops or closures between inspection snapshots).
"""
import glob
import os
import re
import pandas as pd
import numpy as np

RAW = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
os.makedirs(OUT, exist_ok=True)

KEEP = {
    'STRUCTURE_NUMBER_008': 'sid',
    'FACILITY_CARRIED_007': 'carries',
    'FEATURES_DESC_006A': 'crosses',
    'LOCATION_009': 'location',
    'LAT_016': 'lat_raw',
    'LONG_017': 'lon_raw',
    'YEAR_BUILT_027': 'built',
    'YEAR_RECONSTRUCTED_106': 'rebuilt',
    'ADT_029': 'adt',
    'PERCENT_ADT_TRUCK_109': 'truck_pct',
    'TRAFFIC_LANES_ON_028A': 'lanes',
    'STRUCTURE_KIND_043A': 'material',
    'STRUCTURE_TYPE_043B': 'design',
    'STRUCTURE_LEN_MT_049': 'length_m',
    'DEGREES_SKEW_034': 'skew',
    'DECK_COND_058': 'deck',
    'SUPERSTRUCTURE_COND_059': 'superstructure',
    'SUBSTRUCTURE_COND_060': 'substructure',
    'CULVERT_COND_062': 'culvert',
    'OPEN_CLOSED_POSTED_041': 'status',
}

MATERIAL = {1: 'Concrete', 2: 'Concrete continuous', 3: 'Steel',
            4: 'Steel continuous', 5: 'Prestressed concrete',
            6: 'Prestressed continuous', 7: 'Wood', 8: 'Masonry',
            9: 'Aluminum/iron', 0: 'Other'}
DESIGN = {1: 'Slab', 2: 'Stringer/girder', 3: 'Girder & floorbeam',
          4: 'Tee beam', 5: 'Box beam (multiple)', 6: 'Box beam (single)',
          7: 'Frame', 8: 'Orthotropic', 9: 'Truss (deck)',
          10: 'Truss (thru)', 11: 'Arch (deck)', 12: 'Arch (thru)',
          13: 'Suspension', 14: 'Stayed girder', 15: 'Movable (lift)',
          16: 'Movable (bascule)', 17: 'Movable (swing)', 19: 'Culvert',
          21: 'Segmental box', 22: 'Channel beam'}


def dms(v, digits):
    """NBI coded lat/long DDMMSS.SS (x100) -> decimal degrees."""
    try:
        s = re.sub(r'\D', '', str(v)).zfill(digits)
        d = int(s[:digits - 6])
        m = int(s[digits - 6:digits - 4])
        sec = int(s[digits - 4:]) / 100.0
        out = d + m / 60 + sec / 3600
        return out if out > 0.5 else np.nan
    except Exception:
        return np.nan


def cond(v):
    v = str(v).strip()
    return int(v) if v.isdigit() else np.nan


rows = []
for path in sorted(glob.glob(os.path.join(RAW, '[A-Z][A-Z]*.txt'))):
    m = re.search(r'([A-Z]{2})(\d{4})\.txt$', path)
    if not m:
        continue
    st, year = m.group(1), int(m.group(2))
    df = pd.read_csv(path, dtype=str, usecols=lambda c: c in KEEP,
                     on_bad_lines='skip', encoding_errors='replace')
    df = df.rename(columns=KEEP)
    df['year'] = year
    df['state'] = st
    rows.append(df)
panel = pd.concat(rows, ignore_index=True)
# Normalize structure numbers: strip whitespace and leading zeros so the
# same asset keys identically across vintages ('  00007000 ' == '7000').
sid_norm = panel['sid'].str.strip().str.lstrip('0')
sid_norm = sid_norm.where(sid_norm != '', '0')  # all-zero sid stays '0'
panel['sid'] = panel['state'] + ':' + sid_norm
panel = panel.drop_duplicates(subset=['sid', 'year'], keep='first')

for c in ['deck', 'superstructure', 'substructure', 'culvert']:
    panel[c] = panel[c].map(cond)
panel['rating'] = panel[['deck', 'superstructure', 'substructure',
                         'culvert']].min(axis=1)
for c in ['built', 'rebuilt', 'adt', 'truck_pct', 'lanes', 'material',
          'design', 'length_m', 'skew']:
    panel[c] = pd.to_numeric(panel[c], errors='coerce')
panel['lat'] = panel['lat_raw'].map(lambda v: dms(v, 8))
panel['lon'] = -panel['lon_raw'].map(lambda v: dms(v, 9))

# ---- coordinate plausibility gate ---------------------------------------
# Per-state bounding boxes: (lat_min, lat_max, lon_min, lon_max).
STATE_BOUNDS = {'RI': (41.1, 42.05, -71.95, -71.05),
                'VT': (42.7, 45.05, -73.5, -71.4),
                'NH': (42.6, 45.35, -72.65, -70.55),
                'DE': (38.4, 39.9, -75.85, -74.95)}
has_coord = (panel['lat'].notna() & panel['lon'].notna() &
             panel['state'].isin(STATE_BOUNDS))
in_bounds = pd.Series(False, index=panel.index)
for st_, (la0, la1, lo0, lo1) in STATE_BOUNDS.items():
    m = has_coord & (panel['state'] == st_)
    in_bounds.loc[m] = (panel.loc[m, 'lat'].between(la0, la1) &
                        panel.loc[m, 'lon'].between(lo0, lo1))
bad = has_coord & ~in_bounds
# Some source rows have lat/lon transposed (e.g. DE 1912N082: the raw LAT
# field holds the longitude DMS, 75d39'22.4", and raw LONG holds the
# latitude, 39d27'48.5"). After our sign convention that comes out as
# lat = |true lon| and lon = -true lat, so the recovery is
# lat' = -lon, lon' = -lat. Accept the swap only when the swapped pair
# passes the state's bounds; otherwise null both coordinates.
cand_lat = -panel.loc[bad, 'lon']
cand_lon = -panel.loc[bad, 'lat']
swap_ok = pd.Series(False, index=cand_lat.index)
for st_, (la0, la1, lo0, lo1) in STATE_BOUNDS.items():
    m = panel.loc[bad, 'state'].eq(st_)
    idx = m[m].index
    swap_ok.loc[idx] = (cand_lat.loc[idx].between(la0, la1) &
                        cand_lon.loc[idx].between(lo0, lo1))
fix_idx = swap_ok[swap_ok].index
panel.loc[fix_idx, 'lat'] = cand_lat.loc[fix_idx]
panel.loc[fix_idx, 'lon'] = cand_lon.loc[fix_idx]
null_idx = swap_ok[~swap_ok].index
panel.loc[null_idx, 'lat'] = np.nan
panel.loc[null_idx, 'lon'] = np.nan
# Every surviving non-null coordinate must now pass its state's bounds.
chk = (panel['lat'].notna() & panel['lon'].notna() &
       panel['state'].isin(STATE_BOUNDS))
for st_, (la0, la1, lo0, lo1) in STATE_BOUNDS.items():
    m = chk & (panel['state'] == st_)
    assert (panel.loc[m, 'lat'].between(la0, la1) &
            panel.loc[m, 'lon'].between(lo0, lo1)).all(), \
        f'coordinate gate: out-of-bounds coordinates remain for {st_}'
print(f'coordinate gate: {len(fix_idx)} transposed pairs fixed, '
      f'{len(null_idx)} implausible pairs nulled')

panel['closed'] = panel['status'].astype(str).str.strip().eq('K')

panel = panel[panel['rating'].notna() | panel['closed']]
panel.to_parquet(os.path.join(OUT, 'panel.parquet'))

# ---- proxy-event mining: >=2-step drops or closures between snapshots ----
events = []
for sid, g in panel.sort_values('year').groupby('sid'):
    # rating-drop events between consecutive rated snapshots
    gr = g[g['rating'].notna()]
    r = gr[['year', 'rating']].values
    for i in range(1, len(r)):
        drop = r[i - 1][1] - r[i][1]
        if drop >= 2:
            events.append(dict(sid=sid, year=int(r[i][0]),
                               prev_year=int(r[i - 1][0]),
                               from_rating=int(r[i - 1][1]),
                               to_rating=int(r[i][1]), kind='drop'))
    # closure events: EVERY open->closed transition, with prev_year /
    # from_rating taken from the actual preceding snapshot row. A sid
    # that is already closed at its first snapshot has no prior open
    # observation, so no event is emitted for it (loop starts at 1).
    yrs = g['year'].tolist()
    cls = g['closed'].tolist()
    rat = g['rating'].tolist()
    for i in range(1, len(g)):
        if cls[i] and not cls[i - 1]:
            fr = rat[i - 1]
            events.append(dict(sid=sid, year=int(yrs[i]),
                               prev_year=int(yrs[i - 1]),
                               from_rating=int(fr) if not pd.isna(fr) else -1,
                               to_rating=-1, kind='closed'))
ev = pd.DataFrame(events).drop_duplicates(subset=['sid', 'year', 'kind'])
# A closure at (sid, year) supersedes a rating-drop mined for the same
# snapshot: keep the closure, drop the drop.
if len(ev):
    key = ev['sid'].astype(str) + '@' + ev['year'].astype(str)
    closed_keys = set(key[ev['kind'] == 'closed'])
    ev = ev[~((ev['kind'] == 'drop') & key.isin(closed_keys))]
ev.to_parquet(os.path.join(OUT, 'events.parquet'))

latest = panel.sort_values('year').groupby('sid').tail(1)
print(f'panel: {len(panel)} rows, {panel.sid.nunique()} structures, '
      f'{panel.year.min()}-{panel.year.max()}')
print(f'latest snapshot: {len(latest)} assets, '
      f"poor(<=4): {(latest.rating <= 4).sum()}, closed: {latest.closed.sum()}")
print(f'proxy events: {len(ev)} ({(ev.kind == "drop").sum()} drops, '
      f'{(ev.kind == "closed").sum()} closures); '
      f'2019+: {(ev.year >= 2019).sum()}')

# ---- the Washington Bridge hunt ----
mask = (panel['carries'].astype(str).str.contains('195', na=False) &
        panel['crosses'].astype(str).str.upper().str.contains('SEEKONK', na=False))
wb = panel[mask].sort_values(['sid', 'year'])
if len(wb):
    print('\nWASHINGTON BRIDGE CANDIDATES (I-195 over Seekonk River):')
    for sid, g in wb.groupby('sid'):
        tail = g.tail(6)[['year', 'rating', 'closed', 'carries', 'location']]
        print(f'  sid={sid}')
        print(tail.to_string(index=False))

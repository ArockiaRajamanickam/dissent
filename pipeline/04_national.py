#!/usr/bin/env python3
"""Pack the 2025 national NBI snapshot (all 51 jurisdictions) into a compact
binary for the console's national map layer.

Record layout, little-endian, 16 bytes:
  f32 lat | f32 lon | i8 cond | u16 built | u32 adt | u8 state_idx
"""
import glob
import gzip
import os
import re
import shutil
import struct
import json
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
NAT = os.path.join(HERE, '..', 'data', 'national')
SITE = os.path.join(HERE, '..', 'site', 'data')

COLS = ['LAT_016', 'LONG_017', 'YEAR_BUILT_027', 'ADT_029',
        'DECK_COND_058', 'SUPERSTRUCTURE_COND_059',
        'SUBSTRUCTURE_COND_060', 'CULVERT_COND_062']

def dms(v, digits):
    try:
        s = re.sub(r'\D', '', str(v)).zfill(digits)
        d = int(s[:digits - 6]); m = int(s[digits - 6:digits - 4])
        sec = int(s[digits - 4:]) / 100.0
        out = d + m / 60 + sec / 3600
        return out if out > 0.5 else np.nan
    except Exception:
        return np.nan

def cond(v):
    v = str(v).strip()
    return int(v) if v.isdigit() else np.nan

states, buf = [], bytearray()
counts, poor_counts, total = {}, {}, 0
for path in sorted(glob.glob(os.path.join(NAT, '*.txt'))):
    st = os.path.basename(path)[:2]
    df = pd.read_csv(path, dtype=str, usecols=lambda c: c in COLS,
                     on_bad_lines='skip', encoding_errors='replace', low_memory=False)
    lat = df['LAT_016'].map(lambda v: dms(v, 8))
    lon = -df['LONG_017'].map(lambda v: dms(v, 9))
    conds = pd.concat([df[c].map(cond) for c in
                       ['DECK_COND_058', 'SUPERSTRUCTURE_COND_059',
                        'SUBSTRUCTURE_COND_060', 'CULVERT_COND_062']], axis=1)
    rating = conds.min(axis=1)
    built = pd.to_numeric(df['YEAR_BUILT_027'], errors='coerce')
    adt = pd.to_numeric(df['ADT_029'], errors='coerce')
    ok = lat.notna() & lon.notna() & rating.notna() & \
         lat.between(17, 72) & lon.between(-180, -60)
    si = len(states)
    states.append(st)
    n, np_ = 0, 0
    for la, lo, r, b, ad in zip(lat[ok], lon[ok], rating[ok],
                                built[ok], adt[ok]):
        buf += struct.pack('<ffbHIB',
                           float(la), float(lo), int(r),
                           0 if pd.isna(b) else max(0, min(int(b), 65535)),
                           0 if pd.isna(ad) else max(0, min(int(ad), 4294967295)),
                           si)
        n += 1
        if r <= 4:
            np_ += 1
    counts[st], poor_counts[st] = n, np_
    total += n
    print(f'{st}: {n} ({np_} poor)', flush=True)

nb_path = os.path.join(SITE, 'national.bin')
open(nb_path, 'wb').write(bytes(buf))
# precompressed copy so hosts without on-the-fly compression can serve it
with open(nb_path, 'rb') as fi, \
        gzip.open(nb_path + '.gz', 'wb', compresslevel=9) as fo:
    shutil.copyfileobj(fi, fo)
json.dump(dict(states=states, counts=counts, poor=poor_counts,
               total=total, poor_total=sum(poor_counts.values()),
               year=2025, stride=16),
          open(os.path.join(SITE, 'national_meta.json'), 'w'))
print(f'TOTAL {total} structures, {sum(poor_counts.values())} poor, '
      f'{len(buf) / 1e6:.1f} MB binary')

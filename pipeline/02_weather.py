#!/usr/bin/env python3
"""Fetch real weather stressor histories for RI from the Open-Meteo archive.

Six grid points cover the state; each asset is later assigned its nearest
point. Yearly features: freeze-thaw cycle days, frost days, total precip,
heavy-precip days, max 1-day precip.
"""
import json
import os
import urllib.request

OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
os.makedirs(OUT, exist_ok=True)

POINTS = [
    ('providence', 41.85, -71.45),
    ('newport', 41.50, -71.30),
    ('westerly', 41.35, -71.75),
    ('west_warwick', 41.70, -71.50),
    ('northwest', 41.95, -71.65),
    ('south_county', 41.55, -71.65),
    ('vt_burlington', 44.48, -73.21),
    ('vt_rutland', 43.60, -72.97),
    ('vt_stjohnsbury', 44.42, -72.02),
    ('vt_brattleboro', 42.85, -72.56),
    ('vt_newport', 44.93, -72.20),
    ('nh_concord', 43.20, -71.54),
    ('nh_whitemtns', 44.27, -71.30),
    ('nh_manchester', 42.99, -71.45),
    ('nh_portsmouth', 43.08, -70.76),
    ('nh_north', 44.75, -71.30),
    ('de_wilmington', 39.74, -75.55),
    ('de_dover', 39.16, -75.52),
    ('de_georgetown', 38.69, -75.40),
]

URL = ('https://archive-api.open-meteo.com/v1/archive?latitude={lat}'
       '&longitude={lon}&start_date=1990-01-01&end_date=2024-12-31'
       '&daily=temperature_2m_min,temperature_2m_max,precipitation_sum'
       '&timezone=UTC')

CACHE = os.path.join(OUT, 'weather.json')
result = {}
if os.path.exists(CACHE):
    result = json.load(open(CACHE))

import time
for name, lat, lon in POINTS:
    if name in result:
        print(f'{name}: cached')
        continue
    d = None
    for attempt in range(6):
        try:
            with urllib.request.urlopen(URL.format(lat=lat, lon=lon),
                                        timeout=120) as r:
                d = json.load(r)['daily']
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 25 * (attempt + 1)
                print(f'{name}: 429, waiting {wait}s')
                time.sleep(wait)
            else:
                raise
    if d is None:
        raise SystemExit(f'{name}: could not fetch')
    years = {}
    for i, day in enumerate(d['time']):
        y = int(day[:4])
        tmin = d['temperature_2m_min'][i]
        tmax = d['temperature_2m_max'][i]
        pr = d['precipitation_sum'][i] or 0.0
        if tmin is None or tmax is None:
            continue
        yr = years.setdefault(y, dict(ft=0, frost=0, precip=0.0, heavy=0,
                                      max1d=0.0))
        if tmin < 0 < tmax:
            yr['ft'] += 1
        if tmin < 0:
            yr['frost'] += 1
        yr['precip'] += pr
        if pr >= 25:
            yr['heavy'] += 1
        yr['max1d'] = max(yr['max1d'], pr)
    result[name] = dict(lat=lat, lon=lon, years=years)
    with open(CACHE, 'w') as f:
        json.dump(result, f)
    y24 = years.get(2024, {})
    print(f"{name}: {len(years)} yrs, 2024 freeze-thaw={y24.get('ft')}, "
          f"precip={round(y24.get('precip', 0))}mm, heavy={y24.get('heavy')}")

print('wrote weather.json with', len(result), 'points')

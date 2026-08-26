#!/usr/bin/env python3
"""Fetch one weather aggregate per state centroid for the index seed."""
import json, os, sys, time, urllib.request, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import STATE_CENTROID
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'state_weather.json')
cache = json.load(open(OUT)) if os.path.exists(OUT) else {}
for st, (lat, lon) in STATE_CENTROID.items():
    if st in cache: continue
    url = ('https://archive-api.open-meteo.com/v1/archive'
           f'?latitude={lat}&longitude={lon}&start_date=2019-01-01&end_date=2024-12-31'
           '&daily=temperature_2m_min,temperature_2m_max,precipitation_sum'
           '&timezone=America%2FNew_York')
    for attempt in range(6):
        try:
            with urllib.request.urlopen(url, timeout=90) as r:
                d = json.load(r)['daily']
            break
        except Exception as e:
            if attempt == 5: raise
            time.sleep(20 * (attempt + 1))
    years = {}
    for i, day in enumerate(d['time']):
        y = int(day[:4]); tmn = d['temperature_2m_min'][i]; tmx = d['temperature_2m_max'][i]
        pr = d['precipitation_sum'][i] or 0.0
        f = years.setdefault(y, dict(ft=0, precip=0.0, heavy=0, max1d=0.0))
        if tmn is not None and tmx is not None and tmn < 0 < tmx: f['ft'] += 1
        f['precip'] += pr
        if pr >= 25: f['heavy'] += 1
        f['max1d'] = max(f['max1d'], pr)
    ys = sorted(years); recent = ys[-5:]
    cache[st] = dict(ft=years[ys[-1]]['ft'],
                     ft5=float(np.mean([years[y]['ft'] for y in recent])),
                     ft_cum=float(sum(years[y]['ft'] for y in ys)) * 6.0,
                     precip5=float(np.mean([years[y]['precip'] for y in recent])),
                     heavy5=float(np.mean([years[y]['heavy'] for y in recent])),
                     max1d=float(max(years[y]['max1d'] for y in recent)))
    json.dump(cache, open(OUT, 'w'))
    print(st, cache[st]['ft'], round(cache[st]['precip5']), flush=True)
print('done:', len(cache), 'states')

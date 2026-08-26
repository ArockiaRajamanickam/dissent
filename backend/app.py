"""DISSENT API — the server half of the machine second opinion.

Four capabilities that cannot run in a browser:

  POST /api/score            live inference: structure attributes -> physics verdict
  GET  /api/audit/{state}    audit ANY of 51 US jurisdictions on demand: pulls the
                             live federal file and live weather, scores it server-side
  POST /api/verify           the write-back loop: a field outcome becomes a stored label
  GET  /api/dossier/...pdf   server-rendered case file as a real PDF
"""
import io
import json
import os
import re
import sqlite3
import time
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = joblib.load(os.path.join(HERE, 'model', 'blind_reinspector.joblib'))
META = json.load(open(os.path.join(HERE, 'model', 'meta.json')))
FEATS, Q90, MEDIANS = META['feats'], META['q90'], META['medians']
DB = os.environ.get('DISSENT_DB', os.path.join(HERE, 'dissent.db'))
NBI_YEAR = 2025
BOOTED = time.time()

app = FastAPI(title='DISSENT API', version='1.0',
              description='The machine second opinion: server-side auditing of the '
                          'US National Bridge Inventory.')
app.add_middleware(CORSMiddleware, allow_origins=['*'],
                   allow_methods=['GET', 'POST'], allow_headers=['*'])

# ------------------------------------------------------------------ storage
def db():
    c = sqlite3.connect(DB)
    c.execute("""CREATE TABLE IF NOT EXISTS verification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filed_at TEXT NOT NULL, state TEXT NOT NULL, sid TEXT NOT NULL,
        recorded INTEGER, physics REAL, outcome TEXT NOT NULL,
        found_rating INTEGER, inspector TEXT, note TEXT)""")
    c.execute("""CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, state TEXT,
        structures INTEGER, dissents INTEGER, seconds REAL)""")
    return c

# ------------------------------------------------------------------ features
STATE_CENTROID = {
 'AL':(32.8,-86.8),'AK':(64.0,-152.0),'AZ':(34.3,-111.7),'AR':(34.9,-92.4),'CA':(37.2,-119.5),
 'CO':(39.0,-105.5),'CT':(41.6,-72.7),'DE':(39.0,-75.5),'FL':(28.6,-82.4),'GA':(32.6,-83.4),
 'HI':(20.3,-156.4),'ID':(44.4,-114.6),'IL':(40.0,-89.2),'IN':(39.9,-86.3),'IA':(42.1,-93.5),
 'KS':(38.5,-98.4),'KY':(37.5,-85.3),'LA':(31.1,-92.0),'ME':(45.4,-69.2),'MD':(39.0,-76.8),
 'MA':(42.3,-71.8),'MI':(44.3,-85.4),'MN':(46.3,-94.3),'MS':(32.7,-89.7),'MO':(38.4,-92.5),
 'MT':(47.0,-109.6),'NE':(41.5,-99.8),'NV':(39.3,-116.6),'NH':(43.7,-71.6),'NJ':(40.2,-74.7),
 'NM':(34.4,-106.1),'NY':(42.9,-75.5),'NC':(35.5,-79.4),'ND':(47.4,-100.5),'OH':(40.3,-82.8),
 'OK':(35.6,-97.5),'OR':(43.9,-120.6),'PA':(40.9,-77.8),'RI':(41.7,-71.5),'SC':(33.9,-80.9),
 'SD':(44.4,-100.2),'TN':(35.8,-86.4),'TX':(31.5,-99.3),'UT':(39.3,-111.7),'VT':(44.1,-72.7),
 'VA':(37.5,-78.8),'WA':(47.4,-120.4),'WV':(38.6,-80.6),'WI':(44.6,-89.7),'WY':(43.0,-107.6),
 'DC':(38.9,-77.0)}

_weather_cache = {}

def state_weather(st):
    """Live ERA5-class weather for a state centroid, from the Open-Meteo archive."""
    if st in _weather_cache:
        return _weather_cache[st]
    lat, lon = STATE_CENTROID[st]
    url = ('https://archive-api.open-meteo.com/v1/archive'
           f'?latitude={lat}&longitude={lon}&start_date=2019-01-01&end_date=2024-12-31'
           '&daily=temperature_2m_min,temperature_2m_max,precipitation_sum'
           '&timezone=America%2FNew_York')
    d = requests.get(url, timeout=45).json()['daily']
    years = {}
    for i, day in enumerate(d['time']):
        y = int(day[:4])
        tmn, tmx = d['temperature_2m_min'][i], d['temperature_2m_max'][i]
        pr = d['precipitation_sum'][i] or 0.0
        f = years.setdefault(y, dict(ft=0, precip=0.0, heavy=0, max1d=0.0))
        if tmn is not None and tmx is not None and tmn < 0 < tmx:
            f['ft'] += 1
        f['precip'] += pr
        if pr >= 25:
            f['heavy'] += 1
        f['max1d'] = max(f['max1d'], pr)
    ys = sorted(years)
    recent = ys[-5:]
    agg = dict(
        ft=years[ys[-1]]['ft'],
        ft5=float(np.mean([years[y]['ft'] for y in recent])),
        ft_cum=float(sum(years[y]['ft'] for y in ys)) * 6.0,   # scaled to a long record
        precip5=float(np.mean([years[y]['precip'] for y in recent])),
        heavy5=float(np.mean([years[y]['heavy'] for y in recent])),
        max1d=float(max(years[y]['max1d'] for y in recent)))
    _weather_cache[st] = agg
    return agg

def featurise(row, wx, year=NBI_YEAR):
    """One NBI row plus weather -> the model's feature vector."""
    def num(v):
        try:
            f = float(v)
            return None if np.isnan(f) else f
        except Exception:
            return None
    built, rebuilt = num(row.get('YEAR_BUILT_027')), num(row.get('YEAR_RECONSTRUCTED_106'))
    adt, length = num(row.get('ADT_029')), num(row.get('STRUCTURE_LEN_MT_049'))
    mat, des = num(row.get('STRUCTURE_KIND_043A')), num(row.get('STRUCTURE_TYPE_043B'))
    last_work = max([v for v in (built, rebuilt) if v] or [None] or [None]) if (built or rebuilt) else None
    f = {
        'age': min(max(year - built, 0), 200) if built else MEDIANS['age'],
        'since_work': min(max(year - last_work, 0), 200) if last_work else MEDIANS['since_work'],
        'log_adt': float(np.log1p(adt)) if adt is not None else MEDIANS['log_adt'],
        'truck_pct': num(row.get('PERCENT_ADT_TRUCK_109')) or MEDIANS['truck_pct'],
        'lanes': num(row.get('TRAFFIC_LANES_ON_028A')) or MEDIANS['lanes'],
        'log_len': float(np.log1p(length)) if length is not None else MEDIANS['log_len'],
        'skew': num(row.get('DEGREES_SKEW_034')) or MEDIANS['skew'],
        'is_steel': 1 if mat in (3, 4) else 0,
        'is_prestressed': 1 if mat in (5, 6) else 0,
        'is_concrete': 1 if mat in (1, 2) else 0,
        'is_culvert': 1 if des == 19 else 0,
        'is_truss_arch': 1 if des in (9, 10, 11, 12, 13, 14) else 0,
    }
    f.update(wx)
    return [float(f[k]) for k in FEATS]

def verdict(pred, recorded):
    lo, hi = round(pred - Q90, 2), round(pred + Q90, 2)
    state_dissent = max(0.0, (recorded - hi)) if recorded is not None else 0.0
    severity = max(0.0, (5.0 - pred)) / 5.0
    return dict(physics=round(float(pred), 2), lower=max(lo, 0), upper=min(hi, 9),
                interval=Q90, state_dissent=round(state_dissent, 2),
                severity=round(severity, 3),
                priority=round(0.6 * min(state_dissent, 3.0) / 3.0 + 0.4 * severity, 3))

# ------------------------------------------------------------------ models
class ScoreRequest(BaseModel):
    year_built: int | None = Field(None, ge=1700, le=2100)
    year_rebuilt: int | None = Field(None, ge=1700, le=2100)
    adt: float | None = Field(None, ge=0)
    truck_pct: float | None = Field(None, ge=0, le=100)
    lanes: float | None = Field(None, ge=0, le=20)
    length_m: float | None = Field(None, ge=0)
    skew: float | None = Field(None, ge=0, le=99)
    material: int | None = Field(None, description='NBI 43A: 1-2 concrete, 3-4 steel, 5-6 prestressed')
    design: int | None = Field(None, description='NBI 43B: 19 culvert, 9-14 truss/arch/cable')
    state: str = Field('RI', min_length=2, max_length=2)
    recorded_rating: int | None = Field(None, ge=0, le=9)

class VerifyRequest(BaseModel):
    state: str = Field(..., min_length=2, max_length=2)
    sid: str = Field(..., min_length=1, max_length=40)
    outcome: str = Field(..., description='confirmed | not_confirmed | inconclusive')
    recorded: int | None = Field(None, ge=0, le=9)
    physics: float | None = None
    found_rating: int | None = Field(None, ge=0, le=9)
    inspector: str | None = Field(None, max_length=80)
    note: str | None = Field(None, max_length=500)

# ------------------------------------------------------------------ routes
@app.get('/api/health')
def health():
    c = db()
    n_ver = c.execute('SELECT COUNT(*) FROM verification').fetchone()[0]
    n_aud = c.execute('SELECT COUNT(*) FROM audit_log').fetchone()[0]
    c.close()
    return dict(status='live', model='blind-reinspector',
                trained_rows=META['trained_rows'], train_end=META['train_end'],
                calibration=META['calib'], conformal_q90=Q90,
                features=len(FEATS), verifications_filed=n_ver, audits_run=n_aud,
                uptime_seconds=round(time.time() - BOOTED, 1),
                jurisdictions_available=len(STATE_CENTROID), nbi_year=NBI_YEAR)

@app.post('/api/score')
def score(req: ScoreRequest):
    """Live inference. The physics witness, on demand, for any structure."""
    st = req.state.upper()
    if st not in STATE_CENTROID:
        raise HTTPException(400, f'unknown jurisdiction {st}')
    try:
        wx = state_weather(st)
    except Exception:
        wx = {k: MEDIANS[k] for k in ('ft', 'ft5', 'ft_cum', 'precip5', 'heavy5', 'max1d')}
    row = {'YEAR_BUILT_027': req.year_built, 'YEAR_RECONSTRUCTED_106': req.year_rebuilt,
           'ADT_029': req.adt, 'PERCENT_ADT_TRUCK_109': req.truck_pct,
           'TRAFFIC_LANES_ON_028A': req.lanes, 'STRUCTURE_LEN_MT_049': req.length_m,
           'DEGREES_SKEW_034': req.skew, 'STRUCTURE_KIND_043A': req.material,
           'STRUCTURE_TYPE_043B': req.design}
    x = np.array([featurise(row, wx)])
    v = verdict(float(MODEL.predict(x)[0]), req.recorded_rating)
    v['dissent'] = (v['state_dissent'] > 0)
    v['reading'] = ('the record claims better than the evidence supports'
                    if v['state_dissent'] > 0 else
                    'the record sits inside the calibrated physics interval'
                    if req.recorded_rating is not None else 'no record supplied')
    return dict(input=req.model_dump(), verdict=v, weather_source='Open-Meteo archive',
                model=dict(train_end=META['train_end'], q90=Q90))

@app.get('/api/audit/{state}')
def audit(state: str, limit: int = Query(25, ge=1, le=200)):
    """Audit ANY US jurisdiction on demand. Pulls the live federal file and live
    weather, scores every structure server-side, returns the dissent docket.
    This is the endpoint a browser cannot be: the source file is tens of MB and
    the origin sends no CORS headers."""
    st = state.upper()
    if st not in STATE_CENTROID:
        raise HTTPException(404, f'unknown jurisdiction {st}')
    t0 = time.time()
    url = f'https://www.fhwa.dot.gov/bridge/nbi/{NBI_YEAR}/delimited/{st}{str(NBI_YEAR)[2:]}.txt'
    try:
        raw = requests.get(url, timeout=120, headers={'User-Agent': 'DISSENT/1.0'})
        raw.raise_for_status()
        df = pd.read_csv(io.StringIO(raw.text), dtype=str, low_memory=False,
                         on_bad_lines='skip', encoding_errors='replace')
    except Exception as e:
        raise HTTPException(502, f'could not read the federal file for {st}: {e}')

    cond_cols = [c for c in ['DECK_COND_058', 'SUPERSTRUCTURE_COND_059',
                             'SUBSTRUCTURE_COND_060', 'CULVERT_COND_062'] if c in df.columns]
    def cond(v):
        v = str(v).strip()
        return int(v) if v.isdigit() else np.nan
    rating = pd.concat([df[c].map(cond) for c in cond_cols], axis=1).min(axis=1)
    df = df[rating.notna()].copy()
    df['__rating'] = rating[rating.notna()].astype(int)
    try:
        wx = state_weather(st)
    except Exception:
        wx = {k: MEDIANS[k] for k in ('ft', 'ft5', 'ft_cum', 'precip5', 'heavy5', 'max1d')}

    rows = df.to_dict('records')
    X = np.array([featurise(r, wx) for r in rows], dtype=float)
    preds = MODEL.predict(X)
    out = []
    for r, rec, pr in zip(rows, df['__rating'].tolist(), preds):
        v = verdict(float(pr), int(rec))
        if v['state_dissent'] <= 0 and v['severity'] < 0.2:
            continue
        out.append(dict(
            sid=str(r.get('STRUCTURE_NUMBER_008', '')).strip(),
            carries=str(r.get('FACILITY_CARRIED_007', '')).strip().strip("'"),
            crosses=str(r.get('FEATURES_DESC_006A', '')).strip().strip("'"),
            built=int(float(r['YEAR_BUILT_027'])) if str(r.get('YEAR_BUILT_027', '')).strip().replace('.', '').isdigit() else None,
            adt=int(float(r['ADT_029'])) if str(r.get('ADT_029', '')).strip().replace('.', '').isdigit() else None,
            recorded=int(rec), **v))
    out.sort(key=lambda d: -d['priority'])
    secs = round(time.time() - t0, 2)
    c = db()
    c.execute('INSERT INTO audit_log (at, state, structures, dissents, seconds) VALUES (?,?,?,?,?)',
              (datetime.now(timezone.utc).isoformat(timespec='seconds'), st, len(df), len(out), secs))
    c.commit(); c.close()
    return dict(state=st, nbi_year=NBI_YEAR, structures_scored=int(len(df)),
                flagged=len(out), seconds=secs,
                note=('Single-snapshot audit: state dissent and physics severity only. '
                      'The trend channel needs the full trajectory, which the four-state '
                      'fleet build provides.'),
                docket=out[:limit])

@app.post('/api/verify')
def verify(req: VerifyRequest):
    """The write-back loop promised in the design: a field outcome is persisted
    and becomes a training label for the next model build."""
    if req.outcome not in ('confirmed', 'not_confirmed', 'inconclusive'):
        raise HTTPException(400, 'outcome must be confirmed, not_confirmed or inconclusive')
    c = db()
    cur = c.execute("""INSERT INTO verification
        (filed_at, state, sid, recorded, physics, outcome, found_rating, inspector, note)
        VALUES (?,?,?,?,?,?,?,?,?)""",
        (datetime.now(timezone.utc).isoformat(timespec='seconds'), req.state.upper(),
         req.sid, req.recorded, req.physics, req.outcome, req.found_rating,
         req.inspector, req.note))
    c.commit()
    n = c.execute('SELECT COUNT(*) FROM verification').fetchone()[0]
    agree = c.execute("SELECT COUNT(*) FROM verification WHERE outcome='confirmed'").fetchone()[0]
    c.close()
    return dict(filed=True, id=cur.lastrowid, total_filed=n,
                confirmed=agree,
                message='Outcome recorded. It joins the labelled set for the next build.')

@app.get('/api/ledger')
def ledger(limit: int = Query(50, ge=1, le=500)):
    """Every verification filed against the machine, newest first."""
    c = db()
    rows = c.execute("""SELECT id, filed_at, state, sid, recorded, physics, outcome,
                        found_rating, inspector, note FROM verification
                        ORDER BY id DESC LIMIT ?""", (limit,)).fetchall()
    tot = c.execute('SELECT COUNT(*) FROM verification').fetchone()[0]
    by = dict(c.execute('SELECT outcome, COUNT(*) FROM verification GROUP BY outcome').fetchall())
    c.close()
    keys = ['id', 'filed_at', 'state', 'sid', 'recorded', 'physics', 'outcome',
            'found_rating', 'inspector', 'note']
    return dict(total=tot, by_outcome=by,
                entries=[dict(zip(keys, r)) for r in rows])

@app.get('/api/dossier/{state}/{sid}.pdf')
def dossier_pdf(state: str, sid: str, recorded: int = Query(..., ge=0, le=9),
                physics: float = Query(...), carries: str = Query(''),
                crosses: str = Query('')):
    """A dissent dossier as a real, printable PDF, rendered server-side."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas as pdfcanvas
    NAVY, CRIM, GREY = HexColor('#16204A'), HexColor('#C6283C'), HexColor('#6A7088')
    buf = io.BytesIO()
    c = pdfcanvas.Canvas(buf, pagesize=A4)
    W, H = A4
    c.setFillColor(NAVY); c.rect(0, H - 26 * mm, W, 26 * mm, fill=1, stroke=0)
    c.setFillColor(HexColor('#FFFFFF')); c.setFont('Helvetica-Bold', 22)
    c.drawString(18 * mm, H - 17 * mm, 'DISSENT')
    c.setFont('Courier', 8); c.setFillColor(HexColor('#C8CBDA'))
    c.drawRightString(W - 18 * mm, H - 16 * mm,
                      f'FILED {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")} UTC')
    y = H - 40 * mm
    c.setFillColor(NAVY); c.setFont('Helvetica-Bold', 15)
    c.drawString(18 * mm, y, (carries or 'Structure')[:60])
    y -= 6 * mm
    c.setFont('Helvetica', 10); c.setFillColor(GREY)
    c.drawString(18 * mm, y, f'over {crosses or "—"}    |    {state.upper()} structure {sid}')
    y -= 14 * mm
    gap = recorded - (physics + Q90)
    for label, val, col in [('THE RECORD SAYS', str(recorded), NAVY),
                            ('PHYSICS SAYS', f'{physics:.1f}', CRIM if gap > 0 else NAVY)]:
        c.setFillColor(col); c.rect(18 * mm if label.startswith('THE') else 62 * mm,
                                    y - 16 * mm, 38 * mm, 20 * mm, fill=1, stroke=0)
        x0 = (18 if label.startswith('THE') else 62) * mm
        c.setFillColor(HexColor('#FFFFFF')); c.setFont('Courier', 7)
        c.drawString(x0 + 4 * mm, y - 1 * mm, label)
        c.setFont('Helvetica-Bold', 24)
        c.drawString(x0 + 4 * mm, y - 12 * mm, val)
    y -= 30 * mm
    c.setFillColor(HexColor('#20263E')); c.setFont('Helvetica', 11)
    verdict_txt = (f'The official record is {gap:.1f} rating steps more optimistic than the '
                   f'calibrated evidence supports.' if gap > 0 else
                   'The record sits inside the calibrated physics interval. No state dissent on file.')
    for i, line in enumerate([verdict_txt[i:i + 92] for i in range(0, len(verdict_txt), 92)]):
        c.drawString(18 * mm, y - i * 5.5 * mm, line)
    y -= 24 * mm
    c.setFillColor(GREY); c.setFont('Courier', 8)
    for i, line in enumerate([
        f'PHYSICS INTERVAL  {max(physics - Q90, 0):.1f} TO {min(physics + Q90, 9):.1f}  (CONFORMAL, +/-{Q90})',
        f'MODEL FROZEN AT {META["train_end"]}   CALIBRATED {META["calib"]}   {META["trained_rows"]:,} TRAINING ROWS',
        'SOURCE: FHWA NATIONAL BRIDGE INVENTORY + OPEN-METEO REANALYSIS',
        'GENERATED BY THE DISSENT API. OBLIGATION ROUTES TO THE DISTRICT ENGINEER.']):
        c.drawString(18 * mm, y - i * 5 * mm, line)
    c.setFillColor(CRIM); c.rect(18 * mm, 18 * mm, W - 36 * mm, 1.2 * mm, fill=1, stroke=0)
    c.setFillColor(GREY); c.setFont('Courier', 7)
    c.drawString(18 * mm, 12 * mm, 'TEAM NEXUS NETWORK  |  DEPARTMENT OF CSE (CYBER SECURITY)')
    c.showPage(); c.save()
    buf.seek(0)
    return StreamingResponse(buf, media_type='application/pdf', headers={
        'Content-Disposition': f'inline; filename="dissent-{state.upper()}-{sid}.pdf"'})

@app.get('/')
def root():
    return JSONResponse(dict(
        service='DISSENT API', frontend='https://dissent-nexus.netlify.app',
        endpoints=['/api/health', '/api/score (POST)', '/api/audit/{state}',
                   '/api/verify (POST)', '/api/ledger', '/api/dossier/{state}/{sid}.pdf'],
        docs='/docs'))

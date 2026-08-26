# DISSENT — the machine second opinion

**Team NEXUS NETWORK | Department of Computer Science and Engineering (Cyber Security)**
AI Innovation Challenge 2026, Battle of Intelligence, Round 3: AI Evolution.

**Live deployment: https://dissent-nexus.netlify.app**

The map carries a NATIONAL toggle plotting the entire 2025 federal file:
all 621,137 rated structures in the United States (41,319 poor), packed into a
9.9 MB binary and drawn client-side on a canvas layer: no backend, nothing to
cold-start. The deep audit runs in a four-state fleet (Rhode Island, Vermont, New
Hampshire and Delaware): 234,801 real inspection filings across 9,765 structures,
one pooled model frozen at 2015, per-state dockets with a jurisdiction switcher.

Infrastructure does not fail silently. It fails contradicted. DISSENT maintains two
independent accounts of every bridge in an inventory: the Paper Witness (the official
inspection record) and the Physics Witness (a model that predicts what the condition
rating should be from physical evidence alone, never having seen any inspector's
opinion). A calibrated disagreement between the two is the product.

This repository is the working model promised in our Round 2 report
(`docs/NEXUS_NETWORK_Round2_Solution_Report.pdf`), built on real public data for the
pilot inventory the report proposed, now extended to four states. Rhode Island was the
first target deliberately: the smallest bridge inventory in the country and the
worst-rated one.

## Headline results (all on real, public, held-out data)

- **234,801 real inspection filings** across four states (Rhode Island, Vermont, New
  Hampshire, Delaware), 9,765 structures, 136 annual FHWA National Bridge Inventory
  files, 1992-2025, joined to real ERA5 weather histories.
- The Blind Re-Inspector (physics-only features, never shown an inspector's opinion) reaches
  **MAE 0.7 rating steps** on post-2018 data it never saw, with split-conformal intervals at
  **89.2% empirical coverage** against a 90% target. We report the shortfall rather
  than retune on the test years.
- **1,835 "record forced to catch up" events** mined from the trajectories. The
  **166** that occur after 2018 are pure holdout: the frozen-at-2015 model
  flagged **23% of them inside a top-15% alert
  budget (1.5x chance)**, median lead 3.5 years.
- **Best verified catch: 9 years.** A Vermont structure whose record read 8 while the physics witness
  held 6; in 2025 the inspectors filed a 3. It is Exhibit A in the console, shown beside a case the
  model missed (the Washington Bridge, closed December 2023) because a second opinion is only worth
  what its misses cost.
- The console also plots the **entire 2025 national file: 621,137 rated structures
  (41,319 poor)**, drawn client-side from a 9.9 MB binary with no backend.

## The API (Render)

**https://dissent-api-jgod.onrender.com** — a FastAPI service holding the trained
Blind Re-Inspector (168,864 training rows, conformal q90 1.405), doing the work a
browser cannot:

| Endpoint | What it does |
|---|---|
| `GET /api/health` | model provenance, audits run, outcomes filed |
| `POST /api/score` | live inference on any structure's attributes |
| `GET /api/audit/{state}` | audits **any of 51 US jurisdictions on demand**: pulls that state's live federal file and live weather and scores every structure server-side (Wyoming: 3,138 structures in 3.9s; Montana: 5,235 in 11.5s) |
| `POST /api/verify`, `GET /api/ledger` | the write-back loop from the Round 2 design: field outcomes persist as labels for the next build |
| `GET /api/dossier/{state}/{sid}.pdf` | a real printable case file, rendered server-side |

The audit endpoint is the one that genuinely needs a server: the federal file is
tens of megabytes and its origin sends no cross-origin headers, so no browser can
fetch it. The console's **05 LIVE AUDIT** module drives it, and every API-backed
feature degrades honestly when the free instance is asleep — the pre-computed
four-state docket never depends on the server.

Run it locally: `cd backend && pip install -r requirements.txt && uvicorn app:app --reload`

## Repository layout

```
pipeline/00_download.sh   fetch the 34 raw FHWA NBI files for Rhode Island
pipeline/01_ledger.py     parse the panel, build trajectories, mine proxy events
pipeline/02_weather.py    real weather stressors from the Open-Meteo (ERA5) archive
backend/app.py           the API: live inference, on-demand state audits, the
                          verification ledger, server-rendered PDF case files
backend/export_model.py  persists the trained model for the API to serve
pipeline/05_exhibit.py   composes Exhibit A: one verified catch, one honest miss
pipeline/03_model.py      Blind Re-Inspector + conformal calibration + BOCPD +
                          dissent scoring + docket + validation + JSON exports
site/                     the deployed app (no frameworks, no build step)
site/data/                model artifacts consumed by the app
docs/                     the Round 2 solution report this build delivers on
```

## Reproduce

```
python3 -m venv venv && ./venv/bin/pip install pandas scikit-learn pyarrow
bash pipeline/00_download.sh
./venv/bin/python pipeline/01_ledger.py
./venv/bin/python pipeline/02_weather.py
./venv/bin/python pipeline/03_model.py
python3 -m http.server 8000 -d site
```

Training uses only records through 2015; calibration 2016-2018; everything after
is evaluation. No external model APIs, no installed hardware, every input free
and public.

## Interface

The deployed docket is a zero-framework single-page app: a live Leaflet map of all
965 structures (basemap OpenStreetMap contributors / CARTO; Rhode Island boundary
from US Census cartographic files, public domain), per-asset dossiers with
trajectory charts and conformal bands, a live in-browser BOCPD replay of the
Morandi precursor series, and per-row 34-year sparklines. Illustrations were
generated with the team's ChatGPT account for this project; fonts are IBM Plex and
Space Grotesk (Google Fonts).

## The World module

A fifth console view plots the documented forensic record the method is built on:
eight real collapses across four continents (Genoa, Minneapolis, Miami, Surfside,
Morbi, Dresden, Mexico City, Yilan), each with the weak signal that existed, the
lead time it offered, and why nothing happened — every case documented by an
official investigation or peer-reviewed study. Rhode Island is marked as the live
pilot. No invented data: countries without open per-asset inspection histories get
case files, not fabricated inventories.

## Honest limits

Several missed holdout events are administrative closures (bypassed or replaced
structures) that condition physics cannot see. The satellite InSAR channel of the
full Round 2 design is not in this pilot (no free processed InSAR covers Rhode
Island); the Morandi page demonstrates that channel's detector on the published
record instead. NBI ratings are coarse, inspector-subjective labels, which is the
entire reason a second opinion is worth building.

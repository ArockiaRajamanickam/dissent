# DISSENT — the machine second opinion

**Team NEXUS NETWORK | Department of Computer Science and Engineering (Cyber Security)**
AI Innovation Challenge 2026, Battle of Intelligence, Round 3: AI Evolution.

**Live deployment: https://dissent-nexus.netlify.app**

Infrastructure does not fail silently. It fails contradicted. DISSENT maintains two
independent accounts of every bridge in an inventory: the Paper Witness (the official
inspection record) and the Physics Witness (a model that predicts what the condition
rating should be from physical evidence alone, never having seen any inspector's
opinion). A calibrated disagreement between the two is the product.

This repository is the working model promised in our Round 2 report
(`docs/NEXUS_NETWORK_Round2_Solution_Report.pdf`), built on real public data for the
pilot inventory the report proposed: one full US state. We chose Rhode Island
deliberately: the smallest bridge inventory in the country and the worst-rated one,
including the Washington Bridge, whose westbound span was emergency-closed in
December 2023.

## Headline results (all on real, public, held-out data)

- 25,813 real inspection records, 965 open structures, 34 annual FHWA National
  Bridge Inventory files (1992-2025), parsed end to end.
- The Blind Re-Inspector (gradient boosting over physics-only features: age, works
  history, traffic, structural form, and real ERA5 weather stressors) reaches
  **MAE 0.68 rating steps** on post-2018 data it never saw, with split-conformal
  intervals at **87% empirical coverage** (90% nominal; the gap is distribution
  shift, reported rather than retuned away).
- 281 "record forced to catch up" events mined from the trajectories; the 14 that
  occur after 2018 form a pure holdout. The frozen-at-2015 model flags **36% of
  them inside a top-15% alert budget (2.4x random)**, median lead 3 years.
- **The Washington Bridge was inside the docket's top budget band every year from
  2018 onward: six years of lead time** before the December 2023 emergency closure,
  while the official record held a flat rating of 4 the entire time.
- The trend channel is a from-scratch Adams-MacKay Bayesian online changepoint
  detector; the deployed site runs the same algorithm live in the browser over the
  published Morandi Bridge precursor series (Milillo et al. 2019, contested by
  Lanari et al. 2020, and the page says so).

## Repository layout

```
pipeline/00_download.sh   fetch the 34 raw FHWA NBI files for Rhode Island
pipeline/01_ledger.py     parse the panel, build trajectories, mine proxy events
pipeline/02_weather.py    real weather stressors from the Open-Meteo (ERA5) archive
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

## Honest limits

Several missed holdout events are administrative closures (bypassed or replaced
structures) that condition physics cannot see. The satellite InSAR channel of the
full Round 2 design is not in this pilot (no free processed InSAR covers Rhode
Island); the Morandi page demonstrates that channel's detector on the published
record instead. NBI ratings are coarse, inspector-subjective labels, which is the
entire reason a second opinion is worth building.

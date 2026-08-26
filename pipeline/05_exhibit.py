#!/usr/bin/env python3
"""Compose the console's Exhibit A from shipped artifacts: one verified catch
and one honest miss. Reads only site/data/*.json, writes site/data/exhibit.json."""
import json, os
D = os.path.join(os.path.dirname(__file__), '..', 'site', 'data')
rd = lambda f: json.load(open(os.path.join(D, f)))
S = rd('summary_RI.json')

# ---- the catch: the flagged event with the longest verified lead ----
best = None
for st in S['states']:
    for e in rd(f'events_{st}.json')['events']:
        if e['flagged'] and e.get('lead_years'):
            key = (e['lead_years'], (e['from_rating'] - e['to_rating']) if e['kind'] == 'drop' else 0)
            if best is None or key > best[0]:
                best = (key, st, e)
(_, cst, cev) = best
casset = next(a for a in rd(f'assets_{cst}.json') if a['sid'] == cev['sid'])
q = S['q90']
catch_years = [t for t in casset['traj'] if t[1] is not None and t[2] is not None]
catch = dict(
    state=cst, state_name=S['state_names'][cst], sid=cev['sid'],
    carries=casset['carries'], crosses=casset['crosses'],
    built=casset['built'], adt=casset['adt'], material=casset['material'],
    lead=cev['lead_years'], event_year=cev['year'], kind=cev['kind'],
    from_rating=cev['from_rating'], to_rating=cev['to_rating'],
    traj=casset['traj'], cps=casset['cps'],
    # years where the record stood above the physics upper bound
    dissent_years=[[t[0], t[1], round(t[2], 2), round(t[2] + q, 2)]
                   for t in catch_years if t[1] > t[2] + q],
)

# ---- the miss: the Washington Bridge, stated plainly ----
wb = rd('events_RI.json').get('washington')
miss = None
if wb:
    miss = dict(sid=wb['sid'], traj=wb['traj'], cps=wb['cps'],
                by_year=wb['dissent_by_year'],
                closed_year=2024, closure='11 December 2023')

json.dump(dict(catch=catch, miss=miss, q90=q, train_end=S['train_end'],
               budget=S['budget_frac'], recall=S['event_recall'],
               n_test=S['n_events_test'],
               n_flagged=round(S['event_recall'] * S['n_events_test'])),
          open(os.path.join(D, 'exhibit.json'), 'w'))
print(f"catch: {cst} {cev['sid']} lead {cev['lead_years']}y, "
      f"{len(catch['dissent_years'])} dissent years; miss: {'yes' if miss else 'none'}")

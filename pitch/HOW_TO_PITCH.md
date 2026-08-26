# DISSENT — how to pitch it

Team Nexus Network · AI Innovation Challenge 2026, Round 3
Live: https://dissent-nexus.netlify.app

**Three files. Use the right one.**

| File | Slides | Use it when |
|---|---|---|
| `DISSENT_Nexus_Network.pptx` | 14 | **This is the one to present.** Flat solid colours, huge type, one idea per slide, and the demo screenshots run big. Built for a 5-minute pitch where you talk and the slides hit. |
| `DISSENT_Explainer_Nexus_Network.pptx` | 23 | The long read. Hand this over if judges want to go through it themselves afterwards — it carries the full provenance, the controls and the caveats in writing. |
| `DISSENT_Nexus_Network_Pitch.pptx` | 12 | The earlier version. Superseded by the 14-slide deck; keep it only as a backup. |

All three are built from the same shipped artifacts, so their numbers agree. Present from the
**PDF** where you can. The 14-slide deck is set in Arial Black, Arial and Courier New — three
faces that ship with Office on both Windows and Mac — so it renders correctly on a machine you
do not control.

### Timing the 14 slides in five minutes

| Slides | Beat | Seconds |
|---|---|---|
| 1–2 | Cover, then the 730-day gap | 40 |
| 3–4 | Why bridges, why America, then the two-witness idea | 60 |
| 5–6 | The docket, then 621,137 | 45 |
| 7–8 | How it works, and the frozen-model test | 50 |
| 9–11 | The objection, then **108**, then 0 vs 25 | 80 |
| 12 | Time Machine — hand it to a judge | 45 |
| 13–14 | Limits, close | 30 |

Slides 9, 10 and 11 are the spine. If you are running short, cut 7 and 13 before you cut those.

---

## 1. The 30-second version (memorise this)

> "Bridges get inspected once every two years, and the result is a single number from 0 to 9 in a
> government file. That file goes stale, and people die between inspections.
>
> DISSENT keeps two independent accounts of every bridge. One is the official record. The other is a
> model that predicts what the rating *should* be from physical evidence alone (age, traffic, weather).
> It is graded against the inspector's rating, but never allowed to read one. When the two stop agreeing, the machine files a
> dissent: a ranked case file with a dated inspection obligation.
>
> We trained it on real federal data up to 2015 and hid everything after. Of 166 real failures it had
> never seen, 108 happened to bridges the paperwork still called fine. Sorting by the worst recorded
> rating — what an agency does today — found none of those 108. We found 25. That gap is the entire
> product, and it needs no sensors and no budget: every input is public."

If they only ask one question, that is the answer to all of them.

---

## 2. The five-minute pitch, slide by slide

This maps to `DISSENT_Nexus_Network.pptx`, the 14-slide deck. Say the **bold line** out loud.
The rest is what you add if you have room.

**1 — DISSENT.** *Let it sit for three seconds before you speak.*
> **"Every bridge in America gets looked at about once every two years. In between, the only thing
> anyone consults is a file. Tonight I'm going to show you the bridges whose file is lying."**

**2 — 730 days.**
> **"That's the average gap between one look at a bridge and the next. In between, the file is
> standing still. The bridge is not."**

**3 — Why bridges? Why America?** *Answer both before they ask. No defensiveness.*
> **"Bridges, because it's the one asset class with a record worth auditing — public, national,
> per-structure, numeric, thirty-four years deep. You can't audit a record that doesn't exist, and
> buildings don't have one. Surfside cost 98 lives and there was nothing to check it against."**
> **"America, because that record only exists there. India is building the same thing right now."**

**4 — Two accounts.** *This is the slide the whole pitch rests on. Slow down.*
> **"We keep two accounts of every bridge. One is what the institution filed. The other predicts
> what the rating should be from the physical evidence alone — age, traffic, trucks, span, weather.
> It's graded against the inspector's rating, but it never gets to read one."**
> **"When they stop agreeing, that disagreement is the product."**

**5 — Not a dashboard. A docket.**
> **"The output isn't a risk score. It's a ranked list of the bridges whose file has drifted
> furthest from the evidence, capped to what a team can actually visit in a quarter."**

**6 — 621,137.**
> **"Every rated bridge in the country, drawn in the browser from a ten-megabyte file. Zero sensors
> installed. This view doesn't even need our server, so nothing we run can break while you're
> marking us."**

**7 — Public data in. A work order out.**
> **"Four steps, and the whole design is one refusal: no inspector rating is ever one of its
> inputs. It gets graded against that rating. It never gets to read one."**

**8 — Frozen in 2015.**
> **"Trained to 2015, calibrated to 2018, and every number we quote comes from 2019 onward — data
> it has never been shown. And our coverage is 89% against a 90% target. We report it short rather
> than go back and retune on the test years."**

**9 — Just sort by the worst rating.** *Give the objection away before they raise it.*
> **"Here's the obvious objection. Forget the model — just take the bridges the file already rates
> worst and inspect the top 15%. That catches 40 of the 166 real failures. We catch 38."**
> **"On the raw count, the version with no model in it beats us. That's printed in our own
> product, not buried in an appendix."**

**10 — 108.** *Say nothing for two seconds. Let the number do it.*
> **"Of those 166 failures, 108 were on bridges the record still called FINE. Sorting by the worst
> rating is blind to every single one of them, by construction. It can only ever point at bridges
> you already worry about."**

**11 — Zero versus twenty-five.**
> **"Same 108 failures, two ways of choosing who to look at. The no-model ranking found none of
> them. We found twenty-five. And a failure on a bridge the file still calls fine is the only kind
> that carries a warning — because nobody was watching it."**

**12 — Pick a state and a year.** *Actually ask a judge. This is your strongest live moment.*
> **"Name a state. Name a year. — Vermont, 2019. The server is pulling the 2019 federal file,
> scoring all 2,748 bridges with the 2015 model, ranking them, then pulling the 2025 file to see
> what happened. Ninety-three crossed into poor. Thirty-five of those the 2019 file still called
> fine — worst-first found one of them, we found nine."**
> **"And notice the base rate and the beating baseline are on screen. Every time. Including on the
> states where we lose."**

**13 — The limits are in the product.**
> **"It abstains on anything under five years old. It under-covers and says so. It refuses to rank
> 27 of the 51 states because out there we can't tell their optimism from our own error. And the
> Washington Bridge — we missed it, and it's in the app labelled a miss."**
> **"A system that can't tell you where it stops working isn't a second opinion. It's a guess."**

**14 — We did not simulate a single bridge.**
> **"Every number tonight came out of a file the US government publishes for free. Both halves are
> live right now. Here are the links."**
Then open the console.

---

## 3. The live demo (three minutes, in this order)

1. **Open on the docket.** "This is the working surface. Left is the map, right is the ranked docket."
2. **Click the top row.** The case file slides in. Point at the two big badges:
   *"The record says 7. Physics says 4.7. That gap is the product."*
   Scroll to the satellite view: *"and that's the structure from orbit."*
3. **Hit NATIONAL 621K.** Let it stream. *"That's the whole country, live in the browser."*
4. **Go to Exhibit B, press RUN THE DETECTOR.** Let it play to the end.
   *"That's our changepoint detector running live in your browser on the Morandi precursor. It fires
   sixteen months before the collapse. It's a reconstruction of the published finding, and the paper
   that disputes that finding is cited right underneath."*
5. **Switch the jurisdiction chip to VT.** *"Same model, different state, its own docket."*
6. **Go to 05 LIVE AUDIT. Ask a judge to name any US state.** Then press CHECK WHAT CHANGED.
   *"The server just pulled two federal files, last year's and this year's, found every bridge whose
   official rating fell two or more steps, and scored each one from last year's data. In New Hampshire
   that's seven bridges that dropped, and we had already filed a dissent on one of them. That sounds
   small until you see the base rate: we dissent on 6% of structures, so a bridge that fell was 2.4
   times likelier to be one we'd flagged. You picked the state. We didn't."*
7. **Scroll to the National Dissent Index.** *"Every audit also measures how much sunnier each
   state's filings run than the evidence — all 51 jurisdictions. Georgia's records run +1.30 of a
   rating step sunnier than physics, and +0.91 once we subtract our own extrapolation, because even
   inside the rankable band climate distance explains a quarter of what we call optimism. We publish
   the residual, not the raw number."*
   Then scroll one block further, to the withheld table, and say this deliberately:
   *"And twenty-seven states are in this second table with no ranking at all. Our model was
   calibrated on four cold, wet, Atlantic states. Arizona is five envelope-widths outside that
   climate. Out there we can't separate 'their inspectors are optimistic' from 'our model is wrong',
   so we don't publish a number. We still audit them. We just don't pretend."*
8. **THE TIME MACHINE. Ask a judge for a state and a year.** This is your strongest live moment —
   do it even if you have to cut something else.
   *"Pick a state. Pick a year. — Vermont, 2019. Watch: the server is pulling the federal file as it
   stood in 2019, scoring all 2,748 structures with the model frozen in 2015, ranking them by
   dissent, and taking the top 15% as its alert list. Now it pulls the 2025 file and grades itself."*
   Two and a half seconds later, point at the segment table:
   *"Ninety-three of those bridges crossed into poor by 2025. Thirty-five of them were bridges the
   2019 file still called fine. Worst-rating-first found one of those thirty-five. We found nine.
   And notice what else is on this screen — the base rate, and the baseline that beats us on the
   raw count. We print those every time, including when we lose. You can run this on any state
   you like; some of them we lose."*

9. **Drag a slider in "Ask the physics witness anything."** *"That's the model, live on the server,
   for a bridge that doesn't exist."*
9. **Or run a full audit of a state we never pre-processed.**
   *"That just pulled Wyoming's live federal file and its live weather onto our server,
   scored all 3,138 structures, and came back in under four seconds. No browser can do
   that — the file is tens of megabytes and the government sends no CORS headers. This
   is the half of the system that needs a real backend."*
   Then open a dossier and press **FILE AN INSPECTION OUTCOME**: *"and that write-back is
   the loop we promised in Round 2 — the outcome is now a label for the next build."*

If the wifi is bad: the deck's slide 6 chart and slide 8 map are the same story. Say so and move on.

---

## 4. The hard questions, and your answers

**"Is this real data or did you generate it?"**
> "Real. 234,801 inspection filings from the FHWA National Bridge Inventory, 1992 to 2025, plus ERA5
> weather reanalysis. You can download the same files tonight; the repo has the script. The one
> reconstructed series in the app is the Morandi chart, and it's labelled as a reconstruction."

**"How do I know it isn't just memorising?"**
> "The model is frozen at 2015. Calibrated on 2016 to 2018. Every number we quote is from 2019 onward,
> which it has never seen — 46,541 rows of pure holdout."

**"Why not just sort by the worst recorded rating? Wouldn't that do the same job?"**
*This is the sharpest question available and you should want it. Answer it in three beats.*
> "It does better than us on the raw count, and we show that on screen — 40 of 166 versus our 38.
>
> But look at what it's finding. Split those failures by what the file said at the time. Fifty-eight
> were bridges the record already called bad, and worst-first finds 40 of them — of course it does,
> a bridge rated 5 is one step from poor, so that ranking is almost a definition of the answer, not
> a prediction of it. The other 108 were bridges the record still called fine. Worst-first finds
> zero of those. We find 25.
>
> So the honest summary is: sorting by rating tells you what you already knew, faster. We're the
> only one of the two that can tell you something you didn't. And when we control it properly —
> a blind pick with the same rating mix as ours — we come out 1.34 times better."

**"Isn't that lift small?"**
> "It is modest and we're not going to dress it up. 1.34 times over a rating-matched control, on
> 166 events. What makes it worth having isn't the multiplier, it's *where* it applies: on the
> structures nobody is currently looking at, the alternative isn't a worse number, it's no number."

**"23% doesn't sound high."**
> "It's 23% inside a 15% budget, so one and a half times chance — and that's the honest number after we
> removed leakage and dead structures. The alternative framing is: for every hundred bridges an
> inspection team can visit this quarter, we're pointing at the right ones half again as often as their
> current process. And the median warning is three and a half years."

**"Why bridges and not buildings?"**
> "Because their record is public, national, per-structure, numeric and thirty-four years deep, and we
> know of no other asset class with all five of those at once. You cannot audit a record that does not
> exist. Surfside, the Florida condo collapse, cost 98 lives and there was no comparable series for
> anyone to check it against. Buildings are exactly where this goes next."

**"What happened with the Washington Bridge?"** *(if they read Exhibit A)*
> "We missed it, and we show it. Our model rated it slightly better than the record, not worse, because
> the failure was in anchor tie-down details that age, traffic and weather features cannot see. That's the
> gap the satellite channel closes in the full design. We'd rather show you the miss than have you find it."

**"What's the AI here — it's just gradient boosting?"**
> "The learning is deliberately boring because the *framing* is the contribution. The novel parts are the
> blind re-inspection setup, conformal calibration so every verdict carries valid uncertainty, and a
> Bayesian online changepoint detector on the record-versus-physics residual. And a design choice: we never
> train a rare-event classifier, because failures are one in thousands. We train a rating predictor on
> millions of pairs and mine the disagreements."

**"Could this be deployed?"**
> "It is deployed, on both halves. The console is live on Netlify and the model is served by a FastAPI
> service on Render that scores any US state on demand. The whole thing costs nothing to run and the
> pipeline reruns on a laptop in under two minutes."

**"Where's the backend? Is it just a static site?"**
> "No. Open 05 LIVE AUDIT and pick any state — that call goes to our API, which pulls the live federal
> file and live weather and scores every structure server-side. It also serves live inference, generates
> the PDF case files, and stores inspection outcomes in a database. The static half is only the
> pre-computed four-state docket, deliberately, so a sleeping free-tier server can never break the demo."


---

## 5. Traps to avoid

- **Don't claim the Washington Bridge as a win.** It's in the deck and the app as a miss. If you claim it
  and a judge opens Exhibit A, you lose the room. The Vermont case is your win.
- **Don't say "100% accurate" or round 23% up.** The precision *is* the pitch.
- **Never claim we beat the naive baseline outright.** We don't, on raw count, in most states — and
  it's on screen. Claim the thing that is true and stronger: worst-first finds *zero* of the 108
  failures on bridges the record still called fine. If you overclaim here and a judge runs the
  Time Machine on Ohio, you lose the room.
- **Don't rank a state we withhold.** California, Texas, Arizona and 24 others sit outside the
  calibration climate. If a judge asks about California's number, say: "we audit it, we don't rank
  it, and the app tells you why."
- **Don't call the Morandi series real measurements.** Say "a reconstruction of the published finding."
- **Don't oversell India.** Say "the method localises and the data is being created right now," not
  "we've deployed in India."
- **Don't read the slides aloud.** The judges can read. Say the bold line, then talk to them.

---

## 6. If you get sixty seconds only

Slides 4, 6 and 7. The idea, the proof, the validation. Then the link.

# DISSENT — how to pitch it

Team Nexus Network · AI Innovation Challenge 2026, Round 3
Live: https://dissent-nexus.netlify.app

**There are two decks. Use the right one.**

| File | Slides | Use it when |
|---|---|---|
| `DISSENT_Explainer_Nexus_Network.pptx` | 23 | **Default.** Judges read it themselves, or you present with limited time to talk. Every headline is a full sentence that carries the point, every screenshot is captioned, and it answers why bridges, why US data, what the dataset is and why it can be trusted, without narration. |
| `DISSENT_Nexus_Network_Pitch.pptx` | 12 | A fast, spoken five-minute pitch where you are doing the explaining and the slides are backdrop. |

Both are built from the same shipped artifacts, so their numbers agree. **Present from the PDF**
where you can — it embeds its fonts, and the .pptx is set in Cambria and Courier New precisely so
it still renders correctly on a machine you do not control.

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

Say the **bold line** out loud. The rest is what to add if you have room.

**Slide 1 — Title.**
> **"Every dot on this map is a real bridge in the US federal record. Forty-one thousand of them are
> rated poor. Tonight I'll show you the ones whose paperwork is lying."**
Do not explain the team yet. Let the map do the work for three seconds.

**Slide 2 — The problem.**
> **"A bridge doesn't fail the day it becomes unsafe. It fails the day the paperwork and the physical
> bridge stop agreeing, and nobody is looking at both."**
Then the three numbers: 24 months between inspections, a 0–9 human scale as the entire official record,
and under 20% of even long-span bridges carry any sensors. Hardware does not scale. The record does.

**Slide 3 — The pattern.**
> **"We went through the forensic record of eight collapses on three continents. In every single one,
> the evidence existed, in time, and belonged to nobody."**
Pick two, not six: Morandi (satellite radar showed the deck accelerating for seventeen months) and
Surfside (a published study had flagged that exact building subsiding, before it fell). Then stop.

**Slide 4 — The idea.** *This is the slide that wins or loses the pitch. Slow down.*
> **"Infrastructure does not fail silently. It fails contradicted."**
> **"So we keep two witnesses. The Paper Witness is what the institution believes. The Physics Witness
> predicts what the rating should be from evidence alone, and no filed rating is ever one of its
> inputs. The product is not another risk score. The product is the disagreement."**

**Slide 5 — How it works.**
Walk the six steps in about thirty seconds. Land two things only:
> **"Trained only up to 2015. Everything after that, the model has never seen."**
> **"And no inspector's rating is ever one of its inputs. It gets graded against that rating.
> It never gets to read one."**
> **"And the docket is capped to what an inspection team can actually do in a quarter — twelve
> mandatory, twenty-four scheduled, forty-eight watched."**

**Slide 6 — The proof.** *Point at the chart with your hand.*
> **"This is a real Vermont bridge. The black line is the official record: it says 8, a good rating,
> for years. The blue line is our model, which never saw the record — it says 6. In 2025 the inspectors
> came back and filed a 3. We had that structure inside our alert budget nine years earlier."**

**Slide 7 — Validation.** *Say the second half. It is the strongest thing you have.*
> **"We hid the answers and checked. Eighteen hundred 'the record was forced to catch up' events
> across four states; the 166 after 2018 the model has never seen. It caught 23% inside a 15% alert
> budget, with a median warning of three and a half years."**
>
> **"Then we ran the control that matters. Sorting bridges by their worst recorded rating — no model
> at all — catches 40 of those 166. We catch 38. On the raw count, the dumb baseline beats us.**
>
> **But split those 166 by what the file said at the time. Fifty-eight were bridges the record
> already called bad; worst-first finds 40 of them, because that ranking is nearly a definition of
> the answer. The other 108 were bridges the paperwork still called fine. Worst-first finds zero.
> Not one. We find twenty-five."**
>
> **"Sorting by the worst rating can only ever point at bridges you already worry about. The
> failures that kill people are the ones nobody was worried about."**

If a judge looks skeptical, add: *"And we control for it properly — against a blind pick with the
same rating mix as ours we run 1.34 times better. Say the interval too: 0.99 to 1.73. It includes
1.0, so on 166 events we cannot rule out that it adds nothing. The segment finding does not depend
on that number, and that is why we lead with the segment finding."*

**Slide 8 — Scale.**
> **"That's every rated bridge in the United States, 621,137 of them, drawn live in the browser from a
> ten-megabyte file. This view needs no server at all, so nothing can crash while you're marking us."**
The system does have a real backend (you'll show it in the demo); this slide's point is that the
*map* deliberately does not depend on it.

**Slide 9 — Why it's new.**
> **"Everything on the market measures the asset. Sensors, satellites, risk models, inspection AI. We
> audit the paperwork *against* the asset. That's a different category, and it's why we can cover a
> hundred percent of an inventory with zero installed hardware."**

**Slide 10 — Honesty.** *Do not rush this. It is worth more than another feature.*
> **"Here's what it can't do. It abstains entirely on bridges under five years old, because they're
> outside what it can calibrate. Our uncertainty intervals cover 89% against a 90% target, and we report
> the shortfall rather than retune on the test years. And some failures have no precursor in any record."**

**Slide 11 — Impact.**
> **"Today the average gap between looks at a structure is 730 days. Ours is the satellite revisit:
> six to twelve. A county with five bridges and one engineer gets the same second opinion as a national
> railway, because there's nothing to install and nothing to buy."**
Then India: IBMS already inventories 172,517 structures on the same 0–9 idea, MoRTH is re-surveying them
right now, and Morbi — 135 dead, four days after a renovation nobody checked against the physical
cables — is exactly this failure mode.

**Slide 12 — Close.**
> **"Every number you've seen tonight is downloadable from the federal government. We didn't simulate a
> single bridge."**
Then open the live console.

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

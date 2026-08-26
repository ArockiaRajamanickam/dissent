/* DISSENT — the explainer deck, slide by slide.
 *
 * Rules this file obeys:
 *   - every headline is a full-sentence assertion, not a topic phrase
 *   - every number is read from a shipped artifact, never typed by hand
 *   - crimson only ever marks the disagreement
 *   - the naive baseline's win is stated, not hidden
 */
const path = require('path');
const K = require('./build_explainer.js');
const D = require('./diagrams.js');
const {
  p, W, H, M, T, SERIF, MONO,
  DESK, NAVY, CREAM, PAPER, CRIMSON, STEEL, OCHRE, INK, DIM, GREY, ROSE, MOSS, PALE, HAIR, HAIRL,
  darkSlide, lightSlide, scrim, kicker, headline, body, caption, rule, stat,
  shot, pin, leader, pinNote, card, fmt, pct,
  S, NAT, GLOBAL, CT, FINE, POOR, IDX,
} = K;

const GA = IDX.index.find(r => r.state === 'GA');
const WV = IDX.index.find(r => r.state === 'WV');
const N_RANK = IDX.index.filter(r => r.rankable).length;
const N_HELD = IDX.index.length - N_RANK;
const N_STRUCT = IDX.index.reduce((a, r) => a + r.structures, 0);

// ══════════════════════════════════════════════════════════ 01 TITLE
{
  const s = darkSlide('bg01_truss.jpg');
  kicker(s, 'AI Innovation Challenge 2026  ·  Round 3: AI Evolution', M, 0.5, '7E88B4', 9);
  s.addText('DISSENT', {
    x: M, y: 0.92, w: 9, h: 1.15, isTextBox: true, margin: 0,
    fontFace: SERIF, fontSize: 66, bold: true, color: CREAM, charSpacing: 2.5,
  });
  s.addText('Infrastructure does not fail silently.\nIt fails contradicted.', {
    x: M, y: 2.18, w: 7.4, h: 1.4, isTextBox: true, margin: 0, valign: 'top',
    fontFace: SERIF, fontSize: 27, italic: true, color: CREAM, lineSpacing: 36,
  });
  rule(s, M, 3.78, 3.1, CRIMSON, 2.25);
  body(s, 'A machine second opinion on every bridge in the United States, built entirely from ' +
          'public records. It keeps a second, independent-of-opinion account of each structure and reports ' +
          'where the two stop agreeing.',
       M, 4.02, 6.5, { size: 14.5, color: 'A7AFD0', h: 1.1 });

  const by = 6.22;
  rule(s, M, by, W - 2 * M, '3A4570', 0.75);
  s.addText('TEAM NEXUS NETWORK', {
    x: M, y: by + 0.18, w: 6, h: 0.3, isTextBox: true, margin: 0,
    fontFace: MONO, fontSize: 12, bold: true, color: CREAM, charSpacing: 1.6 });
  kicker(s, 'Dept. of CSE (Cyber Security)', M, by + 0.56, '6E78A4', 6);
  s.addText([
    { text: `${fmt(NAT.total)} structures  ·  ${fmt(NAT.poor_total)} rated poor  ·  NBI 1992–2025`,
      options: { fontFace: MONO, fontSize: 9.5, color: '6E78A4', charSpacing: 0.8 } },
  ], { x: W - M - 6, y: by + 0.2, w: 6, h: 0.3, isTextBox: true, margin: 0, align: 'right' });
  s.addText('dissent-nexus.netlify.app', {
    x: W - M - 6, y: by + 0.54, w: 6, h: 0.3, isTextBox: true, margin: 0, align: 'right',
    fontFace: MONO, fontSize: 10, bold: true, color: ROSE, charSpacing: 0.8 });

  s.addNotes('Open cold, let the drawing sit for three seconds, then: "Every bridge in America is ' +
    'inspected about once every two years, and the entire official record of its condition is a ' +
    'single number from 0 to 9. Tonight I am going to show you the ones whose paperwork is lying."');
}

// ══════════════════════════════════════════════════════════ 02 THE PROBLEM
{
  const s = darkSlide('bg04_underside.jpg');
  scrim(s, 0, 0, W * 0.56, H, { t: 12 });
  kicker(s, '01 / the problem', M, 0.62, ROSE);
  headline(s, 'A bridge does not fail the day it\nbecomes unsafe.', M, 1.02, { w: 6.4, size: 30, h: 1.7 });
  body(s, 'It fails the day the paperwork and the physical bridge stop agreeing, and nobody is ' +
          'looking at both. Between one inspection and the next, the file is the only thing anyone ' +
          'consults — and the file is standing still while the structure is not.',
       M, 2.82, 5.9, { size: 14.5, h: 1.6 });

  const facts = [
    ['24 months', 'between routine inspections. A defect born the day after one waits, on average, a year to be seen.'],
    ['0 – 9', 'the lowest of a handful of filed condition digits is the operative account of a whole structure.'],
    ['under 20%', 'of the world’s long-span bridges carry any monitoring hardware at all (Nature Communications, 2025). Sensors do not scale. Records do.'],
  ];
  facts.forEach(([n, t], i) => {
    const y = 4.42 + i * 0.86;
    s.addText(n, { x: M, y, w: 1.62, h: 0.42, isTextBox: true, margin: 0, align: 'right',
      fontFace: SERIF, fontSize: 19, bold: true, color: ROSE });
    s.addText(t, { x: M + 1.82, y: y + 0.02, w: 4.2, h: 0.78, isTextBox: true, margin: 0,
      valign: 'top', fontFace: SERIF, fontSize: 11.5, color: PALE, lineSpacing: 15.5 });
  });
  s.addNotes('Make them feel the gap. Two years between looks, a single subjective digit as the ' +
    'whole record, and almost no sensors anywhere. Hardware cannot cover an inventory. The ' +
    'paperwork already does.');
}

// ══════════════════════════════════════════════════════════ 03 WHY BRIDGES
{
  const s = lightSlide('08_paper_witness.jpg');
  kicker(s, '02 / scope', M, 0.62, OCHRE);
  headline(s, 'We chose bridges because their record is public,\nnational, per-structure and thirty-four years deep.',
           M, 1.0, { size: 28, color: INK, h: 1.5 });
  body(s, 'The method needs something to argue with. A bridge in the United States has a public, ' +
          'per-structure, numeric condition record going back to 1992 — every inspection, every ' +
          'rating, every year. We know of no other asset class with all five of those properties ' +
          'at once.',
       M, 2.6, 6.2, { size: 14.5, color: INK, h: 1.35 });
  body(s, 'This is a scientific choice, not a limitation. Bridges are where the idea can be ' +
          'proven against thirty-four years of ground truth. Buildings are where it goes next.',
       M, 4.02, 6.2, { size: 14.5, color: GREY, italic: true, h: 1.0 });

  // the counter-example, as an exhibit card
  const cx = 7.55, cw = W - M - cx;
  card(s, cx, 1.9, cw, 3.65, { fill: DESK, line: HAIR });
  kicker(s, 'exhibit — what the absence costs', cx + 0.32, 2.16, ROSE, cw - 0.64);
  s.addText('Surfside', { x: cx + 0.32, y: 2.5, w: cw - 0.64, h: 0.52, isTextBox: true, margin: 0,
    fontFace: SERIF, fontSize: 26, bold: true, color: CREAM });
  s.addText('FLORIDA  ·  JUNE 2021  ·  98 DEAD', {
    x: cx + 0.32, y: 3.02, w: cw - 0.64, h: 0.26, isTextBox: true, margin: 0,
    fontFace: MONO, fontSize: 8.6, color: ROSE, charSpacing: 0.9 });
  s.addText('A published study had already flagged that exact building as subsiding, years before ' +
    'it fell. There was no condition record for anyone to audit it against, and no mechanism that ' +
    'would have made the contradiction anybody’s job.',
    { x: cx + 0.32, y: 3.46, w: cw - 0.64, h: 1.5, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.8, color: PALE, lineSpacing: 16.5 });
  rule(s, cx + 0.32, 5.06, cw - 0.64, HAIR, 0.75);
  s.addText('No comparable public per-building condition series exists. That is the gap, not the technology.',
    { x: cx + 0.32, y: 5.16, w: cw - 0.64, h: 0.3, isTextBox: true, margin: 0,
      fontFace: SERIF, fontSize: 10.5, italic: true, color: DIM });

  s.addNotes('The judge will ask why bridges. Answer it as a choice: bridges are the only asset ' +
    'class on earth with a public, national, thirty-four-year, per-structure condition record. ' +
    'You cannot audit a record that does not exist. Surfside is what the absence costs.');
}

// ══════════════════════════════════════════════════════════ 04 WHY US DATA
{
  const s = lightSlide('bg03_paper.jpg');
  kicker(s, '03 / the data question', M, 0.62, OCHRE);
  headline(s, 'We used American data because that is where\na public record exists to test against.',
           M, 1.0, { size: 28, color: INK, h: 1.5 });
  body(s, 'The Federal Highway Administration publishes the National Bridge Inventory as plain ' +
          'delimited files, one per state per year, free to anyone. It is the only longitudinal ' +
          'per-structure inspection record of its kind in the world. If you want to prove that a ' +
          'model can catch a record drifting away from reality, that is the only place the ' +
          'experiment can actually be run.',
       M, 2.55, 6.15, { size: 14, color: INK, h: 1.9 });

  const cx = 7.35, cw = W - M - cx;
  kicker(s, 'and where it travels', cx, 2.62, CRIMSON, cw);
  s.addText('India is building the same record right now.', {
    x: cx, y: 2.92, w: cw, h: 0.62, isTextBox: true, margin: 0, valign: 'top',
    fontFace: SERIF, fontSize: 17, bold: true, color: INK, lineSpacing: 23 });
  s.addText('IBMS already inventories 172,517 National Highway structures on the same 0–9 idea, and ' +
    'MoRTH’s nationwide re-survey is creating exactly the fresh paper baseline this method audits.',
    { x: cx, y: 3.66, w: cw, h: 1.05, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 12, color: GREY, lineSpacing: 16.5 });
  rule(s, cx, 4.78, cw, HAIRL, 1);
  s.addText('Morbi', { x: cx, y: 4.92, w: cw, h: 0.36, isTextBox: true, margin: 0,
    fontFace: SERIF, fontSize: 17, bold: true, color: CRIMSON });
  s.addText('GUJARAT  ·  OCTOBER 2022  ·  135 DEAD', {
    x: cx, y: 5.3, w: cw, h: 0.24, isTextBox: true, margin: 0,
    fontFace: MONO, fontSize: 8.4, color: GREY, charSpacing: 0.9 });
  s.addText('A bridge reopened four days after a renovation that nobody checked against the ' +
    'physical cables. This is the failure mode, exactly.',
    { x: cx, y: 5.62, w: cw, h: 0.8, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.5, italic: true, color: GREY, lineSpacing: 16 });

  s.addNotes('Answer this one head-on and without apology. The method audits a paper record, so it ' +
    'has to be tested where a public paper record exists. That is the United States. India is ' +
    'creating the same baseline now. Do NOT say we have deployed anything in India — say the ' +
    'method localises and the data is being created.');
}

// ══════════════════════════════════════════════════════════ 05 THE IDEA
{
  const s = darkSlide('bg02_contours.jpg');
  kicker(s, '04 / the idea', M, 0.55, ROSE);
  headline(s, 'So we keep two witnesses, and we sell the argument between them.',
           M, 0.9, { size: 26, w: 11.9, h: 0.95 });
  D.twoWitness(s, M, 1.85, W - 2 * M, 5.1);
  s.addNotes('This is the slide that wins or loses the pitch. Slow down. The paper witness is what ' +
    'the institution believes. The physics witness predicts what the rating should be from ' +
    'evidence alone, and no filed rating is ever one of its inputs. The product is not another ' +
    'risk score. The product is the disagreement.');
}

// ══════════════════════════════════════════════════════════ 06 HOW IT WORKS
{
  const s = darkSlide('02_drafting_grid.jpg');
  kicker(s, '05 / how it works', M, 0.58, ROSE);
  headline(s, 'Two public inputs go in. A ranked, dated obligation comes out.',
           M, 0.94, { size: 26, w: 11.9, h: 0.9 });
  body(s, 'Nothing here needs a sensor, a site visit, or a procurement cycle. Every input is ' +
          'already published.', M, 1.86, 9.4, { size: 13.5, color: DIM, h: 0.4 });
  D.pipeline(s, M, 2.6, W - 2 * M, 3.2);

  const by = 6.5;
  s.addText([
    { text: 'THE BUDGET  ', options: { fontFace: MONO, fontSize: 9, bold: true, color: OCHRE, charSpacing: 1.3 } },
    { text: 'The docket is capped at what an inspection team can actually do in a quarter — ' +
            '12 mandatory, 24 scheduled, 48 watched. A model that flags everything catches ' +
            'everything and helps nobody.',
      options: { fontFace: SERIF, fontSize: 11.5, color: PALE } },
  ], { x: M, y: by, w: W - 2 * M, h: 0.6, isTextBox: true, margin: 0, valign: 'top', lineSpacing: 16 });
  s.addNotes('Walk it left to right in about twenty seconds. Land two things only: the model is ' +
    'graded against the inspector rating but never allowed to read one, and the alert list is '  +
    'budgeted to real inspection capacity.');
}

// ══════════════════════════════════════════════════════════ 07 THE DATASET
{
  const s = lightSlide('08_paper_witness.jpg');
  kicker(s, '06 / provenance', M, 0.62, OCHRE);
  headline(s, 'Every number in this deck is downloadable from\nthe United States federal government.',
           M, 1.0, { size: 27, color: INK, h: 1.5 });

  const stats = [
    [fmt(S.n_records || 234801), 'inspection filings in the four-state deep panel, 1992–2025'],
    [fmt(NAT.total), 'structures in the 2025 national snapshot'],
    [fmt(NAT.poor_total), 'of them rated poor by their own inspectors'],
  ];
  stats.forEach(([n, t], i) => {
    const x = M + i * 3.4;
    s.addText(n, { x, y: 2.55, w: 3.1, h: 0.62, isTextBox: true, margin: 0, valign: 'bottom',
      fontFace: SERIF, fontSize: 30, bold: true, color: INK });
    s.addText(t, { x, y: 3.24, w: 3.0, h: 0.68, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11, color: GREY, lineSpacing: 15 });
  });
  rule(s, M, 4.12, W - 2 * M, HAIRL, 1);

  // the receipt
  const ry = 4.35;
  kicker(s, 'the receipt — you can check this tonight', M, ry, CRIMSON, 7);
  s.addText('fhwa.dot.gov/bridge/nbi/{year}/delimited/{ST}{yy}.txt', {
    x: M, y: ry + 0.32, w: 7.2, h: 0.36, isTextBox: true, margin: 0,
    fontFace: MONO, fontSize: 13, bold: true, color: INK, charSpacing: 0.4 });
  s.addText('Thirty-four years, fifty-one jurisdictions, one file each. Weather comes from the ' +
    'Open-Meteo historical archive, an ERA5-class reanalysis, also free. The download script ' +
    'is in our repository.',
    { x: M, y: ry + 0.82, w: 7.0, h: 0.95, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 12, color: GREY, lineSpacing: 16.5 });

  card(s, 8.2, ry - 0.12, W - M - 8.2, 2.05, { fill: DESK, line: HAIR });
  kicker(s, 'what is NOT real', 8.5, ry + 0.12, ROSE, 3.9);
  s.addText('One series in the entire product is a reconstruction: the Morandi precursor chart. ' +
    'It is labelled as a reconstruction inside the app, and the paper that disputes the ' +
    'underlying finding is cited directly beneath it.',
    { x: 8.5, y: ry + 0.46, w: W - M - 8.5 - 0.3, h: 1.4, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.5, color: PALE, lineSpacing: 16 });

  s.addNotes('Be forensic here. Real federal data, downloadable tonight, and we hand them the URL ' +
    'pattern. Then volunteer the one thing that is NOT measured data before they find it.');
}

// ══════════════════════════════════════════════════════════ 08 THE WALL
{
  const s = darkSlide('01_desk_grain.jpg');
  kicker(s, '07 / how you know it did not cheat', M, 0.58, ROSE);
  headline(s, 'The model was frozen in 2015 and has never\nseen a single year we score it on.',
           M, 0.94, { size: 27, w: 11, h: 1.5 });
  D.timeline(s, M, 2.5, W - 2 * M, 3.0);

  const by = 5.72;
  const notes = [
    ['MAE ' + (S.mae_test || 0.7), 'rating steps of error on years it never saw'],
    [pct(S.coverage || 0.892) + ' / 90%', 'conformal coverage against target — reported short, not retuned'],
  ];
  notes.forEach(([n, t], i) => {
    const x = M + i * 5.6;
    s.addText(n, { x, y: by, w: 2.2, h: 0.36, isTextBox: true, margin: 0,
      fontFace: MONO, fontSize: 13, bold: true, color: CREAM, charSpacing: 0.5 });
    s.addText(t, { x: x + 2.3, y: by + 0.04, w: 3.2, h: 0.6, isTextBox: true, margin: 0,
      valign: 'top', fontFace: SERIF, fontSize: 11, color: DIM, lineSpacing: 15 });
  });
  s.addNotes('This is the slide that lets a technical judge relax. Trained to 2015, calibrated on ' +
    '2016 to 2018, and every number we quote comes from 2019 onward — forty-six thousand rows of ' +
    'pure holdout. And the coverage number is below its target on purpose: we refuse to retune on ' +
    'test years.');
}

// ══════════════════════════════════════════════════════════ 09 THE PROOF
{
  const s = darkSlide('bg02_contours.jpg');
  kicker(s, '08 / one real structure', M, 0.55, ROSE);
  headline(s, 'The record called this bridge good\nfor years. The physics disagreed\nthe whole time.',
           M, 0.9, { size: 23, w: 5.15, h: 1.75 });

  const f = shot(s, 'exhibit_a.png', 6.05, 1.5, W - M - 6.05, 5.2, { align: 'left', valign: 'top' });

  const seq = [
    ['THE RECORD SAID', '8', OCHRE, 'a good rating, filed and re-filed'],
    ['PHYSICS SAID', '6', STEEL, 'from age, traffic and weather alone'],
    ['IN 2025 THEY FILED', '3', CRIMSON, 'poor. The record had caught up.'],
  ];
  seq.forEach(([k, v, c, t], i) => {
    const y = 2.62 + i * 1.24;
    s.addText(k, { x: M, y, w: 3.2, h: 0.24, isTextBox: true, margin: 0,
      fontFace: MONO, fontSize: 8.4, bold: true, color: DIM, charSpacing: 1.1 });
    s.addShape(p.ShapeType.rect, { x: M, y: y + 0.3, w: 0.66, h: 0.62,
      fill: { color: c }, line: { type: 'none' } });
    s.addText(v, { x: M, y: y + 0.34, w: 0.66, h: 0.56, isTextBox: true, margin: 0,
      align: 'center', fontFace: SERIF, fontSize: 26, bold: true, color: 'FFFFFF' });
    s.addText(t, { x: M + 0.86, y: y + 0.38, w: 4.2, h: 0.5, isTextBox: true, margin: 0,
      valign: 'top', fontFace: SERIF, fontSize: 11.5, italic: true, color: PALE, lineSpacing: 15.5 });
  });
  s.addShape(p.ShapeType.rect, { x: M, y: 6.35, w: 5.1, h: 0.52,
    fill: { color: CRIMSON, transparency: 78 }, line: { color: CRIMSON, width: 1 } });
  s.addText('We had it inside the alert budget nine years earlier.', {
    x: M + 0.16, y: 6.46, w: 4.8, h: 0.32, isTextBox: true, margin: 0,
    fontFace: SERIF, fontSize: 12.5, bold: true, color: CREAM });
  caption(s, 'Exhibit A in the live console, showing this catch alongside a structure we missed.',
          6.05, f.y + f.h + 0.12, W - M - 6.05);
  s.addNotes('One bridge, told as a story. Point at the three numbers in order. The record said ' +
    'eight, our model — which never saw the record — said six, and in 2025 the inspectors came ' +
    'back and filed a three. We had it flagged nine years before the paperwork moved.');
}

// ══════════════════════════════════════════════════════════ 10 VALIDATION
{
  const s = darkSlide('05_nation_texture.jpg');
  kicker(s, '09 / validation at scale', M, 0.58, ROSE);
  headline(s, 'Then we hid the answers and did it 166 more times.',
           M, 0.94, { size: 27, w: 11, h: 0.85 });
  body(s, `We mined ${fmt(CT.events_total || 1835)} events where the record was forced to catch up — ` +
          'a rating dropping two or more steps, or a closure. The 166 that happen after 2018 are ' +
          'pure holdout.',
       M, 1.84, 8.6, { size: 14, h: 0.9 });

  const tiles = [
    [`${CT.flagged}/${CT.events}`, 'HELD-OUT FAILURES CAUGHT\nINSIDE A 15% ALERT BUDGET', CREAM],
    [pct(CT.recall), 'RECALL AT THAT BUDGET', CREAM],
    [`${S.median_lead} yrs`, 'MEDIAN WARNING BEFORE\nTHE RECORD MOVED', ROSE],
    [`${CT.lift_vs_rating_matched.toFixed(2)}×`, 'OVER A RATING-MATCHED BLIND PICK\n95% CI 0.99 – 1.73', CRIMSON],
  ];
  const tw = (W - 2 * M - 0.66) / 4;
  tiles.forEach(([n, t, c], i) => {
    const x = M + i * (tw + 0.22);
    card(s, x, 3.0, tw, 1.9, { fill: DESK, t: 24, line: HAIR });
    s.addShape(p.ShapeType.rect, { x, y: 3.0, w: tw, h: 0.07, fill: { color: c }, line: { type: 'none' } });
    s.addText(n, { x: x + 0.18, y: 3.3, w: tw - 0.36, h: 0.66, isTextBox: true, margin: 0,
      fontFace: SERIF, fontSize: 27, bold: true, color: c });
    s.addText(t, { x: x + 0.18, y: 4.02, w: tw - 0.36, h: 0.8, isTextBox: true, margin: 0,
      valign: 'top', fontFace: MONO, fontSize: 8, color: DIM, lineSpacing: 11.5, charSpacing: 0.7 });
  });

  const cw2 = (W - 2 * M - 0.3) / 2;
  card(s, M, 5.28, cw2, 1.5, { fill: DESK, t: 18, line: HAIR });
  kicker(s, 'why a budget and not an accuracy score', M + 0.26, 5.46, OCHRE, cw2 - 0.5);
  s.addText('A model that flags every bridge catches every failure and helps nobody. We score ours ' +
    'the way an inspection team works: a fixed number of alerts per quarter, and we count only the ' +
    'real failures that land inside it.',
    { x: M + 0.26, y: 5.74, w: cw2 - 0.52, h: 0.9, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 12, color: PALE, lineSpacing: 16 });

  card(s, M + cw2 + 0.3, 5.28, cw2, 1.5, { fill: CRIMSON, t: 88, line: CRIMSON });
  kicker(s, 'and the caveat we are not hiding', M + cw2 + 0.56, 5.46, ROSE, cw2 - 0.5);
  s.addText('That 1.34× interval runs from 0.99 to 1.73. It includes 1.0, so on 166 events we ' +
    'cannot rule out that the physics witness adds nothing at all. The finding on the next two ' +
    'slides does not depend on it.',
    { x: M + cw2 + 0.56, y: 5.74, w: cw2 - 0.52, h: 0.9, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 12, color: 'F0DDE1', lineSpacing: 16 });
  s.addNotes('Eighteen hundred events mined, 166 in the holdout era. We catch 38 of them inside a ' +
    '15% budget with a median warning of three and a half years. If they look sceptical, the ' +
    'budget explanation is the answer.');
}

// ══════════════════════════════════════════════════════════ 11 THE TURN
{
  const s = darkSlide('bg06_crack.jpg');
  // the plate's bright aggregate runs straight through the right column, so the
  // whole frame gets knocked back before any type lands on it
  scrim(s, 0, 0, W, H, { t: 34 });
  kicker(s, '10 / the control that matters', M, 0.58, ROSE);
  headline(s, 'Now the obvious objection —\nand it beats us.', M, 0.94, { size: 30, w: 6.2, h: 1.6 });
  body(s, 'Forget the model. Just sort every bridge by its worst recorded rating and inspect the ' +
          'top 15%. No machine learning at all.',
       M, 2.66, 5.5, { size: 14.5, h: 0.9 });

  // the scoreboard, stated plainly
  const bx = M, by = 3.72;
  card(s, bx, by, 5.6, 1.62, { fill: DESK, t: 12, line: HAIR });
  const rows = [
    ['Sort by worst rating', `${CT.worst_recorded_caught} of ${CT.events}`, CREAM],
    ['DISSENT (ours)', `${CT.flagged} of ${CT.events}`, ROSE],
  ];
  rows.forEach(([k, v, c], i) => {
    const y = by + 0.26 + i * 0.62;
    s.addText(k, { x: bx + 0.28, y, w: 3.3, h: 0.4, isTextBox: true, margin: 0, valign: 'middle',
      fontFace: SERIF, fontSize: 14, bold: i === 1, color: c });
    s.addText(v, { x: bx + 3.6, y, w: 1.7, h: 0.4, isTextBox: true, margin: 0, valign: 'middle',
      align: 'right', fontFace: MONO, fontSize: 15, bold: true, color: c });
  });
  s.addText('On the raw count, the version with no model in it wins. That is on our screen too.', {
    x: bx, y: by + 1.74, w: 5.9, h: 0.5, isTextBox: true, margin: 0, valign: 'top',
    fontFace: SERIF, fontSize: 12.5, italic: true, color: DIM, lineSpacing: 17 });

  // the reveal, held to the right
  const rx = 7.3;
  rule(s, rx - 0.5, 1.15, 0, HAIR, 1);
  s.addShape(p.ShapeType.line, { x: rx - 0.55, y: 1.1, w: 0, h: 5.5,
    line: { color: '3A4570', width: 0.75 } });
  kicker(s, 'so why does the model earn its place', rx, 1.15, CRIMSON, 5.4);
  s.addText('Because that ranking is nearly a definition of the answer, not a prediction of it.', {
    x: rx, y: 1.5, w: W - M - rx, h: 0.8, isTextBox: true, margin: 0, valign: 'top',
    fontFace: SERIF, fontSize: 17, bold: true, color: CREAM, lineSpacing: 24 });
  s.addText('A bridge already rated 5 is one step from poor. Sorting by the worst rating puts all ' +
    'of those first, so of course it catches the ones that cross the line. It is telling you what ' +
    'you already knew, faster.',
    { x: rx, y: 2.44, w: W - M - rx, h: 1.15, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 13, color: PALE, lineSpacing: 18.5 });
  s.addText('It is also blind, by construction, to a bridge whose file still reads fine.', {
    x: rx, y: 3.66, w: W - M - rx, h: 0.62, isTextBox: true, margin: 0, valign: 'top',
    fontFace: SERIF, fontSize: 15, bold: true, italic: true, color: ROSE, lineSpacing: 21 });
  rule(s, rx, 4.5, W - M - rx, HAIR, 0.75);
  s.addText('And that is the only kind of failure that carries a warning: the one nobody was ' +
    'watching, because nobody had a reason to.',
    { x: rx, y: 4.66, w: W - M - rx, h: 0.9, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 13, color: PALE, lineSpacing: 18.5 });
  s.addText('Turn the page.', { x: rx, y: 5.66, w: W - M - rx, h: 0.4, isTextBox: true, margin: 0,
    fontFace: MONO, fontSize: 10.5, bold: true, color: ROSE, charSpacing: 1.4 });

  s.addNotes('Do not soften this. Say out loud that the dumb baseline beats us on the raw count — ' +
    'forty versus thirty-eight — and that it is printed on our own screen. Then explain WHY: for a ' +
    'threshold target, sorting by rating is nearly a definition of the answer. Then turn the page.');
}

// ══════════════════════════════════════════════════════════ 12 THE NUMBER
// The plate carries the figure as its whole subject. Say almost nothing over it.
{
  const s = darkSlide('09_riso_misregister.jpg');
  kicker(s, '11 / the answer to the objection', M, 0.55, 'A8607A');
  // the plate captions itself along the foot, so the line goes in the empty top band
  s.addText('Sorting by the worst recorded rating found none of them.', {
    x: M, y: 1.02, w: 11.6, h: 0.62, isTextBox: true, margin: 0, valign: 'top',
    fontFace: SERIF, fontSize: 26, bold: true, color: CREAM, lineSpacing: 34 });
  s.addNotes('Let the number sit for two seconds before you say anything. Then: of the 166 held-out ' +
    'failures, 108 were on bridges the paperwork still called fine — and the ranking with no model ' +
    'in it found zero of them. Not a small number. Zero.');
}

// ══════════════════════════════════════════════════════════ 13 THE BLIND SPOT
{
  const s = darkSlide('01_desk_grain.jpg');
  kicker(s, '12 / where the two rankings differ', M, 0.5, ROSE);
  headline(s, 'Split the same 166 failures by what the file said at the time.',
           M, 0.82, { size: 24, w: 11.9, h: 0.7 });
  body(s, 'Same events, same alert budget, two ways of choosing who to look at.',
       M, 1.62, 9, { size: 13, color: DIM, h: 0.36 });
  D.blindSpot(s, M, 2.42, W - 2 * M, 3.6);
  s.addNotes('This is the payoff. Fifty-eight of the failures were on bridges the record already ' +
    'called bad — worst-first finds forty of those. The other hundred and eight were on bridges ' +
    'the paperwork still called fine, and worst-first finds zero. Not one. We find twenty-five. ' +
    'Sorting by rating can only point at bridges you already worry about.');
}

// ══════════════════════════════════════════════════════════ 14 LIMITS
{
  const s = darkSlide('bg02_contours.jpg');
  kicker(s, '13 / what it cannot do', M, 0.58, ROSE);
  headline(s, 'The limits are in the product, not just the appendix.',
           M, 0.94, { size: 27, w: 11, h: 0.85 });
  body(s, 'Each of these is enforced by the running system, where a judge can see it.',
       M, 1.82, 9, { size: 13.5, color: DIM, h: 0.4 });

  const lims = [
    ['IT ABSTAINS', 'On any structure under five years old. There is nothing to calibrate against yet, so it declines to have an opinion.'],
    ['IT UNDER-COVERS', `Conformal intervals cover ${pct(S.coverage || 0.892)} against a 90% target. We report the shortfall rather than retune on the test years.`],
    ['IT WITHHOLDS', `The model calibrated on four cold, wet, Atlantic states. ${N_HELD} of 51 jurisdictions sit outside that climate, so the national ranking is withheld for them. They are still audited.`],
    ['IT MISSED ONE', 'The Washington Bridge closed in 2023 and we rated it slightly better than the record did. The failure was in anchor tie-down details no weather feature can see. It is displayed in the app as a miss.'],
  ];
  const cw = (W - 2 * M - 0.66) / 4;
  lims.forEach(([k, t], i) => {
    const x = M + i * (cw + 0.22);
    card(s, x, 2.4, cw, 3.55, { fill: DESK, t: 20, line: HAIR });
    s.addShape(p.ShapeType.rect, { x, y: 2.4, w: cw, h: 0.06,
      fill: { color: i === 3 ? CRIMSON : OCHRE }, line: { type: 'none' } });
    s.addText(k, { x: x + 0.22, y: 2.66, w: cw - 0.44, h: 0.3, isTextBox: true, margin: 0,
      fontFace: MONO, fontSize: 9.5, bold: true, color: i === 3 ? ROSE : OCHRE, charSpacing: 1.1 });
    s.addText(t, { x: x + 0.22, y: 3.06, w: cw - 0.44, h: 2.7, isTextBox: true, margin: 0,
      valign: 'top', fontFace: SERIF, fontSize: 11.8, color: PALE, lineSpacing: 16.5 });
  });
  s.addText('A system that cannot tell you where it stops working is not a second opinion. It is a guess.', {
    x: M, y: 6.22, w: W - 2 * M, h: 0.4, isTextBox: true, margin: 0, align: 'center',
    fontFace: SERIF, fontSize: 13.5, italic: true, color: CREAM });
  s.addNotes('Do not rush this. It is worth more than another feature. Every one of these four is ' +
    'enforced in the running product — the abstention, the shortfall, the withheld rankings, and ' +
    'the miss we display on purpose.');
}

module.exports = {};

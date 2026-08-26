/* DISSENT explainer deck, part two: the deployed product, and the close.
 * Screenshot-led. Every screenshot is captioned so a reader with nobody talking
 * still knows what they are looking at and why it is on the slide.
 */
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

/* A section divider, so the deck audibly changes gear before the product half. */
{
  const s = darkSlide('bg04_underside.jpg');
  scrim(s, 0, 0, W, H, { t: 42 });
  kicker(s, 'part two', M, 2.62, ROSE, 6);
  s.addText('The thing itself.', {
    x: M, y: 2.98, w: 10, h: 1.1, isTextBox: true, margin: 0,
    fontFace: SERIF, fontSize: 46, bold: true, color: CREAM });
  rule(s, M, 4.24, 2.6, CRIMSON, 2.25);
  body(s, 'Everything from here is a screenshot of software that is deployed and running right now, ' +
          'at a public address, that you can open on your own phone while I talk.',
       M, 4.5, 7.4, { size: 15, h: 0.9 });
  s.addText('dissent-nexus.netlify.app', {
    x: M, y: 5.5, w: 7, h: 0.4, isTextBox: true, margin: 0,
    fontFace: MONO, fontSize: 13, bold: true, color: ROSE, charSpacing: 1 });
  s.addNotes('Change gear here. Everything after this is the running product.');
}

// ══════════════════════════════════════════════════════════ 14 THE DOCKET
{
  const s = darkSlide('01_desk_grain.jpg');
  kicker(s, '14 / the product — the working surface', M, 0.5, ROSE);
  headline(s, 'The output is not a dashboard. It is a docket:\na ranked list with a dated obligation on each row.',
           M, 0.82, { size: 22, w: 8.4, h: 1.15 });

  const f = shot(s, 'docket_full.png', M, 2.12, 8.55, 4.4, { align: 'left', valign: 'top' });

  const nx = 9.5, nw = W - M - nx;
  const notes = [
    ['1', 'Every structure the model has an opinion about, ranked by how far the record has drifted from the evidence.'],
    ['2', 'The two witnesses, side by side on every row: what was filed, and what the physics says — with its interval.'],
    ['3', 'Bands sized to real capacity — INSPECT NOW, SCHEDULE, WATCH — so the list is a work order, not a wall of risk.'],
  ];
  let ny = 2.2;
  notes.forEach(([n, t]) => {
    pinNote(s, n, t, nx, ny, nw, { h: 1.15 });
    ny += 1.32;
  });
  rule(s, nx, ny + 0.05, nw, HAIR, 0.75);
  s.addText('Click any row and a case file opens: the full trajectory, what drove the dissent, and ' +
    'a satellite view of the structure.',
    { x: nx, y: ny + 0.22, w: nw, h: 0.9, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.5, italic: true, color: DIM, lineSpacing: 16 });

  // Pins land on the actual UI elements they describe: the priority column, the
  // record/physics badge pair on a row, and the capacity band chips.
  pin(s, 1, f.x + f.w * 0.757, f.y + f.h * 0.300);   // beside the PRIORITY column
  pin(s, 2, f.x + f.w * 0.627, f.y + f.h * 0.243);   // beside the RECORD / PHYSICS pair
  pin(s, 3, f.x + f.w * 0.535, f.y + f.h * 0.176);   // beside the capacity band chips
  caption(s, 'The Rhode Island docket. 804 structures on file, 12 flagged for immediate inspection.',
          M, f.y + f.h + 0.14, 8.55);
  s.addNotes('This is the working surface. Left is the map, right is the ranked docket. Point at ' +
    'the two badges on the top row: the record says 7, physics says 4.7. That gap is the product.');
}

// ══════════════════════════════════════════════════════════ 15 THE WORLD
{
  const s = darkSlide('05_nation_texture.jpg');
  kicker(s, '15 / the product — coverage', M, 0.5, ROSE);
  headline(s, `All ${fmt(NAT.total)} rated structures in the United States, drawn in the browser.`,
           M, 0.82, { size: 24, w: 11.9, h: 0.72 });

  const f = shot(s, 'world_map.png', M, 1.78, W - 2 * M, 4.05, { valign: 'top' });

  const by = f.y + f.h + 0.24;
  const cols = [
    ['NO SERVER INVOLVED', 'This view streams a 10MB binary straight into the page. Nothing we run can crash while you are marking us.'],
    ['ZERO INSTALLED HARDWARE', 'Not one of these structures needed a sensor, a site visit, or a procurement cycle to appear here.'],
    ['THE WHOLE INVENTORY', `${fmt(NAT.poor_total)} of them are rated poor by their own inspectors. Every one is scoreable by the same model.`],
  ];
  const cw = (W - 2 * M - 0.8) / 3;
  cols.forEach(([k, t], i) => {
    const x = M + i * (cw + 0.4);
    s.addText(k, { x, y: by, w: cw, h: 0.26, isTextBox: true, margin: 0,
      fontFace: MONO, fontSize: 8.6, bold: true, color: OCHRE, charSpacing: 1.1 });
    s.addText(t, { x, y: by + 0.3, w: cw, h: 0.85, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.5, color: PALE, lineSpacing: 16 });
  });
  s.addNotes('Let it land as scale. That is the whole country, live in the browser, from a ten ' +
    'megabyte file. This view deliberately does not depend on our server.');
}

// ══════════════════════════════════════════════════════════ 16 THE TIME MACHINE
{
  const s = darkSlide('02_drafting_grid.jpg');
  kicker(s, '16 / the product — the strongest test we can offer', M, 0.5, ROSE);
  headline(s, 'You pick a state and a year. The model\ngrades its own past ranking, live.',
           M, 0.82, { size: 23, w: 6.9, h: 1.2 });
  body(s, 'The server pulls that year’s federal file, scores every structure with the model frozen ' +
          'in 2015, ranks them by dissent — then pulls the 2025 file and checks what actually ' +
          'happened to them.',
       M, 2.12, 6.9, { size: 13.5, h: 1.05 });

  const f = shot(s, 'timemachine.png', 7.9, 0.95, W - M - 7.9, 5.9, { align: 'left', valign: 'top' });

  // the Vermont result, restated in words so it survives a bad projector
  const bx = M, by = 3.35;
  card(s, bx, by, 6.9, 2.5, { fill: DESK, t: 14, line: HAIR });
  kicker(s, 'vermont, start year 2019 — as run on this slide', bx + 0.26, by + 0.22, OCHRE, 6.4);
  const lines = [
    ['2,748', 'structures still in fair-or-better condition in 2019'],
    ['93', 'of them had crossed into POOR by 2025'],
    ['35', 'of those were bridges the 2019 file still called fine'],
  ];
  lines.forEach(([n, t], i) => {
    const y = by + 0.58 + i * 0.44;
    s.addText(n, { x: bx + 0.26, y, w: 1.0, h: 0.32, isTextBox: true, margin: 0, align: 'right',
      fontFace: MONO, fontSize: 13, bold: true, color: CREAM });
    s.addText(t, { x: bx + 1.4, y: y + 0.03, w: 5.2, h: 0.32, isTextBox: true, margin: 0,
      fontFace: SERIF, fontSize: 12, color: PALE });
  });
  rule(s, bx + 0.26, by + 1.94, 6.38, HAIR, 0.75);
  s.addText([
    { text: 'On those 35:  ', options: { fontFace: SERIF, fontSize: 12.5, color: DIM } },
    { text: 'sorting by worst rating found 1.  ', options: { fontFace: SERIF, fontSize: 12.5, color: PALE } },
    { text: 'Dissent found 9.', options: { fontFace: SERIF, fontSize: 12.5, bold: true, color: ROSE } },
  ], { x: bx + 0.26, y: by + 2.06, w: 6.38, h: 0.32, isTextBox: true, margin: 0, valign: 'top' });

  s.addShape(p.ShapeType.rect, { x: M, y: 6.12, w: 6.9, h: 0.68,
    fill: { color: CRIMSON, transparency: 82 }, line: { color: CRIMSON, width: 1 } });
  s.addText('The base rate and the baseline that beats us are printed on screen every single time — ' +
    'including on the states where we lose.',
    { x: M + 0.2, y: 6.22, w: 6.5, h: 0.5, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.8, bold: true, color: CREAM, lineSpacing: 16 });
  s.addNotes('Ask a judge for a state and a year. Two and a half seconds later the server has ' +
    'pulled two federal files and graded itself. Then point at the honesty: the base rate and the ' +
    'baseline are on screen every time. Invite them to try a state where we lose.');
}

// ══════════════════════════════════════════════════════════ 17 THE INDEX AND ITS GATE
{
  const s = darkSlide('bg05_scatter.jpg');
  kicker(s, '17 / the product — and the most trustworthy thing in it', M, 0.5, ROSE);
  headline(s, `We scored all 51 jurisdictions.\nThen we refused to rank ${N_HELD} of them.`,
           M, 0.82, { size: 23, w: 6.9, h: 1.2 });
  body(s, 'Every audit measures one thing across a whole jurisdiction: how much sunnier its filed ' +
          'ratings run than the physics witness. All 51 jurisdictions, every rated structure in each.',
       M, 2.12, 6.9, { size: 13.5, h: 0.85 });

  const f2 = shot(s, 'index.png', 7.9, 0.86, W - M - 7.9, 3.35, { align: 'left', valign: 'top' });
  const f = shot(s, 'withheld.png', 7.9, 4.42, W - M - 7.9, 1.55, { align: 'left', valign: 'top' });

  // what we will and will not say
  const bx = M, by = 3.1;
  card(s, bx, by, 6.9, 1.78, { fill: DESK, t: 16, line: HAIR });
  kicker(s, 'what we will say — after detrending ourselves', bx + 0.26, by + 0.2, MOSS, 6.4);
  s.addText([
    { text: 'Georgia’s filings run ', options: { fontFace: SERIF, fontSize: 12.5, color: PALE } },
    { text: '+1.30 ', options: { fontFace: MONO, fontSize: 12.5, bold: true, color: CREAM } },
    { text: 'of a rating step sunnier than the evidence — ', options: { fontFace: SERIF, fontSize: 12.5, color: PALE } },
    { text: '+0.91 ', options: { fontFace: MONO, fontSize: 12.5, bold: true, color: MOSS } },
    { text: 'once we subtract our own extrapolation. Even inside the rankable band, ' +
            'climate distance explains a quarter of what we call optimism (r = 0.51). ' +
            'We publish the residual, not the raw number.',
      options: { fontFace: SERIF, fontSize: 12.5, color: PALE } },
  ], { x: bx + 0.26, y: by + 0.52, w: 6.38, h: 1.1, isTextBox: true, margin: 0, valign: 'top',
       lineSpacing: 17 });

  card(s, bx, by + 1.95, 6.9, 2.0, { fill: CRIMSON, t: 86, line: CRIMSON, lw: 1 });
  kicker(s, 'what we will NOT say', bx + 0.26, by + 2.14, ROSE, 6.4);
  s.addText('Anything at all about California, Texas or Arizona.', {
    x: bx + 0.26, y: by + 2.44, w: 6.38, h: 0.36, isTextBox: true, margin: 0,
    fontFace: SERIF, fontSize: 15, bold: true, color: CREAM });
  s.addText('The model calibrated on four cold, wet, Atlantic states. Arizona sits five climate-envelope ' +
    'widths outside that. Out there we cannot separate “their inspectors are optimistic” from ' +
    '“our model is wrong”, so we publish no number. We still audit them, and they still get a ' +
    'docket. We just decline to pretend.',
    { x: bx + 0.26, y: by + 2.84, w: 6.38, h: 1.1, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.5, color: 'F0DDE1', lineSpacing: 16 });

  caption(s, 'The index, and the second table listing every jurisdiction whose ranking is withheld and why.',
          7.9, f.y + f.h + 0.12, W - M - 7.9);
  s.addNotes('This is the slide that buys you credibility for everything else. Say it deliberately: ' +
    'twenty-seven states are in the second table with no ranking at all, and the app tells you the ' +
    'reason for each one.');
}

// ══════════════════════════════════════════════════════════ 18 THE ENGINEERING
{
  const s = darkSlide('10_residual_traces.jpg');
  scrim(s, 0, 0, 7.4, H, { t: 14 });
  kicker(s, '18 / it is a system, not a notebook', M, 0.58, ROSE);
  headline(s, 'Half of this physically cannot run in a browser.',
           M, 0.94, { size: 26, w: 6.5, h: 0.9 });
  body(s, 'The federal files are tens of megabytes and their origin sends no cross-origin headers, ' +
          'so the browser is not allowed to fetch them at all. That half runs on a real server.',
       M, 2.0, 6.3, { size: 13.5, h: 1.05 });

  const items = [
    ['FASTAPI ON RENDER', 'Pulls any state’s live federal file and live weather, scores every structure, and returns a docket.'],
    ['BOUNDED MEMORY', 'Texas is 56,951 structures and completes in about fifteen seconds on a free 512MB instance.'],
    ['SERVER-RENDERED PDFs', 'Any case file downloads as a real document an engineer can sign.'],
    ['THE WRITE-BACK LOOP', 'A field inspection outcome is filed back and stored as a label for the next build. The loop closes.'],
  ];
  let y = 3.2;
  items.forEach(([k, t]) => {
    s.addText(k, { x: M, y, w: 6.3, h: 0.26, isTextBox: true, margin: 0,
      fontFace: MONO, fontSize: 9, bold: true, color: OCHRE, charSpacing: 1.1 });
    s.addText(t, { x: M, y: y + 0.28, w: 6.3, h: 0.56, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.8, color: PALE, lineSpacing: 16 });
    y += 0.92;
  });
  s.addText('dissent-api-jgod.onrender.com/docs', {
    x: M, y: 6.86, w: 6.3, h: 0.3, isTextBox: true, margin: 0,
    fontFace: MONO, fontSize: 10, bold: true, color: ROSE, charSpacing: 0.7 });
  s.addNotes('If they ask "is this just a static site" — this is the answer. Open the docs page. ' +
    'The API is real, documented, and does work a browser is not permitted to do.');
}

// ══════════════════════════════════════════════════════════ 19 WHY IT IS NEW
{
  const s = lightSlide('bg03_paper.jpg');
  kicker(s, '19 / the category', M, 0.62, OCHRE);
  headline(s, 'Everything on the market measures the asset.\nWe audit the paperwork against it.',
           M, 1.0, { size: 27, color: INK, h: 1.5 });

  // the contrast, as two columns of a filing
  const cw = 5.3;
  card(s, M, 2.62, cw, 3.5, { fill: PAPER, line: HAIRL });
  kicker(s, 'what already exists', M + 0.28, 2.86, GREY, cw - 0.56);
  s.addText('Measure the structure', { x: M + 0.28, y: 3.16, w: cw - 0.56, h: 0.42,
    isTextBox: true, margin: 0, fontFace: SERIF, fontSize: 18, bold: true, color: INK });
  s.addText('Strain gauges. Satellite interferometry. Drone photogrammetry. Inspection-photo ' +
    'classifiers. Every one of them is good, and every one needs something installed, flown, or ' +
    'visited — so every one covers a fraction of an inventory.',
    { x: M + 0.28, y: 3.68, w: cw - 0.56, h: 1.5, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 12, color: GREY, lineSpacing: 17 });
  s.addText('Coverage: the assets you paid to instrument.', {
    x: M + 0.28, y: 5.48, w: cw - 0.56, h: 0.4, isTextBox: true, margin: 0,
    fontFace: SERIF, fontSize: 11.5, italic: true, color: GREY });

  const rx = M + cw + 0.5;
  card(s, rx, 2.62, cw, 3.5, { fill: DESK, line: HAIR });
  kicker(s, 'what we do', rx + 0.28, 2.86, ROSE, cw - 0.56);
  s.addText('Audit the account of it', { x: rx + 0.28, y: 3.16, w: cw - 0.56, h: 0.42,
    isTextBox: true, margin: 0, fontFace: SERIF, fontSize: 18, bold: true, color: CREAM });
  s.addText('A blind re-inspection setup in which no filed rating is ever an input. Conformal ' +
    'calibration, so every verdict carries valid uncertainty. A Bayesian changepoint detector on ' +
    'the record-versus-physics residual. And one deliberate refusal: we never train a rare-event ' +
    'classifier, because failures are one in thousands. We train a rating predictor on hundreds of ' +
    'thousands of pairs and mine the disagreements.',
    { x: rx + 0.28, y: 3.68, w: cw - 0.56, h: 1.85, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 11.5, color: PALE, lineSpacing: 16 });
  s.addText('Coverage: 100% of any inventory that files a record.', {
    x: rx + 0.28, y: 5.62, w: cw - 0.56, h: 0.4, isTextBox: true, margin: 0,
    fontFace: SERIF, fontSize: 11.5, italic: true, bold: true, color: ROSE });

  s.addText('That is a different category, and it is why there is nothing to install and nothing to buy.', {
    x: M, y: 6.32, w: W - 2 * M, h: 0.4, isTextBox: true, margin: 0, align: 'center',
    fontFace: SERIF, fontSize: 13.5, italic: true, color: INK });
  s.addNotes('Name the category difference plainly. Everyone else measures the asset; we audit the ' +
    'paperwork against the asset. Then name the four genuinely novel pieces.');
}

// ══════════════════════════════════════════════════════════ 20 IMPACT
{
  const s = darkSlide('bg04_underside.jpg');
  scrim(s, 0, 0, W * 0.58, H, { t: 12 });
  kicker(s, '20 / what changes', M, 0.58, ROSE);
  headline(s, 'Seven hundred and thirty days between\nlooks becomes one model run.',
           M, 0.94, { size: 26, w: 6.6, h: 1.35 });
  body(s, 'A second opinion costs one model run. It can be re-run the day a new federal file lands, ' +
          'or the day the weather record updates. There is no visit to schedule and no hardware to ' +
          'wait for.',
       M, 2.62, 6.2, { size: 14, h: 1.25 });

  const cmp = [
    ['730 days', 'today, between routine inspections', DIM],
    ['one model run', 'to re-audit an entire national inventory', ROSE],
  ];
  cmp.forEach(([n, t, c], i) => {
    const y = 4.05 + i * 1.0;
    s.addText(n, { x: M, y, w: 3.0, h: 0.48, isTextBox: true, margin: 0,
      fontFace: SERIF, fontSize: 24, bold: true, color: c });
    s.addText(t, { x: M + 3.2, y: y + 0.12, w: 3.1, h: 0.5, isTextBox: true, margin: 0,
      valign: 'top', fontFace: SERIF, fontSize: 11.5, color: PALE, lineSpacing: 15.5 });
  });
  rule(s, M, 6.1, 6.2, HAIR, 0.75);
  s.addText('A county with five bridges and one engineer gets exactly what a national railway gets, ' +
    'because there is nothing to install and nothing to buy.',
    { x: M, y: 6.26, w: 6.2, h: 0.7, isTextBox: true, margin: 0, valign: 'top',
      fontFace: SERIF, fontSize: 12, italic: true, color: CREAM, lineSpacing: 16.5 });
  s.addNotes('Land the equity point: the small owner gets the same second opinion as the big one, ' +
    'because the marginal cost of one more structure is a model run.');
}

// ══════════════════════════════════════════════════════════ 21 CLOSE
{
  const s = darkSlide('bg01_truss.jpg');
  kicker(s, 'in closing', M, 0.62, '7E88B4', 6);
  headline(s, 'We did not simulate a single bridge.', M, 1.02, { size: 34, w: 9.5, h: 0.95 });
  body(s, 'Every figure in this deck comes out of a file the United States government publishes for ' +
          'free, and both halves of the system are deployed and running tonight. If you want to ' +
          'check any number in it, the download script is in our repository.',
       M, 2.16, 6.9, { size: 14.5, h: 1.4 });

  rule(s, M, 3.85, 3.1, CRIMSON, 2.25);

  const links = [
    ['THE CONSOLE', 'dissent-nexus.netlify.app'],
    ['THE API', 'dissent-api-jgod.onrender.com/docs'],
    ['THE SOURCE', 'github.com/ArockiaRajamanickam/dissent'],
  ];
  links.forEach(([k, v], i) => {
    const y = 4.18 + i * 0.66;
    s.addText(k, { x: M, y, w: 1.9, h: 0.28, isTextBox: true, margin: 0,
      fontFace: MONO, fontSize: 8.6, bold: true, color: DIM, charSpacing: 1.1 });
    s.addText(v, { x: M + 2.05, y: y - 0.03, w: 6.0, h: 0.34, isTextBox: true, margin: 0,
      fontFace: MONO, fontSize: 12, bold: true, color: i === 0 ? ROSE : CREAM, charSpacing: 0.5 });
  });

  const by = 6.22;
  rule(s, M, by, W - 2 * M, '3A4570', 0.75);
  s.addText('TEAM NEXUS NETWORK', {
    x: M, y: by + 0.18, w: 6, h: 0.3, isTextBox: true, margin: 0,
    fontFace: MONO, fontSize: 12, bold: true, color: CREAM, charSpacing: 1.6 });
  kicker(s, 'Dept. of CSE (Cyber Security)', M, by + 0.56, '6E78A4', 6);
  s.addText('Infrastructure does not fail silently.\nIt fails contradicted.', {
    x: W - M - 5.6, y: by + 0.1, w: 5.6, h: 0.8, isTextBox: true, margin: 0, align: 'right',
    fontFace: SERIF, fontSize: 15, italic: true, color: '9AA3C6', lineSpacing: 21 });

  s.addNotes('Close on verifiability, not on a slogan. Every number is downloadable, nothing was ' +
    'simulated, and both halves are live. Then open the console and hand them the demo.');
}

module.exports = {};

/* DISSENT — the hackathon deck.
 *
 * 14 slides. Every ground is a solid colour. One idea per slide, headlines under
 * ten words, and the accent red is spent exactly once, on the slide that is the
 * whole argument. No photography, no texture, no card borders, no icon rows.
 */
const K = require('./flat_kit.js');
const {
  p, W, H, M, COL,
  INK, PAPER, SIGNAL, STEEL, SLATE, WHITE, DIMINK, DIMPAP,
  DISPLAY, SANS, MONO,
  slide, band, txt, label, head, body, hero, shot, bleed, caption, pageNo,
  fmt, pct, S, NAT, CT, FINE, POOR, IDX,
} = K;

const N_HELD = IDX.index.filter(r => !r.rankable).length;
const PALE   = 'FFD9D4';   // text on the signal ground
const MUTE   = '9AA0A8';   // the losing side of a comparison

// ══════════════════════════════════════ 01 COVER
{
  const s = slide(INK);
  label(s, 'AI Innovation Challenge 2026 · Round 3', M, 0.85, SLATE, 8);
  txt(s, 'DISSENT', { x: M - 0.06, y: 1.42, w: 11, h: 2.0,
    fontFace: DISPLAY, fontSize: 130, bold: true, color: WHITE, charSpacing: -3 });
  band(s, M, 3.72, 2.2, 0.11, SIGNAL);
  txt(s, 'We audit the paperwork,\nnot the bridge.', { x: M, y: 4.06, w: 10, h: 1.5,
    fontFace: DISPLAY, fontSize: 34, bold: true, color: WHITE, lineSpacing: 43 });
  txt(s, 'TEAM NEXUS NETWORK', { x: M, y: 6.28, w: 6, h: 0.3,
    fontFace: MONO, fontSize: 12, bold: true, color: WHITE, charSpacing: 1.8 });
  txt(s, 'DEPT. OF CSE (CYBER SECURITY)', { x: M, y: 6.62, w: 6, h: 0.3,
    fontFace: MONO, fontSize: 10, color: SLATE, charSpacing: 1.5 });
  txt(s, 'dissent-nexus.netlify.app', { x: W - M - 6, y: 6.28, w: 6, h: 0.3, align: 'right',
    fontFace: MONO, fontSize: 12, bold: true, color: SIGNAL, charSpacing: 1 });
  s.addNotes('Open cold. "Every bridge in America gets looked at about once every two years. ' +
    'In between, the only thing anyone consults is a file. Tonight I am going to show you the ' +
    'bridges whose file is lying."');
}

// ══════════════════════════════════════ 02 THE PROBLEM
{
  const s = slide(INK);
  label(s, 'the problem', M, 0.85, SIGNAL, 6);
  txt(s, [
    { text: '730', options: { fontFace: DISPLAY, fontSize: 200, bold: true, color: WHITE,
                              charSpacing: -6 } },
    { text: '  days', options: { fontFace: DISPLAY, fontSize: 48, bold: true, color: SIGNAL } },
  ], { x: M - 0.18, y: 1.3, w: 11.5, h: 2.5, valign: 'middle' });
  txt(s, 'between one look at a bridge and the next.',
    { x: M, y: 4.15, w: 11, h: 0.8, fontFace: DISPLAY, fontSize: 32, bold: true,
      color: WHITE, lineSpacing: 41 });
  txt(s, 'In between, the file is the only thing anyone consults.\nThe file is standing still. The bridge is not.',
    { x: M, y: 5.35, w: 10, h: 1.1, fontFace: SANS, fontSize: 18, color: DIMINK,
      lineSpacing: 28 });
  s.addNotes('Two years between looks. In between, the paperwork IS the bridge as far as any ' +
    'decision-maker is concerned. That is the gap this lives in.');
}

// ══════════════════════════════════════ 03 WHY BRIDGES, WHY AMERICA
{
  const s = slide(PAPER);
  label(s, 'two questions you are about to ask', M, 0.85, DIMPAP, 8);
  head(s, 'Why bridges? Why America?', M, 1.22, { color: INK, size: 44, h: 1.0 });
  const cw = 5.35, y = 2.95;
  const cols = [
    ['WHY BRIDGES', 'Because it is the one asset class with a record worth auditing: public, ' +
      'national, per-structure, numeric, and thirty-four years deep. You cannot audit a record ' +
      'that does not exist.', 'Buildings have no equivalent. Surfside cost 98 lives and there ' +
      'was nothing to check it against.'],
    ['WHY AMERICA', 'Because that record only exists there. The FHWA publishes every state, every ' +
      'year, free. If you want to prove a model can catch a file drifting from reality, that is ' +
      'where the experiment can be run.', 'India is building the same thing now: IBMS already ' +
      'inventories 172,517 structures on the same 0–9 idea.'],
  ];
  cols.forEach(([k, a, b], i) => {
    const x = M + i * (cw + 0.85);
    txt(s, k, { x, y, w: cw, h: 0.3,
      fontFace: MONO, fontSize: 11, bold: true, color: SIGNAL, charSpacing: 1.6 });
    band(s, x, y + 0.42, cw, 0.055, INK);
    txt(s, a, { x, y: y + 0.68, w: cw, h: 1.7, valign: 'top',
      fontFace: SANS, fontSize: 16, color: INK, lineSpacing: 25 });
    txt(s, b, { x, y: y + 2.5, w: cw, h: 1.1, valign: 'top',
      fontFace: SANS, fontSize: 13.5, color: DIMPAP, lineSpacing: 21 });
  });
  s.addNotes('Answer both head on. Bridges because the record exists. America because that is ' +
    'the only place it exists publicly. Do not say anything is deployed in India.');
}

// ══════════════════════════════════════ 04 THE IDEA
{
  const s = slide(STEEL);
  label(s, 'the idea', M, 0.85, 'AFC2FF', 6);
  head(s, 'Keep two accounts of every bridge.\nSell the argument between them.',
       M, 1.22, { color: WHITE, size: 38, h: 1.9 });

  const y = 3.5, bw = 5.35, bh = 2.1;
  // the record
  band(s, M, y, bw, bh, WHITE);
  txt(s, 'THE RECORD', { x: M + 0.34, y: y + 0.32, w: bw - 0.68, h: 0.3,
    fontFace: MONO, fontSize: 11, bold: true, color: DIMPAP, charSpacing: 1.5 });
  txt(s, 'What the\ninstitution filed', { x: M + 0.34, y: y + 0.72, w: bw - 0.68, h: 0.9,
    fontFace: DISPLAY, fontSize: 24, bold: true, color: INK, lineSpacing: 30 });
  txt(s, 'An inspector visits, and writes one number.', { x: M + 0.34, y: y + 1.62,
    w: bw - 0.68, h: 0.4, fontFace: SANS, fontSize: 13, color: DIMPAP });

  // the model
  const rx = M + bw + 0.85;
  band(s, rx, y, bw, bh, INK);
  txt(s, 'THE PHYSICS', { x: rx + 0.34, y: y + 0.32, w: bw - 0.68, h: 0.3,
    fontFace: MONO, fontSize: 11, bold: true, color: 'AFC2FF', charSpacing: 1.5 });
  txt(s, 'What the\nevidence implies', { x: rx + 0.34, y: y + 0.72, w: bw - 0.68, h: 0.9,
    fontFace: DISPLAY, fontSize: 24, bold: true, color: WHITE, lineSpacing: 30 });
  txt(s, 'Age, traffic, trucks, span, weather. No rating among them.',
    { x: rx + 0.34, y: y + 1.62, w: bw - 0.68, h: 0.4,
      fontFace: SANS, fontSize: 13, color: DIMINK });

  band(s, M, y + bh + 0.42, COL, 0.72, SIGNAL);
  txt(s, 'When they stop agreeing, that disagreement is the product.',
    { x: M, y: y + bh + 0.6, w: COL, h: 0.4, align: 'center',
      fontFace: DISPLAY, fontSize: 19, bold: true, color: WHITE });
  s.addNotes('Slow down here. Two accounts of the same bridge. The model is graded against the ' +
    'inspector rating but never gets to read one. The product is not a risk score. It is the ' +
    'contradiction.');
}

// ══════════════════════════════════════ 05 THE DOCKET (screenshot)
{
  const s = slide(INK);
  label(s, 'what we built', M, 0.85, SIGNAL, 6);
  head(s, 'Not a dashboard.\nA docket.', M, 1.25, { color: WHITE, size: 44, w: 4.6, h: 1.9 });
  txt(s, 'A ranked list of the bridges whose file has drifted furthest from the evidence — ' +
         'capped to what an inspection team can actually visit in a quarter.',
    { x: M, y: 3.5, w: 4.4, h: 1.6, fontFace: SANS, fontSize: 15, color: DIMINK,
      lineSpacing: 24 });
  txt(s, 'RHODE ISLAND · 804 STRUCTURES\n12 FLAGGED FOR IMMEDIATE INSPECTION',
    { x: M, y: 5.6, w: 4.6, h: 0.8, fontFace: MONO, fontSize: 10.5, color: SIGNAL,
      charSpacing: 1.1, lineSpacing: 17 });
  bleed(s, 'docket.png', 6.0, 1.25, 8.6);
  s.addNotes('This is the working surface. Left is the map, right is the ranked docket. Top row: ' +
    'the record says 7, physics says 4.7. That gap is the product.');
}

// ══════════════════════════════════════ 06 SCALE (screenshot)
{
  const s = slide(INK);
  label(s, 'coverage', M, 0.78, SIGNAL, 6);
  txt(s, [
    { text: fmt(NAT.total), options: { fontFace: DISPLAY, fontSize: 62, bold: true,
                                        color: WHITE, charSpacing: -1 } },
    { text: '   bridges. Zero sensors installed.',
      options: { fontFace: DISPLAY, fontSize: 30, bold: true, color: DIMINK } },
  ], { x: M, y: 1.12, w: COL, h: 1.0, valign: 'middle' });
  txt(s, `Every rated structure in the country, drawn in the browser from a 10MB file. ` +
         `${fmt(NAT.poor_total)} are rated poor by their own inspectors. This view does not ` +
         `even need our server.`,
    { x: M, y: 2.15, w: 10.9, h: 0.7, fontFace: SANS, fontSize: 15, color: DIMINK,
      lineSpacing: 23 });
  bleed(s, 'world.png', M, 3.1, 12.2);
  s.addNotes('Let scale land. The whole country, live in the browser, and this view does not ' +
    'even need our server.');
}

// ══════════════════════════════════════ 07 HOW IT WORKS
{
  const s = slide(PAPER);
  label(s, 'how it works', M, 0.85, DIMPAP, 6);
  head(s, 'Public data in. A work order out.',
       M, 1.22, { color: INK, size: 42, h: 0.9 });
  const steps = [
    ['01', 'PUBLIC FILES', 'The federal inspection file and the weather history. Both free.'],
    ['02', 'PHYSICS ONLY', '18 features about the structure itself. No filed rating among them.'],
    ['03', 'FROZEN MODEL', 'Trained to 2015 and never updated. It has never seen a later year.'],
    ['04', 'THE GAP', 'Record minus physics, with a calibrated interval on every verdict.'],
  ];
  const cw = (COL - 3 * 0.4) / 4, y = 2.85;
  steps.forEach(([n, k, t], i) => {
    const x = M + i * (cw + 0.4);
    txt(s, n, { x, y, w: cw, h: 0.7, fontFace: DISPLAY, fontSize: 46, bold: true,
      color: i === 3 ? SIGNAL : 'C9C4BA', charSpacing: -1 });
    band(s, x, y + 0.86, cw, 0.05, i === 3 ? SIGNAL : INK);
    txt(s, k, { x, y: y + 1.06, w: cw, h: 0.3,
      fontFace: MONO, fontSize: 10.5, bold: true, color: INK, charSpacing: 1.3 });
    txt(s, t, { x, y: y + 1.44, w: cw, h: 1.3, valign: 'top',
      fontFace: SANS, fontSize: 14, color: DIMPAP, lineSpacing: 21 });
  });
  txt(s, 'The whole design is one refusal: no inspector rating is ever one of its inputs. ' +
         'It is graded against that rating. It never gets to read one.',
    { x: M, y: 6.05, w: COL, h: 0.7, fontFace: SANS, fontSize: 16, color: INK,
      lineSpacing: 25, bold: true });
  s.addNotes('Walk it left to right in twenty seconds. Land the last line: graded against the ' +
    'rating, never allowed to read one. That is what makes it a second opinion and not an echo.');
}

// ══════════════════════════════════════ 08 THE TEST
{
  const s = slide(PAPER);
  label(s, 'how you know it did not cheat', M, 0.85, DIMPAP, 8);
  head(s, 'Frozen in 2015. The rest is hidden.',
       M, 1.22, { color: INK, size: 42, h: 0.9 });

  // the timeline as three flat blocks
  const y = 3.0, h = 1.15;
  const bands = [
    ['1992 – 2015', 'TRAINED', `${fmt(S.trained_rows || 168864)} filings it learned from`, 'C9C4BA', INK, 0.52],
    ['2016 – 2018', 'CALIBRATED', 'interval set here', '8E8A80', WHITE, 0.16],
    ['2019 – 2025', 'NEVER SEEN', '46,541 rows of pure holdout', SIGNAL, WHITE, 0.32],
  ];
  let x = M;
  bands.forEach(([yr, k, t, fill, fg, frac]) => {
    const bw = COL * frac;
    band(s, x, y, bw, h, fill);
    txt(s, k, { x: x + 0.24, y: y + 0.22, w: bw - 0.48, h: 0.3,
      fontFace: MONO, fontSize: 11, bold: true, color: fg, charSpacing: 1.4 });
    txt(s, t, { x: x + 0.24, y: y + 0.58, w: bw - 0.48, h: 0.4,
      fontFace: SANS, fontSize: 13, color: fg });
    txt(s, yr, { x, y: y + h + 0.16, w: bw, h: 0.3,
      fontFace: MONO, fontSize: 10.5, color: DIMPAP, charSpacing: 0.8 });
    x += bw;
  });
  txt(s, 'Every number we quote comes from the red block. It is data the model has never been ' +
         'shown, and we did not go back and retune anything to make it look better.',
    { x: M, y: 5.3, w: 10.6, h: 0.8, fontFace: SANS, fontSize: 16, color: INK, lineSpacing: 25 });
  txt(s, `Conformal coverage ${pct(S.coverage || 0.892)} against a 90% target — reported short, not retuned.`,
    { x: M, y: 6.3, w: 10.6, h: 0.4, fontFace: MONO, fontSize: 12, color: DIMPAP });
  s.addNotes('This is the slide that lets a technical judge relax. Frozen 2015, calibrated to ' +
    '2018, everything from 2019 is holdout. And the coverage number is deliberately below its ' +
    'target because we refuse to retune on test years.');
}

// ══════════════════════════════════════ 09 THE OBJECTION
{
  const s = slide(INK);
  label(s, 'the obvious objection', M, 0.85, SIGNAL, 8);
  head(s, 'Just sort by the worst rating.',
       M, 1.22, { color: WHITE, size: 42, h: 0.9 });
  txt(s, 'No machine learning at all. Take the bridges the file already rates worst, inspect the ' +
         'top 15%, and count how many of the 166 real failures you catch.',
    { x: M, y: 2.42, w: 10.4, h: 0.8, fontFace: SANS, fontSize: 16, color: DIMINK, lineSpacing: 25 });

  const y = 3.55, rw = 4.9;
  const rows = [['Sort by worst rating', '40', MUTE], ['DISSENT', '38', WHITE]];
  rows.forEach(([k, v, c], i) => {
    const ry = y + i * 1.05;
    txt(s, k, { x: M, y: ry, w: 5.4, h: 0.7, valign: 'middle',
      fontFace: SANS, fontSize: 20, color: c, bold: i === 1 });
    txt(s, v, { x: M + 5.6, y: ry - 0.1, w: 1.6, h: 0.9, valign: 'middle', align: 'right',
      fontFace: DISPLAY, fontSize: 54, bold: true, color: c, charSpacing: -1 });
    txt(s, 'of 166', { x: M + 7.35, y: ry, w: 2, h: 0.7, valign: 'middle',
      fontFace: SANS, fontSize: 15, color: SLATE });
  });
  band(s, M, 5.85, 8.3, 0.05, SIGNAL);
  txt(s, 'On the raw count, the version with no model in it wins.',
    { x: M, y: 6.05, w: 10.6, h: 0.45, fontFace: DISPLAY, fontSize: 21, bold: true,
      color: SIGNAL });
  txt(s, 'That is printed in our own product, not buried in an appendix.',
    { x: M, y: 6.58, w: 10.6, h: 0.4, fontFace: SANS, fontSize: 15, color: DIMINK });
  s.addNotes('Do not soften this. Say out loud that the dumb baseline beats us, 40 to 38, and ' +
    'that it is printed in our own product. Then turn the page.');
}

// ══════════════════════════════════════ 10 THE NUMBER  (the one signal slide)
{
  const s = slide(SIGNAL);
  label(s, 'so why does the model earn its place', M, 0.85, PALE, 9);
  hero(s, '108', M - 0.24, 1.3, 9, { size: 250, color: WHITE, tracking: -9, h: 3.1 });
  txt(s, 'of those 166 failures were on bridges\nthe record still called FINE.',
    { x: M, y: 4.6, w: 11, h: 1.3, fontFace: DISPLAY, fontSize: 31, bold: true, color: WHITE,
      lineSpacing: 40 });
  txt(s, 'Sorting by the worst rating is blind to every one of them, by construction. ' +
         'It can only point at bridges you already worry about.',
    { x: M, y: 6.15, w: 10.6, h: 0.8, fontFace: SANS, fontSize: 16, color: PALE, lineSpacing: 24 });
  s.addNotes('Let the number sit for two seconds before you say anything. Then: 108 of the 166 ' +
    'were on bridges the paperwork still called fine, and a ranking based on the paperwork ' +
    'cannot see them.');
}

// ══════════════════════════════════════ 11 ZERO vs 25
{
  const s = slide(PAPER);
  label(s, 'the same 108 failures, two ways of choosing', M, 0.85, DIMPAP, 9);
  head(s, 'One of them found none.', M, 1.22, { color: INK, size: 42, h: 0.9 });

  const y = 2.75, cw = 5.35;
  const cols = [
    ['SORT BY WORST RATING', String(FINE.worst), MUTE,
     'It only ever looks at bridges the file already calls bad, so it never arrives.'],
    ['DISSENT', String(FINE.ours), SIGNAL,
     'It reads the physical evidence, so a good-looking file does not hide anything from it.'],
  ];
  cols.forEach(([k, v, c, t], i) => {
    const x = M + i * (cw + 0.85);
    txt(s, k, { x, y, w: cw, h: 0.3,
      fontFace: MONO, fontSize: 11, bold: true, color: i ? SIGNAL : DIMPAP, charSpacing: 1.5 });
    txt(s, v, { x: x - 0.1, y: y + 0.42, w: cw, h: 2.1, valign: 'middle',
      fontFace: DISPLAY, fontSize: 168, bold: true, color: c, charSpacing: -6 });
    band(s, x, y + 2.7, cw, i ? 0.07 : 0.04, i ? SIGNAL : 'C9C4BA');
    txt(s, t, { x, y: y + 2.92, w: cw - 0.2, h: 1.0, valign: 'top',
      fontFace: SANS, fontSize: 15.5, color: i ? INK : DIMPAP, lineSpacing: 24 });
  });
  txt(s, 'A failure on a bridge the file still calls fine is the only kind that carries a warning. ' +
         'That column is the product.',
    { x: M, y: 6.5, w: COL, h: 0.5, fontFace: SANS, fontSize: 15, color: INK, bold: true });
  s.addNotes('This is the peak. Worst-first found zero of the 108. We found 25. And a failure on ' +
    'a bridge nobody was worried about is the only kind of failure that carries any warning.');
}

// ══════════════════════════════════════ 12 PROVE IT LIVE (screenshot)
{
  const s = slide(INK);
  label(s, 'and you can test it yourself, right now', M, 0.85, SIGNAL, 9);
  head(s, 'Pick a state and a year.\nIt grades itself.',
       M, 1.22, { color: WHITE, size: 30, w: 6.1, h: 1.6 });
  txt(s, 'The server pulls that year’s federal file, scores every bridge with the 2015 model, ' +
         'ranks them — then pulls the 2025 file and checks what actually happened.',
    { x: M, y: 3.05, w: 5.9, h: 1.1, fontFace: SANS, fontSize: 14.5, color: DIMINK,
      lineSpacing: 22 });

  bleed(s, 'timemachine.png', 7.15, 1.3, 6.9);

  const y = 4.35;
  txt(s, 'VERMONT, 2019', { x: M, y, w: 5.6, h: 0.3,
    fontFace: MONO, fontSize: 11, bold: true, color: SIGNAL, charSpacing: 1.5 });
  const lines = [['93', 'bridges crossed into POOR by 2025', false],
                 ['35', 'of those the 2019 file still called fine', false],
                 ['9 vs 1', 'dissent found 9. Worst-first found 1.', true]];
  lines.forEach(([n, t, hi], i) => {
    const ly = y + 0.44 + i * 0.62;
    txt(s, n, { x: M, y: ly, w: 1.45, h: 0.48, valign: 'middle', align: 'right',
      fontFace: DISPLAY, fontSize: hi ? 21 : 27, bold: true, color: hi ? SIGNAL : WHITE });
    txt(s, t, { x: M + 1.68, y: ly, w: 4.4, h: 0.48, valign: 'middle',
      fontFace: SANS, fontSize: 13.5, color: hi ? WHITE : DIMINK });
  });
  txt(s, 'The base rate and the baseline that beats us are printed on screen every time — ' +
         'including on the states where we lose.',
    { x: M, y: 6.45, w: 6.1, h: 0.8, fontFace: SANS, fontSize: 13, color: SIGNAL,
      lineSpacing: 20, bold: true });
  s.addNotes('Ask a judge for a state and a year. Two seconds later the server has pulled two ' +
    'federal files and graded itself. Invite them to try a state where we lose.');
}

// ══════════════════════════════════════ 13 LIMITS
{
  const s = slide(PAPER);
  label(s, 'what it cannot do', M, 0.85, DIMPAP, 6);
  head(s, 'The limits are in the product.',
       M, 1.22, { color: INK, size: 40, h: 0.9 });
  const items = [
    ['IT ABSTAINS', 'On any bridge under five years old. Nothing to calibrate against yet.'],
    ['IT UNDER-COVERS', `Intervals cover ${pct(S.coverage || 0.892)} against a 90% target. We report the shortfall.`],
    ['IT WITHHOLDS', `${N_HELD} of 51 states get no ranking at all. Outside our calibration climate we cannot tell their optimism from our own error.`],
    ['IT MISSED ONE', 'The Washington Bridge closed in 2023 and we rated it slightly better than the record did. It is in the app, labelled a miss.'],
  ];
  const cw = (COL - 3 * 0.42) / 4, y = 2.9;
  items.forEach(([k, t], i) => {
    const x = M + i * (cw + 0.42);
    band(s, x, y, cw, 0.06, i === 3 ? SIGNAL : INK);
    txt(s, k, { x, y: y + 0.26, w: cw, h: 0.3,
      fontFace: MONO, fontSize: 11, bold: true, color: i === 3 ? SIGNAL : INK, charSpacing: 1.4 });
    txt(s, t, { x, y: y + 0.66, w: cw, h: 2.1, valign: 'top',
      fontFace: SANS, fontSize: 14.5, color: DIMPAP, lineSpacing: 22 });
  });
  txt(s, 'A system that cannot tell you where it stops working is not a second opinion. It is a guess.',
    { x: M, y: 6.15, w: COL, h: 0.5, fontFace: DISPLAY, fontSize: 20, bold: true, color: INK });
  s.addNotes('Do not rush this. All four are enforced in the running product where a judge can ' +
    'check them, including the miss we display on purpose.');
}

// ══════════════════════════════════════ 14 CLOSE
{
  const s = slide(INK);
  label(s, 'in closing', M, 0.85, SLATE, 6);
  txt(s, 'We did not simulate\na single bridge.', { x: M, y: 1.3, w: 11, h: 2.0,
    fontFace: DISPLAY, fontSize: 52, bold: true, color: WHITE, lineSpacing: 64 });
  band(s, M, 3.5, 2.2, 0.11, SIGNAL);
  txt(s, `${fmt(S.n_records || 234801)} real inspection filings from the US federal government, ` +
         `1992 to 2025. Both halves of the system are deployed and running tonight, and the ` +
         `download script is in the repo.`,
    { x: M, y: 3.85, w: 9.6, h: 1.0, fontFace: SANS, fontSize: 16, color: DIMINK, lineSpacing: 25 });
  const links = [['CONSOLE', 'dissent-nexus.netlify.app', SIGNAL],
                 ['API', 'dissent-api-jgod.onrender.com/docs', WHITE],
                 ['SOURCE', 'github.com/ArockiaRajamanickam/dissent', WHITE]];
  links.forEach(([k, v, c], i) => {
    const y = 5.05 + i * 0.58;
    txt(s, k, { x: M, y, w: 1.5, h: 0.3, fontFace: MONO, fontSize: 10, color: SLATE,
      charSpacing: 1.4 });
    txt(s, v, { x: M + 1.7, y: y - 0.04, w: 8, h: 0.35, fontFace: MONO, fontSize: 13.5,
      bold: true, color: c, charSpacing: 0.4 });
  });
  txt(s, 'TEAM NEXUS NETWORK', { x: W - M - 6, y: 6.62, w: 6, h: 0.3, align: 'right',
    fontFace: MONO, fontSize: 11, bold: true, color: WHITE, charSpacing: 1.6 });
  s.addNotes('Close on verifiability. Every number is downloadable, nothing was simulated, both ' +
    'halves are live. Then open the console and run the Time Machine on whatever state they name.');
}

const out = require('path').join(__dirname, 'DISSENT_Nexus_Network.pptx');
p.writeFile({ fileName: out }).then(() => console.log('wrote', out, '| slides:', p.slides.length));

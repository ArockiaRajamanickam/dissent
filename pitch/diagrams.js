/* Diagrams for the DISSENT explainer deck.
 *
 * Drawn entirely in pptxgenjs primitives so they stay crisp at any projector
 * resolution and match the deck's type. The visual register is technical
 * drawing, not infographic: hairlines, right angles, restraint. Crimson is
 * rationed — it only ever marks the disagreement itself.
 */
const K = require('./build_explainer.js');
const { p, SERIF, MONO, CREAM, PALE, DIM, CRIMSON, STEEL, OCHRE, HAIR, PAPER, HAIRL,
        INK, GREY, MOSS, ROSE, NAVY, DESK } = K;

const box = (s, x, y, w, h, opts = {}) => s.addShape(p.ShapeType.rect, {
  x, y, w, h,
  fill: opts.fill ? { color: opts.fill, transparency: opts.t || 0 } : { type: 'none' },
  line: { color: opts.line || HAIR, width: opts.lw || 1, dashType: opts.dash || 'solid' },
});

const arrow = (s, x1, y1, x2, y2, opts = {}) => s.addShape(p.ShapeType.line, {
  x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
  line: { color: opts.color || DIM, width: opts.lw || 1.1,
          dashType: opts.dash || 'solid',
          beginArrowType: opts.begin || 'none', endArrowType: opts.end || 'triangle' },
  flipH: x2 < x1, flipV: y2 < y1,
});

const lbl = (s, text, x, y, w, opts = {}) => s.addText(text, {
  x, y, w, h: opts.h || 0.26, isTextBox: true, margin: 0, valign: opts.valign || 'top',
  align: opts.align || 'left', fontFace: opts.mono ? MONO : SERIF,
  fontSize: opts.size || 11, bold: opts.bold || false, italic: opts.italic || false,
  color: opts.color || PALE, charSpacing: opts.mono ? 0.9 : 0,
  lineSpacing: (opts.size || 11) * 1.4,
});

/* ------------------------------------------------------------------ 1. TWO WITNESSES
 * One bridge, two accounts, and the gap between them as the output.
 * Left column is the institution. Right column is the evidence. They meet at a
 * crimson bar that is the only saturated thing on the slide.
 */
function twoWitness(s, x, y, w, h) {
  // Explicit geometry: two columns of equal width with a real gutter between
  // them, centred in the frame, and every element inside a column given its own
  // vertical slot so nothing can land on anything else.
  const colW = 3.45, gutter = 1.75;
  const midX = x + w / 2;
  const lx = midX - gutter / 2 - colW;      // left column origin
  const rx = midX + gutter / 2;             // right column origin

  // ---- the subject
  const subW = 2.4, subH = 0.48;
  box(s, midX - subW / 2, y, subW, subH, { line: HAIR, lw: 1 });
  lbl(s, 'ONE BRIDGE', midX - subW / 2, y + 0.135, subW,
      { mono: true, size: 10, bold: true, color: CREAM, align: 'center' });

  const colY = y + 1.0, colH = 2.92;
  // slots inside a column
  const sTitle = colY + 0.2, sHead = colY + 0.52, sDesc = colY + 1.28,
        sChip = colY + 1.92, sFoot = colY + 2.56;
  const rW = 0.72, rH = 0.56;

  const column = (cx, opts) => {
    box(s, cx, colY, colW, colH, { fill: opts.fill, t: opts.t, line: opts.line, lw: 1 });
    lbl(s, opts.kicker, cx + 0.16, sTitle, colW - 0.32,
        { mono: true, size: 9.2, bold: true, color: opts.kickerColor, align: 'center' });
    lbl(s, opts.head, cx + 0.16, sHead, colW - 0.32,
        { size: 14, color: opts.headColor, align: 'center', h: 0.66 });
    lbl(s, opts.desc, cx + 0.2, sDesc, colW - 0.4,
        { size: 10.2, italic: true, color: opts.descColor, align: 'center', h: 0.58 });
    s.addShape(p.ShapeType.rect, { x: cx + colW / 2 - rW / 2, y: sChip, w: rW, h: rH,
      fill: { color: opts.chipFill }, line: { type: 'none' } });
    lbl(s, opts.value, cx + colW / 2 - rW / 2, sChip + (opts.value.length > 1 ? 0.09 : 0.05), rW,
        { size: opts.value.length > 1 ? 20 : 25, bold: true, color: 'FFFFFF',
          align: 'center', h: 0.5 });
    lbl(s, opts.foot, cx + 0.16, sFoot, colW - 0.32,
        { mono: true, size: 7.6, color: opts.footColor, align: 'center' });
  };

  column(lx, {
    fill: PAPER, t: 6, line: HAIRL,
    kicker: 'THE PAPER WITNESS', kickerColor: OCHRE,
    head: 'What the institution believes', headColor: INK,
    desc: 'An inspector visits every 24 months\nand files one number from 0 to 9.', descColor: GREY,
    chipFill: OCHRE, value: '7', foot: 'FILED RATING', footColor: GREY,
  });
  column(rx, {
    fill: STEEL, t: 88, line: STEEL,
    kicker: 'THE PHYSICS WITNESS', kickerColor: '7E9BD6',
    head: 'What the evidence implies', headColor: CREAM,
    desc: 'Age, traffic, trucks, span, material,\nfreeze-thaw, rainfall. No rating among them.',
    descColor: '9AA6CC',
    chipFill: STEEL, value: '4.7', foot: 'PREDICTED RATING', footColor: '8A93B8',
  });

  // ---- feeds from the subject into each column
  arrow(s, midX - 0.42, y + subH, lx + colW / 2, colY, { color: HAIR });
  arrow(s, midX + 0.42, y + subH, rx + colW / 2, colY, { color: HAIR });
  lbl(s, 'the file', lx + colW / 2 + 0.15, y + 0.58, 1.5,
      { mono: true, size: 8, color: DIM });
  lbl(s, 'the structure', rx + colW / 2 - 1.65, y + 0.58, 1.5,
      { mono: true, size: 8, color: DIM, align: 'right' });

  // ---- the disagreement
  const dY = colY + colH + 0.42, dW = 6.6, dH = 0.8;
  arrow(s, lx + colW / 2, colY + colH, lx + colW / 2, dY, { color: HAIR });
  arrow(s, rx + colW / 2, colY + colH, rx + colW / 2, dY, { color: HAIR });
  s.addShape(p.ShapeType.rect, { x: midX - dW / 2, y: dY, w: dW, h: dH,
    fill: { color: CRIMSON }, line: { type: 'none' } });
  s.addText([
    { text: 'THE DISSENT   ', options: { fontFace: MONO, fontSize: 10, bold: true,
                                          color: 'FFD9DE', charSpacing: 1.4 } },
    { text: '2.3 rating steps of disagreement', options: { fontFace: SERIF, fontSize: 15,
                                                            bold: true, color: 'FFFFFF' } },
  ], { x: midX - dW / 2, y: dY + 0.1, w: dW, h: 0.32, isTextBox: true, margin: 0,
       align: 'center', valign: 'middle' });
  lbl(s, 'This gap is the product. Not another risk score, the contradiction itself.',
      midX - dW / 2, dY + 0.46, dW,
      { size: 10.5, italic: true, color: 'FFE2E6', align: 'center' });
}

/* ------------------------------------------------------------------ 2. PIPELINE
 * Public inputs on the left, a frozen model in the middle, a ranked docket out
 * the right. Reads left to right in one pass.
 */
function pipeline(s, x, y, w, h) {
  const steps = [
    { k: 'INPUT', t: 'Federal file\n+ weather', d: 'Both public. Both free.' },
    { k: 'FEATURES', t: '18 physical\nfeatures', d: 'No filed rating is among them.' },
    { k: 'MODEL', t: 'Frozen at\n2015', d: 'It has never seen a later year.' },
    { k: 'INTERVAL', t: 'Conformal\n±1.41', d: 'Every verdict carries its uncertainty.' },
    { k: 'COMPARE', t: 'Record minus\nphysics', d: 'Three channels of disagreement.' },
    { k: 'OUTPUT', t: 'Ranked\ndocket', d: 'Capped to a quarter of real capacity.' },
  ];
  const n = steps.length, gap = 0.2;
  const bw = (w - gap * (n - 1)) / n, bh = 1.62;
  steps.forEach((st, i) => {
    const bx = x + i * (bw + gap);
    const isOut = i === n - 1;
    box(s, bx, y, bw, bh, {
      fill: isOut ? CRIMSON : PAPER, t: isOut ? 0 : 8,
      line: isOut ? CRIMSON : HAIRL, lw: 1,
    });
    lbl(s, st.k, bx + 0.1, y + 0.16, bw - 0.2, {
      mono: true, size: 7.8, bold: true, align: 'center',
      color: isOut ? 'FFD9DE' : OCHRE });
    lbl(s, st.t, bx + 0.08, y + 0.46, bw - 0.16, {
      size: 12.5, bold: true, align: 'center', h: 0.62,
      color: isOut ? 'FFFFFF' : INK });
    lbl(s, st.d, bx + 0.1, y + 1.12, bw - 0.2, {
      size: 8.6, italic: true, align: 'center', h: 0.44,
      color: isOut ? 'FFE2E6' : GREY });
    if (i < n - 1) arrow(s, bx + bw + 0.02, y + bh / 2, bx + bw + gap - 0.02, y + bh / 2,
                         { color: DIM, lw: 1.2 });
  });
  // the one thing to remember, set below the run
  const ny = y + bh + 0.4;
  s.addShape(p.ShapeType.line, { x, y: ny, w, h: 0, line: { color: HAIR, width: 0.75 } });
  s.addText([
    { text: 'The whole design is one refusal:  ', options: { fontFace: SERIF, fontSize: 13, color: PALE } },
    { text: 'no inspector rating is ever one of its inputs.',
      options: { fontFace: SERIF, fontSize: 13, bold: true, color: CREAM } },
    { text: '  That is what makes it a second opinion rather than an echo.',
      options: { fontFace: SERIF, fontSize: 13, color: PALE } },
  ], { x, y: ny + 0.16, w, h: 0.46, isTextBox: true, margin: 0, valign: 'top',
       align: 'center', lineSpacing: 19 });
}

/* ------------------------------------------------------------------ 3. THE WALL
 * Train / calibrate / holdout as year bands with an unmistakable wall. This is
 * the slide that makes a technical judge relax, so the wall has to be literal.
 */
function timeline(s, x, y, w, h) {
  const y0 = 1992, y1 = 2025, span = y1 - y0;
  const px = yr => x + ((yr - y0) / span) * w;
  const bandY = y + 0.62, bandH = 0.86;

  const bands = [
    { a: 1992, b: 2015, k: 'TRAINED', c: STEEL, t: 62,
      note: `${K.fmt(K.S.trained_rows || 168864)} filings the model learned from` },
    { a: 2015, b: 2018, k: 'CALIBRATED', c: OCHRE, t: 52,
      note: 'interval set here' },
    { a: 2018, b: 2025, k: 'NEVER SEEN', c: CRIMSON, t: 20,
      note: '46,541 rows of pure holdout' },
  ];
  bands.forEach(b => {
    const bx = px(b.a), bw = px(b.b) - px(b.a);
    s.addShape(p.ShapeType.rect, { x: bx, y: bandY, w: bw, h: bandH,
      fill: { color: b.c, transparency: b.t }, line: { color: b.c, width: 1 } });
    lbl(s, b.k, bx + 0.06, bandY + 0.2, bw - 0.12,
        { mono: true, size: 9.5, bold: true, color: 'FFFFFF', align: 'center' });
    lbl(s, b.note, bx + 0.06, bandY + 0.5, bw - 0.12,
        { size: 9.2, italic: true, color: 'E8E4DC', align: 'center' });
  });

  // the wall
  const wx = px(2015);
  s.addShape(p.ShapeType.line, { x: wx, y: bandY - 0.5, w: 0, h: bandH + 1.0,
    line: { color: CREAM, width: 2.25 } });
  lbl(s, 'THE WALL', wx - 1.0, bandY - 0.82, 2.0,
      { mono: true, size: 9.5, bold: true, color: CREAM, align: 'center' });

  // year ticks
  [1992, 2000, 2008, 2015, 2018, 2025].forEach(yr => {
    s.addShape(p.ShapeType.line, { x: px(yr), y: bandY + bandH, w: 0, h: 0.11,
      line: { color: DIM, width: 0.9 } });
    lbl(s, String(yr), px(yr) - 0.32, bandY + bandH + 0.15, 0.64,
        { mono: true, size: 8.4, color: DIM, align: 'center' });
  });

  lbl(s, 'Everything we claim is measured to the right of the wall. Nothing the model saw is used to score it.',
      x, bandY + bandH + 0.62, w,
      { size: 12.5, italic: true, color: PALE, align: 'center' });
}

/* ------------------------------------------------------------------ 4. THE BLIND SPOT
 * Two ranking strategies over the same 166 failures. The point is not that one
 * number is bigger: it is that one column is a zero.
 */
function blindSpot(s, x, y, w, h) {
  const colW = (w - 0.5) / 2;
  const rows = [
    { seg: 'The record already called it bad', n: K.POOR.n, ours: K.POOR.ours, worst: K.POOR.worst,
      note: 'Everyone can see these.' },
    { seg: 'The record still called it FINE', n: K.FINE.n, ours: K.FINE.ours, worst: K.FINE.worst,
      note: 'Nobody was watching these.', hero: true },
  ];
  const hdrH = 0.46, rowH = 1.18;
  // header
  lbl(s, 'WHAT THE FILE SAID AT THE TIME', x, y, w * 0.42,
      { mono: true, size: 8.4, bold: true, color: DIM });
  lbl(s, 'FAILURES', x + w * 0.44, y, w * 0.14,
      { mono: true, size: 8.4, bold: true, color: DIM, align: 'center' });
  lbl(s, 'SORT BY WORST RATING', x + w * 0.59, y, w * 0.2,
      { mono: true, size: 8.4, bold: true, color: DIM, align: 'center' });
  lbl(s, 'DISSENT', x + w * 0.80, y, w * 0.2,
      { mono: true, size: 8.4, bold: true, color: ROSE, align: 'center' });
  K.rule(s, x, y + hdrH - 0.08, w, HAIR, 1);

  rows.forEach((r, i) => {
    const ry = y + hdrH + i * rowH;
    if (r.hero) s.addShape(p.ShapeType.rect, { x: x - 0.14, y: ry - 0.06, w: w + 0.28, h: rowH - 0.08,
      fill: { color: CRIMSON, transparency: 88 }, line: { type: 'none' } });
    lbl(s, r.seg, x, ry + 0.16, w * 0.42,
        { size: 14, bold: r.hero, color: r.hero ? CREAM : PALE, h: 0.5 });
    lbl(s, r.note, x, ry + 0.56, w * 0.42,
        { size: 10, italic: true, color: r.hero ? ROSE : GREY });
    lbl(s, String(r.n), x + w * 0.44, ry + 0.14, w * 0.14,
        { size: 22, bold: true, color: PALE, align: 'center', h: 0.5 });
    lbl(s, String(r.worst), x + w * 0.59, ry + 0.1, w * 0.2,
        { size: r.hero ? 34 : 22, bold: true, color: r.hero ? GREY : PALE,
          align: 'center', h: 0.62 });
    lbl(s, String(r.ours), x + w * 0.80, ry + 0.1, w * 0.2,
        { size: r.hero ? 34 : 22, bold: true, color: r.hero ? CRIMSON : PALE,
          align: 'center', h: 0.62 });
    if (i === 0) K.rule(s, x, ry + rowH - 0.12, w, HAIR, 0.6);
  });

  const fy = y + hdrH + rows.length * rowH + 0.2;
  s.addText([
    { text: 'Sorting by the worst recorded rating found ', options: { fontFace: SERIF, fontSize: 14, color: PALE } },
    { text: 'none', options: { fontFace: SERIF, fontSize: 14, bold: true, color: CREAM } },
    { text: ' of the ', options: { fontFace: SERIF, fontSize: 14, color: PALE } },
    { text: `${K.FINE.n}`, options: { fontFace: SERIF, fontSize: 14, bold: true, color: CREAM } },
    { text: ' failures on bridges the paperwork still called fine. It cannot: it is blind to them by construction.',
      options: { fontFace: SERIF, fontSize: 14, color: PALE } },
  ], { x, y: fy, w, h: 0.6, isTextBox: true, margin: 0, valign: 'top', lineSpacing: 21 });
}

module.exports = { twoWitness, pipeline, timeline, blindSpot, box, arrow, lbl };

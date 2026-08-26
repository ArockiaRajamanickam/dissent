/* DISSENT — flat build kit.
 *
 * Every background is a SOLID colour. There is no photography, no texture, no
 * gradient and no card border anywhere in this deck. What carries the design is
 * scale contrast, colour blocking and whitespace — which is what separates a
 * deck a person made from a deck a template made.
 */
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const DATA = path.join(HERE, '..', 'site', 'data');
const rd = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const S = rd('summary_RI.json');
const NAT = rd('national_meta.json');
const CT = S.controls;
const FINE = CT.segments.record_still_fine;
const POOR = CT.segments.record_already_poor;
const IDX = JSON.parse(fs.readFileSync(
  path.join(HERE, '..', 'backend', 'data', 'index_seed.json'), 'utf8'));

const fmt = n => Number(n).toLocaleString('en-US');
const pct = x => Math.round(x * 100) + '%';

// ─────────────────────────────────────────────────────────── palette
// Five values. That is the whole system.
const INK    = '101418';   // near-black, the dominant ground
const PAPER  = 'F4F1EA';   // warm off-white, the light ground
const SIGNAL = 'E8412F';   // the one saturated accent: disagreement, and only that
const STEEL  = '1F4FD8';   // the physics witness
const SLATE  = '6B7280';   // muted support text
const WHITE  = 'FFFFFF';
const DIMINK = '8A8F98';   // muted text on ink
const DIMPAP = '767B84';   // muted text on paper

// ─────────────────────────────────────────────────────────── type
// Three faces that ship with Office on Windows AND Mac, AND are installed on this
// machine — so the QA render is what a judge actually sees rather than a
// substitute. Century Gothic, Segoe UI, Calibri and Consolas all failed that
// second test here, which is why none of them are used.
//   Arial Black, set very large with tight tracking, is the bold Swiss-poster
//   register this deck wants. Arial carries text. Courier New is the machine voice.
const DISPLAY = 'Arial Black';
const SANS    = 'Arial';
const MONO    = 'Courier New';

const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.author = 'Team Nexus Network';
p.title = 'DISSENT';
const W = 13.333, H = 7.5;
const M = 0.9;                    // generous margin: whitespace is the design
const COL = (W - 2 * M);

// ─────────────────────────────────────────────────────────── primitives
const slide = (bg) => {
  const s = p.addSlide();
  s.background = { color: bg || INK };
  return s;
};

/** Full-bleed colour band, for blocking a slide into two zones. */
const band = (s, x, y, w, h, color) => s.addShape(p.ShapeType.rect, {
  x, y, w, h, fill: { color }, line: { type: 'none' },
});

const txt = (s, text, o) => s.addText(text, {
  isTextBox: true, margin: 0, ...o,
});

/** Small tracked label. The only decorative element in the deck. */
const label = (s, t, x, y, color, w, align) => txt(s, String(t).toUpperCase(), {
  x, y, w: w || 6, h: 0.26, valign: 'top', align: align || 'left',
  fontFace: MONO, fontSize: 10, bold: true, color, charSpacing: 1.8,
});

/** The headline. Big, flush left, never centred, never more than three lines. */
const head = (s, t, x, y, o = {}) => txt(s, t, {
  x, y, w: o.w || COL, h: o.h || 1.6, valign: 'top',
  fontFace: DISPLAY, fontSize: o.size || 40, bold: true,
  color: o.color || WHITE, lineSpacing: (o.size || 40) * 1.12,
});

const body = (s, t, x, y, w, o = {}) => txt(s, t, {
  x, y, w, h: o.h || 1.0, valign: 'top',
  fontFace: SANS, fontSize: o.size || 16, color: o.color || DIMINK,
  lineSpacing: (o.size || 16) * 1.5, bold: o.bold || false, align: o.align || 'left',
});

/** A hero number. One per slide, maximum. */
const hero = (s, n, x, y, w, o = {}) => txt(s, String(n), {
  x, y, w, h: o.h || 2.3, valign: 'middle', align: o.align || 'left',
  fontFace: DISPLAY, fontSize: o.size || 150, bold: true, color: o.color || WHITE,
  charSpacing: o.tracking == null ? -2 : o.tracking,
});

/** Screenshot, aspect-fit into a box, with a real cast shadow so it sits ON the
 *  colour rather than floating in it. No border: a border reads as a card. */
const DIMS = JSON.parse(fs.readFileSync(path.join(HERE, 'flat_dims.json'), 'utf8'));
const SHOT = path.join(HERE, 'shots', 'flat');
const shot = (s, file, bx, by, bw, bh, o = {}) => {
  const d = DIMS[file];
  if (!d) throw new Error('no dims for ' + file);
  const ar = d.w / d.h;
  let w = bw, h = bw / ar;
  if (h > bh) { h = bh; w = bh * ar; }
  const x = o.align === 'left' ? bx : (o.align === 'right' ? bx + bw - w : bx + (bw - w) / 2);
  const y = o.valign === 'top' ? by : (o.valign === 'bottom' ? by + bh - h : by + (bh - h) / 2);
  s.addImage({
    path: path.join(SHOT, file), x, y, w, h,
    shadow: { type: 'outer', color: '000000', blur: 22, offset: 7, angle: 90,
              opacity: o.shadow == null ? 0.30 : o.shadow },
  });
  return { x, y, w, h };
};

/** Screenshot sized by WIDTH and allowed to run past the slide edge. Bleeding
 *  off an edge is what stops a screenshot looking like it is floating in a hole. */
const bleed = (s, file, x, y, w, o = {}) => {
  const d = DIMS[file];
  if (!d) throw new Error('no dims for ' + file);
  const h = w * d.h / d.w;
  s.addImage({
    path: path.join(SHOT, file), x, y, w, h,
    shadow: { type: 'outer', color: '000000', blur: 26, offset: 8, angle: 90,
              opacity: o.shadow == null ? 0.34 : o.shadow },
  });
  return { x, y, w, h };
};

const caption = (s, t, x, y, w, color) => txt(s, t, {
  x, y, w, h: 0.5, valign: 'top',
  fontFace: SANS, fontSize: 11.5, color: color || DIMINK, lineSpacing: 16,
});

const pageNo = (s, color) => { s.slideNumber = {
  x: W - 0.62, y: H - 0.42, color, fontFace: MONO, fontSize: 9 }; };

module.exports = {
  p, W, H, M, COL,
  INK, PAPER, SIGNAL, STEEL, SLATE, WHITE, DIMINK, DIMPAP,
  DISPLAY, SANS, MONO,
  slide, band, txt, label, head, body, hero, shot, bleed, caption, pageNo,
  fmt, pct, S, NAT, CT, FINE, POOR, IDX,
};

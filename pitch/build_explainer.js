/* DISSENT — the explainer deck.
 *
 * Built to be understood with nobody talking: every headline is a full-sentence
 * assertion, every screenshot is captioned, and the numbers are read from the
 * shipped model artifacts rather than typed in by hand.
 *
 * Type system is deliberately two families. Cambria and Courier New both ship
 * with Office on Windows and Mac, so the file renders the same on a machine we
 * do not control. The split carries meaning: the SERIF is the paper witness —
 * the official record and what actually happened — and the MONOSPACE is the
 * physics witness, the machine printing its own readouts, including its bad news.
 */
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const DATA = path.join(HERE, '..', 'site', 'data');
const BG = path.join(HERE, 'bg');
const SHOT = path.join(HERE, 'shots', 'prepped');
const rd = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

const S = rd('summary_RI.json');
const NAT = rd('national_meta.json');
const GLOBAL = rd('global.json');
const CT = S.controls;
const FINE = CT.segments.record_still_fine;
const POOR = CT.segments.record_already_poor;
const IDX = JSON.parse(fs.readFileSync(
  path.join(HERE, '..', 'backend', 'data', 'index_seed.json'), 'utf8'));

const fmt = n => Number(n).toLocaleString('en-US');
const pct = x => Math.round(x * 100) + '%';

// ------------------------------------------------------------------ palette
const DESK = '0F1738', NAVY = '16204A', CREAM = 'FAF8F4', PAPER = 'FFFFFF';
const CRIMSON = 'C6283C', STEEL = '3A5CA8', OCHRE = '8A6420', INK = '20263E';
const DIM = '8A93B8', GREY = '6A7088', ROSE = 'E4607A', MOSS = '0E8A78';
const PALE = 'C8CBDA';                 // body text reversed out of navy
const HAIR = '2A3560';                 // hairline on dark
const HAIRL = 'D9D5C9';                // hairline on cream

// ------------------------------------------------------------------ type
const SERIF = 'Cambria';               // the paper witness
const MONO = 'Courier New';            // the physics witness
const T = {
  deck: 54, section: 38, title: 29, subhead: 17,
  body: 14.5, small: 12.5, caption: 10.5, label: 9.5, stat: 40, statSm: 26,
};

const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';              // 13.333 x 7.5in
p.author = 'Team Nexus Network';
p.company = 'Dept. of CSE (Cyber Security)';
p.title = 'DISSENT — the machine second opinion on America’s bridges';
const W = 13.333, H = 7.5, M = 0.72;

// ------------------------------------------------------------------ helpers
const plate = (s, file) => s.addImage({ path: path.join(BG, file), x: 0, y: 0, w: W, h: H });

/** A soft dark panel so text never fights the plate underneath it. */
const scrim = (s, x, y, w, h, opts = {}) => s.addShape(p.ShapeType.rect, {
  x, y, w, h, fill: { color: opts.color || DESK, transparency: opts.t == null ? 22 : opts.t },
  line: { type: 'none' },
});

const pageNo = (s, col) => { s.slideNumber = {
  x: W - 0.55, y: H - 0.36, color: col, fontFace: MONO, fontSize: 8.5 }; };

const darkSlide = (bgfile) => {
  const s = p.addSlide();
  s.background = { color: DESK };
  if (bgfile) plate(s, bgfile);
  pageNo(s, '4A5480');
  return s;
};
const lightSlide = (bgfile) => {
  const s = p.addSlide();
  s.background = { color: CREAM };
  if (bgfile) plate(s, bgfile);
  pageNo(s, 'B3AC9A');
  return s;
};

/** Machine-voice eyebrow. Always monospace, always tracked, always caps. */
const kicker = (s, text, x, y, color, w, align) => s.addText(String(text).toUpperCase(), {
  x, y, w: w || 7, h: 0.26, isTextBox: true, margin: 0, valign: 'top', align: align || 'left',
  fontFace: MONO, fontSize: T.label, bold: true, color: color || DIM, charSpacing: 1.6,
});

/** The assertion. This is the takeaway, not a topic phrase. */
const headline = (s, text, x, y, opts = {}) => s.addText(text, {
  x, y, w: opts.w || W - 2 * M, h: opts.h || 1.15, isTextBox: true, margin: 0, valign: 'top',
  fontFace: SERIF, fontSize: opts.size || T.title, bold: opts.bold !== false,
  color: opts.color || CREAM, lineSpacing: (opts.size || T.title) * 1.22,
});

const body = (s, text, x, y, w, opts = {}) => s.addText(text, {
  x, y, w, h: opts.h || 1.2, isTextBox: true, margin: 0, valign: 'top',
  fontFace: opts.mono ? MONO : SERIF, fontSize: opts.size || T.body,
  color: opts.color || PALE, lineSpacing: (opts.size || T.body) * 1.52,
  italic: opts.italic || false, bold: opts.bold || false, align: opts.align || 'left',
});

const caption = (s, text, x, y, w, opts = {}) => s.addText(text, {
  x, y, w, h: opts.h || 0.42, isTextBox: true, margin: 0, valign: 'top',
  fontFace: SERIF, fontSize: T.caption, italic: true,
  color: opts.color || DIM, lineSpacing: T.caption * 1.42, align: opts.align || 'left',
});

/** Thin rule. Used sparingly — never as decoration under a title. */
const rule = (s, x, y, w, color, weight) => s.addShape(p.ShapeType.line, {
  x, y, w, h: 0, line: { color: color || HAIR, width: weight || 0.75 },
});

/** A big number with its label. The number is the paper witness, so serif. */
const stat = (s, value, label, x, y, w, opts = {}) => {
  s.addText(String(value), {
    x, y, w, h: opts.vh || 0.62, isTextBox: true, margin: 0, valign: 'bottom',
    fontFace: SERIF, fontSize: opts.size || T.stat, bold: true,
    color: opts.color || CREAM, align: opts.align || 'left',
  });
  s.addText(String(label).toUpperCase(), {
    x, y: y + (opts.vh || 0.62) + 0.06, w, h: opts.lh || 0.5, isTextBox: true, margin: 0,
    valign: 'top', fontFace: MONO, fontSize: 8.2, color: opts.labelColor || DIM,
    charSpacing: 0.9, lineSpacing: 11.5, align: opts.align || 'left',
  });
};

/** Screenshot, sized to fit a box while preserving aspect, with a cast shadow. */
const DIMS = JSON.parse(fs.readFileSync(path.join(HERE, 'shot_dims.json'), 'utf8'));
const shot = (s, file, bx, by, bw, bh, opts = {}) => {
  const d = DIMS[file];
  if (!d) throw new Error('no dims for ' + file);
  const ar = d.w / d.h;
  let w = bw, h = bw / ar;
  if (h > bh) { h = bh; w = bh * ar; }
  const x = opts.align === 'left' ? bx : bx + (bw - w) / 2;
  const y = opts.valign === 'top' ? by : by + (bh - h) / 2;
  s.addImage({
    path: path.join(SHOT, file), x, y, w, h,
    shadow: { type: 'outer', color: '000000', blur: 18, offset: 5, angle: 90, opacity: 0.55 },
  });
  return { x, y, w, h };
};

/** Numbered call-out pin plus a leader line, for pointing INTO a screenshot. */
const pin = (s, n, x, y, opts = {}) => {
  const r = 0.235;
  s.addShape(p.ShapeType.ellipse, {
    x: x - r / 2, y: y - r / 2, w: r, h: r,
    fill: { color: opts.color || CRIMSON }, line: { color: CREAM, width: 1 },
  });
  s.addText(String(n), {
    x: x - r / 2, y: y - r / 2 + 0.012, w: r, h: r, isTextBox: true, margin: 0,
    align: 'center', valign: 'middle', fontFace: MONO, fontSize: 9, bold: true, color: 'FFFFFF',
  });
};
const leader = (s, x1, y1, x2, y2, color) => s.addShape(p.ShapeType.line, {
  x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
  line: { color: color || CRIMSON, width: 1, dashType: 'sysDot',
          beginArrowType: 'none', endArrowType: 'none' },
  flipH: x2 < x1, flipV: y2 < y1,
});

/** A note keyed to a pin, set beside the screenshot. */
const pinNote = (s, n, text, x, y, w, opts = {}) => {
  s.addText([
    { text: `${n}  `, options: { fontFace: MONO, fontSize: 10, bold: true,
                                 color: opts.color || CRIMSON } },
    { text, options: { fontFace: SERIF, fontSize: T.small, color: opts.textColor || PALE } },
  ], { x, y, w, h: opts.h || 0.62, isTextBox: true, margin: 0, valign: 'top',
       lineSpacing: T.small * 1.45 });
};

const card = (s, x, y, w, h, opts = {}) => s.addShape(p.ShapeType.rect, {
  x, y, w, h,
  fill: { color: opts.fill || PAPER, transparency: opts.t || 0 },
  line: { color: opts.line || (opts.fill === PAPER || !opts.fill ? HAIRL : HAIR),
          width: opts.lw || 0.75 },
});

module.exports = {
  p, W, H, M, T, SERIF, MONO,
  DESK, NAVY, CREAM, PAPER, CRIMSON, STEEL, OCHRE, INK, DIM, GREY, ROSE, MOSS, PALE, HAIR, HAIRL,
  darkSlide, lightSlide, plate, scrim, kicker, headline, body, caption, rule, stat,
  shot, pin, leader, pinNote, card, fmt, pct,
  S, NAT, GLOBAL, CT, FINE, POOR, IDX,
};

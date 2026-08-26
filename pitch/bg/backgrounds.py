#!/usr/bin/env python3
"""
DISSENT deck backgrounds - full-bleed raster plates for pptxgenjs.

pptxgenjs cannot do native gradient fills, so every non-flat background must be
supplied as a full-bleed image. This generates all ten plates plus a contrast QA
table measured the way it actually matters: text vs the BRIGHTEST pixels under
the text box, not vs the average.

    python3 backgrounds.py                 # 2560x1440, q90  (print / PDF export)
    python3 backgrounds.py --w 1920 --q 82 # projector build, ~150KB per plate

Deps: numpy, opencv-python, pillow.   No matplotlib, no scipy.
"""
import numpy as np, cv2, os, math, argparse
from PIL import Image, ImageDraw, ImageFont, ImageFilter

AP = argparse.ArgumentParser()
AP.add_argument('--w', type=int, default=2560)
AP.add_argument('--q', type=int, default=90)
AP.add_argument('--out', default=os.path.dirname(os.path.abspath(__file__)))
A = AP.parse_args()

W = A.w; H = int(round(W * 7.5 / 13.333)); DPI = W / 13.333
OUT = A.out; os.makedirs(OUT, exist_ok=True)

# ---- brand -----------------------------------------------------------------
DESK  = (0x0F, 0x17, 0x38);  NAVY  = (0x16, 0x20, 0x4A);  DEEP  = (0x08, 0x0C, 0x22)
CREAM = (0xFA, 0xF8, 0xF4);  CRIM  = (0xC6, 0x28, 0x3C);  STEEL = (0x3A, 0x5C, 0xA8)
OCHRE = (0x8A, 0x64, 0x20);  INK   = (0x20, 0x26, 0x3E);  GREY  = (0x6A, 0x70, 0x88)
GREY_LIFT = (0x9A, 0xA0, 0xB8)      # machine-voice grey that passes 4.5:1 on desk

DATA = os.path.normpath(os.path.join(OUT, '..', '..', 'site', 'data', 'national.bin'))
SHOT = os.path.normpath(os.path.join(OUT, '..', 'shots', '02_dossier.png'))

# ---- colour science --------------------------------------------------------
def lin(c):
    c = np.asarray(c, np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def lum(rgb):
    l = lin(rgb)
    return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]

def contrast(a, b):
    hi, lo = np.maximum(a, b), np.minimum(a, b)
    return (hi + 0.05) / (lo + 0.05)

# ---- primitives ------------------------------------------------------------
def fbm(w, h, octaves=5, base=8, seed=0, gain=0.5):
    """Value-noise fractal brownian motion. The organic layer under everything."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32); amp, norm = 1.0, 0.0
    for o in range(octaves):
        n = base * (2 ** o)
        small = rng.random((max(2, int(n * h / w)), n)).astype(np.float32)
        out += amp * cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)
        norm += amp; amp *= gain
    out /= norm
    return (out - out.min()) / (np.ptp(out) + 1e-9)

def grain(img, sigma=2.6, seed=1):
    """Per-pixel gaussian grain. THIS is what kills 8-bit gradient banding.
    Below sigma~1.8 banding returns on a projector; above ~4.5 it reads as noise."""
    rng = np.random.default_rng(seed)
    n = rng.normal(0, sigma, img.shape[:2]).astype(np.float32)[..., None]
    return np.clip(img + n, 0, 255)

def ramp(c0, c1, angle_deg=90, power=1.0):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = math.radians(angle_deg)
    t = (xx / W) * math.cos(a) + (yy / H) * math.sin(a)
    t = ((t - t.min()) / (np.ptp(t) + 1e-9)) ** power
    t = t[..., None]
    return np.array(c0, np.float32) * (1 - t) + np.array(c1, np.float32) * t

def vignette(img, strength=0.32):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2)) / 1.414
    return img * np.clip(1 - strength * (d / 0.9) ** 2, 0, 1)[..., None]

def blend(dst, rgb, mask):
    a = mask[..., None].astype(np.float32)
    return dst * (1 - a) + np.array(rgb, np.float32) * a

def font(names, size):
    for n in names:
        for d in ('/System/Library/Fonts/Supplemental/', '/System/Library/Fonts/',
                  '/Library/Fonts/'):
            p = os.path.join(d, n)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()

REPORT = []
def save(img, name, boxes, role, text=CREAM, q=None):
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    p = os.path.join(OUT, name)
    im.save(p, quality=q or A.q, subsampling=0, optimize=True)
    L = lum(np.asarray(Image.open(p).convert('RGB'), np.float32))
    tl = float(lum(np.array(text, np.float32)))
    rows = []
    for lab, x, y, w_, h_ in boxes:
        patch = L[int(y * DPI):int((y + h_) * DPI), int(x * DPI):int((x + w_) * DPI)]
        # worst case: text sits over the brightest 0.5% of pixels in its box
        worst = contrast(tl, np.percentile(patch, 99.5) if text == CREAM
                         else np.percentile(patch, 0.5))
        rows.append((lab, float(worst)))
    REPORT.append((name, os.path.getsize(p) / 1e6, role, rows))
    return p

FULL = [('full-bleed', 0.6, 0.6, 12.1, 6.3)]

# ============================================================ 01 DESK GRAIN
def desk_grain():
    img = ramp(NAVY, DEEP, 68, 1.25)
    img += (fbm(W, H, 6, 4, seed=11)[..., None] - 0.5) * 9.0
    return grain(vignette(img, 0.30), 2.8, seed=3)
save(desk_grain(), '01_desk_grain.jpg', FULL, 'BASE / any content slide')

# ============================================================ 02 DRAFTING GRID
def drafting_grid():
    img = desk_grain()
    ov = np.zeros((H, W), np.float32)
    minor, major = int(0.25 * DPI), int(1.25 * DPI)
    ov[:, ::minor] = 0.10; ov[::minor, :] = 0.10          # 0.25in minor
    ov[:, ::major] = 0.26; ov[::major, :] = 0.26          # 1.25in major
    img = blend(img, STEEL, ov)
    im = Image.fromarray(img.astype(np.uint8)); d = ImageDraw.Draw(im, 'RGBA')
    m, L_ = int(0.42 * DPI), int(0.30 * DPI)
    for cx, cy, sx, sy in [(m, m, 1, 1), (W - m, m, -1, 1),
                           (m, H - m, 1, -1), (W - m, H - m, -1, -1)]:
        d.line([cx, cy, cx + sx * L_, cy], fill=(*STEEL, 230), width=3)
        d.line([cx, cy, cx, cy + sy * L_], fill=(*STEEL, 230), width=3)
    for i, x in enumerate(range(m, W - m, minor)):        # drafting ruler
        d.line([x, m - 6, x, m - 6 - (18 if i % 5 else 34)], fill=(*GREY, 120), width=2)
    d.line([m, H - int(0.95 * DPI), W - m, H - int(0.95 * DPI)], fill=(*GREY, 110), width=1)
    return np.asarray(im, np.float32)
save(drafting_grid(), '02_drafting_grid.jpg',
     [('body block', 0.9, 2.2, 6.0, 4.0)] + FULL, 'CONTENT / method')

# ============================================================ 03 TRUSS PLATE
def truss_plate():
    img = drafting_grid()
    im = Image.fromarray(img.astype(np.uint8)); d = ImageDraw.Draw(im, 'RGBA')
    ink, dim = (*STEEL, 105), (*GREY, 80)
    y_deck, y_top = int(H * 0.72), int(H * 0.30)
    x0, x1 = int(W * 0.34), int(W * 1.22)                 # deliberately runs off-frame
    panels = 9; px = (x1 - x0) / panels
    d.line([x0 - int(0.16*W), y_deck, x1, y_deck], fill=ink, width=max(2, int(W/640)))
    d.line([x0 - int(0.16*W), y_deck + int(H/90), x1, y_deck + int(H/90)],
           fill=(*STEEL, 55), width=2)
    d.line([x0, y_top, x1, y_top], fill=ink, width=max(2, int(W/640)))
    for i in range(panels + 1):
        x = int(x0 + i * px)
        d.line([x, y_top, x, y_deck], fill=ink, width=3)
        d.line([x, y_deck, int(x0 + (i+1) * px), y_top], fill=(*STEEL, 80), width=2)
        d.line([x, y_top, int(x0 + (i+1) * px), y_deck], fill=(*STEEL, 55), width=2)
    for k in range(26):                                    # abutment hatching
        xa = x0 - int(0.16*W) + k * int(W/284)
        d.line([xa, y_deck + 20, xa - 40, y_deck + 130], fill=(*STEEL, 60), width=2)
    yd = y_deck + int(H / 7.5)                             # dimension line
    d.line([x0, yd, x1 - int(W/12), yd], fill=dim, width=2)
    for i in range(panels + 1):
        x = int(x0 + i * px)
        if x < x1 - int(W/12): d.line([x, yd - 12, x, yd + 12], fill=dim, width=2)
    return np.asarray(im, np.float32)
save(truss_plate(), '03_truss_plate.jpg',
     [('left column', 0.9, 1.4, 4.2, 4.6)] + FULL, 'TITLE / section divider')

# ============================================================ 04 CONTOUR FIELD
def contour_field():
    img = desk_grain()
    f = cv2.GaussianBlur(fbm(W, H, 5, 3, seed=77), (0, 0), 26 * W / 2560)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    f = f * 0.72 + 0.28 * (xx / W * 0.55 + yy / H * 0.45)
    f = (f - f.min()) / np.ptp(f)
    ov = np.zeros((H, W), np.float32); k = np.ones((2, 2), np.uint8)
    for i in range(1, 20):
        e = cv2.morphologyEx((f > i / 20).astype(np.uint8), cv2.MORPH_GRADIENT, k
                             ).astype(np.float32)
        if i % 5 == 0:                                     # index contour, heavier
            ov = np.maximum(ov, cv2.dilate(e, np.ones((3, 3), np.uint8)) * 0.62)
        else:
            ov = np.maximum(ov, e * 0.34)
    ov = cv2.GaussianBlur(ov, (0, 0), 0.7)
    calm = np.maximum(np.clip((xx / W - 0.30) * 2.6, 0, 1),
                      np.clip((yy / H - 0.34) * 2.6, 0, 1))
    return blend(img, STEEL, ov * (0.30 + 0.70 * np.clip(calm, 0, 1)))
save(contour_field(), '04_contour_field.jpg',
     [('calm zone TL', 0.8, 0.9, 5.4, 3.2)] + FULL, 'SECTION / climate + gate')

# ============================================================ 05 NATION AS TEXTURE
def point_field():
    img = grain(vignette(ramp(NAVY, DEEP, 70, 1.2), 0.34), 2.4, seed=9)
    dt = np.dtype([('lat', '<f4'), ('lon', '<f4'), ('r', 'i1'),
                   ('built', '<u2'), ('adt', '<u4'), ('si', 'u1')])   # 16-byte stride
    a = np.fromfile(DATA, dtype=dt)
    lat, lon, r = a['lat'].astype(np.float64), a['lon'].astype(np.float64), a['r']
    k = (lat > 23) & (lat < 51) & (lon > -126) & (lon < -65)
    lat, lon, r = lat[k], lon[k], r[k]
    p1, p2, l0, f0 = map(math.radians, (29.5, 45.5, -96.0, 23.0))     # Albers equal-area
    n = (math.sin(p1) + math.sin(p2)) / 2
    C = math.cos(p1) ** 2 + 2 * n * math.sin(p1)
    rho = np.sqrt(C - 2 * n * np.sin(np.radians(lat))) / n
    rho0 = math.sqrt(C - 2 * n * math.sin(f0)) / n
    th = n * (np.radians(lon) - l0)
    X, Y = rho * np.sin(th), rho0 - rho * np.cos(th)
    sc = 0.80 * min(W / np.ptp(X), H / np.ptp(Y))
    px = ((X - X.min()) * sc + (W - np.ptp(X) * sc) / 2).astype(np.int32)
    py = ((Y.max() - Y) * sc + (H - np.ptp(Y) * sc) / 2).astype(np.int32)
    ok = (px >= 0) & (px < W) & (py >= 0) & (py < H)
    px, py, r = px[ok], py[ok], r[ok]
    acc = np.zeros((H, W), np.float32); np.add.at(acc, (py, px), 1.0)
    hot = np.zeros((H, W), np.float32); b = r <= 4
    np.add.at(hot, (py[b], px[b]), 1.0)
    dens = np.clip(np.log1p(acc) / math.log1p(acc.max()) * 1.5, 0, 1) * 0.32  # alpha cap
    img = blend(img, (0xB9, 0xC2, 0xDC), dens)
    img = blend(img, CRIM, np.clip(np.log1p(hot) / math.log1p(max(hot.max(), 1)) * 1.6,
                                   0, 1) * 0.42)
    return img, int(ok.sum())
if os.path.exists(DATA):
    pf, npts = point_field()
    save(pf, '05_nation_texture.jpg',
         [('ocean L', 0.55, 0.7, 3.1, 3.0), ('ocean R', 9.8, 0.7, 3.0, 3.0)] + FULL,
         f'DATA / opener  ({npts:,} structures plotted)')

# ============================================================ 06 DUOTONE UNDERDECK
def duotone(src, scrim=0.78, blur=0):
    im = Image.open(src).convert('L').resize((W, H), Image.LANCZOS)
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    g = np.asarray(im, np.float32)[..., None] / 255.0
    g = np.clip((g - 0.5) * 1.25 + 0.46, 0, 1)
    duo = np.array(DEEP, np.float32) * (1 - g) + np.array(CREAM, np.float32) * g
    out = duo * (1 - scrim) + np.array(DESK, np.float32) * scrim
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    fall = np.clip(0.55 - (xx / W) * 0.62, 0, 1)[..., None]   # crush the copy side
    out = out * (1 - fall) + np.array(DESK, np.float32) * fall
    return grain(out, 3.0, seed=5)
if os.path.exists(SHOT):
    save(duotone(SHOT), '06_duotone.jpg',
         [('left third', 0.7, 1.6, 5.0, 4.2)] + FULL, 'TITLE / closing')

# ============================================================ 07 HALFTONE BAND
def halftone(src, pitch=7, theta=15.0, band=0.46, ink=(0xC8, 0xD2, 0xE8), cap=0.46):
    """Rotated dot screen. dot radius = pitch*0.60*sqrt(luma) -> proper tone ramp.
    Confined to a right-hand band so the left column stays body-safe."""
    im = Image.open(src).convert('L').resize((W, H), Image.LANCZOS)
    g = np.clip((np.asarray(im, np.float32) / 255.0 - 0.5) * 1.30 + 0.34, 0, 1)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t = math.radians(theta)
    u = xx * math.cos(t) + yy * math.sin(t)
    v = -xx * math.sin(t) + yy * math.cos(t)
    rad = (pitch * 0.60) * np.sqrt(g)
    dot = np.clip(rad - np.hypot((u % pitch) - pitch / 2, (v % pitch) - pitch / 2)
                  + 0.5, 0, 1)                              # +0.5 = antialiased edge
    x0 = (1 - band) * W
    gate = np.clip((xx - x0) / (0.55 * DPI), 0, 1)
    edge = np.clip(1 - (xx - x0) / (0.10 * DPI), 0, 1) * (xx > x0 - 4)
    img = blend(desk_grain(), ink, dot * cap * gate)
    return grain(blend(img, STEEL, edge * 0.55), 2.0, seed=7)
if os.path.exists(SHOT):
    save(halftone(SHOT), '07_halftone_band.jpg',
         [('left column', 0.7, 1.5, 6.2, 4.6), ('inside band', 7.9, 1.5, 4.8, 4.0)] + FULL,
         'CONTENT / exhibit')

# ============================================================ 08 PAPER WITNESS
def aged_paper():
    img = np.zeros((H, W, 3), np.float32) + np.array(CREAM, np.float32)
    img -= (fbm(W, H, 6, 64, seed=21)[..., None] - 0.5) * 12.0        # fibre
    img = blend(img, (0xE8, 0xDF, 0xCB),
                np.clip((fbm(W, H, 3, 3, seed=33) - 0.55) * 1.5, 0, 1) * 0.5)  # foxing
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    e = np.clip(1 - np.minimum.reduce([xx / (0.55 * DPI), yy / (0.55 * DPI),
                (W - xx) / (0.55 * DPI), (H - yy) / (0.55 * DPI)]), 0, 1)
    img = blend(img, (0xD8, 0xCB, 0xAE), e ** 2 * 0.55)               # handled edges
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im, 'RGBA')
    for y in range(int(1.5 * DPI), H - int(0.7 * DPI), int(0.34 * DPI)):
        d.line([int(0.9 * DPI), y, W - int(0.8 * DPI), y], fill=(*INK, 26), width=1)
    d.line([int(1.55 * DPI), int(0.5 * DPI), int(1.55 * DPI), H - int(0.5 * DPI)],
           fill=(*CRIM, 60), width=2)                                 # filing margin
    d.rectangle([int(0.55 * DPI), int(0.5 * DPI), W - int(0.5 * DPI), H - int(0.5 * DPI)],
                outline=(*INK, 55), width=2)
    return grain(np.asarray(im, np.float32), 3.4, seed=13)
save(aged_paper(), '08_paper_witness.jpg',
     [('body block', 0.9, 2.2, 6.0, 4.0)] + FULL, 'PAPER WITNESS (dark ink)', text=INK)

# ============================================================ 09 RISO MISREGISTER
def riso(numeral='108', kicker='FAILURES THE PAPER STILL CALLED FINE'):
    img = ramp(DEEP, (0x13, 0x1B, 0x40), 100, 1.0)
    shp = Image.new('L', (W, H), 0); d = ImageDraw.Draw(shp)
    f1 = font(['Georgia Bold.ttf', 'Times New Roman Bold.ttf', 'Georgia.ttf'],
              int(6.6 * DPI))
    f2 = font(['Courier New Bold.ttf', 'Courier New.ttf', 'Menlo.ttc'], int(0.30 * DPI))
    d.text((int(0.55 * DPI), int(0.05 * DPI)), numeral, font=f1, fill=255)
    d.text((int(0.62 * DPI), int(6.55 * DPI)), kicker, font=f2, fill=255)
    d.rectangle([int(0.62 * DPI), int(6.30 * DPI), int(12.7 * DPI), int(6.34 * DPI)],
                fill=255)
    shape = np.asarray(shp, np.float32) / 255.0
    mott = fbm(W, H, 5, 20, seed=44)                                  # ink mottle
    img = blend(img, CRIM, np.clip(shape * (0.68 + 0.32 * mott), 0, 1) * 0.92)
    off = np.roll(np.roll(shape, max(3, int(W / 285)), 1), -max(2, int(H / 240)), 0)
    img = blend(img, STEEL, np.clip(off - shape, 0, 1) * (0.45 + 0.45 * mott) * 0.9)
    return grain(img, 4.0, seed=17)
save(riso(), '09_riso_misregister.jpg',
     [('right well', 6.6, 0.8, 6.1, 4.6)] + FULL, 'ONE LOUD SLIDE / the decisive split')

# ============================================================ 10 RESIDUAL TRACES
def residual_traces(n=7000):
    img = grain(vignette(ramp(NAVY, DEEP, 82, 1.15), 0.28), 2.2, seed=19)
    rng = np.random.default_rng(5); steps = 96
    y0 = H * (0.34 + 0.66 * rng.random(n) ** 0.5)
    amp = 3 + 30 * rng.random(n) ** 2.2
    walk = np.cumsum(rng.normal(0, 1, (n, steps)), axis=1) * (amp[:, None] / 6.0)
    walk -= walk.mean(axis=1, keepdims=True)
    ys = np.clip(y0[:, None] + walk, 0, H - 1).astype(np.int32)
    xs = np.linspace(0, W - 1, steps).astype(np.int32)
    lay = Image.new('L', (W, H), 0); d = ImageDraw.Draw(lay)
    for i in range(n):
        d.line(list(zip(xs.tolist(), ys[i].tolist())), fill=255, width=1)
    a = cv2.GaussianBlur(np.asarray(lay, np.float32) / 255.0, (0, 0), 0.6) * 0.34
    img = blend(img, (0x9E, 0xAC, 0xD4), a)
    lay2 = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d2 = ImageDraw.Draw(lay2)
    for i, (yy0, br) in enumerate([(0.40, 0.55), (0.55, 0.68), (0.70, 0.62)]):
        t = np.linspace(0, 1, 200)
        dip = np.clip((t - br) / (1 - br), 0, 1) ** 1.8 * (170 + 50 * i) * H / 1440
        ys2 = (H * yy0 + dip + np.sin(t * 34 + i) * 5).astype(int)
        d2.line(list(zip((t * (W - 1)).astype(int).tolist(), ys2.tolist())),
                fill=(*CRIM, 235), width=max(2, int(W / 640)))
    img = np.asarray(Image.alpha_composite(
        Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA'),
        lay2).convert('RGB'), np.float32)
    return img
save(residual_traces(), '10_residual_traces.jpg',
     [('top band', 0.8, 0.5, 11.7, 2.3)] + FULL, 'DATA / closing')

# ---------------------------------------------------------------- QA table
print(f'\n{W}x{H} @ q{A.q}   worst-case contrast = text vs brightest 0.5% under the box\n')
print(f'{"plate":<26}{"MB":>6}  {"zone":<16}{"ratio":>7}  verdict     role')
print('-' * 104)
for name, mb, role, rows in REPORT:
    for j, (lab, c) in enumerate(rows):
        v = 'BODY 16pt' if c >= 7 else ('LARGE ONLY' if c >= 4.5 else 'TITLE ONLY')
        size = f'{mb:.2f}' if j == 0 else ''
        print(f'{name if j==0 else "":<26}{size:>6}  {lab:<16}{c:7.2f}  '
              f'{v:<12}{role if j==0 else ""}')
print(f'\ntotal plate weight: {sum(r[1] for r in REPORT):.2f} MB')
print('NOTE: pptxgenjs embeds a background once PER SLIDE. Run dedupe_pptx.py '
      'on the finished deck.')

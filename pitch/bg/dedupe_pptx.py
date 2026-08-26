"""Post-process a pptxgenjs deck: collapse byte-identical embedded media.

pptxgenjs embeds a background image once PER SLIDE, so a 20-slide deck that
reuses 8 backgrounds carries ~20 copies. This rewrites the relationship
targets to a single canonical copy and drops the duplicates. Lossless.

usage: python3 dedupe_pptx.py in.pptx out.pptx
"""
import sys, zipfile, hashlib, re, os, shutil

def dedupe(src, dst):
    zin = zipfile.ZipFile(src)
    names = zin.namelist()
    media = [n for n in names if n.startswith('ppt/media/')]
    by_hash, canon = {}, {}
    for n in sorted(media):
        h = hashlib.sha1(zin.read(n)).hexdigest()
        if h in by_hash:
            canon[n] = by_hash[h]
        else:
            by_hash[h] = n
            canon[n] = n
    drop = {n for n, c in canon.items() if c != n}
    # basename -> canonical basename (rels use ../media/xxx)
    bmap = {os.path.basename(n): os.path.basename(c)
            for n, c in canon.items() if c != n}

    zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED, compresslevel=9)
    pat = re.compile(r'(\.\./media/)([^"]+)')
    for n in names:
        if n in drop:
            continue
        data = zin.read(n)
        if n.endswith('.rels'):
            txt = data.decode('utf-8')
            txt = pat.sub(lambda m: m.group(1) + bmap.get(m.group(2), m.group(2)), txt)
            data = txt.encode('utf-8')
        zout.writestr(n, data)
    zout.close(); zin.close()
    return len(media), len(drop)

def validate(path):
    """Every ../media/ target referenced by any .rels must exist in the zip."""
    z = zipfile.ZipFile(path)
    have = set(z.namelist())
    bad = []
    for n in z.namelist():
        if n.endswith('.rels'):
            for t in re.findall(r'\.\./media/([^"]+)', z.read(n).decode('utf-8')):
                if 'ppt/media/' + t not in have:
                    bad.append((n, t))
    z.close()
    return bad

if __name__ == '__main__':
    s, d = sys.argv[1], sys.argv[2]
    tot, dropped = dedupe(s, d)
    bad = validate(d)
    a, b = os.path.getsize(s), os.path.getsize(d)
    print(f'media {tot} -> {tot - dropped} ({dropped} dropped)')
    print(f'{a/1e6:.2f} MB -> {b/1e6:.2f} MB  ({100 * (1 - b / a):.0f}% smaller)')
    print('dangling refs:', bad if bad else 'none')

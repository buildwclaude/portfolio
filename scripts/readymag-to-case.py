#!/usr/bin/env python3
"""
Turn a Readymag page (from import-readymag.py) into a case-study page that
reads top to bottom: a tag and headline, the hero, a Role / Timeline / Team /
Tools row, then one section per heading.

Readymag places every widget by hand on a 1024px canvas, so the reading order
and the structure have to be recovered from where things sit:

  * widgets whose tops fall within ROW_GAP of each other form a row;
  * inside a row, widgets whose left edges line up form a column;
  * a row with one column is read straight down; a row with several becomes
    a grid (quotes side by side, stats, before/after);
  * 15px text is a heading, smaller text is body; numbers in a grid are stats.

    python3 scripts/readymag-to-case.py <slug> [<slug> ...]

    e.g. python3 scripts/readymag-to-case.py yatrihub eduquest

Reads src/content/studies/<slug>.html, writes src/content/cases/<slug>.html.
"""

import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROW_GAP = 30  # px between tops that still counts as the same row
COL_GAP = 60  # px between left edges that still counts as the same column
TINY = 24  # pictures smaller than this are decoration (bullets, logos)
SLUGS = {'yatri-hub': 'yatrihub'}  # featured keys whose study file is named differently
META = {'MY ROLE': 'Role', 'TIMELINE': 'Timeline', 'TEAM': 'Team', 'COLLABORATION': 'Collaboration', 'TOOLS': 'Tools'}
STAT = re.compile(r'^[\d.,]+\s?[%+x]?$|^[^\w\s]{1,3}$')
TERM = re.compile(r'^([A-Z][\w &/\-]{2,32}?)\s?:\s?(\S.+)$', re.S)

WIDGET = re.compile(r'<div class="rm-w (rm-[a-z]+)" style="([^"]*)"[^>]*>(.*?)</div>(?=\s*<div class="rm-w|\s*</div>\s*</div>)', re.S)


def num(style, key):
    m = re.search(rf'(?<![-\w]){key}:(-?\d+)', style)
    return int(m.group(1)) if m else 0


def clean(fragment):
    """A <p>'s text, keeping only links."""
    fragment = re.sub(r'<br\s*/?>', '\n', fragment)
    fragment = re.sub(r'<(?!/?a[\s>])[^>]+>', '', fragment)
    fragment = re.sub(r'<a [^>]*?href="([^"]+)"[^>]*>', r'<a href="\1" target="_blank" rel="noopener">', fragment)
    text = html.unescape(fragment).replace('\xa0', ' ')
    return re.sub(r'[ \t]+', ' ', text).strip()


def widgets(src):
    out = []
    for kind, style, inner in WIDGET.findall(src):
        w = {'left': num(style, 'left'), 'top': num(style, 'top'), 'width': num(style, 'width'), 'height': num(style, 'height')}
        if kind == 'rm-text':
            paras = []
            for pstyle, body in re.findall(r'<p style="([^"]*)">(.*?)</p>', inner, re.S):
                text = clean(body)
                if text:
                    paras.append({'size': num(pstyle, 'font-size'), 'text': text})
            if paras:
                out.append({**w, 'kind': 'text', 'paras': paras})
        elif kind == 'rm-pic':
            m = re.search(r'src="([^"]+)"', inner)
            if m and min(w['width'], w['height'] or w['width']) >= TINY:
                out.append({**w, 'kind': 'pic', 'src': m.group(1)})
    return sorted(out, key=lambda w: (w['top'], w['left']))


def rows(items):
    """Chains widgets into rows by how close their tops are."""
    groups = []
    for it in items:
        if groups and it['top'] - groups[-1][-1]['top'] <= ROW_GAP:
            groups[-1].append(it)
        else:
            groups.append([it])
    return groups


def columns(row):
    cols = []
    for it in sorted(row, key=lambda w: w['left']):
        if cols and abs(it['left'] - cols[-1][0]['left']) <= COL_GAP:
            cols[-1].append(it)
        else:
            cols.append([it])
    return [sorted(c, key=lambda w: w['top']) for c in cols]


def text_of(it):
    return '\n'.join(p['text'] for p in it['paras'])


def esc(text):
    """Escapes text but lets the links clean() kept through."""
    parts = re.split(r'(<a [^>]+>|</a>)', text)
    return ''.join(p if p.startswith('<a ') or p == '</a>' else html.escape(p, quote=False) for p in parts)


def is_meta(row):
    return any(it['kind'] == 'text' and text_of(it).strip().upper() in META for it in row)


def picture(it, cls='cs-frame'):
    # Its shape, and its width on the Readymag canvas, so the page can keep
    # a small picture from being blown up past what it can carry.
    ratio = f' style="aspect-ratio:{it["width"]}/{it["height"]};--w:{it["width"]}px"' if it['height'] else ''
    return f'<figure class="{cls}"{ratio}><img src="{it["src"]}" alt="" loading="lazy" decoding="async"></figure>'


def prose(text, small=False):
    """A paragraph, a bullet list, or a term with its explanation."""
    text = text.strip()
    if '* ' in text and (text.startswith('*') or ' * ' in text or '\n*' in text):
        head, *items = re.split(r'(?:^|\s)\*\s', text)
        out = f'<p>{esc(head.strip())}</p>' if head.strip() else ''
        lis = ''.join(f'<li>{esc(i.strip())}</li>' for i in items if i.strip())
        return out + f'<ul>{lis}</ul>'
    if text[:1] in '"“':
        return f'<blockquote>{esc(text)}</blockquote>'
    m = TERM.match(text)
    if m and not small:
        return f'<div class="cs-term"><h3>{esc(m.group(1).strip())}</h3><p>{esc(m.group(2).strip())}</p></div>'
    return '\n'.join(f'<p>{esc(line.strip())}</p>' for line in text.split('\n') if line.strip())


def block(it, in_grid, beside_stat=False):
    """One widget as HTML: a heading, a stat, prose or a picture."""
    if it['kind'] == 'pic':
        return picture(it)
    out = []
    paras = it['paras']
    for i, p in enumerate(paras):
        text, big = p['text'], p['size'] >= 14
        short = len(text) <= 70 and not text.rstrip().endswith('.') and text[:1] not in '"“*'
        if in_grid and STAT.match(text.strip()):
            out.append(f'<p class="cs-stat">{esc(text)}</p>')
        elif short and not beside_stat and (big or (len(paras) > 1 and i == 0) or (in_grid and len(text) <= 40)):
            # Section headings only come from full-width rows; the caller
            # promotes them. Everything here is a subheading.
            out.append(f'<h3>{esc(text)}</h3>')
        elif text.isupper() and len(text) <= 40:
            out.append(f'<p class="cs-caption">{esc(text.title())}</p>')
        else:
            out.append(prose(text, small=in_grid))
    return '\n'.join(out)


def has_stat(col):
    """Whether a grid column leads with a number, so its short lines are captions."""
    return any(STAT.match(p['text'].strip()) for it in col if it['kind'] == 'text' for p in it['paras'])


def heading_of(col):
    """A full-width column that opens with a big short line opens a section."""
    first = col[0]
    if first['kind'] != 'text' or len(first['paras']) != 1:
        return None
    p = first['paras'][0]
    if p['size'] >= 14 and len(p['text']) <= 60 and not STAT.match(p['text']):
        return p['text']
    return None


def covers():
    """Each project's cover picture, from the featured list in site/warp.ts."""
    src = open(os.path.join(ROOT, 'src/site/warp.ts')).read()
    found = {}
    for key, cover in re.findall(r"key: '([^']+)'.*?cover: '([^']+)'", src):
        found[SLUGS.get(key, key)] = cover
    return found


def convert(slug):
    src = open(os.path.join(ROOT, 'src/content/studies', f'{slug}.html')).read()
    origin = re.search(r'<!--(.*?)-->', src)
    items = widgets(src)
    groups = rows(items)

    # Header: the title, the intro under it, and the pictures before the meta row.
    title_row = groups.pop(0)
    title = text_of(title_row[0])
    intro_parts = [text_of(it) for it in title_row[1:] if it['kind'] == 'text']
    if groups and not is_meta(groups[0]) and all(it['kind'] == 'text' for it in groups[0]):
        intro_parts += [text_of(it) for it in groups.pop(0)]
    hero_pics, captions = [], []
    while groups and not is_meta(groups[0]):
        row = groups.pop(0)
        hero_pics += [it for it in row if it['kind'] == 'pic']
        captions += [text_of(it) for it in row if it['kind'] == 'text']
    meta = groups.pop(0) if groups and is_meta(groups[0]) else []

    tag, _, headline = title.partition(':')
    if not headline.strip():
        tag, headline = '', title
    parts = ['<article class="cs">']
    if origin:
        parts.insert(0, f'<!-- Generated by scripts/readymag-to-case.py from studies/{slug}.html ({origin.group(1).strip()}) -->')
    parts.append('<header class="cs-head" data-cs-reveal>')
    if tag.strip():
        parts.append(f'<p class="cs-tag">{esc(tag.strip())}</p>')
    parts.append(f'<h1 class="cs-title">{esc(headline.strip())}</h1>')
    parts.append('</header>')

    # The hero is the project's cover, as on its card, in a fixed frame.
    cover = covers().get(slug)
    if cover:
        parts.append(f'<figure class="cs-frame cs-hero"><img src="{cover}" alt="" fetchpriority="high" decoding="async"></figure>')
        hero_pics = [p for p in hero_pics if p['src'] != cover]
    elif hero_pics:
        hero = max(hero_pics, key=lambda p: p['width'] * (p['height'] or p['width']))
        parts.append(f'<figure class="cs-frame cs-hero"><img src="{hero["src"]}" alt="" fetchpriority="high" decoding="async"></figure>')
        hero_pics.remove(hero)

    if meta:
        parts.append('<dl class="cs-meta" data-cs-reveal>')
        for col in columns(meta):
            label = text_of(col[0]).strip().upper()
            if label not in META:
                continue
            values = [line.strip() for it in col[1:] for line in text_of(it).split('\n') if line.strip()]
            dd = ''.join(f'<dd>{esc(v)}</dd>' for v in values)
            parts.append(f'<div><dt>{META[label]}</dt>{dd}</div>')
        parts.append('</dl>')

    parts.append('<section class="cs-section" id="overview" data-cs-title="Overview">')
    parts.append('<p class="cs-label" data-cs-reveal>Overview</p>')
    # The intro's first sentence is the lead; the rest reads as body copy.
    intro = ' '.join(intro_parts).strip()
    lead, _, rest = intro.partition('. ')
    parts.append(f'<p class="cs-intro" data-cs-reveal>{esc(lead.rstrip(".") + ".")}</p>')
    if rest.strip():
        parts.append(f'<div class="cs-block" data-cs-reveal><p>{esc(rest.strip())}</p></div>')
    if captions:
        parts.append(''.join(f'<p class="cs-caption" data-cs-reveal>{esc(c.title() if c.isupper() else c)}</p>' for c in captions))
    if hero_pics:
        parts.append(gallery(hero_pics))

    n = 0
    for row in groups:
        cols = columns(row)
        heading = heading_of(cols[0]) if len(cols) == 1 else None
        if heading:
            n += 1
            parts.append('</section>')
            parts.append(f'<section class="cs-section" id="s{n}" data-cs-title="{html.escape(heading)}">')
            parts.append(f'<h2 class="cs-h2" data-cs-reveal>{esc(heading)}</h2>')
            row = cols[0][1:]
            if not row:
                continue
            cols = [row]
        pics = [it for it in row if it['kind'] == 'pic']
        if len(pics) == len(row) and len(pics) > 1:
            parts.append(gallery(pics))
        elif len(cols) == 1:
            parts.append(f'<div class="cs-block" data-cs-reveal>{"".join(block(it, False) for it in cols[0])}</div>')
        else:
            cells = ''.join(f'<div class="cs-cell">{"".join(block(it, True, has_stat(col)) for it in col)}</div>' for col in cols)
            parts.append(f'<div class="cs-grid" style="--cols:{len(cols)}" data-cs-reveal>{cells}</div>')
    parts.append('</section>')
    parts.append('</article>')

    out = os.path.join(ROOT, 'src/content/cases', f'{slug}.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w') as f:
        f.write('\n'.join(parts) + '\n')
    print(f'{slug}: {n} sections -> {os.path.relpath(out, ROOT)}')


def gallery(pics):
    """Pictures side by side, each sized by its share of the row."""
    pics = sorted(pics, key=lambda p: (p['top'] // 200, p['left']))
    if len(pics) == 1:
        return f'<div class="cs-block" data-cs-reveal>{picture(pics[0])}</div>'
    cols = min(len(pics), 5)
    figs = ''.join(picture(p) for p in pics)
    return f'<div class="cs-gallery" style="--cols:{cols}" data-cs-reveal>{figs}</div>'


if __name__ == '__main__':
    for slug in sys.argv[1:] or ['yatrihub', 'ar-hud', 'yatri-energy', 'eduquest', 'dashboard']:
        convert(slug)

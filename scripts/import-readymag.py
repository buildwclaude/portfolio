#!/usr/bin/env python3
"""
Rebuild a Readymag page as a static HTML fragment, exactly as it is laid out.

Readymag serves every page as a list of absolutely positioned widgets
(text, pictures, shapes) on a fixed-width canvas. This script fetches that
list, downloads every picture with the crop Readymag shows, and writes the
page as plain HTML that `src/lib/warp-detail.ts` scales to fit its window.

    python3 scripts/import-readymag.py <project-id> <page-id> <slug>

    e.g. python3 scripts/import-readymag.py 6021618 696d94fbc39fae1a364a188e yatrihub

The page id is the `pageId` of the `/api/viewer/project/<id>/widgets` request
the live page makes (visible in the browser's network panel).

Writes:
    src/content/studies/<slug>.html   the page
    public/work/<slug>/*.webp         its pictures
"""

import hashlib
import html
import json
import os
import re
import sys
import urllib.request

CANVAS = 1024  # Readymag's desktop page width
SITE = 'https://sony-thakuri.xyz'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=60).read()


def rgba(hex8, opacity=1.0):
    """Readymag colours are RRGGBB plus an optional alpha given in percent (hex)."""
    hex8 = (hex8 or '000000').lstrip('#')
    r, g, b = (int(hex8[i:i + 2], 16) for i in (0, 2, 4))
    a = int(hex8[6:8], 16) / 100 if len(hex8) >= 8 else 1.0
    return f'rgba({r},{g},{b},{round(a * opacity, 3)})'


def px(v):
    v = round(float(v), 2)
    return f'{int(v) if v == int(v) else v}px'


# ── text ────────────────────────────────────────────────────────────────────

def char_styles(style_entry, length):
    """Expand Readymag's range-encoded inline styles into one dict per character."""
    inline = style_entry.get('inlineStyles') or {}
    keys, values = inline.get('keys', []), inline.get('values', [])
    per_char = [dict() for _ in range(length)]
    for rng in inline.get('styles', []):
        props = {}
        for ref in rng['styles']:
            k, v = (int(i) for i in ref.split(';'))
            props[keys[k]] = values[v]
        for i in range(rng['offset'], min(length, rng['offset'] + rng['length'])):
            per_char[i].update(props)
    return per_char


def css_for(props, variable=True):
    out = []
    # Readymag's variable-font weight, e.g. ';wght|600' -> 'wght' 600
    axes = re.findall(r'(\w{4})\|([\d.]+)', props.get('FONT_VARIABLE', '')) if variable else []
    if axes:
        out.append('font-variation-settings:' + ','.join(f"'{a}' {v}" for a, v in axes))
    if 'FONT_FAMILY' in props:
        out.append(f"font-family:'{props['FONT_FAMILY']}'")
    if 'FONT_SIZE' in props:
        out.append(f"font-size:{props['FONT_SIZE']}px")
    if 'FONT_WEIGHT' in props:
        out.append(f"font-weight:{props['FONT_WEIGHT']}")
    if props.get('FONT_STYLE', 'normal') != 'normal':
        out.append(f"font-style:{props['FONT_STYLE']}")
    if props.get('LETTER_SPACING', '0') not in ('0', 0):
        out.append(f"letter-spacing:{props['LETTER_SPACING']}px")
    if 'COLOR' in props:
        out.append(f"color:{rgba(props['COLOR'])}")
    if props.get('TEXT_DECORATION'):
        out.append(f"text-decoration:{props['TEXT_DECORATION']}")
    return ';'.join(out)


def link_href(data):
    if data.get('type') == 'Page':
        return f"{SITE}/{data.get('pageNum', data.get('url'))}/"
    return data.get('url', '#')


def load_text_styles():
    """The project's shared paragraph styles, which set e.g. alignment. They
    are not in the widgets list; the viewer embeds them in every page's HTML."""
    page = fetch(f'{SITE}/').decode('utf-8', 'replace').replace('&quot;', '"')
    styles = {}
    for name, css in re.findall(r'"name":"((?:style|paragraph)-[0-9a-f-]+)"[^{}]*?"cssProperties":(\{[^{}]*\})', page):
        try:
            styles[name] = json.loads(css)
        except ValueError:
            pass
    return styles


TEXT_STYLES = {}


def render_text(w):
    styles = {s['key']: s for s in w.get('styles', [])}
    metas = {m['key']: m.get('data', {}) for m in w.get('blocksMeta', [])}
    entity_map = w.get('entityMap') or {}
    paras = []
    for block in w.get('blocks', []):
        text = block.get('text', '')
        meta = metas.get(block['key'], {})
        chars = char_styles(styles.get(block['key'], {}), len(text))

        # which entity (link) covers each character
        ent = [None] * len(text)
        for r in block.get('entityRanges', []):
            for i in range(r['offset'], min(len(text), r['offset'] + r['length'])):
                ent[i] = str(r['key'])

        # group consecutive characters sharing style and link into runs
        runs, i = [], 0
        while i < len(text):
            j = i
            while j < len(text) and chars[j] == chars[i] and ent[j] == ent[i]:
                j += 1
            runs.append((text[i:j], chars[i], ent[i]))
            i = j

        # When the shared style sets its own variable weight, Readymag writes the
        # span's weight as invalid CSS, so the shared one is what actually shows.
        shared = TEXT_STYLES.get(meta.get('textStyle', ''), {})
        shared_fvs = html.unescape(shared.get('fontVariationSettings') or '')

        inner = ''
        for chunk, props, ekey in runs:
            span = f'<span style="{css_for(props, variable=not shared_fvs)}">{html.escape(chunk).replace(chr(10), "<br>")}</span>'
            e = entity_map.get(ekey) if ekey is not None else None
            if e and e.get('type') == 'LINK':
                span = (f'<a href="{html.escape(link_href(e["data"]))}" target="_blank" '
                        f'rel="noopener">{span}</a>')
            inner += span

        # the block's own size/family, so empty lines keep their height
        first = chars[0] if chars else {}
        p_style = [f"line-height:{meta.get('lineHeight', 20)}px"]
        if first.get('FONT_SIZE'):
            p_style.append(f"font-size:{first['FONT_SIZE']}px")
        if first.get('FONT_FAMILY'):
            p_style.append(f"font-family:'{first['FONT_FAMILY']}'")
        if shared_fvs:
            p_style.append(f'font-variation-settings:{shared_fvs}')
        align = (meta.get('align') or shared.get('textAlign') or 'left').replace('align-', '')
        if align != 'left':
            p_style.append(f'text-align:{align}')
        paras.append(f'<p style="{";".join(p_style)}">{inner or "<br>"}</p>')
    return ''.join(paras)


# ── pictures ────────────────────────────────────────────────────────────────

def picture_src(w, slug):
    pic = w['picture']
    base = pic.get('lambdaUrl') or pic['url']
    width = min(2048, int(round(w['w'] * 2)))  # 2x for sharp screens
    crop = f"&cX={w['cropX']}&cY={w['cropY']}&cW={w['cropW']}&cH={w['cropH']}" if 'cropX' in w else ''
    url = f'{base}?w={width}&e=webp&nll=true{crop}'
    stem = base.rsplit('/', 1)[-1].replace('image-', '').split('-')[0]
    name = f"{stem}-{hashlib.sha1(url.encode()).hexdigest()[:6]}.webp"
    out = os.path.join(ROOT, 'public', 'work', slug, name)
    if not os.path.exists(out):
        with open(out, 'wb') as f:
            f.write(fetch(url))
    return f'/work/{slug}/{name}'


# ── page ────────────────────────────────────────────────────────────────────

def anim_attrs(w):
    attrs = []
    for a in w.get('animation') or []:
        if a.get('type') == 'scroll':
            attrs.append('data-rm-reveal')
        elif a.get('type') == 'hover':
            attrs.append('data-rm-hover')
    return (' ' + ' '.join(attrs)) if attrs else ''


def main():
    project, page, slug = sys.argv[1:4]
    TEXT_STYLES.update(load_text_styles())
    widgets = json.loads(fetch(f'{SITE}/api/viewer/project/{project}/widgets?pageId={page}'))
    os.makedirs(os.path.join(ROOT, 'public', 'work', slug), exist_ok=True)

    background = next((w for w in widgets if w['type'] == 'background'), {})
    items, bottom = [], 0
    for w in sorted((w for w in widgets if 'x' in w), key=lambda w: (w['y'], w['x'])):
        # Only what sits on the canvas; Readymag keeps drafts parked off to the sides.
        if w['x'] + w['w'] <= 0 or w['x'] >= CANVAS:
            continue
        # The site's own navigation is replaced by the window's close button.
        if w['type'] == 'text' and w['y'] < 80 and any(
            e.get('type') == 'LINK' for e in (w.get('entityMap') or {}).values()
        ) and w['w'] < 120:
            continue

        box = f"left:{px(w['x'])};top:{px(w['y'])};width:{px(w['w'])};z-index:{w.get('z', 1)}"
        if w['type'] == 'text':
            items.append(f'<div class="rm-w rm-text" style="{box}"{anim_attrs(w)}>{render_text(w)}</div>')
            bottom = max(bottom, w['y'] + w['h'])
        elif w['type'] == 'picture' and w.get('picture'):
            src = picture_src(w, slug)
            style = f"{box};height:{px(w['h'])}"
            if w.get('border_radius'):
                style += f";border-radius:{w['border_radius']}px"
            # Opacity sits on the image so the reveal animation can own the box's.
            img_style = f' style="opacity:{w["opacity"]}"' if w.get('opacity') not in (None, 1) else ''
            items.append(
                f'<div class="rm-w rm-pic" style="{style}"{anim_attrs(w)}>'
                f'<img src="{src}" alt=""{img_style} loading="lazy" decoding="async"></div>'
            )
            bottom = max(bottom, w['y'] + w['h'])
        elif w['type'] == 'shape':
            style = f"{box};height:{px(w['h'])};background:{rgba(w.get('bg_color'), w.get('bg_opacity', 1))}"
            if w.get('borders'):
                style += f";border:{w.get('weight', 1)}px {w.get('stroke', 'solid')} {rgba(w.get('color'))}"
            if w.get('tp') == 'ellipse':
                style += ';border-radius:50%'
            elif w.get('radius'):
                style += f";border-radius:{w['radius']}px"
            if w.get('opacity') not in (None, 1):
                style += f";opacity:{w['opacity']}"
            items.append(f'<div class="rm-w rm-shape" style="{style}"{anim_attrs(w)}></div>')
            bottom = max(bottom, w['y'] + w['h'])

    height = int(bottom + 160)  # the page's closing margin
    bg = rgba(background.get('color', 'ffffff'), background.get('opacity', 1))
    page_html = (
        f'<!-- Generated by scripts/import-readymag.py from {SITE} (project {project}, page {page}). -->\n'
        f'<div class="rm" style="--rm-w:{CANVAS};--rm-h:{height};--rm-bg:{bg}">'
        f'<div class="rm__canvas">\n' + '\n'.join(items) + '\n</div></div>\n'
    )
    out = os.path.join(ROOT, 'src', 'content', 'studies', f'{slug}.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w') as f:
        f.write(page_html)
    print(f'{len(items)} widgets, canvas {CANVAS}x{height} -> {os.path.relpath(out, ROOT)}')


if __name__ == '__main__':
    main()

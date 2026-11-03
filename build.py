#!/usr/bin/env python3
"""Build the Ms Sweeney Decoded site.

  schools/<slug>.json  ->  <slug>/index.html + <slug>/og.png   (one cheat sheet per school)
  all live schools     ->  index.html + og.png                  (the library)
  icon                 ->  favicon.svg, favicon-32.png, apple-touch-icon.png

Add a school: copy schools/unc.json to schools/<slug>.json, change the content, run
  python3 build.py
A school with "status": "draft" gets the review banner, "draft for Amanda" tags and
noindex, and stays off the library. Flip it to "live" once Amanda signs off.
  python3 build.py --preview   also lists draft schools in the library (for review only).

Needs: jinja2 and playwright (python). Images render with Chromium.
"""
import json, sys, time, pathlib
from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = pathlib.Path(__file__).resolve().parent
BASE = "https://mssweeneysays.github.io/"
PREVIEW = "--preview" in sys.argv
BUILD = time.strftime("%Y%m%d%H%M")

SHARE_ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" '
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
              '<path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>')

ICON_SVG = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
            '<rect width="64" height="64" rx="14" fill="#2D6BFF"/>'
            '<path d="M10 40 L54 28" stroke="#FFD43B" stroke-width="14" stroke-linecap="round"/>'
            '<path d="M18 33 L28 43 L47 20" fill="none" stroke="#06251C" stroke-width="7" '
            'stroke-linecap="round" stroke-linejoin="round"/></svg>')

REQUIRED = ["slug", "status", "name", "short", "updated", "preview", "library", "hero", "deadline",
            "chances", "ladder", "numbers", "dates", "money", "todo", "take", "offer", "notes", "footer_source"]

env = Environment(loader=FileSystemLoader(ROOT / "templates"), undefined=StrictUndefined,
                  autoescape=True, trim_blocks=False, lstrip_blocks=False)


def load_schools():
    schools = []
    for f in sorted((ROOT / "schools").glob("*.json")):
        s = json.loads(f.read_text())
        missing = [k for k in REQUIRED if k not in s]
        if missing:
            sys.exit(f"{f.name}: missing {', '.join(missing)}")
        if s["status"] not in ("draft", "live"):
            sys.exit(f"{f.name}: status must be draft or live")
        s.setdefault("self_check", None)
        schools.append(s)
    return schools


def page_data(s):
    """Only what the browser script needs."""
    return json.dumps({
        "slug": s["slug"],
        "deadline": s["deadline"]["date"],
        "grids": [{"filled": g["filled"], "color": g["color"]} for g in s["chances"]["grids"]],
        "gpa": s["numbers"]["gpa"],
        "todo_done": s["todo"]["done"],
        "check_done": (s["self_check"] or {}).get("all_done", ""),
        "notes": s["notes"],
    }, ensure_ascii=False).replace("</", "<\\/")


def render_images(jobs):
    """jobs: list of (html, out_path). Rendered from templates/ so relative asset paths resolve."""
    from playwright.sync_api import sync_playwright
    tmp = ROOT / "templates" / "_render.html"
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        for html, out, size in jobs:
            tmp.write_text(html)
            pg.set_viewport_size({"width": size[0], "height": size[1]})
            pg.goto(tmp.as_uri())
            pg.wait_for_load_state("networkidle")
            pg.evaluate("document.fonts.ready")
            pg.screenshot(path=str(out), omit_background=False)
        b.close()
    tmp.unlink(missing_ok=True)


def main():
    schools = load_schools()
    sheet, library, og = env.get_template("sheet.html"), env.get_template("library.html"), env.get_template("og.html")
    images = []

    for s in schools:
        out = ROOT / s["slug"]
        out.mkdir(exist_ok=True)
        url = f"{BASE}{s['slug']}/"
        (out / "index.html").write_text(sheet.render(
            s=s, draft=s["status"] == "draft", url=url, build=BUILD,
            share_icon=SHARE_ICON, js_data=page_data(s)))
        name = s["name"]
        images.append((og.render(
            title=f'<span class="hl">{name}</span>',
            title_size=88 if len(name) <= 16 else 70,
            sub="Your one-page application check", note=s["preview"]["image_line"],
            chip=s["library"]["deadline_text"]), out / "og.png", (1200, 630)))
        print(f"  {s['slug']}/  ({s['status']})")

    listed = [s for s in schools if s["status"] == "live" or PREVIEW]
    listed.sort(key=lambda s: s["name"])
    desc = "One-page college cheat sheets from a former admissions reader: what each school says matters most, straight from its own Common Data Set."
    (ROOT / "index.html").write_text(library.render(
        schools=listed, url=BASE, build=BUILD, share_icon=SHARE_ICON, description=desc))
    images.append((og.render(title='Your school, <span class="hl">on one page</span>', title_size=76,
                             sub="College cheat sheets from a former admissions reader",
                             note="Straight from each school's own data", chip=""),
                   ROOT / "og.png", (1200, 630)))
    print(f"  library: {len(listed)} school(s){' (preview: drafts included)' if PREVIEW else ''}")

    (ROOT / "favicon.svg").write_text(ICON_SVG)
    def icon_html(svg):
        return f'<html><body style="margin:0">{svg.replace("<svg ", "<svg width=100% height=100% style=display:block ")}</body></html>'
    # iPhone rounds the corners itself, so the touch icon is full-bleed
    images += [(icon_html(ICON_SVG.replace('rx="14"', 'rx="0"')), ROOT / "apple-touch-icon.png", (180, 180)),
               (icon_html(ICON_SVG), ROOT / "favicon-32.png", (32, 32))]
    render_images(images)
    (ROOT / ".nojekyll").write_text("")
    print("done")


if __name__ == "__main__":
    main()

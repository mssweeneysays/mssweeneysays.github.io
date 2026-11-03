# Ms Sweeney Decoded

One-page college cheat sheets, live at https://mssweeneysays.github.io/

## How it's organized

- `schools/<slug>.json`: everything about one school (numbers, dates, student and parent lines, Amanda's take). **This is the only file that changes per school.**
- `templates/sheet.html`: the cheat-sheet layout every school shares.
- `templates/library.html`: the school list at the home page.
- `templates/og.html`: the link preview image (1200×630).
- `assets/`: shared styles, script, fonts and headshot.
- `build.py`: turns the above into `<slug>/index.html`, `<slug>/og.png`, `index.html`, `og.png` and the tab icons.

## Add a school

1. Copy `schools/unc.json` to `schools/<slug>.json` (the slug becomes the web address, e.g. `nyu` → `/nyu/`).
2. Replace the content. Lines that differ for parents use `{"s": "student line", "p": "parent line"}`.
3. Leave `"status": "draft"` until Amanda approves the numbers and her take, then change it to `"live"`.
4. Run `python3 build.py` and push.

Draft sheets show a review banner and "draft for Amanda" labels, ask search engines not to index them, and stay off the library page.

## Links

- Student mode (default): `/unc/`
- Parent mode: `/unc/#parent`

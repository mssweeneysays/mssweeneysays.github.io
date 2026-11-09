# Ms Sweeney Decoded

One-page college cheat sheets, live at https://mssweeneysays.github.io/

## How it's organized

- `schools/<slug>.json`: everything about one school (numbers, dates, student and parent lines, Amanda's take). **This is the only file that changes per school.**
- `templates/sheet.html`: the cheat-sheet layout every school shares.
- `templates/library.html`: the school list at the home page.
- `templates/og.html`: the link preview image (1200×630).
- `assets/`: shared styles, script, fonts and headshot.
- `build.py`: turns the above into `<slug>/index.html`, `<slug>/og.png`, `index.html`, `og.png` and the tab icons.

## Sheet order (Nov 9, 2026)

One sheet serves three jobs: the DM resource, the long-form screen-share walkthrough, and short-form b-roll. Scrolling top to bottom follows the script shape:
header + `promise` line → chances → C7 ladder → Ms Sweeney's take → `catch` (optional) → where are you → dates → money → to-do → reader's check → offer → footer.

- `promise`: one true sentence about what this sheet gives the reader. Drafted by Claude, reviewed by Amanda.
- `catch`: the one real surprise in the school's data. Leave it out if there isn't one; never invent one.
- The reader comes first: anything that only helps the video belongs in the script, not on the sheet.

## Add a school

1. Copy `schools/unc.json` to `schools/<slug>.json` (the slug becomes the web address, e.g. `nyu` → `/nyu/`).
2. Replace the content. Lines that differ for parents use `{"s": "student line", "p": "parent line"}`.
3. Leave `"status": "draft"` until Amanda approves the numbers and her take, then change it to `"live"`.
4. Run `python3 build.py` and push.

Draft sheets show a review banner and "draft for Amanda" labels, ask search engines not to index them, and stay off the library page.

## Links

- Student mode (default): `/unc/`
- Parent mode: `/unc/#parent`

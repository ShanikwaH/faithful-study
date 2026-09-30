"""Make a one-tap import link for a deck.
Usage:  python tools/make-import-link.py decks/my-deck.json [app_url]
Prints a link. Open it on any phone or computer and the deck imports into the app, with no file download.
The deck travels in the #fragment, which browsers never send to the server, so it stays private.
"""
import base64, gzip, json, sys
if len(sys.argv) < 2: sys.exit(__doc__)
app = sys.argv[2] if len(sys.argv) > 2 else "https://shanikwah.github.io/faithful-study/"
deck = json.load(open(sys.argv[1], encoding="utf-8"))
raw = json.dumps(deck, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
payload = base64.urlsafe_b64encode(gzip.compress(raw, mtime=0)).decode().rstrip("=")
link = f"{app}#import={payload}"
print(link)
print(f"\n({len(link):,} characters. Links under ~60,000 characters work in all modern browsers.)", file=sys.stderr)

#!/usr/bin/env python3
"""Publish decks as ready-made links on the Import tab: writes deck-links.json (readable by anyone who opens the app).

    python3 tools/publish-deck-links.py            # run from the faithful-study folder after changing a deck in decks/

Edit DECKS below to choose which deck files from the private decks/ folder are offered."""
import json
from pathlib import Path
BASE = Path(__file__).resolve().parent.parent
DECKS = ["d550-ethics-scenario-exam.json", "d550-practice-exam-2.json"]
decks = [json.loads((BASE / "decks" / f).read_text(encoding="utf-8")) for f in DECKS]
(BASE / "deck-links.json").write_text(json.dumps({"decks": decks}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"deck-links.json: {len(decks)} decks, {sum(len(d['questions']) for d in decks)} questions")

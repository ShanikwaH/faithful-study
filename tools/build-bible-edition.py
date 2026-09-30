#!/usr/bin/env python3
"""
Build the "Bible Stories for All Ages" edition from the main Faithful Study source.

Usage (from the faithful-study folder):
    python3 tools/build-bible-edition.py  [output_folder]   # default: ../bible-stories

Why a build script: both editions share one codebase. Fix a bug or add a feature in
faithful-study/index.html, re-run this script, and the Bible edition gets it too, so they never drift.
Every replacement is asserted, so if the base file changes shape the script stops and says which rule broke.
"""
import json, os, shutil, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else BASE.parent / "bible-stories"
DECKS = BASE / "decks" / "bible"   # private repo faithful-study-decks, cloned at faithful-study/decks

def rep(text, old, new, count=1):
    n = text.count(old)
    if n != count:
        sys.exit(f"Build rule failed ({n} matches, expected {count}): {old[:90]!r}")
    return text.replace(old, new)

html = (BASE / "index.html").read_text(encoding="utf-8")

# ---------- identity ----------
html = rep(html, "<title>Faithful Study</title>", "<title>Bible Stories for All Ages</title>")
html = rep(html, 'content="Offline quiz and study vault: practice, timed exams, flashcards, and weak-spot review from any course material."',
                 'content="Bible story quizzes for families and Sunday school: read-aloud questions, flashcards, and challenges that work offline."')
html = rep(html, '<meta name="theme-color" content="#0B1F3A">', '<meta name="theme-color" content="#2A1650">')
html = rep(html, '<meta name="apple-mobile-web-app-title" content="Faithful Study">', '<meta name="apple-mobile-web-app-title" content="Bible Stories">')
html = rep(html, 'const APP_ID = "faithful-study";', 'const APP_ID = "bible-stories-all-ages";')
html = rep(html, '<span class="brand-name" id="brandName">Faithful Study</span>', '<span class="brand-name" id="brandName">Bible Stories for All Ages</span>')

# ---------- logo + favicon (open book with a gold cross) ----------
LOGO = ('<svg class="brand-logo" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#6B3FA0"/>'
        '<path d="M12 20c7-3 14-3 20 1v28c-6-4-13-4-20-1z" fill="#F4EEFB"/><path d="M52 20c-7-3-14-3-20 1v28c6-4 13-4 20-1z" fill="#E4D6F7"/>'
        '<path d="M32 8v14M26 13h12" stroke="#F2C14E" stroke-width="4" stroke-linecap="round"/></svg>')
start = html.index('<svg class="brand-logo"'); end = html.index("</svg>", start) + len("</svg>")
html = html[:start] + LOGO + html[end:]
fav_start = html.index('<link rel="icon" href="data:image/svg+xml,'); fav_end = html.index(">", fav_start) + 1
FAV = ("<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
       "%3Crect width='64' height='64' rx='14' fill='%236B3FA0'/%3E%3Cpath d='M12 20c7-3 14-3 20 1v28c-6-4-13-4-20-1z' fill='%23F4EEFB'/%3E"
       "%3Cpath d='M52 20c-7-3-14-3-20 1v28c6-4 13-4 20-1z' fill='%23E4D6F7'/%3E%3Cpath d='M32 8v14M26 13h12' stroke='%23F2C14E' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E\">")
html = html[:fav_start] + FAV + html[fav_end:]

# ---------- purple / lavender palette ----------
html = rep(html, "--navy:#0B1F3A; --blue:#1E5AA8; --green:#2E8B57; --green-bright:#34C27A;",
                 "--navy:#2A1650; --blue:#6B3FA0; --green:#7E4FC4; --green-bright:#F2C14E;")
html = rep(html, "--bg:#F5F7FB; --surface:#FFFFFF; --surface-2:#EEF2F8; --border:#D8DFEA;\n  --text:#0F1B2D; --muted:#5B6B82;",
                 "--bg:#F7F3FC; --surface:#FFFFFF; --surface-2:#EFE7F9; --border:#DCCFEE;\n  --text:#1E1433; --muted:#6A5C80;")
dark_old = "--bg:#0A1426; --surface:#101D33; --surface-2:#16263F; --border:#243652;\n    --text:#E8EEF7; --muted:#9AAAC2; --accent:#5B9BF0; --accent-ink:#06101F;"
dark_new = "--bg:#140C24; --surface:#1E1433; --surface-2:#2A1D45; --border:#3B2B5E;\n    --text:#F1EAFB; --muted:#B3A5CC; --accent:#C3A6F0; --accent-ink:#1A0F2E;"
html = rep(html, dark_old, dark_new)
html = rep(html, dark_old.replace("\n    ", "\n  "), dark_new.replace("\n    ", "\n  "))
html = rep(html, ".bar .track i{display:block;height:100%;background:var(--green)}", ".bar .track i{display:block;height:100%;background:var(--ok)}")
html = rep(html, "font:16px/1.55 var(--font)", "font:17px/1.6 var(--font)")   # slightly larger type for young readers

# ---------- BRAND block ----------
old_brand = html[html.index("const BRAND = {"): html.index("};", html.index("const BRAND = {")) + 2]
new_brand = '''const BRAND = {
  name: "Bible Stories for All Ages",
  tagline: "Thy word have I hid in mine heart. (Psalm 119:11)",
  byline: "by AnalyticsByShanikwa",
  url: "https://analyticsbyshanikwa.com",
  support: "hello@analyticsbyshanikwa.com",
  version: "1.1.0",
  examLabel: "Timed challenge",
  correctMsg: "Great job! 🎉",
  courseWord: "Group",
  courseExample: "e.g., Sunday School Grades 3–5",
  deckExample: "e.g., The Life of Moses (Ages 9–12)",
  focusExample: "e.g., Ages 5–8, simple words, 3 choices, a hint on every question",
  scenarioLabel: "Story-based questions (recommended)",
  speechRate: 0.92,
  autoSeed: true,
  sampleButton: "Load the 60 starter Bible stories"
};'''
html = html.replace(old_brand, new_brand)

# ---------- wording ----------
html = rep(html, "Study any course offline with practice mode, timed exams, flashcards, and weak-spot review.",
                 "Learn Bible stories at home, at church, or on the go, even offline. Practice with read-aloud questions, flashcards, and friendly challenges for every age.")
html = rep(html, "Tip: Ask Claude, ChatGPT, or any AI to turn your PDFs, slides, or videos into a quiz. The Import tab has a copy-paste prompt.",
                 "Tip: Ask Claude, ChatGPT, or any AI to turn a lesson, Bible passage, or curriculum into a quiz. The Import tab has a copy-paste prompt.")
html = rep(html, "<li>Open your AI and attach your course files: PDFs, slides, book chapters, spreadsheets, images, video transcripts, or a pre-assessment report.</li>",
                 "<li>Open your AI and attach or paste your lesson: a Sunday school curriculum, Bible passage, sermon notes, VBS guide, or a picture of a worksheet.</li>")
html = rep(html, "Store PDFs, books, slides, spreadsheets, images, audio, and video on this device so you can study offline.",
                 "Keep lesson PDFs, coloring pages, Bible story videos, memory-verse cards, and songs on this device so you can use them offline.")
html = rep(html, "Turn your files into a sourced practice exam inside the app.", "Turn a lesson or Bible passage into a new quiz inside the app.")
html = rep(html, "PDF, DOCX, PPTX, XLSX, CSV, TXT, MD, and images. For video or audio, add a transcript.",
                 "Lesson PDFs, Word or PowerPoint files, text, or pictures of worksheets. For videos, paste the transcript or story text.")
html = rep(html, 'placeholder="Paste any text: notes, video transcripts, or the questions you missed on a practice test…"',
                 'placeholder="Paste a Bible passage, lesson notes, or the story you are teaching this week…"')
html = rep(html, '<label for="aiText">Paste notes, a transcript, or your pre-assessment results (optional)</label>',
                 '<label for="aiText">Paste a Bible passage or lesson notes (optional)</label>')
html = rep(html, "Generate practice exam</button>", "Generate Bible quiz</button>")
html = rep(html, "Rename the app, for yourself or for a version you give to students or clients.",
                 "Rename the app for your church, class, or family (for example, \"Grace Kids Bible Quiz\").")

# paste-box example
ph_start = html.index('<textarea id="pasteBox" placeholder="'); ph_end = html.index('"></textarea>', ph_start)
html = html[:ph_start] + '''<textarea id="pasteBox" placeholder="Q: Who built an ark before the great flood?
A) Moses
*B) Noah
C) David
Explanation: God told Noah to build an ark of gopher wood.
Source: Genesis 6:13–14 (KJV)
Topic: Genesis
Hint: He brought the animals two by two.''' + html[ph_end:]

# ---------- AI prompt for Bible content ----------
p_start = html.index("const AI_PROMPT = `"); p_end = html.index("`;", p_start) + 2
BIBLE_PROMPT = '''const AI_PROMPT = `You are a warm, careful Bible teacher writing quiz questions for [AGE GROUP] (for example: Little Learners ages 5–8, Kids 9–12, or Teens & Adults). Using the attached or pasted lesson, Bible passage, or curriculum, write [NUMBER] multiple-choice questions about [STORY OR BOOK].

Rules:
- Stay faithful to the biblical text. Use the King James Version (KJV) for any quotations and quote it word for word. Never invent or paraphrase inside quotation marks.
- Every question cites its passage in "sources" as "KJV: Book Chapter:Verse" (for example "KJV: Genesis 9:13"). Add a short exact KJV quote after the reference when helpful.
- Ages 5–8: short, simple sentences; 3 answer choices (a–c); a kind, encouraging explanation of 1–2 sentences; a "hint" on every question.
- Ages 9–12: 4 choices (a–d); explanations of 2–3 sentences; include a hint.
- Teens & Adults: 4 choices; add context, cross-references, and real-life application; make wrong answers plausible (e.g., quotes or events from other parts of the Bible).
- Wrong answers must be clearly wrong from the text, never silly or unkind, and never a different Bible teaching that could also be right.
- Spread the correct answers evenly across the choices.
- "topic": the part of the Bible (for example "Genesis", "Exodus to Ruth", "Kings & Prophets", "Life of Jesus", "Parables of Jesus", "Early Church").
- Stay non-denominational: focus on what the text says.

Return ONLY valid JSON (no commentary) in exactly this format:
{
  "format": "studyquiz/v1",
  "deck": {"title": "[STORY OR BOOK] ([AGE GROUP])", "course": "[AGE GROUP]", "description": "", "sources": ["The Holy Bible, King James Version"]},
  "questions": [
    {"id": "q1", "topic": "Genesis", "prompt": "Question?",
     "options": [{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],
     "answer": "b", "explanation": "...", "sources": ["KJV: Genesis 9:13"], "hint": "...", "tags": []}
  ]
}`;'''
html = html[:p_start] + BIBLE_PROMPT + html[p_end:]
# the in-app generator fills [NUMBER]/[COURSE NAME]; map the Bible placeholders to what the user typed
html = rep(html, '''return AI_PROMPT.replace(/\\[NUMBER\\]/g, String(count)).replace(/\\[COURSE NAME\\]/g, title || "this course").replace(/\\[COURSE CODE\\]/g, title || "")''',
                 '''return AI_PROMPT.replace(/\\[NUMBER\\]/g, String(count)).replace(/\\[STORY OR BOOK\\]/g, title || "the attached Bible story").replace(/\\[AGE GROUP\\]/g, "the age group described in the learner's instructions (default: Kids 9–12)")''')
html = rep(html, "+ (scenario ? \"\" : \"\\n\\nScenarios are optional for this set: direct concept questions are fine.\")",
                 "+ (scenario ? \"\\n\\nFrame questions around the story's events and characters.\" : \"\\n\\nDirect recall questions are fine for this set.\")")

html = rep(html, '(/exam|quiz|practice/i.test(title) ? "" : " Practice Exam")', '(/exam|quiz|practice/i.test(title) ? "" : " Quiz")')

# ---------- built-in starter decks (all 60 questions) ----------
if not DECKS.exists():
    sys.exit(f"Deck folder not found: {DECKS}\nClone the private repo first:  gh repo clone ShanikwaH/faithful-study-decks \"{BASE / 'decks'}\"")
decks = [json.loads((DECKS / f).read_text(encoding="utf-8")) for f in
         ("bible-little-learners.json", "bible-kids.json", "bible-teens-adults.json")]
s_start = html.index("const SAMPLE = {"); s_end = html.index("]};", s_start) + 3
html = html[:s_start] + "const SAMPLE = " + json.dumps({"decks": decks}, ensure_ascii=False) + ";" + html[s_end:]

# ---------- write output ----------
# Update files in place. Never delete OUT: it's a git repository, and OUT/decks is a separate
# private deck repository nested inside it. Deck files are NOT copied into the public app folder.
(OUT / "icons").mkdir(parents=True, exist_ok=True)
(OUT / "index.html").write_text(html, encoding="utf-8")

sw = (BASE / "sw.js").read_text(encoding="utf-8")
sw = rep(sw, 'const CACHE = "faithful-study-v', 'const CACHE = "bible-stories-v')
sw = rep(sw, "/* Faithful Study service worker", "/* Bible Stories for All Ages service worker")
(OUT / "sw.js").write_text(sw, encoding="utf-8")

man = json.loads((BASE / "manifest.webmanifest").read_text(encoding="utf-8"))
man.update(name="Bible Stories for All Ages", short_name="Bible Stories",
           description="Bible story quizzes for families and Sunday school. Read-aloud, flashcards, and challenges that work offline.",
           background_color="#2A1650", theme_color="#2A1650", categories=["education", "kids", "lifestyle"])
(OUT / "manifest.webmanifest").write_text(json.dumps(man, indent=2), encoding="utf-8")

# icons
from PIL import Image, ImageDraw
def icon(size, maskable=False, rounded=True):
    S = size * 4; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    purple, deep, page, page2, gold = (107, 63, 160, 255), (42, 22, 80, 255), (244, 238, 251, 255), (228, 214, 247, 255), (242, 193, 78, 255)
    if maskable or not rounded: d.rectangle([0, 0, S, S], fill=deep)
    else: d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * .22), fill=deep)
    k = .8 if maskable else 1.0; c = S / 2
    f = lambda x, y: (c + (x - .5) * S * k, c + (y - .5) * S * k)
    d.polygon([f(.17, .34), f(.49, .38), f(.49, .82), f(.17, .78)], fill=page)
    d.polygon([f(.83, .34), f(.51, .38), f(.51, .82), f(.83, .78)], fill=page2)
    w = int(S * .06 * k)
    d.line([f(.5, .10), f(.5, .34)], fill=gold, width=w); d.line([f(.40, .18), f(.60, .18)], fill=gold, width=w)
    return im.resize((size, size), Image.LANCZOS)
icon(192).save(OUT / "icons/icon-192.png"); icon(512).save(OUT / "icons/icon-512.png")
icon(512, maskable=True).save(OUT / "icons/icon-maskable-512.png")
icon(180, rounded=False).convert("RGB").save(OUT / "icons/apple-touch-icon.png")

start_p = html.index("const AI_PROMPT = `") + len("const AI_PROMPT = `")
(OUT / "ai-quiz-prompt.txt").write_text(html[start_p: html.index("`;", start_p)], encoding="utf-8")
guide = BASE / "tools" / "BIBLE-EDITION-README.md"
if guide.exists(): shutil.copy(guide, OUT / "README.md")
print(f"Built Bible edition → {OUT}  ({sum(len(d['questions']) for d in decks)} starter questions)")

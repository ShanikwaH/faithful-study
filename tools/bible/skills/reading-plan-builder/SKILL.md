---
name: "reading-plan-builder"
description: "Build a day-by-day reading or listening plan (Bible, any book, textbook, course) as an importable readingplan/v1 file plus a Markdown checklist and optional calendar."
---

# Reading Plan Builder

Turns "read X in N days" into a balanced daily plan the person can follow, check off, and import into the Bible Stories for All Ages app (Bible tab > Reading plans > Import a plan).

## 1. Gather (ask with interactive checkboxes if anything is missing, 3-4 questions max)
- **What to read:** whole Bible, a testament, specific books (e.g., Psalms + Proverbs), a textbook's chapters, or a course reading list.
- **Length:** number of days (30, 90, 365) or a pace ("3 chapters a day").
- **Shape:** straight through, or parallel tracks each day (e.g., OT + NT, Psalms + Proverbs, textbook chapter + practice set).
- **Start date** (Day 1). Default: the day they choose; missed days stay open.
- **Outputs:** importable plan (default), Markdown checklist (default), .ics calendar (optional).

## 2. Build the plan
- **Balance by length, not by unit count.** Use verse counts for the Bible (or page counts for books) so each day takes about the same time. Keep whole chapters when the average day is 2+ chapters. When a track has fewer units than days (e.g., NT over 365 days), split chapters into verse ranges and break at paragraph starts near the target.
- **Cover everything exactly once.** No gaps, no repeats, original order within each track.
- **Never leave a day empty** unless the person asks for rest days (then label them `Rest / catch-up`).
- Compute it in code (Python) rather than by hand. For the Bible, get chapter/verse counts from a public-domain KJV source (e.g., eBible.org KJV or scrollmapper/bible_databases).

## 3. Reference format (must parse in the app)
Use full English book names and these forms only:
- Chapter: `Psalm 23` · Chapter range: `Genesis 1-3` · Verses: `John 3:16-21` · Across chapters: `Matthew 2:19-3:17` · Whole book: `Jude`
- Several passages in one day: separate entries in the day's array (or `;` in plain-text lines).
- Numbered books as `1 Corinthians`, `2 Kings`, `3 John`. Use `Song of Solomon`, `Psalm`/`Psalms`.

## 4. Outputs
**a) readingplan/v1 JSON** (save as `<slug>.readingplan.json`):
```json
{"format": "readingplan/v1",
 "plan": {"title": "Psalms in 30 Days", "description": "Five psalms a day.",
   "days": [["Psalm 1-5"], ["Psalm 6-10"], ["Psalm 119:1-88"], ["Genesis 1-2", "Matthew 1"]]}}
```
One inner array per day, in order. Keep titles under 50 characters.

**b) Markdown checklist** (`<slug>.md`): title, description, start date, then `- [ ] Day 1 (Tue, Oct 20): Genesis 1-2 · Matthew 1` for every day, grouped by month or week.

**c) Optional .ics calendar:** one all-day event per day, titled `Day N: <readings>`, starting on the chosen start date.

Plain-text alternative the app also accepts: first line = title, then one day per line (`Day 1: Genesis 1-3; Matthew 1`).

## 5. Verify before delivering
- Re-parse every reference and confirm each unit (verse or chapter) appears exactly once and in order.
- Report: number of days, average and max verses (or pages) per day, first and last day.
- For non-Bible books, cite the edition and table of contents you used for chapter/page counts; never invent page numbers.

## 6. Deliver
- Send the JSON and Markdown files.
- Tell them how to import on iPhone: copy the JSON text, open Bible Stories from the Home Screen, go to Bible > Reading plans, tap **Paste & import**, pick the start date.
- Offer a one-line next step (for example, a calendar file or a companion quiz deck from course-exam-builder).
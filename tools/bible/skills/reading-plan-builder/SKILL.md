---
name: reading-plan-builder
description: Build a day-by-day Bible (or any book) reading or listening plan with a daily prayer, memory verse, story quiz, and milestones, as an importable readingplan/v1 file plus a Markdown checklist and .ics calendar for the Bible Stories app.
---

# Reading Plan Builder

Turns "read X in N days" into a balanced daily plan the person can follow, check off, and import into the Bible Stories for All Ages app. Import it through Import › 📋 Paste & import, or Bible › Reading plans › Import a plan. Each day can also carry a prayer, a memory verse, story quiz questions, and milestones. It works with any prayers and quiz decks in the app, including ones added later.

## 1. Gather (ask with interactive checkboxes if anything is missing; 3-4 questions max)
- **What to read:** the whole Bible, a testament, specific books (e.g., Psalms + Proverbs), a story set (e.g., the life of David), a textbook's chapters, or a course reading list.
- **Length:** number of days (30, 90, 365) or a pace ("3 chapters a day"). Day 1 is whatever day the person starts; missed days stay open.
- **Shape:** straight through, or parallel tracks each day (e.g., OT + NT, Psalms + Proverbs).
- **Daily extras (default all on):**
  - 🙏 **Prayer:** matched to the reading, or to a topic such as thankful, family, peace, test day, or work.
  - 📌 **Memory verse:** one verse from the day's reading.
  - ❓ **Story quiz:** questions from the app's decks on the books being read.
  - 🏁 **Milestones:** "Finish Genesis" is added automatically for each book completed; add the person's own (a church event, "tell a friend the story of Noah").
- **Outputs:** the importable plan, a Markdown checklist, and an .ics calendar (all by default).

## 2. Build the readings (compute in Python, never by hand)
- **Balance by length, not by unit count.** Use verse counts for the Bible (or page counts for books) so each day takes about the same time. Keep whole chapters when the average day is 2+ chapters. When a track has fewer units than days (e.g., NT over 365 days), split chapters into verse ranges and break at paragraph starts near the target.
- **Cover everything exactly once:** no gaps, no repeats, original order within each track.
- **Never leave a day empty** unless the person asks for rest days (label them `Rest / catch-up`).
- **Bible counts** come from a public-domain KJV source (eBible.org KJV or scrollmapper/bible_databases).

## 3. Add the extras
- **Memory verse (`verse`):** one short, memorable verse inside that day's reading: a promise, praise, or teaching, about 40-220 characters. Skip genealogies, measurements, and battle lists. Give a reference only (`"John 3:16"`); the app shows the KJV words. If you leave it out, the app picks one, preferring well-known memory verses.
- **Prayer (`prayer`):** either the exact title of a prayer already in the app (its 64 Bible prayers, 23 classic prayers, 30 written for the app, or the person's own), or a new short prayer `{"title": "…", "text": "…"}` written on that day's reading. A new prayer is added to the person's 🖊️ My prayers when imported. Write new prayers warmly and plainly, quote the KJV word for word when you quote it, and keep them non-denominational. If you leave it out, the app picks a prayer from the same book, or one for the plan's `prayerTopic`.
- **Story quiz:** the app finds up to 5 questions in any deck whose sources cite that day's chapters, falling back to the same book. Set `"quiz": false` on a day to skip it. To make new questions for a plan, use the course-exam-builder skill (KJV: Book Chapter:Verse sources), then import that deck.
- **Milestones:** plan-level `milestones: [{"day": 30, "title": "One month done!"}]`, or a day-level `"milestone": "Finish the life of David"`. Book-completion milestones are automatic; don't repeat them.

## 4. Reference format (must parse in the app)
- **Forms:** use full English (KJV) book names and only these forms:
  - Chapter: `Psalm 23`
  - Chapter range: `Genesis 1-3`
  - Verses: `John 3:16-21`
  - Across chapters: `Matthew 2:19-3:17`
  - Whole book: `Jude`
- **Book names:** write numbered books as `1 Corinthians`, `2 Kings`, `3 John`. Use `Song of Solomon` and `Psalm`/`Psalms`.

## 5. Outputs
**a) readingplan/v1 JSON** (`<slug>.readingplan.json`):
```json
{"format": "readingplan/v1",
 "plan": {"title": "Genesis Stories in 30 Days", "description": "Creation to Joseph, with a prayer and verse each day.",
  "extras": {"prayer": true, "verse": true, "quiz": true, "prayerTopic": ""},
  "milestones": [{"day": 15, "title": "Halfway! Tell someone your favorite story so far"}],
  "days": [
   {"read": ["Genesis 1-2"], "verse": "Genesis 1:27", "prayer": {"title": "Thank you for creation", "text": "Lord, thank You for making the world and everything in it…"}},
   {"read": ["Genesis 3-4"], "verse": "Genesis 3:15", "prayer": "Create in me a clean heart"},
   ["Genesis 5-6"],
   {"read": ["Genesis 50"], "milestone": "Finished Joseph's story", "quiz": false}]}}
```
- **Each day** is either an array of readings or an object with `read` plus any of `verse`, `prayer`, `milestone`, and `quiz`.
- **Keep the title under 50 characters.**
- **Older plans** with plain arrays still import.

**b) Markdown checklist** (`<slug>.md`): the title, description, and start date, then a `- [ ] Day N (Tue, Oct 20): readings` line for each day, with sub-bullets for 🏁 milestones, 📌 the memory verse (reference and KJV words), 🙏 the prayer title, and ❓ story questions. Group days by week or month.

**c) .ics calendar** (`<slug>.ics`): one all-day VEVENT per day from the start date.
- **SUMMARY:** `Day N: <readings>`.
- **DESCRIPTION:** the readings, milestones, verse, and prayer.
- **Required fields:** UID, DTSTAMP, DTSTART;VALUE=DATE, and DTEND (the next day). Use CRLF line endings.

Plain text also imports: the first line is the title, then one day per line (`Day 1: Genesis 1-3; Matthew 1`).

## 6. Verify before delivering
- Re-parse every reference and confirm each verse or chapter appears exactly once and in order.
- Every `verse` falls inside that day's reading. Every prayer title you reused exists in the app's list (or write it as a new prayer). Every quoted KJV phrase in a new prayer matches the KJV exactly.
- Report the number of days, the average and maximum verses per day, the first and last day, and how many days have a verse, a prayer, and a milestone. Open the .md and .ics files to check them.
- For non-Bible books, cite the edition and table of contents you used for chapter or page counts. Never invent page numbers.

## 7. Deliver
- Send the JSON, Markdown, and .ics files.
- **Import on iPhone:** copy the JSON text (or a link made with `python tools/make-import-link.py plan.json https://shanikwah.github.io/bible-stories/`), open Bible Stories from the Home Screen, go to **Import › 📋 Paste & import**, and pick the start date.
- **Calendar:** open the .ics file and tap **Add All**.
- **In the app:** each day shows ▶ Play day, the memory verse with 🔊 Hear it, the prayer (Open), and ▶ Quiz me. **Daily extras and milestones** on the plan card turn extras on or off, set a prayer topic, and add milestones.
- Offer one next step, such as a companion quiz deck from course-exam-builder for the same books.

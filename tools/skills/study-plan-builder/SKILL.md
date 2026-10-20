---
name: study-plan-builder
description: Build a day-by-day study plan for any course up to an exam date (lessons, practice by topic, weak-spot review, exam simulations, milestones) as a Faithful Study studyplan/v1 file plus a Markdown checklist and .ics calendar.
---

# Study Plan Builder

Turns "I have this course and my exam is on X" into a dated plan the person can follow, check off, and import into the Faithful Study app (Import › Paste & import, or Plan tab › Import a study plan). It works for any course, whether its decks are already in the app or added later.

## 1. Gather (use interactive checkboxes if anything is missing; 3-4 questions max)
- **Course and goal:** course name or code (e.g., WGU D550), and the exam or assessment date.
- **Study days:** which weekdays (default Mon-Sat), and the start date (default today).
- **Load:** questions per practice session: light 10, standard 20 (default), or intense 30.
- **Decks:** the exact deck titles in Faithful Study, and their topic names if known. The deck JSON's `questions[].topic` values are the topics.
- **Lessons:** chapters, modules, slides, or videos in course order. Read them from the attached syllabus, course guide, or table of contents. Keep page numbers or links only when the materials show them; never invent page numbers.
- **Milestones:** pre-assessment, scheduling the exam, a project due date, and similar. Each can have a date.

## 2. Build the schedule (compute it in Python; don't lay it out by hand)
- **Dates:** every chosen weekday from the start date up to the day before the exam, then the exam day.
- **Learn phase (about 60% of the days):**
  - Spread the lessons in order: lesson j starts on day floor(j × learnDays / lessonCount).
  - Every learn day gets one practice session on the current lesson's topic. Match the chapter or unit number in the lesson title to the deck topic with the same number, otherwise the most similar topic name.
  - Add a short weak-spot review every third day.
- **Review phase (about 25%):** mixed practice plus weak-spot review each day, with one exam simulation in the middle.
- **Final phase (the rest, at least 2 days when the plan has 6 or more study days):** exam simulations every other day, weak-spot review on the days between, and weak spots plus flashcards on the last day before the exam.
- **Milestones:** put each on its date, or on the first study day after that date. Put undated milestones at the end of the learn phase.
- **Exam day:** add a final day with the milestone "🎯 Exam day: <course>".
- **Very short plans (under 6 study days):** shrink or drop the review and final phases, but keep at least one exam simulation if there's a deck.

## 3. Output
**a) studyplan/v1 JSON** (`<slug>.studyplan.json`). The app uses the `days` exactly as given:
```json
{"format": "studyplan/v1",
 "plan": {"title": "D550 Ethics for Accountants", "course": "WGU D550",
  "start": "2026-10-20", "exam": "2026-11-10", "studyDays": [1,2,3,4,5,6], "load": "standard",
  "decks": ["D550 Ethics for Accountants: Practice Exam 2 (60 Questions)"],
  "lessons": [{"title": "Mintz Ch. 3: Organizational Ethics and Corporate Governance", "detail": "eBook p. 102"}],
  "milestones": [{"title": "Take the pre-assessment", "date": "2026-11-02"}],
  "days": [
   {"date": "2026-10-20", "items": [
     {"type": "lesson", "title": "Mintz Ch. 3: Organizational Ethics and Corporate Governance", "detail": "eBook p. 102", "url": ""},
     {"type": "practice", "deck": "D550 Ethics for Accountants: Practice Exam 2 (60 Questions)", "topic": "Ch. 3 Organizational Ethics & Governance", "count": 20}]},
   {"date": "2026-11-09", "items": [{"type": "weak", "deck": "…", "count": 20}, {"type": "flash", "deck": "…"}]},
   {"date": "2026-11-10", "items": [{"type": "milestone", "title": "🎯 Exam day: WGU D550"}]}]}}
```
- **Item types:**
  - `lesson` (title, optional detail and url)
  - `practice` (deck, topic, or "" for mixed topics, and count)
  - `weak` (deck, count)
  - `examsim` (deck; 40 questions in 60 minutes)
  - `flash` (deck)
  - `milestone` (title)
- **Deck titles:** must match the app exactly; topics must match the deck's topic strings.
- **Without `days`:** the app builds the schedule itself from the other fields, using the same rules as section 2.

**b) Markdown checklist** (`<slug>.md`): the title, course, exam date, and study days, then a `## Tue, Oct 20` heading for each day with `- [ ]` items, for example `- [ ] ✏️ Practice 20 questions: Ch. 3 … (deck title)`.

**c) .ics calendar** (`<slug>.ics`): one all-day VEVENT per study day.
- SUMMARY: "<plan title>: <the item>" if the day has one item, or "<plan title>: N study items" if it has more.
- DESCRIPTION: all of the day's items.
- Include UID, DTSTAMP, DTSTART;VALUE=DATE, and DTEND (the next day). Use CRLF line endings.

Also offer a one-tap link the person can paste into the app's Import tab. This is optional: make it with `python tools/make-import-link.py plan.json` from the Faithful Study folder, which accepts any JSON.

## 4. Verify before delivering
- Every date falls on a chosen weekday, is on or after the start date, and is before the exam. The exam day is last.
- Every lesson appears exactly once, in order. Every deck title and topic matches the person's decks; flag any that don't.
- Report the number of study days, items per type, and the first and last days. Open the .ics and the Markdown to check them.

## 5. Deliver
- Send the JSON, Markdown, and .ics files.
- Import steps:
  - **iPhone:** copy the JSON text (or the link), open Faithful Study from the Home Screen, go to Import, and tap 📋 Paste & import.
  - **Calendar:** open the .ics file and tap Add All.
- If a deck isn't in the app yet, say which ones to add (Import › Ready-made decks, or a deck link).
- Remind the person that sessions started from the Plan tab check themselves off, missed work shows under Catch up, and ↻ Re-plan from today spreads unfinished work over the remaining days.

# Bible Stories for All Ages: Quiz App

*"Thy word have I hid in mine heart." (Psalm 119:11, KJV)* · by AnalyticsByShanikwa · v1.1.0

This is a Bible story quiz app for families, Sunday school, VBS, homeschool, and youth groups. It works on laptops, tablets, iPhones, and Android phones, even with no internet. Nothing to download from an app store, no accounts, and no ads. Everything stays on your device.

---

## What's inside

- **60 starter questions**, written from the King James Version, in three age tiers:
  - **Little Learners (ages 5–8):** 20 questions, 3 choices each, a hint on every card, and friendly explanations.
  - **Kids (ages 9–12):** 20 questions from Abraham to Pentecost.
  - **Teens & Adults:** 20 deeper questions with context, cross-references, and real-life application.
- **Every answer** shows a short explanation and the KJV scripture reference, often with the exact verse quoted.
- **🔊 Read aloud** reads each question and its answers out loud for pre-readers. It uses the device's built-in voice, so it works offline on most phones, tablets, and computers.
- **Study modes:**
  - **Practice** with instant feedback
  - **Flashcards:** tap to flip
  - **Timed challenge** for friendly competitions
  - **Weak spots:** replays the questions someone missed
- **Library:** save lesson PDFs, coloring pages, memory-verse cards, songs, and Bible story videos to use offline.
- **Make more quizzes:** paste any AI's quiz, type your own, or use AI Builder.

The 60 starter questions load automatically the first time you open the app. If you ever need them again, tap **Load the 60 starter Bible stories**.

**Deck files:** the separate deck files (and any new or paid decks) are kept in a private repository, `ShanikwaH/bible-stories-decks`, cloned locally at `C:\GitHub\bible-stories\decks`. This repository's `.gitignore` keeps that folder out of the public app.

---

## How to open it

**On a laptop or desktop:** unzip the folder and double-click `index.html`.

**On phones and tablets (recommended):** put the folder online once for free (see "Host it free" below), then:
- **iPhone or iPad:** open the link in Safari, tap **Share**, then **Add to Home Screen**.
- **Android:** open the link in Chrome, tap **⋮**, then **Install app**.

Open it once while connected. After that it works offline, even in the car, at camp, or in a church basement with no Wi-Fi.

### Host it free
- **GitHub Pages:**
  1. Create a public repository and upload everything inside this folder.
  2. Go to **Settings → Pages**, choose branch `main` and folder `/ (root)`, then **Save**.
- **Netlify Drop:** drag the folder onto app.netlify.com/drop.

> If you host both apps on the same GitHub account, give each one its own repository (for example `faithful-study` and `bible-stories`). They store their data separately and won't interfere with each other.

---

## Ideas for teachers and parents

- **Class on a TV or projector:** use **Practice**, read each question aloud (🔊), let kids call out answers, then tap to reveal the explanation and verse.
- **Friendly competition:** use **Timed challenge**, and check the score and the "By topic" results together.
- **Memory-verse review:** use **Flashcards**, and tap **Again** on anything a child didn't know.
- **Separate profiles:** each child can use their own device or browser. Progress is saved per device.
- **Your own lessons:** go to **Import → Copy AI prompt**, paste it into Claude or ChatGPT with this week's passage or curriculum, then paste the reply back into Import.
- **Print a worksheet:** on any deck, tap **••• → Print / save PDF**. You get a printable quiz with the answer key at the end.
- **Rename it for your church:** **Settings → Branding** (for example, "Grace Kids Bible Quiz").

---

## Adding your own questions

**Plain text** (the easiest way to type them):
```
# Deck: The Life of Moses (Ages 9–12)
Q: Where did God speak to Moses from a bush that burned but was not consumed?
A) Mount Carmel
*B) Mount Horeb
C) The Jordan River
D) Jericho
Explanation: The angel of the LORD appeared in a flame of fire out of the bush at Horeb, the mountain of God.
Source: KJV: Exodus 3:1–2
Topic: Exodus to Ruth
Hint: It is called the mountain of God.
```
Mark the right answer with `*`, or add a line such as `Answer: B`. You can also use CSV from a spreadsheet, JSON from any AI, or the editor in the app (**••• → Edit questions**).

**Deck links on a phone:** a deck link carries the whole deck. Copy the link, open the app from your Home Screen, go to **Import**, and tap **📋 Paste & import**. Don't just tap the link: a Home Screen app keeps its own storage, so tapping opens the deck in Safari or Chrome instead. To make a link from a deck file, run `python tools\make-import-link.py deck.json https://shanikwah.github.io/bible-stories/` from the Faithful Study folder. Needs app version 1.2.1+.

---

## Selling or sharing

- The app and all 60 starter questions are original works by AnalyticsByShanikwa. Quotations are from the King James Version, which is in the public domain in the United States.
- If you add questions quoting modern translations (NIV, ESV, NLT, and others), follow each publisher's quotation limits. Or stick with KJV, or use references only.
- To make a branded copy for a church or client, edit the `BRAND` block near the top of `index.html`. Or, from the main Faithful Study folder, run `python3 tools/build-bible-edition.py` to rebuild this edition from the shared source. The script updates files in place and never touches `decks\`.

*No accounts, no tracking. Nothing leaves your device except material you choose to send to an AI in AI Builder.*

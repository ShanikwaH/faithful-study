# Bible Stories for All Ages: Quiz App

*"Thy word have I hid in mine heart." (Psalm 119:11, KJV)* · by AnalyticsByShanikwa · v1.2.5

This is a Bible story quiz app for families, Sunday school, VBS, homeschool, and youth groups. It works on laptops, tablets, iPhones, and Android phones, even with no internet. Nothing to download from an app store, no accounts, and no ads. Everything stays on your device.

---

## What's inside

- **📖 The whole Holy Bible (King James Version) with an audio reader.** It's built into the app, so it works offline.
  - Open the **Bible** tab. Tap any of the 66 books and a chapter, or type a passage such as `John 3:16`, `Psalm 23`, `Genesis 1-3`, `1 Cor 13:4-7`, or `John 3:36-4:2`.
  - Press **▶ Play**. Your device's voice reads the passage aloud. The verse being read is highlighted, and the page scrolls along with it.
  - **What to read:** use **⚙ Options** to choose this chapter, only the verses you searched for, to the end of the book, or the whole Bible from where you are. **Read the whole book aloud** is on every book's chapter list.
  - **Your settings:** pick the reading speed, choose a voice, and set a sleep timer (15, 30, or 60 minutes, or the end of the chapter).
  - **Find your place again:** tap any verse number to read from there, read just that verse, or bookmark it. **Continue** picks up where you stopped, and **★ Bookmarks** keeps your saved verses.
  - **🎧 Narrated version:** on every chapter, **Narrated on Bible.com** opens that chapter's human-narrated KJV recording (*The Listener's Bible®: KJV Edition*, © 2007 Fellowship for the Performing Arts) in YouVersion's player. It needs internet and isn't stored in the app.
  - **Better voices:** for the most natural voice on iPhone, go to **Settings › Accessibility › Spoken Content › Voices › English** and download an *Enhanced* or *Premium* voice. Then choose it in ⚙ Options.
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
- **Bible text:** King James Version, Pure Cambridge Edition (from the MIT-licensed [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) project). Small-capital divine names (LORD, GOD) and the Psalm titles were checked against the public-domain [eBible.org KJV](https://ebible.org/kjv/).
- **Selling in the United Kingdom:** in the UK, rights in the Authorized (King James) Version are vested in the Crown and administered by Cambridge University Press, the Crown's patentee. Before you sell the app in the UK with the full Bible inside it, get written permission from **Cambridge University Press (its Bibles permissions department)**. Once permission is granted, use the acknowledgment wording they give you. Until then, the app does not claim Cambridge's permission or endorsement. Sales in the US and most other countries need no permission.
- **The audio** is your device's own text-to-speech voice reading the KJV text. No third-party recording is included in the app. The **Narrated on Bible.com** button only links to YouVersion's own player, where that recording is licensed.
- If you add questions quoting modern translations (NIV, ESV, NLT, and others), follow each publisher's quotation limits. Or stick with KJV, or use references only.
- To make a branded copy for a church or client, edit the `BRAND` block near the top of `index.html`. Or, from the main Faithful Study folder, run `python3 tools/build-bible-edition.py` to rebuild this edition from the shared source. The script updates files in place and never touches `decks\`.

*No accounts, no tracking. Nothing leaves your device except material you choose to send to an AI in AI Builder.*

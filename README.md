# Faithful Study: Offline Quiz & Study Vault

**Faithful with Numbers. Faithful with Truth.** · by AnalyticsByShanikwa · v1.1.0

Faithful Study turns any course material into practice exams you can take anywhere, with or without internet. It runs on laptops, desktops, iPhones, iPads, and Android phones, with nothing to install from an app store. Your data stays on your device.

---

## What's in the folder

```
faithful-study/
├── index.html                  ← the whole app (this file alone also works as the single-file version)
├── manifest.webmanifest        ← lets phones/computers "install" it
├── sw.js                       ← offline engine (caches the app)
├── icons/                      ← app icons (home screen, taskbar)
├── tools/                      ← build script for the Bible Stories edition
├── ai-quiz-prompt.txt          ← copy-paste prompt for any AI
└── README.md                   ← this guide

decks/   ← NOT in this public repo. Your decks live in the private repo
           ShanikwaH/faithful-study-decks, cloned locally at C:\GitHub\faithful-study\decks
           (this repo's .gitignore keeps it out).
```

---

## Three ways to run it

### 1. Single file on a laptop or desktop (easiest, 30 seconds)

1. Unzip the folder anywhere, such as Documents.
2. Double-click `index.html`. It opens in your browser.
3. It works offline from then on. Bookmark it, or pin the tab.

> Best in Chrome, Edge, or Firefox. Safari on Mac also works, but export a backup regularly (Settings → Backup), because some browsers limit storage for local files.

### 2. Installable app on iPhone, Android, and computers (recommended for phones)

Phones can't run a loose HTML file reliably, so put the folder on a free web host once. After that, you install it like an app, and it works fully offline.

**Option A: GitHub Pages (free; you already have a GitHub account)**
1. On github.com, click **New repository** and name it `faithful-study`. Set it to Public. (Pages on private repos needs a paid plan.)
2. Click **Add file → Upload files**, drag in everything inside the `faithful-study` folder (not the folder itself), then click **Commit**.
3. Go to **Settings → Pages**. Under "Branch," choose `main` and `/ (root)`, then **Save**.
4. After a minute or so, your app is live at `https://shanikwah.github.io/faithful-study/`.

**Option B: Netlify Drop (no account setup needed)**
Go to app.netlify.com/drop and drag the `faithful-study` folder onto the page. You get a link immediately. Create a free account to keep it permanently.

**Then install it:**
- **iPhone or iPad (Safari):** open the link, tap **Share** (the square with an arrow), then **Add to Home Screen**. Open it once while online, and it works offline after that.
- **Android (Chrome):** open the link, tap **⋮**, then **Install app** (or **Add to Home screen**).
- **Windows, Mac, or Chromebook (Chrome/Edge):** open the link and click the **install icon** in the address bar, or go to **Settings → Install app** inside Faithful Study.

> Your decks and progress are saved separately in each browser and on each device. To move them, use **Settings → Export backup** on one device and **Restore backup** on the other.

### 3. Share it with students or clients

Send them your hosted link. Each person's data stays private on their own device.

---

## Getting questions into the app

### A. Any AI chat (Claude, ChatGPT, Gemini, Copilot…): free with your existing subscription
1. In the app, go to **Import → Copy AI prompt**.
2. In your AI chat, attach your course files: PDFs, slides, book chapters, spreadsheets, images, video transcripts, or a pre-assessment report.
3. Paste the prompt, fill in the `[BRACKETS]`, and send it.
4. Copy the AI's reply into **Import → paste box → Import pasted text**, or save the reply as a `.json` file and drop it into Import.

> In Claude, the **course-exam-builder** skill does all of this automatically: it asks a few setup questions, writes fully sourced questions, and gives you both a study file and a deck ready to import here.

### B. AI Builder inside the app (needs internet plus an API key)
1. Go to **AI Builder** and pick **Claude**, **ChatGPT**, or **Other**.
2. Paste an API key. Keys come from console.anthropic.com or platform.openai.com. They're billed per use and are separate from your chat subscription. A 40-question exam usually costs well under a dollar.
3. Add files (PDF, DOCX, PPTX, XLSX, CSV, TXT, images), pick files from your Library, or paste notes or a transcript.
4. Set the question count, then click **Generate practice exam**. Always spot-check the new deck in **Edit questions**.

**Fully offline AI (advanced):** Install **Ollama** or **LM Studio** on your laptop, choose **Other OpenAI-compatible**, and use the base URL `http://localhost:11434/v1` for Ollama or `http://localhost:1234/v1` for LM Studio. For Ollama, allow browser access by setting `OLLAMA_ORIGINS=*` before starting it. In LM Studio, turn on CORS in the server settings. Local models can't read PDFs, so use DOCX, PPTX, text, or pasted content.

> **Security:** your key is stored only in this browser, and only if you tick "Remember." Never leave your key in a copy you give to other people.

### C. Spreadsheet (Excel or Google Sheets)
Save as CSV with these columns:
```
topic,question,A,B,C,D,answer,explanation,source,hint,tags
Ch. 4,"A CPA finds an error in a prior return. What first?",File amended return,Advise the client,Notify IRS,Do nothing,B,"Circular 230 §10.21 …","31 C.F.R. §10.21; SSTS 1.2",,weak-spot
```
- `answer` is a letter. For multi-select, use `A,C`.
- Separate multiple sources with semicolons.

### D. Plain text (type or paste)
```
# Deck: My Course Quiz
Q: A CPA finds an error in a client's prior-year return. What should the CPA do first?
A) File an amended return
*B) Advise the client of the error and its consequences
C) Notify the IRS
D) Nothing
Explanation: Circular 230 §10.21 requires advising the client; the client decides.
Source: 31 C.F.R. §10.21; AICPA SSTS No. 1 §1.2
Topic: Tax ethics
Hint: Who makes the final decision?
```
Mark the right answer with `*`, or add a line like `Answer: B` (or `Answer: A, C`).

### E. Build by hand
Go to **Decks → New blank deck** (or **••• → Edit questions**), then **+ Add question**.

### F. Your private decks
All deck files, including the D550 deck and the Bible source decks, live in a **private** repository, `ShanikwaH/faithful-study-decks`, never in this public one. On your computer it's cloned inside this folder at `decks\`. To use a deck, go to **Import → drop area** and choose the file from `C:\GitHub\faithful-study\decks`.
To set it up on a new computer: `gh repo clone ShanikwaH/faithful-study-decks C:\GitHub\faithful-study\decks`

---

## Study modes

**🔊 Read aloud:** every question, explanation, and flashcard can be read out loud by the device's built-in voice. It works offline on most phones, tablets, and computers.

- **Practice:** Instant feedback with the explanation and sources after every answer. Hints are available where the deck has them.
- **Timed exam:** Mimics the real test. It has a countdown (default 90 seconds per question), a question grid, and flags. You get no feedback until you submit. Results include your score against your target, a breakdown by topic, and a full review filtered by All, Missed, or Flagged.
- **Flashcards:** Tap or press Space to flip. Rate each card **Again** (1) or **Got it** (2).
- **Weak spots:** Drills only the questions you last missed, or miss more often than you get right.
- **Filters:** Every mode can filter by topic, limit the question count, and shuffle.

**Keyboard shortcuts:** A–D to pick an answer · Enter to check or go to the next question · ← → to move between questions · Esc to close a pop-up.

**Progress:** A question counts as *mastered* after two correct answers in a row. Open **••• → Progress & stats** for mastery, coverage, accuracy by topic, most-missed questions, and your full history.

---

## Library (study materials, offline)

Store PDFs, e-books, slides, spreadsheets, images, audio, and video on the device, grouped by course. Open them right inside the app: images, video, audio, PDFs, and text preview directly, and Word, PowerPoint, and Excel files show a text preview. You can also write quick notes. Tap **Protect storage from auto-cleanup** once so the browser doesn't clear your files.

> On iPhone, Safari may clear data for websites you haven't opened in a while. Installing the app to the Home Screen prevents that. Export a backup either way.

---

## Backup, export, and print

- **••• → Export JSON:** share a deck or re-import it anywhere.
- **••• → Export CSV:** open or edit the deck in Excel or Google Sheets.
- **••• → Print / save PDF:** a printable exam with the answer key at the end.
- **Settings → Export backup:** everything at once, with an option to include library files. **Restore backup** brings it all back on any device.

---

## Troubleshooting

- **The app shows the Import screen but my decks are gone.** You're in a different browser or device, or opened the file from a different folder. Restore your latest backup.
- **The AI says "Couldn't reach the AI service."** Check your internet connection and key. For local AI, check the base URL and the CORS setting.
- **A PDF won't preview on my phone.** Tap **Open in new tab** or **Download**.
- **I updated the app files but still see the old version.** Close and reopen the app twice. The offline engine updates in the background.

---

## Rebranding or selling

- **A Bible edition is already built:** see the `bible-stories` folder. To regenerate it after changing this app, run `python3 tools/build-bible-edition.py` from this folder. The script copies every fix and feature into the Bible edition, so the two never drift apart.

- Open `index.html` and edit the **BRAND** block near the top of the script (name, tagline, byline, URL, support email). Also update the name in `manifest.webmanifest` and the icons in `/icons`.
- Buyers can also rename it without code: **Settings → Branding**.
- **Content licensing:** the app, the AI prompt, and the formats are yours to sell. Decks built from copyrighted course materials (for example, McGraw Hill slides) are for personal study only. Don't resell them. Sell the app plus your own original question banks instead.
- Product ideas: "Offline Exam Prep App + AI Prompt Kit"; course-specific bundles of original question banks (CPA sections, WGU accounting courses, data analytics certifications); a Bible-story quiz edition for families or Sunday school.
- Before you sell, test on a real iPhone and an Android phone. Then write your own license and refund terms.

---

*No accounts, no tracking. Nothing leaves your device except files you choose to send to an AI in AI Builder.*

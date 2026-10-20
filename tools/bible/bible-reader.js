/* Bible Stories for All Ages: King James Bible reader with read-aloud.
   Loaded only by the Bible Stories edition (the build script adds this file, kjv.json, and the "Bible" tab).
   Text: King James Version, Pure Cambridge Edition (see kjv.json "meta"). Audio: the device's own speech voices,
   so it works offline and on any book, chapter, or verse range. */
(() => {
  "use strict";
  const NT_START = 39;
  const ALIASES = {
    genesis: 0, gen: 0, ge: 0, gn: 0, exodus: 1, exod: 1, exo: 1, ex: 1, leviticus: 2, lev: 2, le: 2, lv: 2, numbers: 3, num: 3, nu: 3, nm: 3,
    deuteronomy: 4, deut: 4, dt: 4, de: 4, joshua: 5, josh: 5, jos: 5, judges: 6, judg: 6, jdg: 6, jg: 6, ruth: 7, ru: 7, rth: 7,
    "1samuel": 8, "1sam": 8, "1sa": 8, "2samuel": 9, "2sam": 9, "2sa": 9, "1kings": 10, "1kgs": 10, "1ki": 10, "2kings": 11, "2kgs": 11, "2ki": 11,
    "1chronicles": 12, "1chron": 12, "1chr": 12, "1ch": 12, "2chronicles": 13, "2chron": 13, "2chr": 13, "2ch": 13, ezra: 14, ezr: 14,
    nehemiah: 15, neh: 15, ne: 15, esther: 16, esth: 16, est: 16, es: 16, job: 17, jb: 17, psalms: 18, psalm: 18, ps: 18, psa: 18, pss: 18,
    proverbs: 19, prov: 19, pro: 19, prv: 19, pr: 19, ecclesiastes: 20, eccl: 20, ecc: 20, ec: 20, qoh: 20,
    songofsolomon: 21, songofsongs: 21, song: 21, sos: 21, canticles: 21, cant: 21, isaiah: 22, isa: 22, is: 22, jeremiah: 23, jer: 23, je: 23,
    lamentations: 24, lam: 24, la: 24, ezekiel: 25, ezek: 25, eze: 25, ezk: 25, daniel: 26, dan: 26, da: 26, dn: 26, hosea: 27, hos: 27, ho: 27,
    joel: 28, jl: 28, amos: 29, am: 29, obadiah: 30, obad: 30, ob: 30, jonah: 31, jnh: 31, jon: 31, micah: 32, mic: 32, mc: 32, nahum: 33, nah: 33, na: 33,
    habakkuk: 34, hab: 34, hb: 34, zephaniah: 35, zeph: 35, zep: 35, zp: 35, haggai: 36, hag: 36, hg: 36, zechariah: 37, zech: 37, zec: 37, zc: 37,
    malachi: 38, mal: 38, ml: 38, matthew: 39, matt: 39, mat: 39, mt: 39, mark: 40, mrk: 40, mk: 40, mr: 40, luke: 41, luk: 41, lk: 41,
    john: 42, jhn: 42, jn: 42, joh: 42, acts: 43, act: 43, ac: 43, romans: 44, rom: 44, ro: 44, rm: 44,
    "1corinthians": 45, "1cor": 45, "1co": 45, "2corinthians": 46, "2cor": 46, "2co": 46, galatians: 47, gal: 47, ga: 47,
    ephesians: 48, eph: 48, ephes: 48, philippians: 49, phil: 49, php: 49, pp: 49, colossians: 50, col: 50,
    "1thessalonians": 51, "1thess": 51, "1thes": 51, "1th": 51, "2thessalonians": 52, "2thess": 52, "2thes": 52, "2th": 52,
    "1timothy": 53, "1tim": 53, "1ti": 53, "2timothy": 54, "2tim": 54, "2ti": 54, titus: 55, tit: 55, philemon: 56, philem: 56, phm: 56, pm: 56,
    hebrews: 57, heb: 57, james: 58, jas: 58, jm: 58, "1peter": 59, "1pet": 59, "1pe": 59, "1pt": 59, "2peter": 60, "2pet": 60, "2pe": 60, "2pt": 60,
    "1john": 61, "1jn": 61, "1jo": 61, "1jhn": 61, "2john": 62, "2jn": 62, "2jo": 62, "2jhn": 62, "3john": 63, "3jn": 63, "3jo": 63, "3jhn": 63,
    jude: 64, jud: 64, jd: 64, revelation: 65, revelations: 65, rev: 65, re: 65, therevelation: 65, apocalypse: 65
  };
  const SPEEDS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5];
  const SLEEP = [[0, "Off"], [15, "15 minutes"], [30, "30 minutes"], [60, "1 hour"], [-1, "End of this chapter"]];

  const BR = {
    data: null, loading: null, error: "",
    screen: "home", book: 0, ch: 1, sel: null,           // sel = {v1, v2} within the open chapter, from a search
    prefs: {rate: 0.9, voiceURI: "", sleep: 0, scope: "chapter"},
    bookmarks: [], resume: null,
    plans: {active: null, progress: {}, custom: []},     // reading plans: progress[id] = {start: "YYYY-MM-DD", done: {dayIndex: time}, pos}
    planShowAll: false,
    play: {on: false, id: 0, pos: null, end: null, follow: true, sleepTimer: null, sleepAt: 0, lock: null, startCh: null}
  };

  /* ---------- data & storage ---------- */
  async function loadData() {
    if (BR.data) return BR.data;
    if (!BR.loading) BR.loading = fetch("kjv.json").then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(d => { BR.data = d; return d; })
      .catch(e => { BR.error = "The Bible text couldn't be loaded (" + e.message + "). Open the app once while online so it can save the Bible for offline use."; BR.loading = null; throw e; });
    return BR.loading;
  }
  async function loadState() {
    try { const s = await DB.get("kv", "bible"); if (s) { Object.assign(BR.prefs, s.prefs || {}); BR.bookmarks = s.bookmarks || []; BR.resume = s.resume || null; if (s.plans) BR.plans = Object.assign({active: null, progress: {}, custom: []}, s.plans); } } catch (e) {}
  }
  function saveState() { try { DB.put("kv", {id: "bible", prefs: BR.prefs, bookmarks: BR.bookmarks, resume: BR.resume, plans: BR.plans}); } catch (e) {} }
  const books = () => BR.data.books;
  const bookName = b => books()[b].n;
  const chapters = b => books()[b].c;
  const verses = (b, c) => chapters(b)[c - 1].v;
  const vText = x => typeof x === "string" ? x : x[0];
  const vPara = x => typeof x !== "string" && x[1] === 1;
  const chapName = b => b === 18 ? "Psalm" : bookName(b);   // "Psalm 23", not "Psalms 23"
  // Bible.com (YouVersion) book codes, for the narrated KJV audio link (The Listener's Bible, KJV Edition)
  const USFM = "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split(" ");
  const narratedUrl = (b, c) => `https://www.bible.com/audio-bible/1/${USFM[b]}.${c}.KJV`;
  const ref = (b, c, v1, v2) => `${chapName(b)} ${c}${v1 ? ":" + v1 + (v2 && v2 !== v1 ? "–" + v2 : "") : ""}`;

  /* ---------- reference parsing: "John 3:16", "Ps 23", "1 Cor 13:4-7", "Genesis 1-3", "Jude 5" ---------- */
  function normBook(s) {
    let k = s.toLowerCase().replace(/\./g, " ").replace(/\s+/g, " ").trim();
    k = k.replace(/^(first|1st|i)\s+/, "1").replace(/^(second|2nd|ii)\s+/, "2").replace(/^(third|3rd|iii)\s+/, "3").replace(/^the\s+/, "");
    k = k.replace(/\s+/g, "");
    if (k in ALIASES) return ALIASES[k];
    const hits = books().map((b, i) => [b.n.toLowerCase().replace(/\s+/g, ""), i]).filter(([n]) => n.startsWith(k));
    return hits.length === 1 && k.length >= 3 ? hits[0][1] : -1;
  }
  function parseRef(input) {
    const m = String(input).trim().match(/^((?:[1-3]|i{1,3}|1st|2nd|3rd|first|second|third)?\s*[a-z][a-z .]*?)\s*(\d+)?(?:\s*[:.]\s*(\d+))?(?:\s*[-–—]\s*(\d+)(?:\s*[:.]\s*(\d+))?)?\s*$/i);
    if (!m) return {error: "Type a book and chapter, such as John 3 or Psalm 23:1-6."};
    const b = normBook(m[1]); if (b < 0) return {error: `“${m[1].trim()}” isn't a book name I recognize.`};
    const nCh = chapters(b).length; let [c1, v1, x, y] = [m[2], m[3], m[4], m[5]].map(n => n === undefined ? null : +n);
    if (c1 === null) return {b, c1: 1, v1: null, c2: nCh, v2: null, whole: true};
    if (nCh === 1 && v1 === null && (c1 > 1 || x !== null)) { v1 = c1; c1 = 1; if (x !== null) { y = x; x = 1; } }   // "Jude 5", "Jude 3-5"
    let c2 = c1, v2 = v1;
    if (x !== null) { if (y !== null) { c2 = x; v2 = y; } else if (v1 !== null) v2 = x; else c2 = x; }
    if (c1 < 1 || c1 > nCh || c2 < c1 || c2 > nCh) return {error: `${bookName(b)} has ${nCh} chapter${nCh > 1 ? "s" : ""}.`};
    const n1 = verses(b, c1).length, n2 = verses(b, c2).length;
    if (v1 !== null && (v1 < 1 || v1 > n1)) return {error: `${bookName(b)} ${c1} has ${n1} verses.`};
    if (v2 !== null && (v2 < 1 || v2 > n2 || (c2 === c1 && v2 < v1))) return {error: `${bookName(b)} ${c2} has ${n2} verses.`};
    return {b, c1, v1, c2, v2};
  }

  /* ---------- speech ---------- */
  const enVoices = () => canSpeak ? speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang)) : [];
  function pickVoice() {
    const vs = enVoices(); if (!vs.length) return null;
    return vs.find(v => v.voiceURI === BR.prefs.voiceURI) || vs.find(v => v.default) || vs.find(v => v.localService) || vs[0];
  }
  function setVoice(u, v) { u.lang = v ? v.lang : "en-GB"; try { if (v) u.voice = v; } catch (e) {} }
  // Read divine names and other all-capital words naturally ("LORD" -> "Lord", "I AM THAT I AM" -> "I Am That I Am").
  const forSpeech = t => t.replace(/\b([A-Z])([A-Z]+)\b/g, (w, a, b) => a + b.toLowerCase());
  function chunks(t) {   // short pieces: some browsers stop long utterances after ~15 seconds
    const parts = t.match(/[^.;:?!]+[.;:?!]*\s*/g) || [t], out = [];
    let cur = "";
    for (const p of parts) { if ((cur + p).length > 220 && cur) { out.push(cur.trim()); cur = p; } else cur += p; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function speakChunks(list, id, done) {
    let i = 0;
    const next = () => {
      if (id !== BR.play.id) return;
      if (i >= list.length) return done();
      const u = new SpeechSynthesisUtterance(list[i++]);
      setVoice(u, pickVoice());
      u.rate = BR.prefs.rate || 0.9;
      u.onend = () => next();
      u.onerror = ev => { if (id !== BR.play.id) return; if (ev.error === "interrupted" || ev.error === "canceled") pausePlayback(true); else next(); };
      speechSynthesis.speak(u);
    };
    next();
  }

  /* ---------- playback ---------- */
  const lastPos = () => { const b = books().length - 1, c = chapters(b).length; return {b, c, v: verses(b, c).length}; };
  const cmp = (p, q) => p.b - q.b || p.c - q.c || p.v - q.v;
  function nextPos(p) {
    if (p.v < verses(p.b, p.c).length) return {b: p.b, c: p.c, v: p.v + 1};
    if (p.c < chapters(p.b).length) return {b: p.b, c: p.c + 1, v: 1};
    if (p.b < books().length - 1) return {b: p.b + 1, c: 1, v: 1};
    return null;
  }
  function planEnd(start, scope) {
    if (BR.range && BR.range.b === start.b && start.c >= BR.range.c1 && start.c <= BR.range.c2 && (scope === "chapter" || scope === "selection")) {
      const c = BR.range.c2; return {b: start.b, c, v: BR.range.v2 || verses(start.b, c).length};
    }
    if (scope === "selection" && BR.sel) return {b: BR.book, c: BR.ch, v: BR.sel.v2};
    if (scope === "book") { const c = chapters(start.b).length; return {b: start.b, c, v: verses(start.b, c).length}; }
    if (scope === "bible") return lastPos();
    return {b: start.b, c: start.c, v: verses(start.b, start.c).length};
  }
  async function wakeLock(on) {
    try {
      if (on && "wakeLock" in navigator && !BR.play.lock && document.visibilityState === "visible") { BR.play.lock = await navigator.wakeLock.request("screen"); BR.play.lock.addEventListener("release", () => { BR.play.lock = null; }); }
      if (!on && BR.play.lock) { await BR.play.lock.release(); BR.play.lock = null; }
    } catch (e) {}
  }
  function startPlayback(start, scope, opts) {
    if (!canSpeak) { toast("This browser can't read aloud. Try Safari on iPhone or Chrome on Android.", true, 6000); return; }
    speechSynthesis.cancel();
    const id = ++BR.play.id;
    opts = opts || {};
    Object.assign(BR.play, {on: true, pos: start, end: opts.end || planEnd(start, scope), follow: true, startCh: start.c, scope,
      queue: opts.queue || [], planId: opts.planId || null, planDay: opts.planDay ?? null, seg: opts.seg || 0});
    clearTimeout(BR.play.sleepTimer); BR.play.sleepAt = 0;
    if (BR.prefs.sleep > 0) { BR.play.sleepAt = Date.now() + BR.prefs.sleep * 60000; BR.play.sleepTimer = setTimeout(() => { pausePlayback(); toast("Sleep timer: reading stopped."); }, BR.prefs.sleep * 60000); }
    wakeLock(true);
    readPos(start, true, id);
  }
  function readPos(p, first, id) {
    if (id !== BR.play.id) return;
    BR.play.pos = p; BR.resume = {b: p.b, c: p.c, v: p.v};
    if (BR.play.planDay !== null) { const pr = BR.plans.progress[BR.play.planId]; if (pr) pr.pos = {day: BR.play.planDay, seg: BR.play.seg, b: p.b, c: p.c, v: p.v}; }
    saveState();
    // follow along: show the chapter being read if the listener is on the reader
    if (S.view === "bible" && BR.play.follow && BR.screen === "read" && (BR.book !== p.b || BR.ch !== p.c)) {
      BR.book = p.b; BR.ch = p.c; BR.sel = null; render();   // afterRender highlights the verse
    } else markReading(p);
    const intro = [];
    if (p.v === 1 || first) {
      if (p.v === 1) { intro.push(p.b === 18 ? `Psalm ${p.c}.` : `${bookName(p.b).replace(/^([123]) /, (m, n) => ["", "First ", "Second ", "Third "][n])}, chapter ${p.c}.`); const t = chapters(p.b)[p.c - 1].t; if (t) intro.push(forSpeech(t)); }
    }
    const text = forSpeech(vText(verses(p.b, p.c)[p.v - 1]));
    speakChunks([...intro, ...chunks(text)], id, () => {
      const n = nextPos(p);
      if (!n || cmp(n, BR.play.end) > 0) return segmentDone(id);
      if (BR.prefs.sleep === -1 && n.c !== p.c) { finishPlayback(); toast("Sleep timer: end of chapter."); return; }
      readPos(n, false, id);
    });
  }
  // A plan day can have several passages (for example Psalm 1 and Matthew 1:1-17). Play them in order, then mark the day read.
  function segmentDone(id) {
    const P = BR.play;
    if (P.queue && P.queue.length) {
      const g = P.queue.shift(); P.seg++;
      P.end = {b: g.b, c: g.c2, v: g.v2}; P.startCh = g.c1;
      if (BR.prefs.sleep === -1) { finishPlayback(); toast("Sleep timer: end of chapter."); return; }
      return readPos({b: g.b, c: g.c1, v: g.v1}, true, id);
    }
    const planId = P.planId, day = P.planDay;
    finishPlayback();
    if (day !== null && planId) {
      const pr = BR.plans.progress[planId];
      if (pr) { pr.done[day] = Date.now(); pr.pos = null; saveState(); }
      toast(`Day ${day + 1} complete ✓`);
      if (S.view === "bible" && BR.screen === "plans") render();
    }
  }
  function pausePlayback(interrupted) {
    BR.play.id++; BR.play.on = false; clearTimeout(BR.play.sleepTimer);
    if (!interrupted && canSpeak) speechSynthesis.cancel();
    wakeLock(false); updateBar();
  }
  function finishPlayback() { pausePlayback(); BR.play.pos = null; BR.play.planDay = null; BR.play.planId = null; BR.play.queue = []; markReading(null); updateBar(); }
  const resumeOpts = () => BR.play.planDay !== null ? {end: BR.play.end, queue: BR.play.queue, planId: BR.play.planId, planDay: BR.play.planDay, seg: BR.play.seg} : undefined;
  function markReading(p) {
    document.querySelectorAll(".kjv .vs.reading").forEach(e => e.classList.remove("reading"));
    if (p && BR.screen === "read" && BR.book === p.b && BR.ch === p.c) {
      const el = document.getElementById("kv" + p.v);
      if (el) { el.classList.add("reading"); el.scrollIntoView({block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); }
    }
    updateBar();
  }
  function updateBar() {
    const st = document.getElementById("bpStatus"), btn = document.getElementById("bpPlay"); if (!st || !btn) return;
    const p = BR.play.pos;
    const dayTag = BR.play.planDay !== null && p ? `Day ${BR.play.planDay + 1} · ` : "";
    st.textContent = dayTag + (BR.play.on && p ? `Reading ${ref(p.b, p.c, p.v)}` + (BR.play.sleepAt ? ` · stops in ${Math.max(1, Math.round((BR.play.sleepAt - Date.now()) / 60000))} min` : "")
      : p ? `Paused at ${ref(p.b, p.c, p.v)}` : (BR.screen === "read" ? `${ref(BR.book, BR.ch)}${BR.sel ? ` · ${ref(BR.book, BR.ch, BR.sel.v1, BR.sel.v2).split(" ").pop()} selected` : ""}` : BR.screen === "plans" ? "Tap ▶ on a day to listen" : "Choose a book to start"));
    btn.innerHTML = BR.play.on ? "⏸<span class='vh'> Pause</span>" : "▶<span class='vh'> Play</span>";
    btn.setAttribute("aria-label", BR.play.on ? "Pause reading" : "Play: read aloud");
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && BR.play.on) wakeLock(true); });
  setInterval(() => { if (BR.play.on && BR.play.sleepAt) updateBar(); }, 30000);

  /* ---------- views ---------- */
  function bookGrid(from, to) {
    return `<div class="bgrid">${books().slice(from, to).map((b, i) => `<button class="btn bbook" data-act="bbook" data-b="${from + i}">${esc(b.n)}</button>`).join("")}</div>`;
  }
  function notice() {
    return `<p class="help bnotice">${esc(BR.data.meta.edition)}. ${esc(BR.data.meta.notice)} Read aloud by your device's built-in voice. The 🎧 narrated recording on Bible.com is The Listener's Bible®: KJV Edition, © 2007 Fellowship for the Performing Arts; it plays on Bible.com and is not stored in this app.</p>`;
  }
  function viewHome() {
    const r = BR.resume;
    return `<div class="row between" style="margin-bottom:10px"><h1>Holy Bible</h1><span class="pill">King James Version</span></div>
      <form id="bibleGo" class="card bsearch" role="search">
        <label for="bibleRef">Go to a book, chapter, or verses</label>
        <div class="row"><input id="bibleRef" type="text" inputmode="text" autocomplete="off" placeholder="e.g., John 3:16, Psalm 23, Genesis 1-3" style="flex:1;min-width:0"><button class="btn primary" type="submit">Go</button></div>
      </form>
      <div class="row" style="margin:12px 0">
        ${r ? `<button class="btn green" data-act="bresume">▶ Continue: ${esc(ref(r.b, r.c, r.v))}</button>` : ""}
        <button class="btn" data-act="bmarks">★ Bookmarks (${BR.bookmarks.length})</button>
        <button class="btn" data-act="bplans">📅 Reading plans</button>
      </div>
      ${todayCard()}
      <h2>Old Testament</h2>${bookGrid(0, NT_START)}
      <h2 style="margin-top:16px">New Testament</h2>${bookGrid(NT_START, books().length)}
      ${notice()}`;
  }
  function viewChapters() {
    const n = chapters(BR.book).length;
    return `<div class="row between" style="margin-bottom:10px"><button class="btn sm" data-act="bhome">← Books</button><h1 style="margin:0">${esc(bookName(BR.book))}</h1><span></span></div>
      <div class="row" style="margin-bottom:12px"><button class="btn green" data-act="bplaybook">▶ Read the whole book aloud</button></div>
      <div class="cgrid" role="list">${Array.from({length: n}, (_, i) => `<button class="btn" role="listitem" data-act="bch" data-c="${i + 1}" aria-label="${esc(bookName(BR.book))} chapter ${i + 1}">${i + 1}</button>`).join("")}</div>`;
  }
  function viewRead() {
    const ch = chapters(BR.book)[BR.ch - 1], vs = ch.v, sel = BR.sel;
    const marked = new Set(BR.bookmarks.filter(m => m.b === BR.book && m.c === BR.ch).map(m => m.v));
    let html = "", open = false;
    vs.forEach((x, i) => {
      const v = i + 1;
      if (!open || vPara(x)) { if (open) html += "</p>"; html += "<p>"; open = true; }
      const cls = ["vs"]; if (sel && v >= sel.v1 && v <= sel.v2) cls.push("sel"); if (marked.has(v)) cls.push("marked");
      html += `<span class="${cls.join(" ")}" id="kv${v}"><button class="vnum" data-act="bverse" data-v="${v}" aria-label="Verse ${v} options">${v}</button> ${esc(vText(x))} </span>`;
    });
    if (open) html += "</p>";
    const prev = BR.ch > 1 ? {b: BR.book, c: BR.ch - 1} : BR.book > 0 ? {b: BR.book - 1, c: chapters(BR.book - 1).length} : null;
    const next = BR.ch < chapters(BR.book).length ? {b: BR.book, c: BR.ch + 1} : BR.book < books().length - 1 ? {b: BR.book + 1, c: 1} : null;
    return `<div class="bhead"><button class="btn sm" data-act="bhome" aria-label="All books">← Books</button>
        <form id="bibleGo" class="bmini" role="search"><label class="vh" for="bibleRef">Go to a book, chapter, or verses</label>
          <input id="bibleRef" type="text" autocomplete="off" placeholder="Go to… e.g., John 3:16"><button class="btn sm primary" type="submit">Go</button></form></div>
      <div class="row between" style="align-items:center;gap:8px"><h1 class="btitle">${esc(chapName(BR.book))} ${BR.ch}</h1>
        ${chapters(BR.book).length > 1 ? `<button class="btn sm" data-act="bchapters" aria-label="Choose another chapter of ${esc(bookName(BR.book))}">Chapters</button>` : ""}</div>
      ${ch.t ? `<p class="bpsalm">${esc(ch.t)}</p>` : ""}
      <p class="bnarr"><a class="btn sm" href="${narratedUrl(BR.book, BR.ch)}" target="_blank" rel="noopener" aria-label="Hear ${esc(ref(BR.book, BR.ch))} narrated on Bible.com (opens in a new tab, needs internet)">🎧 Narrated on Bible.com</a> <span class="help">Human narration, needs internet</span></p>
      <article class="kjv" aria-label="${esc(ref(BR.book, BR.ch))}">${html}</article>
      <div class="row between" style="margin:14px 0">
        ${prev ? `<button class="btn" data-act="bgoto" data-b="${prev.b}" data-c="${prev.c}">← ${esc(ref(prev.b, prev.c))}</button>` : "<span></span>"}
        ${next ? `<button class="btn" data-act="bgoto" data-b="${next.b}" data-c="${next.c}">${esc(ref(next.b, next.c))} →</button>` : "<span></span>"}
      </div>
      ${notice()}`;
  }
  function playerBar() {
    return `<div class="bplayer" role="region" aria-label="Read-aloud player">
      <div class="bpstatus" id="bpStatus" aria-live="polite"></div>
      <div class="bpbtns">
        <button class="btn" data-act="bprev" aria-label="Previous chapter">⏮</button>
        <button class="btn primary bpmain" id="bpPlay" data-act="bplay" aria-label="Play: read aloud">▶</button>
        <button class="btn" data-act="bnext" aria-label="Next chapter">⏭</button>
        <button class="btn" data-act="bopts" aria-label="Reading options: what to play, speed, voice, sleep timer">⚙︎<span class="hide-xs"> Options</span></button>
      </div></div><div class="bspacer"></div>`;
  }
  async function renderBible() {
    if (!BR.stateLoaded && DB.db !== null) { await loadState(); BR.stateLoaded = true; }   // the app's database opens at boot, after this file loads
    try { await loadData(); } catch (e) { return `<div class="card"><h1>Holy Bible</h1><p class="muted">${esc(BR.error)}</p></div>`; }
    const body = BR.screen === "read" ? viewRead() : BR.screen === "chapters" ? viewChapters() : BR.screen === "plans" ? viewPlans() : viewHome();
    return body + playerBar();
  }
  EXTRA_VIEWS.bible = renderBible;
  BACKUP_KV.push("bible");   // bookmarks, reading plans, and reading options go into Settings › Backup
  document.addEventListener("app-restored", () => { BR.stateLoaded = false; });
  EXTRA_AFTER.push(() => {
    if (S.view !== "bible") return;
    updateBar();
    if (BR.play.pos) markReading(BR.play.pos);
    else if (BR.screen === "read" && BR.jumpTo) { const el = document.getElementById("kv" + BR.jumpTo); if (el) el.scrollIntoView({block: "center"}); }
    BR.jumpTo = null;
  });


  /* ---------- reading plans (Bible in a year, OT + NT daily, NT in 90 days, or imported) ---------- */
  // A reading is a passage {b, c1, v1, c2, v2} inside one book. A plan day is a list of readings.
  const lastV = (b, c) => verses(b, c).length;
  const DAY_MS = 86400000;
  const today0 = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseDay = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDay = d => d.toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"});
  function allChapters(fromB, toB) { const out = []; for (let b = fromB; b < toB; b++) chapters(b).forEach((ch, i) => out.push({b, c: i + 1, n: ch.v.length})); return out; }
  // Whole chapters, split so every day has about the same number of verses (about the same listening time).
  function splitChapters(list, days) {
    const total = list.reduce((a, x) => a + x.n, 0), out = []; let i = 0, cum = 0;
    for (let d = 0; d < days; d++) {
      const day = [], target = total * (d + 1) / days, daysLeft = days - d - 1;
      while (i < list.length && (d === days - 1 || !day.length || (cum + list[i].n / 2 <= target && list.length - i > daysLeft))) { day.push(list[i]); cum += list[i].n; i++; }
      out.push(day);
    }
    return out.map(groupChapters);
  }
  function groupChapters(chs) {   // consecutive chapters of one book -> one reading
    const out = [];
    chs.forEach(x => { const g = out[out.length - 1]; if (g && g.b === x.b && g.c2 === x.c - 1) { g.c2 = x.c; g.v2 = lastV(x.b, x.c); } else out.push({b: x.b, c1: x.c, v1: 1, c2: x.c, v2: lastV(x.b, x.c)}); });
    return out;
  }
  // Verse-level split for short daily portions (New Testament every day): breaks at the paragraph nearest the target.
  const range = (a, z) => Array.from({length: z - a}, (_, i) => a + i);
  function splitVerses(bookList, days) {
    const vs = [];
    for (const b of bookList) chapters(b).forEach((ch, ci) => ch.v.forEach((x, vi) => vs.push({b, c: ci + 1, v: vi + 1, br: vi === 0 || vPara(x)})));
    const cuts = [0];
    for (let d = 1; d < days; d++) {
      const t = Math.round(vs.length * d / days); let best = t;
      for (let k = 0; k <= 8; k++) { if (vs[t + k]?.br) { best = t + k; break; } if (vs[t - k]?.br && t - k > cuts[cuts.length - 1]) { best = t - k; break; } }
      cuts.push(Math.max(best, cuts[cuts.length - 1] + 1));
    }
    cuts.push(vs.length);
    return cuts.slice(0, -1).map((a, d) => {
      const out = [];
      vs.slice(a, cuts[d + 1]).forEach(x => { const g = out[out.length - 1]; if (g && g.b === x.b) { g.c2 = x.c; g.v2 = x.v; } else out.push({b: x.b, c1: x.c, v1: x.v, c2: x.c, v2: x.v}); });
      return out;
    });
  }
  const BUILT_IN = [
    {id: "gen-rev", title: "Bible in a year: Genesis to Revelation", description: "The whole Bible in order, 3 to 4 chapters a day. Each day is about the same length.", make: () => splitChapters(allChapters(0, books().length), 365)},
    {id: "ot-nt", title: "Bible in a year: Old + New Testament daily", description: "Every day has an Old Testament reading (about 2 to 3 chapters) and a New Testament reading (about 20 verses).",
      make: () => { const ot = splitChapters(allChapters(0, NT_START), 365), nt = splitVerses(range(NT_START, books().length), 365); return ot.map((d, i) => d.concat(nt[i])); }},
    {id: "nt-90", title: "New Testament in 90 days", description: "Matthew to Revelation, about 3 chapters a day. A good first plan.", make: () => splitChapters(allChapters(NT_START, books().length), 90)}
  ];
  // Plan builder (the reading-plan-builder skill, inside the app): whole chapters when there are enough, otherwise verse portions.
  function splitAuto(bookList, days) {
    const chs = bookList.flatMap(b => chapters(b).map((ch, i) => ({b, c: i + 1, n: ch.v.length})));
    return chs.length >= days ? splitChapters(chs, days) : splitVerses(bookList, days);
  }
  const SCOPES = {bible: ["The whole Bible", () => range(0, books().length)], ot: ["The Old Testament", () => range(0, NT_START)], nt: ["The New Testament", () => range(NT_START, books().length)],
    gospels: ["The four Gospels", () => range(39, 43)], custom: ["Books I choose (from… to…)", null]};
  const EXTRAS = {none: ["Nothing extra", []], nt: ["New Testament", null], ps: ["Psalms", [18]], pr: ["Proverbs", [19]], pspr: ["Psalms and Proverbs", [18, 19]]};
  function buildPlan(o) {
    const extra = o.extra === "nt" ? range(NT_START, books().length) : EXTRAS[o.extra][1];
    let main = o.scope === "custom" ? range(Math.min(o.from, o.to), Math.max(o.from, o.to) + 1) : SCOPES[o.scope][1]();
    main = main.filter(b => !extra.includes(b));
    if (!main.length) throw new Error("Choose books to read, other than the daily extra.");
    const days = Math.max(1, Math.min(1500, o.days | 0));
    const mainChs = main.reduce((a, b) => a + chapters(b).length, 0);
    if (days > main.reduce((a, b) => a + chapters(b).reduce((x, ch) => x + ch.v.length, 0), 0)) throw new Error("That's more days than there are verses to read. Choose fewer days.");
    const A = splitAuto(main, days), B = extra.length ? splitAuto(extra, days) : null;
    const name = o.scope === "custom" ? (main.length === 1 ? bookName(main[0]) : `${bookName(main[0])} to ${bookName(main[main.length - 1])}`) : SCOPES[o.scope][0].replace(/^The /, "").replace(/^./, c => c.toUpperCase());
    const title = `${name}${B ? " + " + EXTRAS[o.extra][0] : ""} in ${days} days`;
    const description = `${mainChs} chapters${B ? `, with ${EXTRAS[o.extra][0]} every day` : ""}. Made with the plan builder.`;
    return {title, description, days: A.map((d, i) => (B ? d.concat(B[i]) : d).map(readingLabel))};
  }
  const PLAN_PROMPT = `You are building a Bible reading plan for the "Bible Stories for All Ages" app (reading-plan-builder skill).
Plan: [DESCRIBE IT, e.g., "Psalms and Proverbs in 60 days" or "the life of David, 40 days, one passage a day"].
Rules:
- Balance the days by verse count so each day takes about the same time. Cover every chapter or passage exactly once, in order, with no empty days.
- Use full English book names and only these reference forms: "Psalm 23", "Genesis 1-3", "John 3:16-21", "Matthew 2:19-3:17", "Jude". Numbered books as "1 Corinthians", "2 Kings". Use the King James Version book names (e.g., "Song of Solomon").
- A day with more than one passage lists each passage separately.
Return ONLY valid JSON, no commentary, in exactly this format:
{"format": "readingplan/v1", "plan": {"title": "Short title (under 50 characters)", "description": "One sentence.", "days": [["Genesis 1-2", "Matthew 1"], ["Genesis 3-5"]]}}`;
  function planMarkdown(id) {
    const st = planStatus(id); if (!st) return "";
    const start = parseDay(st.pr.start);
    return `# ${st.P.title}\n\n${st.P.description}\n\nStart: ${fmtDay(start)} · ${st.n} days · King James Version\n\n` +
      st.P.days.map((d, i) => `- [${st.pr.done[i] ? "x" : " "}] Day ${i + 1} (${fmtDay(new Date(start.getTime() + i * DAY_MS))}): ${dayLabel(d)}`).join("\n") + "\n";
  }
  function planJSON(id) {
    const P = planDef(id); if (!P) return "";
    return JSON.stringify(planObj(id), null, 1);
  }
  function planObj(id) {
    const P = planDef(id); if (!P) return null;
    return {format: "readingplan/v1", plan: {...(BUILT_IN.some(b => b.id === id) ? {builtIn: id} : {}), title: P.title, description: P.description, days: P.days.map(d => d.map(readingLabel))}};
  }
  const planCache = {};
  function planDef(id) {
    if (planCache[id]) return planCache[id];
    const bi = BUILT_IN.find(p => p.id === id);
    if (bi) return planCache[id] = {id, title: bi.title, description: bi.description, days: bi.make()};
    const c = BR.plans.custom.find(p => p.id === id); if (!c) return null;
    return planCache[id] = {id, title: c.title, description: c.description || "", custom: true, days: c.days.map(day => day.flatMap(refToReadings))};
  }
  function refToReadings(str) {   // "Genesis 1-3", "Psalm 23", "John 3:16-4:2", "Jude"; several can be joined with ";"
    return String(str).split(/;|\s+and\s+/i).map(x => x.trim()).filter(Boolean).flatMap(x => {
      const r = parseRef(x); if (r.error) throw new Error(`“${x}”: ${r.error}`);
      return [{b: r.b, c1: r.c1, v1: r.v1 || 1, c2: r.c2, v2: r.v2 || lastV(r.b, r.c2)}];
    });
  }
  function readingLabel(g) {
    const whole1 = g.v1 === 1, wholeEnd = g.v2 === lastV(g.b, g.c2);
    if (g.c1 === g.c2) return whole1 && wholeEnd ? `${chapName(g.b)} ${g.c1}` : `${chapName(g.b)} ${g.c1}:${g.v1}–${g.v2}`;
    const nm = chapters(g.b).length === g.c2 - g.c1 + 1 && whole1 && wholeEnd ? bookName(g.b) : null;
    if (nm) return nm;
    return whole1 && wholeEnd ? `${bookName(g.b)} ${g.c1}–${g.c2}` : `${bookName(g.b)} ${g.c1}:${g.v1}–${g.c2}:${g.v2}`;
  }
  const dayLabel = day => day.map(readingLabel).join(" · ");
  function planStatus(id) {
    const P = planDef(id), pr = BR.plans.progress[id]; if (!P || !pr) return null;
    const n = P.days.length, doneN = Object.keys(pr.done).length;
    const todayIdx = Math.min(n - 1, Math.max(0, Math.floor((today0() - parseDay(pr.start)) / DAY_MS)));
    let next = 0; while (next < n && pr.done[next]) next++;
    let behind = 0; for (let i = 0; i < todayIdx; i++) if (!pr.done[i]) behind++;
    return {P, pr, n, doneN, todayIdx, next, behind, finished: doneN >= n};
  }
  function todayCard() {
    const id = BR.plans.active; if (!id) return "";
    const st = planStatus(id); if (!st) return "";
    if (st.finished) return `<div class="card bplancard"><strong>🎉 You finished ${esc(st.P.title)}!</strong> <button class="btn sm" data-act="bplans">Choose another plan</button></div>`;
    const d = st.next;
    return `<div class="card bplancard"><div class="row between"><strong>📅 ${esc(st.P.title)}</strong><span class="pill">Day ${d + 1} of ${st.n}</span></div>
      <p style="margin:6px 0 10px">${esc(dayLabel(st.P.days[d]))}</p>
      <div class="row"><button class="btn green" data-act="bpday" data-d="${d}">▶ Play day ${d + 1}</button><button class="btn" data-act="bplans">Open plan</button></div>
      ${st.behind ? `<p class="help" style="margin:8px 0 0">${st.behind} day${st.behind > 1 ? "s" : ""} to catch up. Keep going at your own pace.</p>` : ""}</div>`;
  }
  function viewPlans() {
    const id = BR.plans.active, st = id ? planStatus(id) : null;
    let html = `<div class="row between" style="margin-bottom:10px"><button class="btn sm" data-act="bhome">← Books</button><h1 style="margin:0">Reading plans</h1><span></span></div>`;
    if (st) {
      const p = Math.round(st.doneN / st.n * 100), start = parseDay(st.pr.start);
      const from = BR.planShowAll ? 0 : Math.max(0, Math.min(st.next, st.todayIdx) - 2), to = BR.planShowAll ? st.n : Math.min(st.n, Math.max(st.next, st.todayIdx) + 12);
      const rows = [];
      for (let i = from; i < to; i++) {
        const done = !!st.pr.done[i], isToday = i === st.todayIdx;
        rows.push(`<li class="bday ${done ? "done" : ""} ${isToday ? "today" : ""}">
          <button class="bcheck" data-act="bpdone" data-d="${i}" aria-pressed="${done}" aria-label="Day ${i + 1} ${done ? "read. Tap to mark unread" : "not read yet. Tap to mark read"}">${done ? "✓" : ""}</button>
          <div class="bdaytxt"><b>Day ${i + 1}</b> <span class="muted">${fmtDay(new Date(start.getTime() + i * DAY_MS))}${isToday ? " · today" : ""}</span><br><button class="blink" data-act="bpopen" data-d="${i}">${esc(dayLabel(st.P.days[i]))}</button></div>
          <button class="btn sm" data-act="bpday" data-d="${i}" aria-label="Play day ${i + 1}">▶</button></li>`);
      }
      html += `<div class="card"><div class="row between"><h2 style="margin:0">${esc(st.P.title)}</h2><span class="pill">${st.doneN} of ${st.n} days</span></div>
        <p class="muted" style="margin:6px 0">${esc(st.P.description)}</p>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="Plan progress ${p}%"><i style="width:${p}%"></i></div>
        <p style="margin:10px 0">${st.finished ? "🎉 Plan complete. Well done, good and faithful reader!" : st.behind ? `You have <strong>${st.behind}</strong> day${st.behind > 1 ? "s" : ""} to catch up. Missed days stay open, so just keep going.` : "You're on track."}</p>
        <div class="row">${st.finished ? "" : `<button class="btn green" data-act="bpday" data-d="${st.next}">▶ Play day ${st.next + 1}</button>`}
          <button class="btn sm" data-act="bpstart" data-id="${esc(id)}">Change start date</button>
          <button class="btn sm" data-act="bpexport" data-f="md" aria-label="Save this plan as a checklist (Markdown)">⬇ Checklist</button>
          <button class="btn sm" data-act="bpexport" data-f="json" aria-label="Save this plan as a plan file to share">⬇ Plan file</button>
          <button class="btn sm" data-act="bplink" aria-label="Copy a link to this plan">🔗 Copy link</button>
          ${navigator.share ? `<button class="btn sm" data-act="bplink" data-share="1" aria-label="Share a link to this plan">📤 Share</button>` : ""}</div>
        <ol class="bdays">${rows.join("")}</ol>
        <button class="btn sm ghost" data-act="bpall">${BR.planShowAll ? "Show fewer days" : `Show all ${st.n} days`}</button></div>`;
    }
    const all = [...BUILT_IN.map(b => ({id: b.id, title: b.title, description: b.description})), ...BR.plans.custom.map(c => ({id: c.id, title: c.title, description: c.description, custom: true, n: c.days.length}))];
    html += `<h2 style="margin-top:18px">${st ? "Other plans" : "Choose a plan"}</h2><div class="grid">${all.filter(x => x.id !== id).map(x => {
      const pr = BR.plans.progress[x.id], dn = pr ? Object.keys(pr.done).length : 0;
      return `<div class="card"><h3 style="margin-top:0">${esc(x.title)}</h3><p class="muted" style="font-size:.9rem">${esc(x.description || "")}${x.custom ? ` (${x.n} days, imported)` : ""}</p>
        <div class="row"><button class="btn primary sm" data-act="${pr ? "bpswitch" : "bpstart"}" data-id="${esc(x.id)}">${pr ? `Continue (${dn} days read)` : "Start this plan"}</button>
        ${x.custom ? `<button class="btn sm ghost" data-act="bpdel" data-id="${esc(x.id)}">Remove</button>` : ""}</div></div>`; }).join("")}</div>
      <div class="card" style="margin-top:14px"><h2 style="margin-top:0">🛠 Build your own plan</h2>
        <form id="bpBuild">
          <div class="field"><label for="bbScope">What to read</label><select id="bbScope">${Object.entries(SCOPES).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join("")}</select></div>
          <div class="row bbrange hide" id="bbRange"><div class="field" style="flex:1;min-width:130px"><label for="bbFrom">From</label><select id="bbFrom">${books().map((b, i) => `<option value="${i}">${esc(b.n)}</option>`).join("")}</select></div>
            <div class="field" style="flex:1;min-width:130px"><label for="bbTo">To</label><select id="bbTo">${books().map((b, i) => `<option value="${i}" ${i === 18 ? "selected" : ""}>${esc(b.n)}</option>`).join("")}</select></div></div>
          <div class="field"><label for="bbExtra">Also read every day</label><select id="bbExtra">${Object.entries(EXTRAS).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join("")}</select></div>
          <div class="field"><label for="bbDays">Number of days</label><input id="bbDays" type="number" min="1" max="1500" value="365" inputmode="numeric">
            <div class="row" style="margin-top:6px">${[30, 90, 180, 365].map(n => `<button type="button" class="btn sm" data-act="bbdays" data-n="${n}">${n}</button>`).join("")}</div></div>
          <p class="help" id="bbPreview"></p>
          <button class="btn primary" type="submit">Create plan</button></form>
        <p class="help" style="margin-top:12px">Want something else, like a topical or chronological plan? <button class="blink" data-act="bpprompt">Copy the AI prompt</button>, paste it into Claude, ChatGPT, or any AI with your idea, then import the result below.</p></div>
      <div class="card" style="margin-top:14px"><h2 style="margin-top:0">Import a plan</h2>
        <p class="muted" style="font-size:.9rem">Paste a <code>readingplan/v1</code> plan from the reading-plan skill or any AI, or a simple list with one day per line, such as <code>Genesis 1-3; Matthew 1</code>.</p>
        <label class="vh" for="bpText">Plan to import</label><textarea id="bpText" style="min-height:110px" placeholder='{"format":"readingplan/v1","plan":{"title":"Psalms in 30 days","days":[["Psalm 1-5"],["Psalm 6-10"]]}}'></textarea>
        <div class="row" style="margin-top:8px"><button class="btn primary" data-act="bpimport">Import plan</button><button class="btn" data-act="bpclip">📋 Paste & import</button></div></div>
      ${notice()}`;
    return html;
  }
  function importPlan(text) {
    text = String(text || "").trim(); if (!text) { toast("Paste a plan first.", true); return; }
    let title = "", description = "", days;
    try {
      if (/^[\[{]/.test(text)) {
        const j = JSON.parse(text), pl = j.plan || j;
        if (j.format && j.format !== "readingplan/v1") throw new Error("This isn't a readingplan/v1 file.");
        title = pl.title || ""; description = pl.description || ""; days = (pl.days || []).map(d => Array.isArray(d) ? d : d.readings || [d]);
      } else {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length && !/\d/.test(lines[0]) && !/^(jude|obadiah|philemon|2 ?john|3 ?john)\b/i.test(lines[0])) title = lines.shift();
        days = lines.map(l => [l.replace(/^(day\s*)?\d+\s*[:.)\-–]\s*/i, "")]);
      }
      if (!days.length) throw new Error("No days found.");
      days.forEach((d, i) => d.forEach(x => { try { refToReadings(x); } catch (e) { throw new Error(`Day ${i + 1}, ${e.message}`); } }));
    } catch (e) { toast("Couldn't import that plan. " + e.message, true, 8000); return; }
    const id = "custom-" + Date.now().toString(36);
    BR.plans.custom.push({id, title: title || `My reading plan (${days.length} days)`, description, days});
    saveState(); toast(`Imported “${title || "your plan"}” (${days.length} days).`);
    actions.bpstart({id});
  }

  /* ---------- actions ---------- */
  function openChapter(b, c, sel, jump) {
    if (BR.range && (BR.range.b !== b || c < BR.range.c1 || c > BR.range.c2)) BR.range = null;
    BR.book = b; BR.ch = c; BR.sel = sel || null; BR.screen = "read"; BR.jumpTo = jump || (sel && sel.v1) || null;
    BR.play.follow = BR.play.on && BR.play.pos && BR.play.pos.b === b && BR.play.pos.c === c;
    render(); if (!BR.jumpTo) window.scrollTo(0, 0);
  }
  const scopeStart = () => BR.sel ? {b: BR.book, c: BR.ch, v: BR.sel.v1} : {b: BR.book, c: BR.ch, v: 1};
  Object.assign(actions, {
    bplans: () => { BR.screen = "plans"; render(); window.scrollTo(0, 0); },
    bpall: () => { BR.planShowAll = !BR.planShowAll; render(); },
    bpstart: d => {
      const P = planDef(d.id); if (!P) return; const pr = BR.plans.progress[d.id];
      openModal(`<h2>${esc(P.title)}</h2><p class="muted">${P.days.length} days. Day 1 is the date you choose. Miss a day? It stays open so you can catch up.</p>
        <div class="field"><label for="bpDate">Start date (Day 1)</label><input id="bpDate" type="date" value="${pr ? pr.start : isoDay(today0())}"></div>
        <div class="actions"><button class="btn" data-act="modal-close" data-val="0">Cancel</button>${pr ? `<button class="btn danger" data-act="bpreset" data-id="${esc(d.id)}">Start over</button>` : ""}<button class="btn primary" data-act="bpgo" data-id="${esc(d.id)}">${pr ? "Save" : "Start plan"}</button></div>`);
    },
    bpgo: d => {
      const v = $("#bpDate")?.value || isoDay(today0()); const pr = BR.plans.progress[d.id];
      if (pr) pr.start = v; else BR.plans.progress[d.id] = {start: v, done: {}, pos: null};
      BR.plans.active = d.id; saveState(); closeModal(false); BR.screen = "plans"; render(); window.scrollTo(0, 0);
    },
    bpreset: async d => { closeModal(false); if (await confirmBox("Start over?", "Clears the days you've marked read in this plan.", "Start over", true)) { BR.plans.progress[d.id] = {start: isoDay(today0()), done: {}, pos: null}; BR.plans.active = d.id; saveState(); render(); } },
    bpswitch: d => { BR.plans.active = d.id; saveState(); render(); window.scrollTo(0, 0); },
    bpdel: async d => { if (!(await confirmBox("Remove plan?", "Removes this imported plan and its progress from this device.", "Remove", true))) return; BR.plans.custom = BR.plans.custom.filter(x => x.id !== d.id); delete BR.plans.progress[d.id]; delete planCache[d.id]; if (BR.plans.active === d.id) BR.plans.active = null; saveState(); render(); },
    bpdone: d => { const pr = BR.plans.progress[BR.plans.active]; if (!pr) return; const i = +d.d; if (pr.done[i]) delete pr.done[i]; else pr.done[i] = Date.now(); saveState(); render(); },
    bpopen: d => { const g = planDef(BR.plans.active).days[+d.d][0]; const whole = g.v1 === 1 && (g.c1 !== g.c2 || g.v2 === lastV(g.b, g.c1)); openChapter(g.b, g.c1, whole ? null : {v1: g.v1, v2: g.c1 === g.c2 ? g.v2 : lastV(g.b, g.c1)}, whole ? null : g.v1); },
    bpday: d => {
      const id = BR.plans.active, P = planDef(id), i = +d.d; if (!P) return;
      const pr = BR.plans.progress[id], segs = P.days[i].map(g => ({...g}));
      let seg = 0, start = {b: segs[0].b, c: segs[0].c1, v: segs[0].v1};
      if (pr.pos && pr.pos.day === i && segs[pr.pos.seg]) { seg = pr.pos.seg; start = {b: pr.pos.b, c: pr.pos.c, v: pr.pos.v}; }   // pick up where you stopped
      const cur = segs[seg];
      openChapter(start.b, start.c, null, start.v);
      startPlayback(start, "plan", {end: {b: cur.b, c: cur.c2, v: cur.v2}, queue: segs.slice(seg + 1), planId: id, planDay: i, seg});
    },
    bpimport: () => importPlan($("#bpText")?.value),
    bplink: async d => {
      const id = BR.plans.active, P = planDef(id); if (!P) return;
      const link = await makeLink(planObj(id)), msg = `Reading plan: ${P.title}. Open Bible Stories from your Home Screen, go to Import, and tap Paste & import.`;
      if (d.share && navigator.share) { try { await navigator.share({title: P.title, text: msg, url: link}); } catch (e) {} return; }
      try { await navigator.clipboard.writeText(link); toast("Plan link copied. In the other copy of the app, go to Import and tap 📋 Paste & import.", false, 6000); }
      catch (e) { openModal(`<h2>Plan link</h2><textarea readonly style="min-height:140px" onfocus="this.select()">${esc(link)}</textarea><div class="actions"><button class="btn" data-act="modal-close">Close</button></div>`); }
    },
    bbdays: d => { $("#bbDays").value = d.n; bbPreview(); },
    bpprompt: async () => { try { await navigator.clipboard.writeText(PLAN_PROMPT); toast("Prompt copied. Paste it into any AI and describe your plan."); } catch (e) { download("reading-plan-prompt.txt", PLAN_PROMPT, "text/plain"); } },
    bpexport: d => { const id = BR.plans.active, P = planDef(id); if (!P) return; const slugT = P.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (d.f === "md") download(slugT + ".md", planMarkdown(id), "text/markdown"); else download(slugT + ".readingplan.json", planJSON(id), "application/json"); },
    bpclip: async () => { let t = ""; try { t = await navigator.clipboard.readText(); } catch (e) { toast("Your browser didn't allow reading the clipboard. Long-press the box, tap Paste, then tap Import plan.", true, 8000); $("#bpText")?.focus(); return; } importPlan(t); },
    bbook: d => { BR.book = +d.b; BR.screen = chapters(+d.b).length === 1 ? "read" : "chapters"; BR.ch = 1; BR.sel = null; render(); window.scrollTo(0, 0); },
    bch: d => openChapter(BR.book, +d.c),
    bgoto: d => openChapter(+d.b, +d.c),
    bhome: () => { BR.screen = "home"; render(); window.scrollTo(0, 0); },
    bchapters: () => { BR.screen = "chapters"; render(); window.scrollTo(0, 0); },
    bresume: () => { const r = BR.resume; if (r) { openChapter(r.b, r.c, null, r.v); startPlayback({b: r.b, c: r.c, v: r.v}, BR.prefs.scope === "selection" ? "chapter" : BR.prefs.scope); } },
    bplaybook: () => { BR.screen = "read"; BR.ch = 1; BR.sel = null; render(); startPlayback({b: BR.book, c: 1, v: 1}, "book"); },
    bplay: () => {
      if (BR.play.on) return pausePlayback();
      if (BR.play.pos && !(BR.screen === "read" && (BR.play.pos.b !== BR.book || BR.play.pos.c !== BR.ch))) return startPlayback(BR.play.pos, BR.play.scope || BR.prefs.scope, resumeOpts());
      if (BR.screen !== "read") { const r = BR.resume; if (r) return actions.bresume(); toast("Choose a book and chapter first."); return; }
      const scope = BR.sel && BR.prefs.scope === "chapter" ? "selection" : BR.prefs.scope === "selection" && !BR.sel ? "chapter" : BR.prefs.scope;
      startPlayback(scopeStart(), scope);
    },
    bprev: () => { const p = BR.screen === "read" ? {b: BR.book, c: BR.ch} : null; if (!p) return; if (p.c > 1) p.c--; else if (p.b > 0) { p.b--; p.c = chapters(p.b).length; } else return; const was = BR.play.on; openChapter(p.b, p.c); if (was) startPlayback({b: p.b, c: p.c, v: 1}, BR.play.scope === "selection" ? "chapter" : BR.play.scope); },
    bnext: () => { const p = BR.screen === "read" ? {b: BR.book, c: BR.ch} : null; if (!p) return; if (p.c < chapters(p.b).length) p.c++; else if (p.b < books().length - 1) { p.b++; p.c = 1; } else return; const was = BR.play.on; openChapter(p.b, p.c); if (was) startPlayback({b: p.b, c: p.c, v: 1}, BR.play.scope === "selection" ? "chapter" : BR.play.scope); },
    bverse: d => {
      const v = +d.v, t = vText(verses(BR.book, BR.ch)[v - 1]), has = BR.bookmarks.some(m => m.b === BR.book && m.c === BR.ch && m.v === v);
      openModal(`<h2>${esc(ref(BR.book, BR.ch, v))}</h2><p class="kjv-quote">${esc(t)}</p>
        <div class="actions" style="justify-content:flex-start">
          <button class="btn primary" data-act="bfrom" data-v="${v}">▶ Read from here</button>
          <button class="btn" data-act="bone" data-v="${v}">Read just this verse</button>
          <button class="btn" data-act="bmark" data-v="${v}">${has ? "★ Remove bookmark" : "☆ Bookmark"}</button>
          <button class="btn ghost" data-act="modal-close" data-val="0">Close</button></div>`);
    },
    bfrom: d => { closeModal(false); BR.sel = null; startPlayback({b: BR.book, c: BR.ch, v: +d.v}, BR.prefs.scope === "selection" ? "chapter" : BR.prefs.scope); },
    bone: d => { closeModal(false); BR.sel = {v1: +d.v, v2: +d.v}; render(); startPlayback({b: BR.book, c: BR.ch, v: +d.v}, "selection"); },
    bmark: d => {
      const v = +d.v, i = BR.bookmarks.findIndex(m => m.b === BR.book && m.c === BR.ch && m.v === v);
      if (i >= 0) { BR.bookmarks.splice(i, 1); toast("Bookmark removed."); } else { BR.bookmarks.unshift({b: BR.book, c: BR.ch, v, at: Date.now()}); toast(`Bookmarked ${ref(BR.book, BR.ch, v)}.`); }
      saveState(); closeModal(false); render();
    },
    bmarks: () => {
      if (!BR.bookmarks.length) { toast("No bookmarks yet. Tap a verse number while reading to bookmark it."); return; }
      openModal(`<h2>Bookmarks</h2><div class="bmlist">${BR.bookmarks.map((m, i) => `<div class="bmitem"><button class="btn bmgo" data-act="bmopen" data-i="${i}"><b>${esc(ref(m.b, m.c, m.v))}</b><span class="muted">${esc(vText(verses(m.b, m.c)[m.v - 1]).slice(0, 70))}…</span></button><button class="btn sm ghost" data-act="bmdel" data-i="${i}" aria-label="Remove bookmark ${esc(ref(m.b, m.c, m.v))}">✕</button></div>`).join("")}</div>
        <div class="actions"><button class="btn" data-act="modal-close" data-val="0">Close</button></div>`);
    },
    bmopen: d => { const m = BR.bookmarks[+d.i]; closeModal(false); openChapter(m.b, m.c, {v1: m.v, v2: m.v}, m.v); },
    bmdel: d => { BR.bookmarks.splice(+d.i, 1); saveState(); closeModal(false); actions.bmarks(); },
    bopts: () => {
      const vs = enVoices(), cur = pickVoice();
      const scopes = [["chapter", "This chapter"], ["selection", "Selected verses (from a search)"], ["book", "To the end of the book"], ["bible", "The whole Bible from here"]];
      openModal(`<h2>Reading options</h2>
        <div class="field"><label for="bScope">What to read when you press Play</label><select id="bScope">${scopes.map(([k, l]) => `<option value="${k}" ${BR.prefs.scope === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="field"><label for="bRate">Reading speed</label><select id="bRate">${SPEEDS.map(r => `<option value="${r}" ${Math.abs(BR.prefs.rate - r) < .01 ? "selected" : ""}>${r === 1 ? "Normal" : r < 1 ? (r <= .75 ? "Slow" : "A little slower") : r >= 1.3 ? "Fast" : "A little faster"} (${r}×)</option>`).join("")}</select></div>
        <div class="field"><label for="bVoice">Voice</label><select id="bVoice">${vs.length ? vs.map(v => `<option value="${esc(v.voiceURI)}" ${cur && v.voiceURI === cur.voiceURI ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})${v.localService ? "" : " · needs internet"}</option>`).join("") : `<option value="">Device default</option>`}</select>
          <p class="help">More natural voices: on iPhone, go to Settings › Accessibility › Spoken Content › Voices › English and download an "Enhanced" or "Premium" voice.</p></div>
        <div class="field"><label for="bSleep">Sleep timer</label><select id="bSleep">${SLEEP.map(([m, l]) => `<option value="${m}" ${BR.prefs.sleep === m ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="actions"><button class="btn" data-act="btest">🔊 Test voice</button><button class="btn primary" data-act="bsaveopts">Save</button></div>`);
    },
    btest: () => { const u = new SpeechSynthesisUtterance("The LORD is my shepherd; I shall not want.".replace("LORD", "Lord")); const vs = enVoices(), v = vs.find(x => x.voiceURI === $("#bVoice")?.value) || pickVoice(); setVoice(u, v); u.rate = +($("#bRate")?.value || 1); speechSynthesis.cancel(); speechSynthesis.speak(u); },
    bsaveopts: () => {
      BR.prefs.scope = $("#bScope").value; BR.prefs.rate = +$("#bRate").value; BR.prefs.voiceURI = $("#bVoice").value; BR.prefs.sleep = +$("#bSleep").value;
      saveState(); closeModal(false); toast("Reading options saved.");
      if (BR.play.on && BR.play.pos) startPlayback(BR.play.pos, BR.play.scope, resumeOpts());   // apply new speed/voice/timer right away
      else updateBar();
    }
  });
  const bbOpts = () => ({scope: $("#bbScope").value, from: +$("#bbFrom").value, to: +$("#bbTo").value, extra: $("#bbExtra").value, days: +$("#bbDays").value});
  function bbPreview() {
    const el = $("#bbPreview"); if (!el) return;
    $("#bbRange")?.classList.toggle("hide", $("#bbScope").value !== "custom");
    try { const P = buildPlan(bbOpts()); el.textContent = `${P.title}. Day 1: ${P.days[0].join(" · ")}.`; } catch (e) { el.textContent = e.message; }
  }
  document.addEventListener("change", e => { if (/^bb(Scope|From|To|Extra)$/.test(e.target.id)) bbPreview(); });
  document.addEventListener("input", e => { if (e.target.id === "bbDays") bbPreview(); });
  EXTRA_AFTER.push(() => { if (S.view === "bible" && BR.screen === "plans") bbPreview(); });
  document.addEventListener("submit", e => {
    if (e.target.id !== "bpBuild") return;
    e.preventDefault();
    let P; try { P = buildPlan(bbOpts()); } catch (err) { toast(err.message, true, 6000); return; }
    const id = "custom-" + Date.now().toString(36);
    BR.plans.custom.push({id, title: P.title, description: P.description, days: P.days});
    saveState(); toast(`Created “${P.title}”.`); actions.bpstart({id});
  });
  document.addEventListener("submit", e => {
    if (e.target.id !== "bibleGo") return;
    e.preventDefault();
    const q = $("#bibleRef").value; if (!q.trim()) return;
    const r = parseRef(q); if (r.error) { toast(r.error, true, 5000); return; }
    if (!BR.play.on) BR.play.pos = null;
    BR.range = null;
    if (r.whole) { BR.book = r.b; BR.screen = chapters(r.b).length === 1 ? "read" : "chapters"; BR.ch = 1; BR.sel = null; render(); window.scrollTo(0, 0); return; }
    if (r.v1 === null) {   // a chapter, or a chapter range such as Genesis 1-3
      openChapter(r.b, r.c1);
      if (r.c2 > r.c1) { BR.range = {b: r.b, c1: r.c1, c2: r.c2, v2: null}; toast(`Press ▶ Play to hear ${bookName(r.b)} ${r.c1}–${r.c2}.`); }
      return;
    }
    if (r.c2 > r.c1) {     // verses across chapters, such as John 3:16-4:2
      BR.range = {b: r.b, c1: r.c1, c2: r.c2, v2: r.v2};
      openChapter(r.b, r.c1, {v1: r.v1, v2: verses(r.b, r.c1).length}, r.v1);
    } else openChapter(r.b, r.c1, {v1: r.v1, v2: r.v2 === null ? r.v1 : r.v2}, r.v1);
    toast(`Press ▶ Play to hear ${ref(r.b, r.c1, r.v1)}${r.c2 > r.c1 ? "–" + r.c2 + ":" + r.v2 : r.v2 && r.v2 !== r.v1 ? "–" + r.v2 : ""}.`);
  });
  // Leaving the Bible tab pauses reading (Safari reports a cancel as a normal "end", so don't rely on the error event).
  const _nav = nav;
  nav = function (view) { if (view !== "bible" && BR.play.on) pausePlayback(); return _nav(view); };

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.bsearch label{display:block;font-weight:600;margin-bottom:6px}
.bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:6px;margin-top:8px}
.bbook{justify-content:flex-start;text-align:left;padding:10px 12px;font-size:.92rem;min-height:44px}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:6px}
.cgrid .btn{min-height:48px;justify-content:center;padding:6px}
.bhead{position:sticky;top:0;z-index:5;background:var(--bg);padding:6px 0;display:flex;gap:6px;align-items:center}
.bmini{display:flex;gap:6px;flex:1;min-width:0}
.bmini input{flex:1;min-width:0;padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;font-size:16px}
.btitle{margin:6px 0 4px}
.bpsalm{font-style:italic;color:var(--muted);margin:0 0 10px}
.kjv{font-family:Georgia,"Times New Roman",serif;font-size:1.12rem;line-height:1.85;max-width:42em}
.kjv p{margin:0 0 .9em}
.kjv .vs{border-radius:6px;transition:background .25s}
.kjv .vs.sel{background:var(--surface-2)}
.kjv .vs.marked .vnum::after{content:"★";font-size:.7em;margin-left:1px;color:#C9971C}
.kjv .vs.reading{background:color-mix(in srgb,var(--accent) 22%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}
.vnum{font:700 .72rem/1 var(--font);color:var(--accent);background:none;border:0;padding:6px 3px;min-width:28px;min-height:28px;vertical-align:super;cursor:pointer;border-radius:6px}
.vnum:hover,.vnum:focus-visible{background:var(--surface-2)}
.kjv-quote{font-family:Georgia,serif;font-size:1.05rem;line-height:1.7}
.bnotice{margin-top:22px}
.bnarr{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 12px}.bnarr .help{margin:0}
.bplayer{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--surface);border-top:1px solid var(--border);box-shadow:0 -6px 24px rgba(0,0,0,.12);padding:8px 12px calc(8px + env(safe-area-inset-bottom))}
.bpstatus{max-width:960px;margin:0 auto 6px;font-size:.85rem;color:var(--muted);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bpbtns{display:flex;gap:8px;justify-content:center;max-width:960px;margin:0 auto}
.bpbtns .btn{min-height:46px;min-width:50px;justify-content:center;font-size:1.1rem}
.bpmain{min-width:76px!important}
.bspacer{height:120px}
body:has(.bplayer) #toast{bottom:calc(118px + env(safe-area-inset-bottom))}
.bplancard{margin:0 0 14px}
.bdays{list-style:none;padding:0;margin:12px 0;display:grid;gap:6px}
.bday{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
.bday.today{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent)}
.bday.done .bdaytxt{opacity:.7}
.bcheck{flex:none;width:34px;height:34px;border-radius:50%;border:2px solid var(--border);background:var(--surface);color:#fff;font-weight:700;cursor:pointer}
.bday.done .bcheck{background:var(--ok);border-color:var(--ok)}
.bdaytxt{flex:1;min-width:0;font-size:.92rem}
.blink{background:none;border:0;padding:2px 0;color:var(--accent);font:inherit;text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.bbrange{gap:10px}
.bmlist{display:grid;gap:6px}
.bmitem{display:flex;gap:6px;align-items:stretch}
.bmgo{flex:1;flex-direction:column;align-items:flex-start;text-align:left;gap:2px;min-width:0}
.bmgo span{font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
@media (max-width:420px){ .bgrid{grid-template-columns:repeat(2,1fr)} .kjv{font-size:1.06rem} }
@media (prefers-reduced-motion:reduce){ .kjv .vs{transition:none} }`;
  document.head.appendChild(css);

  /* ---------- start ---------- */
  if (canSpeak && "onvoiceschanged" in speechSynthesis) speechSynthesis.addEventListener("voiceschanged", () => {});
  // Plan links pasted in Import › Paste & import (or opened from a link) land here.
  EXTRA_IMPORTERS["readingplan/v1"] = async obj => {
    await loadData(); if (!BR.stateLoaded && DB.db !== null) { await loadState(); BR.stateLoaded = true; }
    BR.screen = "plans"; nav("bible");
    const pl = obj.plan || {};
    if (pl.builtIn && BUILT_IN.some(b => b.id === pl.builtIn)) { actions.bpstart({id: pl.builtIn}); return; }
    const same = BR.plans.custom.find(c => c.title === pl.title && JSON.stringify(c.days) === JSON.stringify(pl.days));
    if (same) { toast("You already have this plan."); actions.bpstart({id: same.id}); return; }
    importPlan(JSON.stringify(obj));
  };
  window.BibleReader = {parseRef: q => (BR.data ? parseRef(q) : null), state: BR, load: loadData, planDef: id => (BR.data ? planDef(id) : null), dayLabel, importPlan};
})();

/* Faithful Study: study plans (Plan tab).
   Build a day-by-day plan for any course: lessons and readings, practice from your decks by topic, weak-spot review,
   exam simulations, and milestones, spread over the days you study until your exam date. Sessions you finish from the
   plan check themselves off; missed work rolls into "Catch up"; review grows toward the topics you miss most.
   Plans travel as studyplan/v1 (links, Import › Paste & import, or the study-plan-builder skill). */
(() => {
  "use strict";
  const SP = {plans: [], active: null, loaded: false, showAll: false, building: false};
  const DAY = 86400000, WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today0 = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseDay = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDay = s => parseDay(s).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"});
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const LOADS = {light: 10, standard: 20, intense: 30};

  /* ---------- storage ---------- */
  async function loadState() { if (SP.loaded || DB.db === null) return; try { const s = await DB.get("kv", "studyplans"); if (s) { SP.plans = s.plans || []; SP.active = s.active || null; } } catch (e) {} SP.loaded = true; }
  const save = () => { try { DB.put("kv", {id: "studyplans", plans: SP.plans, active: SP.active}); } catch (e) {} };
  BACKUP_KV.push("studyplans");
  document.addEventListener("app-restored", () => { SP.loaded = false; });
  const plan = () => SP.plans.find(p => p.id === SP.active) || null;
  const deckByTitle = t => S.decks.find(d => d.title === t) || S.decks.find(d => d.title.toLowerCase() === String(t || "").toLowerCase());

  /* ---------- building a schedule ---------- */
  function studyDates(startISO, examISO, days) {
    const out = []; let d = parseDay(startISO); const end = parseDay(examISO);
    while (d < end) { if (days.includes(d.getDay())) out.push(iso(d)); d = addDays(d, 1); }
    return out;
  }
  function topicsOf(titles) {   // [{deck, topic, n}] in deck order
    const out = [];
    titles.forEach(t => { const d = deckByTitle(t); if (!d) return; const m = {}; d.questions.forEach(q => { m[q.topic] = (m[q.topic] || 0) + 1; }); Object.entries(m).forEach(([topic, n]) => out.push({deck: d.title, topic, n})); });
    return out;
  }
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function matchTopic(lesson, topics) {   // a lesson "Mintz Ch. 4 …" practices the deck topic "Ch. 4 …" when they share a chapter or words
    if (lesson.topic) { const t = topics.find(x => norm(x.topic) === norm(lesson.topic)) || topics.find(x => norm(x.topic).includes(norm(lesson.topic))); if (t) return t; }
    const ch = (lesson.title.match(/\b(?:ch(?:apter)?\.?|unit|module|lesson)\s*(\d+)/i) || [])[1];
    if (ch) { const t = topics.find(x => new RegExp(`\\b(?:ch(?:apter)?\\.?|unit|module|lesson)\\s*${ch}\\b`, "i").test(x.topic)); if (t) return t; }
    const words = norm(lesson.title).split(" ").filter(w => w.length > 4);
    let best = null, score = 0; topics.forEach(x => { const s = words.filter(w => norm(x.topic).includes(w)).length; if (s > score) { score = s; best = x; } });
    return best;
  }
  // Learn (about 60% of study days): lessons in order, each with practice on its topic (or the next topic in rotation).
  // Review (about 25%): mixed practice plus weak spots, with one exam simulation in the middle.
  // Final (the rest): exam simulations every other day, weak-spot review, and flashcards the day before the exam.
  function buildSchedule(def) {
    const dates = studyDates(def.start, def.exam, def.days);
    if (!dates.length) throw new Error("No study days between the start date and the exam date. Pick a later exam date or more study days.");
    const n = dates.length, count = LOADS[def.load] || 20, topics = topicsOf(def.decks), mainDeck = (def.decks.map(deckByTitle).filter(Boolean).sort((a, b) => b.questions.length - a.questions.length)[0] || {}).title;
    const nFinal = n >= 6 ? Math.max(2, Math.round(n * 0.15)) : n >= 3 ? 1 : 0, nReview = n >= 6 ? Math.max(1, Math.round(n * 0.25)) : n >= 4 ? 1 : 0, nLearn = Math.max(1, n - nFinal - nReview);
    const days = dates.map(date => ({date, items: []}));
    let k = 0; const id = () => "i" + (++k);
    const lessons = def.lessons || [];
    // Learn phase
    for (let i = 0; i < nLearn; i++) {
      // lesson j starts on learn day floor(j * nLearn / L); the days after it practice that lesson's topic
      const startOf = j => Math.floor(j * nLearn / lessons.length);
      const todays = lessons.filter((_, j) => startOf(j) === i);
      let cur = -1; lessons.forEach((_, j) => { if (startOf(j) <= i) cur = j; });
      todays.forEach(l => days[i].items.push({id: id(), type: "lesson", title: l.title, detail: l.detail || "", url: l.url || ""}));
      if (topics.length) {
        const t = (cur >= 0 && matchTopic(lessons[cur], topics)) || topics[i % topics.length];
        days[i].items.push({id: id(), type: "practice", deck: t.deck, topic: t.topic, count});
      }
      if (i > 0 && i % 3 === 2 && mainDeck) days[i].items.push({id: id(), type: "weak", deck: mainDeck, count: Math.round(count / 2)});
    }
    // Review phase
    for (let j = 0; j < nReview; j++) {
      const i = nLearn + j;
      if (mainDeck) {
        if (j === Math.floor(nReview / 2)) days[i].items.push({id: id(), type: "examsim", deck: mainDeck});
        else { days[i].items.push({id: id(), type: "practice", deck: mainDeck, topic: "", count}); days[i].items.push({id: id(), type: "weak", deck: mainDeck, count}); }
      }
    }
    // Final phase
    for (let j = 0; j < nFinal; j++) {
      const i = nLearn + nReview + j, last = j === nFinal - 1;
      if (!mainDeck) continue;
      if (last) { days[i].items.push({id: id(), type: "weak", deck: mainDeck, count}); days[i].items.push({id: id(), type: "flash", deck: mainDeck}); }
      else if (j % 2 === 0) days[i].items.push({id: id(), type: "examsim", deck: mainDeck});
      else days[i].items.push({id: id(), type: "weak", deck: mainDeck, count});
    }
    // Milestones: on their date when given, otherwise at the end of the learn phase
    (def.milestones || []).forEach(m => {
      const target = m.date && days.find(d => d.date >= m.date) || days[Math.min(n - 1, nLearn - 1)];
      target.items.unshift({id: id(), type: "milestone", title: m.title});
    });
    days.push({date: def.exam, items: [{id: id(), type: "milestone", title: `🎯 Exam day: ${def.course || def.title}`}]});
    return days.filter(d => d.items.length);
  }
  function makePlan(def, explicitDays) {
    const days = explicitDays ? explicitDays.map((d, i) => ({date: d.date, items: d.items.map((x, j) => ({...x, id: `i${i}_${j}`}))})) : buildSchedule(def);
    return {id: "sp-" + Date.now().toString(36), def, days, done: {}, created: Date.now()};
  }
  // Re-plan: keep finished work, spread everything not yet done over the remaining study days from today.
  function replan(p) {
    const d0 = iso(today0()), def = {...p.def, start: d0 > p.def.start ? d0 : p.def.start};
    const fresh = buildSchedule(def), doneTitles = new Set(p.days.flatMap(d => d.items).filter(x => p.done[x.id] && x.type === "lesson").map(x => x.title));
    const kept = p.days.filter(d => d.date < def.start).map(d => ({...d, items: d.items.filter(x => p.done[x.id])})).filter(d => d.items.length);
    fresh.forEach(d => { d.items = d.items.filter(x => !(x.type === "lesson" && doneTitles.has(x.title))); d.items.forEach(x => { x.id = x.id + "r" + Date.now().toString(36).slice(-3); }); });
    p.days = [...kept, ...fresh.filter(d => d.items.length)]; p.def = def;
  }

  /* ---------- status ---------- */
  function status(p) {
    const t = iso(today0()), all = p.days.flatMap(d => d.items.map(x => ({...x, date: d.date})));
    const work = all.filter(x => x.type !== "milestone" || !/^🎯/.test(x.title));
    const doneN = work.filter(x => p.done[x.id]).length;
    const overdue = all.filter(x => x.date < t && !p.done[x.id] && !(x.type === "milestone" && /^🎯/.test(x.title)));
    const todayDay = p.days.find(d => d.date === t), next = p.days.find(d => d.date > t);
    const daysLeft = Math.round((parseDay(p.def.exam) - today0()) / DAY);
    return {all, work, doneN, pct: work.length ? Math.round(doneN / work.length * 100) : 0, overdue, todayDay, next, daysLeft};
  }
  function weakCount(deckTitle) { const d = deckByTitle(deckTitle); return d ? d.questions.filter(q => isWeak(d.id, q)).length : 0; }

  /* ---------- items ---------- */
  function itemLabel(x) {
    if (x.type === "lesson") return `📖 ${x.title}${x.detail ? ` · ${x.detail}` : ""}`;
    if (x.type === "practice") return `✏️ Practice ${x.count} questions${x.topic ? `: ${x.topic}` : " (mixed topics)"}`;
    if (x.type === "weak") { const w = weakCount(x.deck); return `🎯 Weak-spot review${w ? ` (${Math.min(w, x.count)} of your ${w} weak spots)` : " (none yet: mixed practice instead)"}`; }
    if (x.type === "examsim") return `⏱️ Exam simulation: ${BRAND.realExam ? `${BRAND.realExam.count} questions, ${BRAND.realExam.minutes} minutes` : "timed exam"}`;
    if (x.type === "flash") return "🃏 Flashcards: run through the whole deck";
    return `🏁 ${x.title}`;
  }
  const deckNote = x => x.deck && x.type !== "lesson" && x.type !== "milestone" ? `<span class="muted spdeck">${esc(x.deck)}${deckByTitle(x.deck) ? "" : " · not on this device yet: add it on the Import tab"}</span>` : "";
  function itemRow(p, x, showDate) {
    const done = !!p.done[x.id], playable = ["practice", "weak", "examsim", "flash"].includes(x.type) && deckByTitle(x.deck);
    return `<li class="spitem ${done ? "done" : ""}"><button class="bcheck" data-act="sp-done" data-id="${x.id}" aria-pressed="${done}" aria-label="${done ? "Done. Tap to mark not done" : "Tap to mark done"}">${done ? "✓" : ""}</button>
      <div class="sptxt">${showDate ? `<span class="muted" style="font-size:.8rem">${fmtDay(x.date)}</span><br>` : ""}${esc(itemLabel(x))}${x.url ? ` <a href="${esc(x.url)}" target="_blank" rel="noopener">Open</a>` : ""}<br>${deckNote(x)}</div>
      ${playable && !done ? `<button class="btn sm primary" data-act="sp-go" data-id="${x.id}" aria-label="Start: ${esc(itemLabel(x))}">▶ Start</button>` : ""}</li>`;
  }
  function startItem(p, x) {
    const d = deckByTitle(x.deck); if (!d) { toast("Add this deck first on the Import tab.", true); return; }
    let qs = d.questions, mode = "practice";
    if (x.type === "examsim" && BRAND.realExam) { startReal(d, balancedDraw(d.questions, BRAND.realExam.count), realMinutes(d.questions.length) * 60, false); S.session.planItem = {plan: p.id, item: x.id}; render(); return; }
    if (x.type === "flash") mode = "flash";
    if (x.type === "practice" && x.topic) qs = qs.filter(q => q.topic === x.topic);
    if (x.type === "weak") { const w = qs.filter(q => isWeak(d.id, q)); qs = w.length ? w : qs; }
    if (!qs.length) qs = d.questions;
    qs = shuffle(qs).slice(0, mode === "flash" ? qs.length : x.count || 20).map(q => ({...q}));
    S.session = {deckId: d.id, deckTitle: d.title, mode, qs, i: 0, ans: {}, checked: {}, flags: {}, hints: {}, start: Date.now(), limit: 0, ended: false, flipped: false, known: 0, again: 0, planItem: {plan: p.id, item: x.id}};
    S.view = "session"; render(); window.scrollTo(0, 0);
  }
  // Finishing a session started from the plan checks that item off.
  SESSION_HOOKS.push(s => {
    if (!s.planItem) return; const p = SP.plans.find(x => x.id === s.planItem.plan); if (!p) return;
    p.done[s.planItem.item] = Date.now(); save(); toast("Plan item done ✓ Keep going!");
  });

  /* ---------- views ---------- */
  function todayCard() {
    const p = plan(); if (!p) return "";
    const st = status(p), items = [...st.overdue, ...(st.todayDay ? st.todayDay.items.map(x => ({...x, date: st.todayDay.date})) : [])].filter(x => !p.done[x.id]).slice(0, 4);
    if (!items.length) return "";
    return `<div class="card sptoday"><div class="row between"><strong>📅 Today's study: ${esc(p.def.title)}</strong><span class="pill">${st.daysLeft > 0 ? `${st.daysLeft} day${st.daysLeft > 1 ? "s" : ""} to exam` : "Exam day"}</span></div>
      <ol class="spitems">${items.map(x => itemRow(p, x, x.date !== iso(today0()))).join("")}</ol>
      <button class="btn sm" data-act="nav" data-view="plan">Open study plan</button></div>`;
  }
  function viewActive(p) {
    const st = status(p), t = iso(today0());
    const upcoming = p.days.filter(d => SP.showAll || (d.date >= t && d.date <= iso(addDays(today0(), 14))));
    return `<div class="card"><div class="row between"><h2 style="margin:0">${esc(p.def.title)}</h2><span class="pill">${st.daysLeft > 0 ? `${st.daysLeft} days to exam (${fmtDay(p.def.exam)})` : st.daysLeft === 0 ? "Exam day: you've got this!" : "Exam date passed"}</span></div>
      <p class="muted" style="margin:6px 0">${esc(p.def.course || "")}${p.def.decks.length ? ` · Decks: ${p.def.decks.map(esc).join(", ")}` : ""} · Study days: ${p.def.days.map(d => WD[d]).join(", ")}</p>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.pct}" aria-label="Plan progress ${st.pct}%"><i style="width:${st.pct}%"></i></div>
      <p style="margin:8px 0">${st.doneN} of ${st.work.length} items done.${st.overdue.length ? ` <strong>${st.overdue.length} to catch up</strong>: they're listed first under Today.` : " You're on track."}</p>
      <div class="row"><button class="btn sm" data-act="sp-replan">↻ Re-plan from today</button><button class="btn sm" data-act="sp-edit">Edit plan</button>
        <button class="btn sm" data-act="sp-export" data-f="md">⬇ Checklist</button><button class="btn sm" data-act="sp-export" data-f="ics">⬇ Calendar</button>
        <button class="btn sm" data-act="sp-link">🔗 Copy link</button>${navigator.share ? `<button class="btn sm" data-act="sp-link" data-share="1">📤 Share</button>` : ""}
        <button class="btn sm ghost" data-act="sp-del" style="color:var(--bad)">Delete plan</button></div></div>
    <div class="card" style="margin-top:14px"><h2 style="margin-top:0">Today</h2>
      ${st.overdue.length ? `<h3 class="sph">Catch up</h3><ol class="spitems">${st.overdue.map(x => itemRow(p, x, true)).join("")}</ol>` : ""}
      ${st.todayDay ? `<ol class="spitems">${st.todayDay.items.map(x => itemRow(p, {...x, date: st.todayDay.date})).join("")}</ol>` : `<p class="muted">No study scheduled today.${st.next ? ` Next: ${fmtDay(st.next.date)}.` : ""}</p>`}</div>
    <div class="card" style="margin-top:14px"><h2 style="margin-top:0">${SP.showAll ? "Whole plan" : "Next two weeks"}</h2>
      ${upcoming.filter(d => SP.showAll || d.date > t).map(d => `<h3 class="sph">${fmtDay(d.date)}${d.date === t ? " · today" : ""}</h3><ol class="spitems">${d.items.map(x => itemRow(p, {...x, date: d.date})).join("")}</ol>`).join("") || `<p class="muted">Nothing else scheduled.</p>`}
      <button class="btn sm ghost" data-act="sp-all">${SP.showAll ? "Show next two weeks" : "Show the whole plan"}</button></div>`;
  }
  function buildForm(def) {
    const t = iso(today0()), ex = iso(addDays(today0(), 21));
    def = def || {title: "", course: "", decks: S.decks.slice(0, 1).map(d => d.title), start: t, exam: ex, days: [1, 2, 3, 4, 5, 6], load: "standard", lessons: [], milestones: []};
    return `<div class="card" style="margin-top:14px"><h2 style="margin-top:0">${def.id ? "Edit study plan" : "🛠 Build a study plan"}</h2>
      <form id="spForm" data-edit="${def.id ? "1" : ""}">
        <div class="row"><div class="field" style="flex:1 1 220px"><label for="spTitle">Plan name</label><input id="spTitle" type="text" required value="${esc(def.title)}" placeholder="e.g., D550 Ethics for Accountants"></div>
          <div class="field" style="flex:1 1 160px"><label for="spCourse">Course</label><input id="spCourse" type="text" value="${esc(def.course)}" placeholder="e.g., WGU D550"></div></div>
        <fieldset class="field" style="border:0;padding:0;margin:0 0 12px"><legend style="font-weight:600;margin-bottom:6px">Practice from these decks</legend>
          ${S.decks.length ? S.decks.map(d => `<label class="check"><input type="checkbox" name="spDeck" value="${esc(d.title)}" ${def.decks.includes(d.title) ? "checked" : ""}> ${esc(d.title)} <span class="muted">(${d.questions.length})</span></label>`).join("") : `<p class="help">No decks yet. Add some on the Import tab, or build a reading-only plan.</p>`}</fieldset>
        <div class="row"><div class="field" style="flex:1 1 150px"><label for="spStart">Start</label><input id="spStart" type="date" value="${def.start}"></div>
          <div class="field" style="flex:1 1 150px"><label for="spExam">Exam date</label><input id="spExam" type="date" required value="${def.exam}"></div>
          <div class="field" style="flex:1 1 150px"><label for="spLoad">Questions per session</label><select id="spLoad">${Object.entries(LOADS).map(([k, v]) => `<option value="${k}" ${def.load === k ? "selected" : ""}>${k[0].toUpperCase() + k.slice(1)} (${v})</option>`).join("")}</select></div></div>
        <fieldset class="field" style="border:0;padding:0;margin:0 0 12px"><legend style="font-weight:600;margin-bottom:6px">Days you study</legend>
          <div class="pchips">${WD.map((w, i) => `<label class="pchip pcheck"><input type="checkbox" name="spDay" value="${i}" ${def.days.includes(i) ? "checked" : ""}> ${w}</label>`).join("")}</div></fieldset>
        <div class="field"><label for="spLessons">Lessons and readings, in order (optional, one per line)</label>
          <textarea id="spLessons" style="min-height:110px" placeholder="Mintz Ch. 3: Organizational Ethics | eBook p. 102&#10;Mintz Ch. 4: Ethics in Public Accounting | p. 174&#10;Course module 2 video | https://…">${esc((def.lessons || []).map(l => [l.title, l.detail, l.url].filter(Boolean).join(" | ")).join("\n"))}</textarea>
          <p class="help">Add a page or a link after a | bar. A lesson's chapter number is matched to the deck topic with that chapter, so practice follows your reading.</p></div>
        <div class="field"><label for="spMiles">Milestones (optional, one per line)</label>
          <textarea id="spMiles" style="min-height:70px" placeholder="Take the pre-assessment | 2026-11-02&#10;Schedule the OA">${esc((def.milestones || []).map(m => [m.title, m.date].filter(Boolean).join(" | ")).join("\n"))}</textarea>
          <p class="help">Add a date after a | bar. Milestones without a date land at the end of the learning phase.</p></div>
        <p class="help" id="spPreview"></p>
        <div class="actions" style="justify-content:flex-start">${def.id ? `<button type="button" class="btn" data-act="sp-cancel">Cancel</button>` : ""}<button class="btn primary" type="submit">${def.id ? "Save and re-plan" : "Create plan"}</button></div>
      </form>
      <p class="help" style="margin-top:12px">Prefer an AI? <button class="blink" data-act="sp-prompt">Copy the AI prompt</button>, paste it into Claude or any AI with your syllabus or course materials, then paste the reply below. With Claude, the <code>study-plan-builder</code> skill does this and also makes a checklist and a calendar file.</p></div>
    <div class="card" style="margin-top:14px"><h2 style="margin-top:0">Import a study plan</h2>
      <label class="vh" for="spText">Study plan to import</label><textarea id="spText" style="min-height:90px" placeholder='A study plan link, or {"format":"studyplan/v1", …}'></textarea>
      <div class="row" style="margin-top:8px"><button class="btn primary" data-act="sp-import">Import plan</button><button class="btn" data-act="sp-clip">📋 Paste & import</button></div></div>`;
  }
  function readForm() {
    const lines = id => $(id).value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => l.split("|").map(x => x.trim()));
    return {
      title: $("#spTitle").value.trim() || "Study plan", course: $("#spCourse").value.trim(),
      decks: [...document.querySelectorAll("input[name=spDeck]:checked")].map(x => x.value),
      start: $("#spStart").value || iso(today0()), exam: $("#spExam").value, load: $("#spLoad").value,
      days: [...document.querySelectorAll("input[name=spDay]:checked")].map(x => +x.value),
      lessons: lines("#spLessons").map(([title, a, b]) => ({title, ...(a && /^https?:/i.test(a) ? {url: a} : a ? {detail: a} : {}), ...(b && /^https?:/i.test(b) ? {url: b} : {})})),
      milestones: lines("#spMiles").map(([title, date]) => ({title, ...(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? {date} : {})}))
    };
  }
  function previewForm() {
    const el = $("#spPreview"); if (!el) return;
    try { const def = readForm(); if (!def.exam) { el.textContent = "Pick your exam date."; return; } const days = buildSchedule(def);
      el.textContent = `${days.length - 1} study days until ${fmtDay(def.exam)}, ${days.reduce((a, d) => a + d.items.length, 0) - 1} items.`; }
    catch (e) { el.textContent = e.message; }
  }
  async function renderPlan() {
    await loadState();
    const p = plan(), others = SP.plans.filter(x => x !== p);
    const chips = SP.plans.length > 1 ? `<div class="pchips" style="margin-bottom:12px">${SP.plans.map(x => `<button class="pchip" data-act="sp-switch" data-id="${x.id}" aria-pressed="${x === p}">${esc(x.def.title)}</button>`).join("")}<button class="pchip" data-act="sp-new">＋ New plan</button></div>` : "";
    return `<div class="row between" style="margin-bottom:10px"><h1 style="margin:0">Study plan</h1>${p && SP.plans.length === 1 && !SP.building ? `<button class="btn sm" data-act="sp-new">＋ New plan</button>` : ""}</div>${chips}
      ${p && !SP.building ? viewActive(p) : `${!SP.plans.length ? `<p class="muted">Plan your course day by day until your exam: readings, practice by topic from your decks, weak-spot review, exam simulations, and milestones. Sessions you finish from the plan check themselves off.</p>` : ""}${buildForm(SP.editing)}`}`;
  }
  EXTRA_VIEWS.plan = renderPlan;
  EXTRA_AFTER.push(() => { if (S.view === "plan") previewForm(); if (S.view === "decks") { const c = todayCard(); if (c) { const m = $("#main"); if (m && !m.querySelector(".sptoday")) m.insertAdjacentHTML("afterbegin", c); } } });
  // The Decks tab shows today's study once plans are loaded.
  (async () => { for (let i = 0; i < 40 && DB.db === null; i++) await new Promise(r => setTimeout(r, 100)); await loadState(); if (S.view === "decks" && plan()) render(); })();

  /* ---------- exports & links ---------- */
  const planOut = p => { const {days, ...rest} = p.def; return {format: "studyplan/v1", plan: {...rest, studyDays: days, days: p.days.map(d => ({date: d.date, items: d.items.map(({id, ...x}) => x)}))}}; };
  function planMarkdown(p) {
    const lines = [`# ${p.def.title}`, "", `${p.def.course ? p.def.course + " · " : ""}Exam: ${fmtDay(p.def.exam)} · Study days: ${p.def.days.map(d => WD[d]).join(", ")}`, ""];
    p.days.forEach(d => { lines.push(`## ${fmtDay(d.date)}`); d.items.forEach(x => lines.push(`- [${p.done[x.id] ? "x" : " "}] ${itemLabel(x).replace(/ \(.*weak spots\)| \(none yet: mixed practice instead\)/, "")}${x.deck && x.type !== "lesson" ? ` (${x.deck})` : ""}`)); lines.push(""); });
    return lines.join("\n");
  }
  function planICS(p) {
    const esc2 = s => String(s).replace(/[\\;,]/g, m => "\\" + m).replace(/\n/g, "\\n"), stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const ev = p.days.map((d, i) => { const dt = d.date.replace(/-/g, ""), nx = iso(addDays(parseDay(d.date), 1)).replace(/-/g, "");
      return ["BEGIN:VEVENT", `UID:${p.id}-${i}@faithful-study`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${dt}`, `DTEND;VALUE=DATE:${nx}`, `SUMMARY:${esc2(`${p.def.title}: ` + (d.items.length === 1 ? itemLabel(d.items[0]) : `${d.items.length} study items`))}`, `DESCRIPTION:${esc2(d.items.map(itemLabel).join("\n"))}`, "END:VEVENT"].join("\r\n"); });
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AnalyticsByShanikwa//Faithful Study//EN", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n");
  }
  function importPlanObj(obj) {
    const pl = obj.plan || {}; if (!pl.exam) throw new Error("The plan needs an exam date.");
    const explicit = Array.isArray(pl.days) && pl.days.length && typeof pl.days[0] === "object" ? pl.days : null;
    const weekdays = pl.studyDays || (Array.isArray(pl.days) && !explicit ? pl.days : null) || [1, 2, 3, 4, 5, 6];
    const def = {title: pl.title || "Study plan", course: pl.course || "", decks: pl.decks || [], start: pl.start || (explicit ? explicit[0].date : iso(today0())), exam: pl.exam, days: weekdays.map(Number), load: pl.load || "standard", lessons: pl.lessons || [], milestones: pl.milestones || []};
    if (explicit) explicit.forEach(d => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Array.isArray(d.items)) throw new Error("Each day needs a date (YYYY-MM-DD) and a list of items."); });
    const p = makePlan(def, explicit); SP.plans.push(p); SP.active = p.id; SP.building = false; save(); return p;
  }
  EXTRA_IMPORTERS["studyplan/v1"] = async obj => {
    await loadState();
    try { const p = importPlanObj(obj); nav("plan"); const miss = p.def.decks.filter(t => !deckByTitle(t)); toast(`Imported the study plan “${p.def.title}”.${miss.length ? ` Add ${miss.length > 1 ? "these decks" : "this deck"} on the Import tab: ${miss.join(", ")}.` : ""}`, false, 7000); }
    catch (e) { toast("Couldn't import that plan. " + e.message, true, 7000); }
  };
  const PLAN_PROMPT = `Build a study plan for my course for the Faithful Study app (study-plan-builder skill).
Course: [COURSE, e.g., WGU D550 Ethics for Accountants]. Exam date: [YYYY-MM-DD]. Start: [YYYY-MM-DD]. I study on: [e.g., Mon-Sat].
My decks in the app (exact titles): [DECK TITLES]. Use the attached syllabus, course guide, or textbook table of contents for the lessons.
Rules: lessons in course order; practice follows the lesson's topic; leave review, weak-spot practice, and timed exam simulations for the last third; flashcards and weak spots the day before the exam; never invent page numbers (use only what the materials show).
Return ONLY JSON in this format:
{"format":"studyplan/v1","plan":{"title":"…","course":"…","exam":"YYYY-MM-DD","start":"YYYY-MM-DD","studyDays":[1,2,3,4,5,6],"decks":["exact deck title"],
"days":[{"date":"YYYY-MM-DD","items":[{"type":"lesson","title":"Mintz Ch. 3: Organizational Ethics","detail":"eBook p. 102"},{"type":"practice","deck":"exact deck title","topic":"exact topic name or empty for mixed","count":20}]},
{"date":"YYYY-MM-DD","items":[{"type":"weak","deck":"…","count":20},{"type":"examsim","deck":"…"},{"type":"flash","deck":"…"},{"type":"milestone","title":"Take the pre-assessment"}]}]}}`;

  /* ---------- actions ---------- */
  Object.assign(actions, {
    "sp-new": () => { SP.building = true; SP.editing = null; render(); },
    "sp-cancel": () => { SP.building = false; SP.editing = null; render(); },
    "sp-switch": d => { SP.active = d.id; SP.building = false; save(); render(); },
    "sp-all": () => { SP.showAll = !SP.showAll; render(); },
    "sp-done": d => { const p = plan(); if (!p) return; if (p.done[d.id]) delete p.done[d.id]; else p.done[d.id] = Date.now(); save(); render(); },
    "sp-go": d => { const p = plan(), x = p && p.days.flatMap(y => y.items).find(y => y.id === d.id); if (x) startItem(p, x); },
    "sp-replan": async () => { const p = plan(); if (!p || !(await confirmBox("Re-plan from today?", "Work you've finished stays checked off. Everything else is spread over your study days from today until the exam.", "Re-plan"))) return; try { replan(p); save(); render(); toast("Plan updated from today."); } catch (e) { toast(e.message, true, 6000); } },
    "sp-edit": () => { const p = plan(); SP.editing = {...p.def, id: p.id}; SP.building = true; render(); },
    "sp-del": async () => { const p = plan(); if (!p || !(await confirmBox("Delete this study plan?", `“${esc(p.def.title)}” and its check marks will be removed. Your decks and scores stay.`, "Delete", true))) return; SP.plans = SP.plans.filter(x => x !== p); SP.active = SP.plans[0]?.id || null; save(); render(); },
    "sp-export": d => { const p = plan(); if (!p) return; const n = p.def.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "study-plan";
      if (d.f === "ics") download(n + ".ics", planICS(p), "text/calendar"); else download(n + ".md", planMarkdown(p), "text/markdown"); },
    "sp-link": async d => { const p = plan(); if (!p) return; const link = await makeLink(planOut(p));
      if (d.share && navigator.share) { try { await navigator.share({title: p.def.title, text: `Study plan: ${p.def.title}. Open ${BRAND.name} from your Home Screen, go to Import, and tap Paste & import.`, url: link}); } catch (e) {} return; }
      try { await navigator.clipboard.writeText(link); toast("Plan link copied. In the other copy of the app, go to Import and tap 📋 Paste & import.", false, 6000); }
      catch (e) { openModal(`<h2>Study plan link</h2><textarea readonly style="min-height:140px" onfocus="this.select()">${esc(link)}</textarea><div class="actions"><button class="btn" data-act="modal-close">Close</button></div>`); } },
    "sp-prompt": async () => { try { await navigator.clipboard.writeText(PLAN_PROMPT); toast("Prompt copied. Paste it into any AI with your course materials."); } catch (e) { download("study-plan-prompt.txt", PLAN_PROMPT, "text/plain"); } },
    "sp-import": () => importPastedText($("#spText").value),
    "sp-clip": async () => { let t = ""; try { t = await navigator.clipboard.readText(); } catch (e) { toast("Your browser didn't allow reading the clipboard. Long-press the box, tap Paste, then tap Import plan.", true, 8000); return; } importPastedText(t); }
  });
  document.addEventListener("submit", e => {
    if (e.target.id !== "spForm") return;
    e.preventDefault();
    try {
      const def = readForm(); if (!def.exam) throw new Error("Pick your exam date."); if (!def.days.length) throw new Error("Pick at least one study day.");
      if (SP.editing?.id) { const p = SP.plans.find(x => x.id === SP.editing.id); p.def = {...def}; replan(p); }
      else { const p = makePlan(def); SP.plans.push(p); SP.active = p.id; }
      SP.building = false; SP.editing = null; save(); render(); window.scrollTo(0, 0); toast("Study plan ready. Today's work is at the top.");
    } catch (err) { toast(err.message, true, 6000); }
  });
  document.addEventListener("change", e => { if (e.target.closest && e.target.closest("#spForm")) previewForm(); });
  document.addEventListener("input", e => { if (e.target.closest && e.target.closest("#spForm") && e.target.type !== "checkbox") previewForm(); });

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
.sptoday{margin-bottom:14px;border:2px solid var(--accent)}
.spitems{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.spitem{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
.spitem.done .sptxt{opacity:.65;text-decoration:line-through}
.sptxt{flex:1;min-width:0;font-size:.93rem}
.spdeck{font-size:.8rem}
.sph{margin:12px 0 4px;font-size:.95rem}
.bcheck{flex:none;width:34px;height:34px;border-radius:50%;border:2px solid var(--border);background:var(--surface);color:#fff;font-weight:700;cursor:pointer}
.spitem.done .bcheck{background:var(--ok);border-color:var(--ok)}
.pchips{display:flex;flex-wrap:wrap;gap:6px}
.pchip{border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:999px;padding:8px 12px;font:inherit;font-size:.9rem;cursor:pointer;min-height:40px}
.pchip[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700}
.pcheck{display:inline-flex;align-items:center;gap:6px}
.pcheck input{width:18px;height:18px;margin:0;accent-color:var(--accent)}
.pcheck:has(input:checked){background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700}`;
  document.head.appendChild(css);
  window.StudyPlans = {state: SP, buildSchedule, makePlan, status, planMarkdown, planICS, planOut};
})();

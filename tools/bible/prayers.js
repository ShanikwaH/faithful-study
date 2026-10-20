/* Bible Stories for All Ages: Prayers tab.
   Prayers from the Bible (text pulled word for word from the app's KJV), classic public-domain prayers (each with its source),
   and short prayers written for this app on a KJV verse. Pick a feeling or topic, search any word or phrase,
   read aloud, star favorites, copy, or share. Loaded only by the Bible Stories edition (added by the build script). */
(() => {
  "use strict";
  const P = {data: null, loading: null, error: "", topic: null, kind: "all", q: "", favs: [], mine: [], open: null, stateLoaded: false, speaking: null};
  const KINDS = [["all", "All"], ["bible", "📖 From the Bible"], ["classic", "🕯️ Classic"], ["new", "✍️ Written for you"], ["mine", "🖊️ My prayers"], ["fav", "★ Favorites"]];
  const KIND_TAG = {bible: "From the Bible (KJV)", classic: "Classic prayer", new: "Written for this app", mine: "My prayer"};

  async function load() {
    if (P.data) return P.data;
    if (!P.loading) P.loading = Promise.all([fetch("prayers.json").then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }), BibleReader.load()])
      .then(([d]) => { d.builtIn = d.prayers; d.prayers.forEach(p => index(d, p)); P.data = d; mergeMine(); return d; })
      .catch(e => { P.error = "The prayers couldn't be loaded (" + e.message + "). Open the app once while online so it can save them for offline use."; P.loading = null; throw e; });
    return P.loading;
  }
  function index(d, p) { p.body = bodyOf(p); p.search = norm([p.title, p.body, (p.refs || []).join(" "), p.anchor || "", anchorText(p), p.source?.name || "", p.topics.map(t => { const x = d.topics.find(y => y.id === t); return x ? x.label + " " + (x.k || "") : t; }).join(" ")].join(" ")); return p; }
  function mergeMine() { if (!P.data) return; P.data.prayers = [...P.mine.map(m => index(P.data, {...m, kind: "mine"})), ...P.data.builtIn]; }
  async function loadState() { try { const s = await DB.get("kv", "prayers"); P.favs = s?.favs || []; P.mine = s?.mine || []; mergeMine(); } catch (e) {} }
  const saveState = () => { try { DB.put("kv", {id: "prayers", favs: P.favs, mine: P.mine}); } catch (e) {} };
  BACKUP_KV.push("prayers");   // your own prayers and favorites go into Settings › Backup
  document.addEventListener("app-restored", () => { P.stateLoaded = false; });

  /* ---------- Bible text ---------- */
  function passage(ref) {   // exact KJV wording from the app's Bible
    const r = BibleReader.parseRef(ref); if (!r || r.error) return "";
    const B = BibleReader.state.data.books[r.b], out = [];
    for (let c = r.c1; c <= r.c2; c++) {
      const vs = B.c[c - 1].v, a = c === r.c1 && r.v1 ? r.v1 : 1, z = c === r.c2 && r.v2 ? r.v2 : (c === r.c1 && r.v1 && r.v2 === null ? r.v1 : vs.length);
      for (let v = a; v <= z; v++) out.push(typeof vs[v - 1] === "string" ? vs[v - 1] : vs[v - 1][0]);
    }
    return out.join(" ");
  }
  const bodyOf = p => p.kind === "bible" ? p.refs.map(passage).join("\n\n") : p.text;
  const anchorText = p => p.anchor ? passage(p.anchor) : "";
  const refLine = p => p.kind === "bible" ? p.refs.join("; ") + " (KJV)" : p.anchor ? `${p.kind === "mine" ? "Verse" : "Based on"} ${p.anchor} (KJV)` : "";
  const topicLabel = (d, id) => (d.topics.find(t => t.id === id) || {label: id}).label;
  const norm = s => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9':\- ]+/g, " ").replace(/\s+/g, " ");

  /* ---------- prayer of the day: same for everyone on a given date, a new one each day ---------- */
  function prayerOfDay() {
    const list = P.data.builtIn, d = new Date(), day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return list[(day * 7919) % list.length];
  }

  /* ---------- search & filter ---------- */
  function terms() {   // "quoted phrases" stay together; other words must all appear
    const q = P.q.trim(); if (!q) return [];
    const out = []; q.replace(/"([^"]+)"|(\S+)/g, (m, a, b) => { const t = norm(a || b).trim(); if (t) out.push(t); });
    return out;
  }
  function results() {
    const ts = terms();
    return P.data.prayers.filter(p => (!P.topic || p.topics.includes(P.topic)) &&
      (P.kind === "all" || (P.kind === "fav" ? P.favs.includes(p.id) : p.kind === P.kind)) &&
      ts.every(t => p.search.includes(t)));
  }
  function hl(text) {   // escape, then highlight search terms
    let h = esc(text); const ts = terms(); if (!ts.length) return h;
    const re = new RegExp("(" + ts.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]")).join("|") + ")", "gi");
    return h.replace(/(<[^>]*>)|([^<]+)/g, (m, tag, txt) => tag || txt.replace(re, "<mark>$1</mark>"));
  }
  const paras = t => t.split(/\n\n+/).map(x => `<p>${hl(x).replace(/\n/g, "<br>")}</p>`).join("");

  /* ---------- views ---------- */
  function card(p, featured) {
    const fav = P.favs.includes(p.id), open = featured || P.open === p.id;
    const tags = p.topics.map(t => P.data.topics.find(x => x.id === t)).filter(Boolean).map(t => `<span class="pill">${t.emoji} ${esc(t.label)}</span>`).join("");
    const src = p.source ? `<p class="help psrc">Source: ${p.source.url ? `<a href="${esc(p.source.url)}" target="_blank" rel="noopener">${esc(p.source.name)}</a>` : esc(p.source.name)}</p>` : "";
    const anchor = p.anchor ? `<blockquote class="panchor"><strong>${esc(p.anchor)}</strong> ${hl(anchorText(p))}</blockquote>` : "";
    const body = open ? `<div class="pbody">${paras(p.body)}</div>${anchor}<p class="help pref">${esc(refLine(p))}</p>${src}<div class="ptags">${tags}</div>
      <div class="row pacts">
        <button class="btn sm ${P.speaking === p.id ? "primary" : ""}" data-act="prspeak" data-id="${p.id}" aria-label="${P.speaking === p.id ? "Stop reading" : "Read this prayer aloud"}">${P.speaking === p.id ? "⏹ Stop" : "🔊 Read aloud"}</button>
        <button class="btn sm" data-act="prfav" data-id="${p.id}" aria-pressed="${fav}">${fav ? "★ Saved" : "☆ Favorite"}</button>
        <button class="btn sm" data-act="prcopy" data-id="${p.id}">📋 Copy</button>
        <button class="btn sm" data-act="prshare" data-id="${p.id}">📤 Share</button>
        <button class="btn sm" data-act="prlink" data-id="${p.id}" aria-label="Copy a link to this prayer">🔗 Copy link</button>
        ${p.kind === "mine" ? `<button class="btn sm" data-act="predit" data-id="${p.id}">✏️ Edit</button><button class="btn sm ghost" data-act="prdel" data-id="${p.id}" style="color:var(--bad)">Delete</button>` : ""}</div>`
      : `<p class="psnip">${hl(p.body.replace(/\s+/g, " ").slice(0, 120))}…</p>`;
    return `<article class="card pcard ${featured ? "pday" : ""}" id="pr-${p.id}">
      ${featured ? `<p class="pdaylbl">🌤️ Prayer of the day</p>` : ""}
      <div class="row between" style="align-items:flex-start;gap:8px">
        ${featured ? `<h2 style="margin:0">${hl(p.title)}</h2>` : `<button class="ptitle" data-act="propen" data-id="${p.id}" aria-expanded="${open}">${hl(p.title)}</button>`}
        <span class="pill pkind">${esc(KIND_TAG[p.kind])}</span></div>
      ${body}</article>`;
  }
  function listHtml() {
    const rs = results(), ts = terms(), t = P.topic && P.data.topics.find(x => x.id === P.topic);
    const what = [t ? `${t.emoji} ${t.label}` : "", ts.length ? `“${P.q.trim().replace(/^["“]+|["”]+$/g, "")}”` : "", P.kind !== "all" ? KINDS.find(k => k[0] === P.kind)[1] : ""].filter(Boolean).join(" · ");
    if (!rs.length) return `<div class="card empty"><p><strong>No prayers found${what ? " for " + esc(what) : ""}.</strong></p><p class="muted">${P.kind === "fav" ? "Tap ☆ Favorite on any prayer to save it here." : P.kind === "mine" ? "Tap ＋ Add your own prayer to write one. It stays on this device." : "Try a shorter word, a different feeling, or clear the filters."}</p>
      ${P.q || P.topic || P.kind !== "all" ? `<button class="btn" data-act="prclear">Clear search and filters</button>` : ""}</div>`;
    const allMine = P.kind === "mine" && P.mine.length > 1 ? `<div class="row" style="margin:0 0 10px"><button class="btn sm" data-act="prlinkall">🔗 Copy one link for all ${P.mine.length} of my prayers</button></div>` : "";
    return `<p class="muted pcount" aria-live="polite">${rs.length} prayer${rs.length > 1 ? "s" : ""}${what ? " · " + esc(what) : ""}${P.q || P.topic || P.kind !== "all" ? ` · <button class="blink" data-act="prclear">Clear</button>` : ""}</p>` + allMine + rs.map(p => card(p)).join("");
  }
  function chips(group, label) {
    return `<h3 class="pgrp">${label}</h3><div class="pchips" role="group" aria-label="${esc(label)}">${P.data.topics.filter(t => t.group === group).map(t =>
      `<button class="pchip" data-act="prtopic" data-t="${t.id}" aria-pressed="${P.topic === t.id}">${t.emoji} ${esc(t.label)}</button>`).join("")}</div>`;
  }
  async function renderPrayers() {
    if (!P.stateLoaded && DB.db !== null) { await loadState(); P.stateLoaded = true; }
    try { await load(); } catch (e) { return `<div class="card"><h1>Prayers</h1><p class="muted">${esc(P.error)}</p></div>`; }
    const day = prayerOfDay();
    return `<div class="row between" style="margin-bottom:10px"><h1 style="margin:0">Prayers</h1><div class="row"><span class="pill">${P.data.prayers.length} prayers</span><button class="btn sm primary" data-act="pradd">＋ Add your own prayer</button></div></div>
      <form id="prSearch" class="psearch" role="search" onsubmit="return false">
        <label for="prQ" class="vh">Search prayers</label>
        <input id="prQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="Search a word, phrase, or verse" value="${esc(P.q)}">
      </form>
      <div class="card pfilters">
        ${chips("feel", "How are you feeling?")}
        ${chips("need", "What do you need?")}
        ${chips("school", "School and exams")}
        ${chips("work", "Work and business")}
        <div class="pkinds" role="group" aria-label="Kind of prayer">${KINDS.map(([k, l]) => `<button class="btn sm" data-act="prkind" data-k="${k}" aria-pressed="${P.kind === k}">${l}${k === "fav" ? ` (${P.favs.length})` : ""}</button>`).join("")}</div>
      </div>
      ${!P.q && !P.topic && P.kind === "all" ? card(day, true) : ""}
      <div id="prList">${listHtml()}</div>
      <p class="help" style="margin-top:18px">${esc(P.data.meta.note)}</p>`;
  }
  EXTRA_VIEWS.prayers = renderPrayers;
  const refreshList = () => { const el = $("#prList"); if (el) el.innerHTML = listHtml(); };

  /* ---------- read aloud ---------- */
  const forSpeech = t => t.replace(/\b([A-Z])([A-Z]+)\b/g, (w, a, b) => a + b.toLowerCase());
  function voice() { const vs = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang)), want = BibleReader.state.prefs.voiceURI; return vs.find(v => v.voiceURI === want) || vs.find(v => v.default) || vs[0] || null; }
  function speak(p) {
    if (!canSpeak) { toast("This browser can't read aloud. Try Safari on iPhone or Chrome on Android.", true); return; }
    speechSynthesis.cancel();
    const text = forSpeech(`${p.title}. ${p.body}`), parts = (text.match(/[^.;:?!]+[.;:?!]*\s*/g) || [text]), list = [];
    let cur = ""; for (const x of parts) { if ((cur + x).length > 220 && cur) { list.push(cur); cur = x; } else cur += x; } if (cur.trim()) list.push(cur);
    const id = P.speaking = p.id; let i = 0; render();
    const next = () => {
      if (P.speaking !== id) return;
      if (i >= list.length) { P.speaking = null; render(); return; }
      const u = new SpeechSynthesisUtterance(list[i++]), v = voice(); u.lang = v ? v.lang : "en-US"; try { if (v) u.voice = v; } catch (e) {}
      u.rate = BibleReader.state.prefs.rate || 0.9; u.onend = next; u.onerror = () => { if (P.speaking === id) { P.speaking = null; render(); } };
      speechSynthesis.speak(u);
    };
    next();
  }
  const stopPrayer = () => { if (P.speaking) { P.speaking = null; if (canSpeak) speechSynthesis.cancel(); } };

  /* ---------- copy & share ---------- */
  const plain = p => `${p.title}\n\n${p.body}\n\n${refLine(p)}${p.anchor ? "\n" + p.anchor + ": " + anchorText(p) : ""}${p.source ? "\nSource: " + p.source.name : ""}\n\nShared from Bible Stories for All Ages`;
  async function copy(p) { try { await navigator.clipboard.writeText(plain(p)); toast("Prayer copied."); } catch (e) { openModal(`<h2>Copy this prayer</h2><textarea style="min-height:220px" readonly>${esc(plain(p))}</textarea><div class="actions"><button class="btn" data-act="modal-close">Close</button></div>`); } }
  async function share(p) {
    if (navigator.share) { try { await navigator.share({title: p.title, text: plain(p)}); } catch (e) { /* closed the share sheet */ } return; }
    const body = encodeURIComponent(plain(p));
    openModal(`<h2>Share “${esc(p.title)}”</h2><div class="actions" style="justify-content:flex-start">
      <a class="btn primary" href="sms:?&body=${body}">💬 Text message</a><a class="btn" href="mailto:?subject=${encodeURIComponent(p.title)}&body=${body}">✉️ Email</a>
      <button class="btn" data-act="prcopy" data-id="${p.id}">📋 Copy</button><button class="btn ghost" data-act="modal-close">Close</button></div>`);
  }

  /* ---------- your own prayers (saved on this device, included in Settings › Backup) ---------- */
  function prayerForm(p) {
    p = p || {id: "", title: "", text: "", anchor: "", topics: P.topic ? [P.topic] : []};
    const groups = [["feel", "Feelings"], ["need", "Needs"], ["school", "School and exams"], ["work", "Work and business"]];
    openModal(`<h2>${p.id ? "Edit your prayer" : "Add your own prayer"}</h2>
      <form id="myPrayer" data-id="${esc(p.id)}">
        <div class="field"><label for="mpTitle">Title</label><input id="mpTitle" type="text" required maxlength="80" value="${esc(p.title)}" placeholder="e.g., For Mom's surgery"></div>
        <div class="field"><label for="mpText">Your prayer</label><textarea id="mpText" required style="min-height:180px" placeholder="Lord, …">${esc(p.text)}</textarea></div>
        <div class="field"><label for="mpRef">Bible verse to go with it (optional)</label><input id="mpRef" type="text" autocomplete="off" value="${esc(p.anchor || "")}" placeholder="e.g., Philippians 4:6-7"><p class="help">The app shows the verse in KJV words.</p></div>
        <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-weight:600;margin-bottom:6px">When is this prayer for? (pick any)</legend>
          ${groups.map(([g, l]) => `<p class="help" style="margin:8px 0 4px">${l}</p><div class="pchips">${P.data.topics.filter(t => t.group === g).map(t =>
            `<label class="pchip pcheck"><input type="checkbox" name="mpT" value="${t.id}" ${p.topics.includes(t.id) ? "checked" : ""}> ${t.emoji} ${esc(t.label)}</label>`).join("")}</div>`).join("")}</fieldset>
        <div class="actions"><button type="button" class="btn" data-act="modal-close">Cancel</button><button type="submit" class="btn primary">Save prayer</button></div>
      </form>`, {wide: true});
  }
  document.addEventListener("submit", e => {
    if (e.target.id !== "myPrayer") return;
    e.preventDefault();
    const title = $("#mpTitle").value.trim(), text = $("#mpText").value.trim(), ref = $("#mpRef").value.trim();
    if (!title || !text) { toast("Add a title and your prayer.", true); return; }
    let anchor = "";
    if (ref) { const r = BibleReader.parseRef(ref); if (!r || r.error) { toast(r ? r.error : "Open the Bible tab once, then try again.", true, 6000); return; } anchor = ref.replace(/[–—]/g, "-"); }
    const topics = [...document.querySelectorAll("input[name=mpT]:checked")].map(x => x.value);
    const id = e.target.dataset.id || "mine-" + Date.now().toString(36), rec = {id, title, text, anchor, topics, at: Date.now()};
    const i = P.mine.findIndex(m => m.id === id); if (i >= 0) P.mine[i] = rec; else P.mine.unshift(rec);
    saveState(); mergeMine(); closeModal(false); P.kind = "mine"; P.topic = null; P.q = ""; P.open = id; render();
    toast(i >= 0 ? "Prayer updated." : "Prayer saved. Find it under 🖊️ My prayers.");
  });

  /* ---------- prayer links: copy, then Import › Paste & import in Bible Stories on another device ---------- */
  const mineOut = m => ({title: m.title, text: m.text, anchor: m.anchor || "", topics: m.topics});
  async function copyPrayerLink(obj, label) {
    const link = await makeLink(obj);
    try { await navigator.clipboard.writeText(link); toast(`${label} link copied. In Bible Stories on the other device, go to Import and tap 📋 Paste & import.`, false, 6500); }
    catch (e) { openModal(`<h2>${esc(label)} link</h2><textarea readonly style="min-height:140px" onfocus="this.select()">${esc(link)}</textarea><div class="actions"><button class="btn" data-act="modal-close">Close</button></div>`); }
  }
  EXTRA_IMPORTERS["prayers/v1"] = async obj => {
    if (!P.stateLoaded && DB.db !== null) { await loadState(); P.stateLoaded = true; }
    await load();
    let added = 0;
    for (const m of obj.prayers || []) {
      if (!m.title || !m.text) continue;
      if (P.mine.some(x => x.title === m.title && x.text === m.text)) continue;
      P.mine.unshift({id: "mine-" + Date.now().toString(36) + added, title: String(m.title).slice(0, 80), text: String(m.text), anchor: m.anchor || "", topics: (m.topics || []).filter(t => P.data.topics.some(x => x.id === t)), at: Date.now()}); added++;
    }
    saveState(); mergeMine();
    P.q = ""; P.topic = null;
    if (obj.open && byId(obj.open)) { P.kind = "all"; P.open = obj.open; nav("prayers"); setTimeout(() => document.getElementById("pr-" + obj.open)?.scrollIntoView({block: "start"}), 100); return; }
    P.kind = "mine"; P.open = null; nav("prayers");
    toast(added ? `Added ${added} prayer${added > 1 ? "s" : ""} to 🖊️ My prayers.` : "You already have these prayers.");
  };

  /* ---------- actions ---------- */
  const byId = id => P.data.prayers.find(p => p.id === id);
  Object.assign(actions, {
    propen: d => { P.open = P.open === d.id ? null : d.id; refreshList(); document.getElementById("pr-" + d.id)?.querySelector(".ptitle")?.focus(); },
    prtopic: d => { P.topic = P.topic === d.t ? null : d.t; P.open = null; render(); setTimeout(() => $("#prList")?.scrollIntoView({block: "start", behavior: "smooth"}), 50); },
    prkind: d => { P.kind = d.k; P.open = null; render(); },
    prclear: () => { P.q = ""; P.topic = null; P.kind = "all"; P.open = null; render(); },
    prfav: d => { const i = P.favs.indexOf(d.id); if (i >= 0) P.favs.splice(i, 1); else P.favs.unshift(d.id); saveState(); toast(i >= 0 ? "Removed from favorites." : "Saved to favorites ★"); render(); },
    prspeak: d => { if (P.speaking === d.id) { stopPrayer(); render(); } else speak(byId(d.id)); },
    prcopy: d => { closeModal(false); copy(byId(d.id)); },
    prshare: d => share(byId(d.id)),
    pradd: () => prayerForm(),
    prlink: d => { const p = byId(d.id); copyPrayerLink(p.kind === "mine" ? {format: "prayers/v1", prayers: [mineOut(p)]} : {format: "prayers/v1", open: p.id}, "Prayer"); },
    prlinkall: () => copyPrayerLink({format: "prayers/v1", prayers: P.mine.map(mineOut)}, "My prayers"),
    predit: d => prayerForm(P.mine.find(m => m.id === d.id)),
    prdel: async d => { const m = P.mine.find(x => x.id === d.id); if (!m || !(await confirmBox("Delete this prayer?", `“${esc(m.title)}” will be removed from this device.`, "Delete", true))) return;
      P.mine = P.mine.filter(x => x.id !== d.id); P.favs = P.favs.filter(x => x !== d.id); saveState(); mergeMine(); render(); toast("Prayer deleted."); }
  });
  document.addEventListener("input", e => { if (e.target.id === "prQ") { P.q = e.target.value; P.open = null; refreshList(); $(".pday")?.classList.toggle("hide", !!P.q.trim()); } });
  // leaving the tab stops reading
  const _nav2 = nav;
  nav = function (view) { if (view !== "prayers") stopPrayer(); return _nav2(view); };

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
.psearch{position:sticky;top:0;z-index:5;background:var(--bg);padding:6px 0 10px}
.psearch input{width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);font:inherit;font-size:16px}
.pday{border:2px solid var(--accent);margin-bottom:14px}
.pdaylbl{margin:0 0 6px;font-weight:700;color:var(--accent);font-size:.9rem}
.pfilters{margin-bottom:12px}
.pgrp{margin:10px 0 6px;font-size:.95rem}
.pgrp:first-child{margin-top:0}
.pchips{display:flex;flex-wrap:wrap;gap:6px}
.pchip{border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:999px;padding:8px 12px;font:inherit;font-size:.9rem;cursor:pointer;min-height:40px}
.pchip[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700}
.pcheck{display:inline-flex;align-items:center;gap:6px}
.pcheck input{width:18px;height:18px;margin:0;accent-color:var(--accent)}
.pcheck:has(input:checked){background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700}
.pkinds{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)}
.pkinds .btn[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.pcard{margin-bottom:10px}
.ptitle{background:none;border:0;padding:4px 0;font:700 1.05rem/1.3 var(--font);color:var(--text);text-align:left;cursor:pointer;flex:1}
.ptitle:hover{color:var(--accent)}
.pkind{flex:none;font-size:.72rem}
.psnip{margin:4px 0 0;color:var(--muted);font-size:.92rem}
.pbody{font-family:Georgia,"Times New Roman",serif;font-size:1.1rem;line-height:1.75;margin-top:8px}
.pbody p{margin:0 0 .8em}
.panchor{margin:6px 0 8px;padding:8px 12px;border-left:4px solid var(--accent);background:var(--surface-2);border-radius:0 10px 10px 0;font-family:Georgia,serif}
.pref,.psrc{margin:4px 0}
.ptags{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}
.pacts{margin-top:8px}
.pcount{margin:4px 0 10px}
mark{background:color-mix(in srgb,#F2C14E 55%,transparent);color:inherit;border-radius:3px;padding:0 1px}
@media (max-width:420px){ .pchip{padding:7px 10px;font-size:.86rem} .pbody{font-size:1.04rem} }`;
  document.head.appendChild(css);
  window.Prayers = {state: P, load, results, prayerOfDay: () => P.data && prayerOfDay()};
})();

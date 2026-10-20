#!/usr/bin/env python3
"""Build prayers.json for the Bible Stories Prayers tab from the lists in prayer-data/.
   python3 tools/bible/make-prayers.py
Bible prayers store only references: the app shows the exact KJV words from kjv.json.
Every reference is checked against kjv.json here, so a typo stops the build."""
import json, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "prayer-data"))
from bible_prayers import BIBLE
from new_prayers import NEW
from classic_prayers import CLASSIC

TOPICS = [
 ("anxious","😟","Anxious","feel"),("sad","😢","Sad or grieving","feel"),("lonely","🫂","Lonely","feel"),("afraid","😨","Afraid","feel"),
 ("angry","😠","Angry","feel"),("weary","😮‍💨","Tired or weary","feel"),("discouraged","😞","Discouraged","feel"),("guilty","🙇","Guilty","feel"),
 ("thankful","🙏","Thankful","feel"),("joyful","😊","Joyful","feel"),
 ("peace","🕊️","Peace","need"),("strength","💪","Strength","need"),("healing","🩹","Healing","need"),("guidance","🧭","Guidance","need"),
 ("forgiveness","🤝","Forgiveness","need"),("protection","🛡️","Protection","need"),("family","🏠","Family","need"),("provision","🍞","Provision","need"),
 ("morning","🌅","Morning","need"),("night","🌙","Night","need"),
 ("study","📚","Studying","school"),("testday","📝","Test day","school"),("focus","🎯","Focus","school"),("waiting","⏳","Waiting for results","school"),
 ("work","💼","Work","work"),("business","🏪","Business","work"),("wisdom","💡","Wisdom in decisions","work"),("money","💵","Money","work"),
]
kjv = json.loads((HERE / "kjv.json").read_text(encoding="utf-8")); names = [b["n"] for b in kjv["books"]]
def check(ref):
    m = re.match(r"^(.+?) (\d+)(?::(\d+)(?:-(\d+))?)?$", ref); assert m, ref
    b = names.index("Psalms" if m[1] == "Psalm" else m[1]); ch = kjv["books"][b]["c"]; c = int(m[2]); assert 1 <= c <= len(ch), ref
    if m[3]: a, z = int(m[3]), int(m[4] or m[3]); assert 1 <= a <= z <= len(ch[c - 1]["v"]), ref
# extra words people search for, so "exam" finds test-day prayers and "worry" finds anxious ones
KEYWORDS = {"anxious":"anxiety worry worried stress stressed nervous panic overwhelmed","sad":"sadness grief grieve grieving loss mourning sorrow depressed down heartbroken",
 "lonely":"alone loneliness isolated","afraid":"fear fearful scared terrified worry","angry":"anger mad frustrated frustration upset bitter","weary":"tired exhausted burnout burned out rest sleepy worn",
 "discouraged":"hopeless hope give up quit defeated","guilty":"guilt shame ashamed sin sinned repent sorry","thankful":"thanks thank gratitude grateful praise","joyful":"happy happiness joy celebrate glad rejoice",
 "peace":"calm rest quiet stillness","strength":"strong courage brave endurance","healing":"heal sick sickness illness pain hospital doctor surgery recovery health","guidance":"direction decision lost path way plan",
 "forgiveness":"forgive forgiving forgiven sorry mercy","protection":"protect safe safety travel danger shield","family":"children kids son daughter marriage husband wife parents mother father home household",
 "provision":"provide needs bills food rent","morning":"day start wake","night":"sleep bedtime evening insomnia rest","study":"school class homework college university learning studying exam",
 "testday":"test exam exams quiz assessment oa pa cpa final","focus":"concentrate concentration distracted attention","waiting":"wait results patience patient answer",
 "work":"job career boss coworkers office labor","business":"customers sales shop store entrepreneur company","wisdom":"wise decision decisions choose choice understanding","money":"finances financial bills debt budget giving tithe save saving"}
ids = set(t[0] for t in TOPICS); out = []
def add(p):
    assert p["id"] not in {x["id"] for x in out}, p["id"]
    bad = set(p["topics"]) - ids; assert not bad, (p["id"], bad); out.append(p)
for id_, title, refs, topics in BIBLE:
    for r in refs: check(r)
    add({"id": id_, "title": title, "kind": "bible", "refs": refs, "topics": topics})
for c in CLASSIC:
    add({"id": c["id"], "title": c["title"], "kind": "classic", "text": c["text"].strip(), "topics": c["topics"], "source": c["source"]})
for id_, title, topics, anchor, text in NEW:
    check(anchor); add({"id": id_, "title": title, "kind": "new", "anchor": anchor, "text": text, "topics": topics})
missing = ids - {t for p in out for t in p["topics"]}; assert not missing, missing
data = {"meta": {"note": "Bible prayers are shown word for word from the King James Version in this app. Classic prayers are public domain; each shows where it comes from. Prayers marked “Written for this app” are original prayers by AnalyticsByShanikwa, each built on the KJV verse shown with it."},
        "topics": [{"id": i, "emoji": e, "label": l, "group": g, "k": KEYWORDS[i]} for i, e, l, g in TOPICS], "prayers": out}
(HERE / "prayers.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"prayers.json: {len(out)} prayers ({sum(p['kind']=='bible' for p in out)} Bible, {sum(p['kind']=='classic' for p in out)} classic, {sum(p['kind']=='new' for p in out)} new)")

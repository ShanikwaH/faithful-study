"""Make one Study Library pack per course from your course folders.

Usage:
  python tools/make-library-packs.py "<folder with one subfolder per course>" "<output folder>" [--max-mb 25]

Each course subfolder whose name starts with the course code (for example "D550 P + O" or "D551 Fraud")
becomes WGU-<CODE>-Study-Library.json. Load it in Faithful Study: Library > Load library pack.

- Every file is copied unchanged and labeled "WGU <CODE>" in the Library.
- Each pack also holds a short "<CODE> Course Overview.md" note (course name, credits, assessments, and
  any files left out), so every course gets its own Library section even before you add files.
- Files bigger than --max-mb (default 25 MB) are left out, because phones struggle to load very large
  packs; the overview note lists them so you know to open them from OneDrive instead.
- File IDs come from the course code and file name, so loading an updated pack replaces the same files
  instead of adding copies.

Packs hold your own course material and records: keep them private (OneDrive or a private repo),
never in the public app folder.
"""
import base64, json, mimetypes, os, re, sys, time

# WGU MS Accounting, Taxation Specialization (MACCT, catalog 202412): 10 courses, 3 CUs each.
COURSES = [
    ("C204", "Management Communication", "PA"),
    ("D550", "Ethics for Accountants", "PA+OA"),
    ("D551", "Fraud and Forensic Accounting", "OA"),
    ("D252", "Accounting Research and Critical Thinking", "PA"),
    ("D552", "Data Analytics for Accountants I", "PA+OA"),
    ("D553", "Data Analytics for Accountants II", "PA"),
    ("D554", "Advanced Financial Accounting I", "OA"),
    ("D557", "Corporate Taxation", "OA"),
    ("D555", "Advanced Financial Accounting II", "OA"),
    ("D558", "Pass-Through Taxation", "OA"),
]
NOTES = {"D553": "Take after D552 (Data Analytics for Accountants I).", "D555": "Builds on D554 (Advanced Financial Accounting I)."}
ASMT = {"PA": "Performance assessment (tasks graded against a rubric)", "OA": "Objective assessment (proctored exam)",
        "PA+OA": "Performance assessment and objective assessment"}
SKIP = re.compile(r"^(~\$|\.~lock|desktop\.ini$|thumbs\.db$|\.ds_store$)", re.I)
MIME = {".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".md": "text/markdown", ".pdf": "application/pdf", ".mp4": "video/mp4", ".m4a": "audio/mp4"}

def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def mime(name): ext = os.path.splitext(name)[1].lower(); return MIME.get(ext) or mimetypes.guess_type(name)[0] or "application/octet-stream"

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2: sys.exit(__doc__)
    src, out = args
    max_mb = float(sys.argv[sys.argv.index("--max-mb") + 1]) if "--max-mb" in sys.argv else 25.0
    os.makedirs(out, exist_ok=True)
    subdirs = [d for d in os.listdir(src) if os.path.isdir(os.path.join(src, d))]
    now = int(time.time() * 1000); summary = []
    for code, name, asmt in COURSES:
        label = f"WGU {code}"
        folder = next((d for d in sorted(subdirs) if re.match(rf"{code}\b", d, re.I)), None)
        files, skipped = [], []
        if folder:
            root = os.path.join(src, folder)
            for dp, _, fns in os.walk(root):
                for fn in sorted(fns):
                    if SKIP.search(fn): continue
                    path = os.path.join(dp, fn); size = os.path.getsize(path)
                    rel = os.path.relpath(path, root)
                    if size > max_mb * 1024 * 1024: skipped.append((rel, size)); continue
                    data = open(path, "rb").read()
                    files.append({"id": f"file-{code.lower()}-{slug(fn)}", "name": fn, "type": mime(fn), "size": len(data),
                                  "course": label, "added": int(os.path.getmtime(path) * 1000), "data": base64.b64encode(data).decode()})
        lines = [f"# {code} {name}", "", f"- **Program:** WGU MS Accounting, Taxation Specialization (MACCT)", f"- **Credits:** 3 CUs",
                 f"- **Assessment:** {ASMT[asmt]}"]
        if code in NOTES: lines.append(f"- **Note:** {NOTES[code]}")
        lines += ["", f"## Files in this pack ({len(files)})", ""]
        lines += [f"- {f['name']} ({f['size'] / 1048576:.2f} MB)" for f in files] or ["- None yet. Add files to this course's folder and make the pack again."]
        if skipped:
            lines += ["", f"## Left out because they're over {max_mb:g} MB (open these from OneDrive)", ""]
            lines += [f"- {r} ({s / 1048576:.1f} MB)" for r, s in skipped]
        lines += ["", f"Pack made {time.strftime('%B %d, %Y')} from: {folder or '(no course folder yet)'}"]
        note = "\n".join(lines).encode("utf-8")
        files.insert(0, {"id": f"file-{code.lower()}-course-overview", "name": f"{code} Course Overview.md", "type": "text/markdown",
                         "size": len(note), "course": label, "added": now, "data": base64.b64encode(note).decode()})
        pack = {"format": "faithful-study-backup", "version": 1, "exported": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "note": f"{label} Study Library pack: {len(files)} file(s) for {code} {name}. Loading it adds only these files; decks, progress and settings are untouched.",
                "decks": [], "progress": [], "files": files, "kv": []}
        fname = f"WGU-{code}-Study-Library.json"
        with open(os.path.join(out, fname), "w", encoding="utf-8") as fh: json.dump(pack, fh, ensure_ascii=False)
        summary.append((fname, len(files), sum(f["size"] for f in files), len(skipped), folder))
    for fname, n, b, sk, folder in summary:
        print(f"{fname:34} {n:3} files {b / 1048576:7.2f} MB" + (f"  ({sk} left out, over {max_mb:g} MB)" if sk else "") + ("" if folder else "  (no course folder yet: overview only)"))

if __name__ == "__main__":
    main()

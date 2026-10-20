#!/usr/bin/env python3
"""Lock private decks into the public app: writes locked-decks.json (AES-256-GCM, key from a passphrase via PBKDF2-SHA256).

    python3 tools/lock-decks.py            # run from the faithful-study folder after changing any deck in decks/

Reads decks/LOCK.json from the PRIVATE decks repo (cloned at faithful-study/decks):
    {"passphrase": "...", "salt": "<base64>", "decks": [["d550-pe1", "d550-ethics-scenario-exam.json"], ...]}
The passphrase and the readable decks never leave the private repo. Keep the salt the same so devices that are
already unlocked keep updating; change the passphrase (and salt) only if you want every device to ask again.
Needs: pip install cryptography"""
import base64, hashlib, json, os, sys
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

BASE = Path(__file__).resolve().parent.parent
DECKS = BASE / "decks"
cfg_path = DECKS / "LOCK.json"
if not cfg_path.exists(): sys.exit(f"Missing {cfg_path}. Clone the private decks repo into {DECKS} first.")
cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
ITER = 310000
bundle = {"decks": [{"lockId": lid, "deck": json.loads((DECKS / f).read_text(encoding="utf-8"))} for lid, f in cfg["decks"]]}
plain = json.dumps(bundle, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
salt = base64.b64decode(cfg["salt"])
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(cfg["passphrase"].strip().lower().encode("utf-8"))
iv = os.urandom(12)
out = {"format": "faithful-locked/v1", "hash": hashlib.sha256(plain).hexdigest()[:16],
       "kdf": {"name": "PBKDF2-SHA256", "salt": cfg["salt"], "iterations": ITER}, "cipher": "AES-256-GCM",
       "iv": base64.b64encode(iv).decode(), "data": base64.b64encode(AESGCM(key).encrypt(iv, plain, None)).decode()}
(BASE / "locked-decks.json").write_text(json.dumps(out), encoding="utf-8")
print(f"locked-decks.json: {len(bundle['decks'])} decks, {sum(len(d['deck']['questions']) for d in bundle['decks'])} questions, {len(plain):,} bytes (hash {out['hash']})")

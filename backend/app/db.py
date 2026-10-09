"""Database layer.

MongoStore  -> MongoDB Atlas / local MongoDB (MONGODB_URI set ho aur connect ho jaye)
FileStore   -> backend/data/db.json (URI nahi ho ya Atlas connect na ho to automatic fallback)

Dono ka interface same hai, isliye baaki code ko farak nahi padta.
Images bhi DB ke saath hi store hoti hain (Mongo: 'images' collection, File: data/uploads/) - alag Cloudinary ki zaroorat nahi.
"""
import json
import logging
import os
import re
import threading
from datetime import datetime, timezone
from pathlib import Path

from . import config

log = logging.getLogger("chaukas.db")
ID_RE = re.compile(r"^CS-(\d+)$", re.I)


def now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _num(cid):
    m = ID_RE.match(cid or "")
    return int(m.group(1)) if m else 0


class FileStore:
    kind = "file"

    def __init__(self, path: Path):
        self.path = path
        self.img_dir = path.parent / "uploads"
        self.img_dir.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.data = {"complaints": {}, "audit": [], "dispatches": [], "counter": 1000}
        if path.exists():
            try:
                self.data.update(json.loads(path.read_text(encoding="utf-8")))
            except Exception:
                # corrupt file - backup rakho, naya shuru karo
                try:
                    path.rename(path.with_suffix(f".corrupt-{int(datetime.now().timestamp())}.json"))
                except OSError:
                    pass
        self.data["counter"] = max(self.data.get("counter", 1000), max([_num(k) for k in self.data["complaints"]] + [1000]))

    def _flush(self):
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.data, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, self.path)

    def ping(self):
        return True

    def count(self):
        with self.lock:
            return len(self.data["complaints"])

    def next_id(self):
        with self.lock:
            self.data["counter"] += 1
            self._flush()
            return f"CS-{self.data['counter']}"

    def list(self):
        with self.lock:
            return sorted((dict(v) for v in self.data["complaints"].values()), key=lambda c: c["created_at"], reverse=True)

    def get(self, cid):
        with self.lock:
            for k, v in self.data["complaints"].items():
                if k.lower() == (cid or "").strip().lower():
                    return json.loads(json.dumps(v))
        return None

    def insert(self, doc):
        with self.lock:
            self.data["complaints"][doc["complaint_id"]] = doc
            self._flush()

    def insert_many(self, docs):
        with self.lock:
            for d in docs:
                self.data["complaints"][d["complaint_id"]] = d
            self.data["counter"] = max(self.data["counter"], max([_num(d["complaint_id"]) for d in docs] + [1000]))
            self._flush()

    def replace(self, doc):
        with self.lock:
            self.data["complaints"][doc["complaint_id"]] = doc
            self._flush()

    def delete(self, cid):
        with self.lock:
            ok = self.data["complaints"].pop(cid, None) is not None
            self._flush()
            return ok

    def add_audit(self, entry):
        with self.lock:
            self.data["audit"].insert(0, entry)
            del self.data["audit"][500:]
            self._flush()

    def list_audit(self, limit=300):
        with self.lock:
            return list(self.data["audit"][:limit])

    def add_dispatch(self, entry):
        with self.lock:
            self.data["dispatches"].insert(0, entry)
            del self.data["dispatches"][500:]
            self._flush()

    def save_image(self, name, data: bytes):
        (self.img_dir / name).write_bytes(data)

    def get_image(self, name):
        p = self.img_dir / Path(name).name
        return p.read_bytes() if p.exists() else None

    def describe(self):
        return {"type": "local-file", "path": str(self.path), "complaints": self.count()}


class MongoStore:
    kind = "mongodb"

    def __init__(self, uri, dbname):
        import certifi
        from pymongo import MongoClient, ASCENDING

        kw = {"serverSelectionTimeoutMS": 6000, "connectTimeoutMS": 6000}
        if uri.startswith("mongodb+srv") or "mongodb.net" in uri or "tls=true" in uri.lower():
            kw["tlsCAFile"] = certifi.where()
        self.client = MongoClient(uri, **kw)
        self.client.admin.command("ping")  # fail ho to exception -> fallback
        self.db = self.client[dbname]
        self.c = self.db["complaints"]
        self.c.create_index([("created_at", ASCENDING)])
        self.c.create_index([("status", ASCENDING)])
        n = max([_num(d["_id"]) for d in self.c.find({}, {"_id": 1})] + [1000])
        self.db["counters"].update_one({"_id": "complaint"}, {"$max": {"seq": n}}, upsert=True)

    @staticmethod
    def _out(d):
        if d is None:
            return None
        d = dict(d)
        d.pop("_id", None)
        return d

    @staticmethod
    def _in(doc):
        d = dict(doc)
        d["_id"] = d["complaint_id"]
        return d

    def ping(self):
        try:
            self.client.admin.command("ping")
            return True
        except Exception:
            return False

    def count(self):
        return self.c.count_documents({})

    def next_id(self):
        from pymongo import ReturnDocument
        r = self.db["counters"].find_one_and_update({"_id": "complaint"}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER)
        return f"CS-{r['seq']}"

    def list(self):
        return [self._out(d) for d in self.c.find().sort("created_at", -1)]

    def get(self, cid):
        cid = (cid or "").strip()
        d = self.c.find_one({"_id": cid.upper()}) or self.c.find_one({"_id": cid})
        return self._out(d)

    def insert(self, doc):
        self.c.replace_one({"_id": doc["complaint_id"]}, self._in(doc), upsert=True)

    def insert_many(self, docs):
        for d in docs:
            self.insert(d)
        n = max([_num(d["complaint_id"]) for d in docs] + [1000])
        self.db["counters"].update_one({"_id": "complaint"}, {"$max": {"seq": n}}, upsert=True)

    def replace(self, doc):
        self.insert(doc)

    def delete(self, cid):
        return self.c.delete_one({"_id": cid}).deleted_count > 0

    def add_audit(self, entry):
        self.db["audit"].insert_one(dict(entry))

    def list_audit(self, limit=300):
        return [self._out(d) for d in self.db["audit"].find().sort("at", -1).limit(limit)]

    def add_dispatch(self, entry):
        self.db["dispatches"].insert_one(dict(entry))

    def save_image(self, name, data: bytes):
        from bson.binary import Binary
        self.db["images"].replace_one({"_id": name}, {"_id": name, "data": Binary(data), "at": now_iso()}, upsert=True)

    def get_image(self, name):
        d = self.db["images"].find_one({"_id": Path(name).name})
        return bytes(d["data"]) if d else None

    def describe(self):
        return {"type": "mongodb", "db": self.db.name, "complaints": self.count()}


def connect():
    """Mongo try karo; fail ho to FileStore. Return (store, note)."""
    file_path = config.DATA_DIR / "db.json"
    if config.MONGODB_URI:
        try:
            s = MongoStore(config.MONGODB_URI, config.MONGODB_DB)
            log.info("MongoDB connected (%s)", config.MONGODB_DB)
            return s, "MongoDB connected"
        except Exception as e:  # noqa: BLE001
            msg = f"MongoDB connect nahi hua ({type(e).__name__}: {str(e)[:140]}). Local file DB use ho rahi hai."
            log.warning(msg)
            return FileStore(file_path), msg
    return FileStore(file_path), "MONGODB_URI set nahi hai - local file DB use ho rahi hai"

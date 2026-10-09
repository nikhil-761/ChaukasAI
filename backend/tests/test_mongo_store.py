"""MongoStore ka logic mongomock se test (asli Atlas ki zaroorat nahi). python tests/test_mongo_store.py"""
import sys, tempfile, os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import mongomock, pymongo
pymongo.MongoClient = mongomock.MongoClient  # patch
from app import db

s = db.MongoStore("mongodb://localhost/test", "t")
assert s.count() == 0
i1, i2 = s.next_id(), s.next_id(); assert (i1, i2) == ("CS-1001", "CS-1002"), (i1, i2)
doc = {"complaint_id": i1, "created_at": "2026-01-01T00:00:00Z", "status": "submitted", "x": 1}
s.insert(doc); s.insert({"complaint_id": i2, "created_at": "2026-02-01T00:00:00Z", "status": "submitted"})
assert [c["complaint_id"] for c in s.list()] == [i2, i1] and "_id" not in s.list()[0]
assert s.get("cs-1001")["x"] == 1 and s.get("CS-9") is None
d = s.get(i1); d["status"] = "resolved"; s.replace(d); assert s.get(i1)["status"] == "resolved"
s.save_image("a.jpg", b"\xff\xd8abc"); assert s.get_image("a.jpg") == b"\xff\xd8abc" and s.get_image("../a.jpg") == b"\xff\xd8abc"
s.add_audit({"at": "2026-01-01T00:00:00Z", "actor": "a", "action": "x"}); assert len(s.list_audit()) == 1 and "_id" not in s.list_audit()[0]
s.insert_many([{"complaint_id": "CS-1500", "created_at": "2026-03-01T00:00:00Z"}]); assert s.next_id() == "CS-1501"
assert s.delete(i1) and not s.delete(i1)
print("MongoStore OK")

# fallback: Mongo URI galat -> FileStore
os.environ["DATA_DIR"] = tempfile.mkdtemp()
from app import config
pymongo.MongoClient = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("no server"))
config.MONGODB_URI = "mongodb://bad"; config.DATA_DIR = Path(os.environ["DATA_DIR"])
st, note = db.connect(); assert st.kind == "file", st.kind; print("Fallback OK:", note[:60])

"""Database helpers — MongoDB with in-memory fallback."""

import json
import os
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ.get("MONGO_URL", os.environ.get("MONGO_URI", ""))
DB_NAME = os.environ.get("DB_NAME", "triad_realty")
USE_MONGO = False
db = None
client = None

if MONGO_URL:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        USE_MONGO = True
        print(f"[DB] Connected to MongoDB: {DB_NAME}")
    except Exception as e:
        print(f"[DB] MongoDB connection failed: {e} — using in-memory store")

if not USE_MONGO:
    print("[DB] Using in-memory store (no MongoDB configured)")

_store: dict[str, list] = {
    "leads": [],
    "contacts": [],
    "applications": [],
    "team": [],
    "users": [],
    "organizations": [],
    "projects": [],
    "blogs": [],
    "attendance": [],
    "settings": [],
}

STORE_FILE = ROOT_DIR / "db_store.json"


def _load_store():
    if not USE_MONGO and STORE_FILE.exists():
        try:
            with open(STORE_FILE, "r") as f:
                data = json.load(f)
                for k, v in data.items():
                    if k in _store:
                        _store[k] = v
            print(f"[DB] Loaded data from {STORE_FILE}")
        except Exception as e:
            print(f"[DB] Error loading data from {STORE_FILE}: {e}")


def _save_store():
    if not USE_MONGO:
        try:
            with open(STORE_FILE, "w") as f:
                json.dump(_store, f, indent=2)
        except Exception as e:
            print(f"[DB] Error saving data to {STORE_FILE}: {e}")


# Load local data if available on startup
_load_store()


async def mem_insert(collection: str, doc: dict):
    _store[collection].append(doc)
    _save_store()


async def mem_find(collection: str, query: Optional[dict] = None):
    items = list(_store[collection])
    if not query:
        return items
    return [d for d in items if _matches(d, query)]


def _matches(doc: dict, query: dict) -> bool:
    for k, v in query.items():
        if doc.get(k) != v:
            return False
    return True


async def mem_find_one(collection: str, query: dict):
    for doc in _store[collection]:
        if _matches(doc, query):
            return doc
    return None


async def mem_update(collection: str, doc_id: str, updates: dict):
    for i, doc in enumerate(_store[collection]):
        if doc.get("id") == doc_id or doc.get("_id") == doc_id:
            _store[collection][i].update(updates)
            _save_store()
            return _store[collection][i]
    return None


async def mem_delete(collection: str, doc_id: str):
    _store[collection] = [
        doc
        for doc in _store[collection]
        if doc.get("id") != doc_id and doc.get("_id") != doc_id
    ]
    _save_store()


async def mem_delete_many(collection: str, query: dict):
    _store[collection] = [
        doc
        for doc in _store[collection]
        if not _matches(doc, query)
    ]
    _save_store()


async def db_insert(collection: str, doc: dict):
    if USE_MONGO:
        await db[collection].insert_one({**doc})
    else:
        await mem_insert(collection, doc)


async def db_find(collection: str, query: Optional[dict] = None):
    if USE_MONGO:
        q = query or {}
        return await db[collection].find(q, {"_id": 0}).to_list(500)
    return await mem_find(collection, query)


async def db_find_one(collection: str, query: dict):
    if USE_MONGO:
        return await db[collection].find_one(query, {"_id": 0})
    return await mem_find_one(collection, query)


async def db_update(collection: str, doc_id: str, updates: dict):
    if USE_MONGO:
        await db[collection].update_one({"id": doc_id}, {"$set": updates})
        return await db[collection].find_one({"id": doc_id}, {"_id": 0})
    return await mem_update(collection, doc_id, updates)


async def db_delete(collection: str, doc_id: str):
    if USE_MONGO:
        await db[collection].delete_one({"id": doc_id})
    else:
        await mem_delete(collection, doc_id)


async def db_delete_many(collection: str, query: dict):
    if USE_MONGO:
        await db[collection].delete_many(query)
    else:
        await mem_delete_many(collection, query)


async def db_count(collection: str) -> int:
    if USE_MONGO:
        return await db[collection].count_documents({})
    return len(_store[collection])


async def close_db():
    if USE_MONGO and client:
        client.close()

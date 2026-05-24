"""Triad Realty API — entry point (uvicorn server:app)."""

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.cors import CORSMiddleware
from db import (
    USE_MONGO,
    close_db,
    db_count,
    db_delete,
    db_delete_many,
    db_find,
    db_find_one,
    db_insert,
    db_update,
)
from deps import (
    get_current_user,
    require_developer,
    require_owner,
    require_owner_or_developer,
    require_staff_or_owner,
)
from middleware import SecurityHeadersMiddleware
from rate_limit import check_rate_limit
from seed_data import BLOGS, CAREERS, PROJECTS
from security import (
    ROLE_DEVELOPER,
    ROLE_OWNER,
    ROLE_STAFF,
    create_access_token,
    has_strong_jwt_secret,
    hash_password,
    verify_password,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DEFAULT_ORG_ID = os.environ.get("DEFAULT_ORG_ID", "default-org")
DEVELOPER_EMAIL = "developer@triad.ae"
DEVELOPER_PASSWORD = "developer"
OWNER_EMAIL = "owner@triad.ae"
OWNER_PASSWORD = "onwer"
STAFF_EMAIL = "normal@triad.ae"
STAFF_PASSWORD = "normal"
REELLY_BASE = os.environ.get(
    "REELLY_API_BASE",
    "https://search-listings-production.up.railway.app/v1",
)
REELLY_API_KEY = os.environ.get("REELLY_API_KEY", "")
TARGET_PROJECT_COUNT = int(os.environ.get("TARGET_PROJECT_COUNT", "100"))

app = FastAPI(title="Triad Realty API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
reelly_client: Optional[httpx.AsyncClient] = None


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ----------------------------- Models -----------------------------
class LeadIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    project_id: Optional[str] = None
    asset: Optional[str] = "brochure"
    source_page: Optional[str] = None


class Lead(LeadIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str = DEFAULT_ORG_ID
    status: str = "new"
    assigned_to: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class LeadPatch(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str


class Contact(ContactIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


class ApplicationIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    position: str
    experience_years: Optional[int] = None
    cover_letter: Optional[str] = None
    portfolio_url: Optional[str] = None


class Application(ApplicationIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    organization_id: Optional[str] = None


class OwnerCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    organization_name: str


class OrgPatch(BaseModel):
    name: Optional[str] = None


class PopupSettingsIn(BaseModel):
    tag: str
    title: str
    description: str
    btn1_label: str
    btn1_link: str
    btn2_label: str
    btn2_link: str
    active: bool


class HomepageSettingsIn(BaseModel):
    launch_title: str
    launch_description: str
    launch_video_url: Optional[str] = None
    stat1_value: str
    stat1_label: str
    stat2_value: str
    stat2_label: str
    stat3_value: str
    stat3_label: str
    stat4_value: str
    stat4_label: str
    founders_image_url: Optional[str] = None


class TeamMemberIn(BaseModel):
    name: str
    role: str
    expertise: Optional[str] = None
    focus: Optional[str] = None
    photo: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    bio: Optional[str] = None
    videoUrl: Optional[str] = None
    videoUrl2: Optional[str] = None


class TeamMemberOut(TeamMemberIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


DEFAULT_HOMEPAGE_SETTINGS = {
    "id": "homepage",
    "launch_title": "Why Triad Realty?",
    "launch_description": (
        "Renowned for curated UAE launches, sharp market intelligence, and client-first advisory, "
        "Triad Realty blends developer access with disciplined investment guidance."
    ),
    "launch_video_url": "",
    "stat1_value": "50,000+",
    "stat1_label": "Homes delivered*",
    "stat2_value": "54,000+",
    "stat2_label": "In planning and progress*",
    "stat3_value": "100+",
    "stat3_label": "Awards received",
    "stat4_value": "9",
    "stat4_label": "Countries",
    "founders_image_url": "/three_founders.jpg",
}


def user_public(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name"),
        "role": u["role"],
        "organization_id": u.get("organization_id"),
    }


# ----------------------------- Startup seed -----------------------------
async def seed_content():
    if await db_count("projects") == 0:
        for p in PROJECTS:
            await db_insert("projects", dict(p))
        logger.info("Seeded %d projects", len(PROJECTS))

    # Ensure we always have a full catalog for the Projects page.
    current_projects = await db_find("projects")
    if len(current_projects) < TARGET_PROJECT_COUNT:
        existing_ids = {p.get("id") for p in current_projects if p.get("id")}
        generated = []
        idx = 1
        while len(current_projects) + len(generated) < TARGET_PROJECT_COUNT:
            base = PROJECTS[(idx - 1) % len(PROJECTS)]
            gen_id = f"{base['id']}-auto-{idx}"
            idx += 1
            if gen_id in existing_ids:
                continue

            price_base = int(base.get("price_from", 1_000_000))
            sqft_base = int(base.get("sqft_from", 700))
            price_factor = 1 + (((idx % 9) - 4) * 0.035)
            sqft_factor = 1 + (((idx % 7) - 3) * 0.025)
            tx_price = int(max(300_000, price_base * (0.88 + (idx % 5) * 0.04)))

            generated_doc = {
                **base,
                "id": gen_id,
                "name": f"{base.get('name', 'Project')} {idx}",
                "price_from": int(max(300_000, price_base * price_factor)),
                "sqft_from": int(max(350, sqft_base * sqft_factor)),
                "transactions": [
                    {"date": "2026-01-14", "unit": "1BR - 720 sqft", "price": tx_price},
                    {"date": "2026-03-07", "unit": "2BR - 1,080 sqft", "price": int(tx_price * 1.15)},
                ],
            }
            generated.append(generated_doc)
            existing_ids.add(gen_id)

        for doc in generated:
            await db_insert("projects", doc)
        logger.info("Auto-generated %d additional projects (total=%d)", len(generated), len(current_projects) + len(generated))

    if await db_count("blogs") == 0:
        for b in BLOGS:
            await db_insert("blogs", dict(b))
        logger.info("Seeded %d blogs", len(BLOGS))
    if not await db_find_one("settings", {"id": "launch_popup"}):
        await db_insert("settings", {
            "id": "launch_popup",
            "tag": "New Launch",
            "title": "Marina Aurora — Pre-Launch",
            "description": "Exclusive access to Emaar's newest waterfront tower before the public release.",
            "btn1_label": "View Details",
            "btn1_link": "/projects/marina-aurora",
            "btn2_label": "Compare",
            "btn2_link": "/analysis",
            "active": True
        })
        logger.info("Seeded default launch popup settings")
    if not await db_find_one("settings", {"id": "homepage"}):
        await db_insert("settings", dict(DEFAULT_HOMEPAGE_SETTINGS))
        logger.info("Seeded default homepage settings")


async def _upsert_default_user(
    email: str,
    password: str,
    role: str,
    name: str,
    organization_id: Optional[str],
):
    existing = await db_find_one("users", {"email": email.lower()})
    created_at = existing.get("created_at") if existing else now_iso()
    
    # Keep the existing password hash if the user already exists in the database
    p_hash = existing["password_hash"] if existing else hash_password(password)
    
    doc = {
        "email": email.lower(),
        "password_hash": p_hash,
        "name": name,
        "role": role,
        "organization_id": organization_id,
        "created_at": created_at,
    }

    if existing:
        return await db_update("users", existing["id"], doc)

    doc["id"] = str(uuid.uuid4())
    await db_insert("users", doc)
    return doc


async def seed_default_users():
    org = await db_find_one("organizations", {"id": DEFAULT_ORG_ID})
    if not org:
        await db_insert(
            "organizations",
            {"id": DEFAULT_ORG_ID, "name": "Triad Realty", "created_at": now_iso()},
        )

    await _upsert_default_user(
        email=DEVELOPER_EMAIL,
        password=DEVELOPER_PASSWORD,
        role=ROLE_DEVELOPER,
        name="Platform Developer",
        organization_id=None,
    )
    await _upsert_default_user(
        email=OWNER_EMAIL,
        password=OWNER_PASSWORD,
        role=ROLE_OWNER,
        name="Organization Owner",
        organization_id=DEFAULT_ORG_ID,
    )
    await _upsert_default_user(
        email="onwer@triad.ae",
        password=OWNER_PASSWORD,
        role=ROLE_OWNER,
        name="Organization Owner (Typo Email)",
        organization_id=DEFAULT_ORG_ID,
    )
    await _upsert_default_user(
        email=STAFF_EMAIL,
        password=STAFF_PASSWORD,
        role=ROLE_STAFF,
        name="Staff User",
        organization_id=DEFAULT_ORG_ID,
    )

    logger.info("Seeded default admin users (developer/owner/staff)")


@app.on_event("startup")
async def on_startup():
    global reelly_client
    environment = os.environ.get("ENVIRONMENT", os.environ.get("APP_ENV", "development")).lower()
    if environment in {"production", "prod"} and not has_strong_jwt_secret():
        raise RuntimeError("JWT_SECRET must be set to a strong value in production")

    reelly_client = httpx.AsyncClient(timeout=30.0)
    await seed_content()
    await seed_default_users()


@app.on_event("shutdown")
async def shutdown_db_client():
    global reelly_client
    if reelly_client:
        await reelly_client.aclose()
        reelly_client = None
    await close_db()


# ----------------------------- Auth -----------------------------
@api_router.post("/auth/login")
async def login(payload: LoginIn, request: Request):
    check_rate_limit(request, limit=10, window_sec=60)
    user = await db_find_one("users", {"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(user["id"], user["role"], user.get("organization_id"))
    att_id = str(uuid.uuid4())
    await db_insert(
        "attendance",
        {
            "id": att_id,
            "user_id": user["id"],
            "organization_id": user.get("organization_id"),
            "login_at": now_iso(),
            "logout_at": None,
        },
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_public(user),
        "attendance_id": att_id,
    }


@api_router.post("/auth/logout")
async def logout(user=Depends(get_current_user)):
    records = await db_find("attendance", {"user_id": user["id"], "logout_at": None})
    for rec in records:
        await db_update("attendance", rec["id"], {"logout_at": now_iso()})
    return {"detail": "Logged out"}


@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return user_public(user)


# ----------------------------- Developer: owners & orgs -----------------------------
@api_router.post("/admin/owners")
async def create_owner(payload: OwnerCreate, _=Depends(require_developer)):
    existing = await db_find_one("users", {"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    org_id = str(uuid.uuid4())
    await db_insert(
        "organizations",
        {"id": org_id, "name": payload.organization_name, "created_at": now_iso()},
    )
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": ROLE_OWNER,
        "organization_id": org_id,
        "created_at": now_iso(),
    }
    await db_insert("users", doc)
    return {"user": user_public(doc), "organization": {"id": org_id, "name": payload.organization_name}}


@api_router.get("/admin/owners")
async def list_owners(_=Depends(require_developer)):
    owners = await db_find("users", {"role": ROLE_OWNER})
    orgs = {o["id"]: o for o in await db_find("organizations")}
    results = []
    for o in owners:
        org = orgs.get(o.get("organization_id"), {})
        results.append({**user_public(o), "organization_name": org.get("name")})
    return {"count": len(results), "results": results}


@api_router.patch("/admin/organizations/{org_id}")
async def patch_organization(org_id: str, payload: OrgPatch, _=Depends(require_developer)):
    org = await db_find_one("organizations", {"id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates:
        await db_update("organizations", org_id, updates)
    return await db_find_one("organizations", {"id": org_id})


@api_router.get("/admin/organizations")
async def list_organizations(_=Depends(require_developer)):
    items = await db_find("organizations")
    return {"count": len(items), "results": items}


# ----------------------------- Owner: staff -----------------------------
@api_router.post("/admin/staff")
async def create_staff(payload: UserCreate, user=Depends(require_owner)):
    existing = await db_find_one("users", {"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "id": str(uuid.uuid4()),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": ROLE_STAFF,
        "organization_id": user["organization_id"],
        "created_at": now_iso(),
    }
    await db_insert("users", doc)
    return user_public(doc)


@api_router.get("/admin/staff")
async def list_staff(user=Depends(require_owner)):
    items = await db_find("users", {"role": ROLE_STAFF, "organization_id": user["organization_id"]})
    return {"count": len(items), "results": [user_public(u) for u in items]}


@api_router.delete("/admin/staff/{staff_id}")
async def delete_staff(staff_id: str, user=Depends(require_owner)):
    staff = await db_find_one("users", {"id": staff_id, "role": ROLE_STAFF})
    if not staff or staff.get("organization_id") != user["organization_id"]:
        raise HTTPException(status_code=404, detail="Staff not found")
    await db_delete("users", staff_id)
    return {"detail": "Deleted"}


# ----------------------------- Attendance -----------------------------
@api_router.get("/admin/attendance")
async def attendance_dashboard(user=Depends(require_owner)):
    org_id = user["organization_id"]
    staff = await db_find("users", {"role": ROLE_STAFF, "organization_id": org_id})
    staff_ids = {s["id"] for s in staff}
    records = await db_find("attendance")
    org_records = [r for r in records if r.get("user_id") in staff_ids or r.get("organization_id") == org_id]
    return {"count": len(org_records), "results": org_records}


# ----------------------------- Leads (protected) -----------------------------
@api_router.get("/admin/leads")
async def admin_list_leads(user=Depends(require_staff_or_owner)):
    if user["role"] == ROLE_STAFF:
        items = await db_find("leads", {"assigned_to": user["id"]})
    else:
        items = await db_find("leads", {"organization_id": user["organization_id"]})
    return {"count": len(items), "results": items}


@api_router.patch("/admin/leads/{lead_id}")
async def admin_patch_lead(lead_id: str, payload: LeadPatch, user=Depends(require_staff_or_owner)):
    lead = await db_find_one("leads", {"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if user["role"] == ROLE_STAFF:
        if lead.get("assigned_to") != user["id"]:
            raise HTTPException(status_code=403, detail="Not your lead")
    elif lead.get("organization_id") != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Not in your organization")
    updates = payload.model_dump(exclude_unset=True)
    updates["updated_at"] = now_iso()
    updated = await db_update("leads", lead_id, updates)
    return updated


@api_router.delete("/admin/leads")
async def admin_clear_leads(user=Depends(require_owner)):
    await db_delete_many("leads", {"organization_id": user["organization_id"]})
    return {"detail": "All leads cleared"}


@api_router.get("/leads")
async def list_leads(_=Depends(require_owner_or_developer)):
    items = await db_find("leads")
    return {"count": len(items), "results": items}


@api_router.get("/contacts")
async def list_contacts(_=Depends(require_owner_or_developer)):
    items = await db_find("contacts")
    return {"count": len(items), "results": items}


@api_router.get("/applications")
async def list_applications(_=Depends(require_owner_or_developer)):
    items = await db_find("applications")
    return {"count": len(items), "results": items}


# ----------------------------- Public POST (rate limited) -----------------------------
@api_router.post("/leads", response_model=Lead)
async def create_lead(payload: LeadIn, request: Request):
    check_rate_limit(request)
    lead = Lead(**payload.model_dump())
    await db_insert("leads", lead.model_dump())
    return lead


@api_router.post("/contacts", response_model=Contact)
async def create_contact(payload: ContactIn, request: Request):
    check_rate_limit(request)
    c = Contact(**payload.model_dump())
    await db_insert("contacts", c.model_dump())
    return c


@api_router.post("/applications", response_model=Application)
async def create_application(payload: ApplicationIn, request: Request):
    check_rate_limit(request)
    a = Application(**payload.model_dump())
    await db_insert("applications", a.model_dump())
    return a


# ----------------------------- Projects / blogs (public read, DB) -----------------------------
def filter_projects(
    items: list,
    emirate: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    configuration: Optional[str] = None,
    hot: Optional[bool] = None,
    q: Optional[str] = None,
):
    results = items
    if emirate:
        results = [p for p in results if p["emirate"].lower() == emirate.lower()]
    if location:
        results = [p for p in results if location.lower() in p["location"].lower()]
    if type:
        results = [p for p in results if p["type"].lower() == type.lower()]
    if min_price is not None:
        results = [p for p in results if p["price_from"] >= min_price]
    if max_price is not None:
        results = [p for p in results if p["price_from"] <= max_price]
    if configuration:
        config_upper = configuration.upper()
        results = [
            p
            for p in results
            if config_upper in [c.upper() for c in p["configuration"]]
        ]
    if hot is not None:
        results = [p for p in results if p["hot"] == hot]
    if q:
        ql = q.lower()
        results = [
            p
            for p in results
            if ql in p["name"].lower()
            or ql in p["description"].lower()
            or ql in p["location"].lower()
        ]
    return results


@api_router.get("/")
async def root():
    return {"service": "Triad Realty API", "status": "ok"}


@api_router.get("/settings/popup")
async def get_popup_settings():
    s = await db_find_one("settings", {"id": "launch_popup"})
    if not s:
        return {
            "id": "launch_popup",
            "tag": "New Launch",
            "title": "Marina Aurora — Pre-Launch",
            "description": "Exclusive access to Emaar's newest waterfront tower before the public release.",
            "btn1_label": "View Details",
            "btn1_link": "/projects/marina-aurora",
            "btn2_label": "Compare",
            "btn2_link": "/analysis",
            "active": True
        }
    return s


@api_router.get("/settings/homepage")
async def get_homepage_settings():
    s = await db_find_one("settings", {"id": "homepage"})
    if not s:
        return DEFAULT_HOMEPAGE_SETTINGS
    return {**DEFAULT_HOMEPAGE_SETTINGS, **s}


@api_router.get("/projects")
async def list_projects(
    emirate: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    configuration: Optional[str] = None,
    hot: Optional[bool] = None,
    q: Optional[str] = None,
    page: int = 1,
    per_page: int = 0,
):
    items = await db_find("projects")
    results = filter_projects(items, emirate, location, type, min_price, max_price, configuration, hot, q)
    total = len(results)
    if per_page > 0:
        start = max(0, (page - 1) * per_page)
        end = start + per_page
        results = results[start:end]
    return {"count": total, "results": results}


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    p = await db_find_one("projects", {"id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


@api_router.get("/blogs")
async def list_blogs():
    items = await db_find("blogs")
    return {"count": len(items), "results": items}


@api_router.get("/blogs/{blog_id}")
async def get_blog(blog_id: str):
    b = await db_find_one("blogs", {"id": blog_id})
    if not b:
        raise HTTPException(status_code=404, detail="Blog not found")
    return b


@api_router.get("/careers")
async def list_careers():
    return {"count": len(CAREERS), "results": CAREERS}


# ----------------------------- Admin CMS: projects & blogs (developer) -----------------------------
@api_router.get("/admin/projects")
async def admin_list_projects(_=Depends(require_developer)):
    items = await db_find("projects")
    return {"count": len(items), "results": items}


@api_router.post("/admin/projects")
async def admin_create_project(payload: dict, _=Depends(require_developer)):
    if not payload.get("id"):
        payload["id"] = str(uuid.uuid4())
    await db_insert("projects", payload)
    return payload


@api_router.patch("/admin/projects/{project_id}")
async def admin_update_project(project_id: str, payload: dict, _=Depends(require_developer)):
    p = await db_find_one("projects", {"id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    payload.pop("id", None)
    return await db_update("projects", project_id, payload)


@api_router.delete("/admin/projects/{project_id}")
async def admin_delete_project(project_id: str, _=Depends(require_developer)):
    await db_delete("projects", project_id)
    return {"detail": "Deleted"}


@api_router.get("/admin/blogs")
async def admin_list_blogs(_=Depends(require_developer)):
    items = await db_find("blogs")
    return {"count": len(items), "results": items}


@api_router.post("/admin/blogs")
async def admin_create_blog(payload: dict, _=Depends(require_developer)):
    if not payload.get("id"):
        payload["id"] = str(uuid.uuid4())
    await db_insert("blogs", payload)
    return payload


@api_router.patch("/admin/blogs/{blog_id}")
async def admin_update_blog(blog_id: str, payload: dict, _=Depends(require_developer)):
    b = await db_find_one("blogs", {"id": blog_id})
    if not b:
        raise HTTPException(status_code=404, detail="Blog not found")
    payload.pop("id", None)
    return await db_update("blogs", blog_id, payload)


@api_router.delete("/admin/blogs/{blog_id}")
async def admin_delete_blog(blog_id: str, _=Depends(require_developer)):
    await db_delete("blogs", blog_id)
    return {"detail": "Deleted"}


@api_router.get("/admin/system/health")
async def system_health(_=Depends(require_developer)):
    return {
        "status": "ok",
        "database": "mongodb" if USE_MONGO else "memory",
        "projects": await db_count("projects"),
        "blogs": await db_count("blogs"),
        "users": await db_count("users"),
        "leads": await db_count("leads"),
    }


# ----------------------------- Team (public read, developer CRUD) -----------------------------
@api_router.get("/team")
async def list_team():
    items = await db_find("team")
    return {"count": len(items), "results": items}


@api_router.get("/team/{member_id}")
async def get_team_member(member_id: str):
    item = await db_find_one("team", {"id": member_id})
    if not item:
        raise HTTPException(status_code=404, detail="Team member not found")
    return item


@api_router.post("/team")
async def create_team_member(payload: TeamMemberIn, _=Depends(require_developer)):
    member = TeamMemberOut(**payload.model_dump())
    await db_insert("team", member.model_dump())
    return member


@api_router.put("/team/{member_id}")
async def update_team_member(member_id: str, payload: TeamMemberIn, _=Depends(require_developer)):
    updated = await db_update("team", member_id, payload.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Team member not found")
    return updated


@api_router.delete("/team/{member_id}")
async def delete_team_member(member_id: str, _=Depends(require_developer)):
    await db_delete("team", member_id)
    return {"detail": "Deleted"}


# ----------------------------- Reelly proxy -----------------------------
async def _reelly_request(path: str, params: Optional[dict] = None):
    global reelly_client
    if not REELLY_API_KEY:
        raise HTTPException(status_code=503, detail="External listings API not configured")
    url = f"{REELLY_BASE.rstrip('/')}/{path.lstrip('/')}"
    if reelly_client is None:
        reelly_client = httpx.AsyncClient(timeout=30.0)

    try:
        r = await reelly_client.get(
            url,
            params=params,
            headers={"X-API-Key": REELLY_API_KEY, "accept": "application/json"},
        )
    except httpx.HTTPError as exc:
        logger.warning("External API request failed: %s", exc)
        raise HTTPException(status_code=502, detail="External API unavailable") from exc

    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail="External API error")
    return r.json()


@api_router.get("/external/properties")
async def proxy_properties(
    page: int = 1,
    per_page: int = 50,
    has_escrow: bool = True,
    price_type: str = "area",
):
    return await _reelly_request(
        "properties",
        {"page": page, "per_page": per_page, "has_escrow": has_escrow, "price_type": price_type},
    )


@api_router.get("/external/properties/{property_id}")
async def proxy_property_detail(property_id: str):
    return await _reelly_request(f"properties/{property_id}")


@api_router.get("/external/property-markers")
async def proxy_property_markers():
    return await _reelly_request("property-markers")


@api_router.get("/external/areas")
async def proxy_areas():
    return await _reelly_request("areas")


@api_router.get("/external/unit-bedrooms")
async def proxy_unit_bedrooms():
    return await _reelly_request("unit-bedrooms")


@api_router.get("/external/sale-statuses")
async def proxy_sale_statuses():
    return await _reelly_request("sale-statuses")


@api_router.put("/admin/settings/popup")
async def update_popup_settings(payload: PopupSettingsIn, _=Depends(require_developer)):
    s = await db_find_one("settings", {"id": "launch_popup"})
    if not s:
        doc = {"id": "launch_popup", **payload.model_dump()}
        await db_insert("settings", doc)
        return doc
    updates = payload.model_dump()
    return await db_update("settings", "launch_popup", updates)


@api_router.put("/admin/settings/homepage")
async def update_homepage_settings(payload: HomepageSettingsIn, _=Depends(require_developer)):
    s = await db_find_one("settings", {"id": "homepage"})
    if not s:
        doc = {"id": "homepage", **payload.model_dump()}
        await db_insert("settings", doc)
        return doc
    updates = payload.model_dump()
    return await db_update("settings", "homepage", updates)


app.include_router(api_router)

_cors_origins = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1024)

# ----------------------------- Serve Static Frontend -----------------------------
FRONTEND_BUILD_DIR = Path(os.path.dirname(__file__)).joinpath("../frontend/build").resolve()

if FRONTEND_BUILD_DIR.exists():
    static_dir = FRONTEND_BUILD_DIR / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        if path.startswith("api/") or path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")

        safe_path = (FRONTEND_BUILD_DIR / path).resolve()
        try:
            safe_path.relative_to(FRONTEND_BUILD_DIR)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid path")

        if safe_path.is_file():
            return FileResponse(str(safe_path))

        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        raise HTTPException(status_code=404, detail="Frontend index.html not found")

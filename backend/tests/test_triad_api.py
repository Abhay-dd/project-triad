"""Triad Realty backend API tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://dubai-launches.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ----- Health -----
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ----- Projects -----
def test_projects_list(s):
    r = s.get(f"{API}/projects")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 6
    assert len(data["results"]) == 6


def test_projects_hot(s):
    r = s.get(f"{API}/projects", params={"hot": "true"})
    data = r.json()
    assert data["count"] == 3
    assert all(p["hot"] is True for p in data["results"])


def test_projects_filter_emirate(s):
    r = s.get(f"{API}/projects", params={"emirate": "Sharjah"})
    data = r.json()
    assert data["count"] == 1
    assert data["results"][0]["emirate"] == "Sharjah"


def test_projects_filter_type_villa(s):
    r = s.get(f"{API}/projects", params={"type": "Villa"})
    data = r.json()
    assert data["count"] == 2
    assert all(p["type"] == "Villa" for p in data["results"])


def test_projects_filter_config(s):
    r = s.get(f"{API}/projects", params={"configuration": "2BR"})
    data = r.json()
    assert data["count"] >= 1
    for p in data["results"]:
        assert any(c.upper() == "2BR" for c in p["configuration"])


def test_projects_price_range(s):
    r = s.get(f"{API}/projects", params={"min_price": 2000000, "max_price": 10000000})
    data = r.json()
    for p in data["results"]:
        assert 2000000 <= p["price_from"] <= 10000000


def test_projects_search_marina(s):
    r = s.get(f"{API}/projects", params={"q": "marina"})
    data = r.json()
    assert data["count"] >= 1
    names = [p["name"].lower() for p in data["results"]]
    assert any("marina" in n or "marina" in p.get("location", "").lower() for n, p in zip(names, data["results"]))


def test_project_detail(s):
    r = s.get(f"{API}/projects/marina-aurora")
    assert r.status_code == 200
    p = r.json()
    assert p["id"] == "marina-aurora"
    assert isinstance(p["gallery"], list) and len(p["gallery"]) > 0
    assert isinstance(p["payment_plan"], list)
    assert isinstance(p["amenities"], list)
    assert isinstance(p["transactions"], list)


def test_project_404(s):
    r = s.get(f"{API}/projects/nonexistent")
    assert r.status_code == 404


# ----- Blogs / Careers -----
def test_blogs_list(s):
    r = s.get(f"{API}/blogs")
    data = r.json()
    assert r.status_code == 200
    assert data["count"] == 4


def test_blog_detail(s):
    r = s.get(f"{API}/blogs/dubai-2026-outlook")
    assert r.status_code == 200
    assert r.json()["id"] == "dubai-2026-outlook"


def test_careers(s):
    r = s.get(f"{API}/careers")
    assert r.status_code == 200
    assert r.json()["count"] == 4


# ----- Lead create + list (no _id) -----
def test_lead_create(s):
    payload = {
        "name": "TEST_Lead",
        "email": "test_lead@example.com",
        "phone": "+971500000001",
        "project_id": "marina-aurora",
        "asset": "brochure",
        "source_page": "/projects/marina-aurora",
    }
    r = s.post(f"{API}/leads", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == payload["email"]
    assert "id" in body
    assert "_id" not in body


def test_leads_list_requires_auth(s):
    r = s.get(f"{API}/leads")
    assert r.status_code == 401


def test_contact_create(s):
    payload = {
        "name": "TEST_Contact",
        "email": "test_contact@example.com",
        "phone": "+971500000002",
        "subject": "Inquiry",
        "message": "Please contact me.",
    }
    r = s.post(f"{API}/contacts", json=payload)
    assert r.status_code == 200
    assert r.json()["email"] == payload["email"]


def test_contacts_list_requires_auth(s):
    assert s.get(f"{API}/contacts").status_code == 401


def test_application_create(s):
    payload = {
        "name": "TEST_Applicant",
        "email": "test_app@example.com",
        "phone": "+971500000003",
        "position": "senior-consultant",
        "experience_years": 5,
        "cover_letter": "Hello",
        "portfolio_url": "https://example.com",
    }
    r = s.post(f"{API}/applications", json=payload)
    assert r.status_code == 200
    assert r.json()["position"] == "senior-consultant"


def test_invalid_email_rejected(s):
    r = s.post(f"{API}/leads", json={"name": "X", "email": "not-an-email", "phone": "1"})
    assert r.status_code == 422

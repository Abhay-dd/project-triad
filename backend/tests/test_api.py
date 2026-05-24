"""Triad Realty Backend API Tests"""
import os
import sys

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")
API = f"{BASE_URL}/api"

DEVELOPER_EMAIL = os.environ.get("DEVELOPER_EMAIL", "developer@triad.ae")
DEVELOPER_PASSWORD = os.environ.get("DEVELOPER_PASSWORD", "TriadDev2026!")


def get_session():
    try:
        import requests
        sess = requests.Session()
        sess.headers.update({"Content-Type": "application/json"})
        return sess
    except ImportError:
        print("ERROR: 'requests' not installed. Run: pip install requests")
        sys.exit(1)


def get_dev_token(s):
    r = s.post(
        f"{API}/auth/login",
        json={"email": DEVELOPER_EMAIL, "password": DEVELOPER_PASSWORD},
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def run_test(name, fn):
    try:
        fn()
        print(f"  ✅ PASS  {name}")
        return True
    except AssertionError as e:
        print(f"  ❌ FAIL  {name}: {e}")
        return False
    except Exception as e:
        print(f"  ⚠️  ERROR {name}: {e}")
        return False


def test_health(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_projects_list(s):
    r = s.get(f"{API}/projects")
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert data["count"] >= 1
    print(f"       → Found {data['count']} projects")


def test_project_detail(s):
    r = s.get(f"{API}/projects/marina-aurora")
    assert r.status_code == 200
    p = r.json()
    assert p["id"] == "marina-aurora"
    assert isinstance(p.get("gallery"), list)
    assert isinstance(p.get("payment_plan"), list)


def test_project_not_found(s):
    r = s.get(f"{API}/projects/does-not-exist")
    assert r.status_code == 404


def test_projects_filter_hot(s):
    r = s.get(f"{API}/projects", params={"hot": "true"})
    data = r.json()
    assert r.status_code == 200
    assert all(p["hot"] is True for p in data["results"])


def test_projects_filter_emirate(s):
    r = s.get(f"{API}/projects", params={"emirate": "Sharjah"})
    data = r.json()
    assert all(p["emirate"] == "Sharjah" for p in data["results"])


def test_blogs_list(s):
    r = s.get(f"{API}/blogs")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] >= 1


def test_careers_list(s):
    r = s.get(f"{API}/careers")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] >= 1


def test_lead_create(s):
    payload = {
        "name": "Test Lead",
        "email": "testlead@example.com",
        "phone": "+971500000001",
        "project_id": "marina-aurora",
        "asset": "brochure",
    }
    r = s.post(f"{API}/leads", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == payload["email"]
    assert "id" in body
    assert body.get("organization_id")
    assert "_id" not in body


def test_leads_list_requires_auth(s):
    r = s.get(f"{API}/leads")
    assert r.status_code == 401


def test_leads_list_with_auth(s, token):
    r = s.get(f"{API}/leads", headers=auth_headers(token))
    assert r.status_code == 200
    assert "results" in r.json()


def test_invalid_email_rejected(s):
    r = s.post(f"{API}/leads", json={"name": "X", "email": "not-an-email", "phone": "1"})
    assert r.status_code == 422


def test_contact_create(s):
    payload = {
        "name": "Test Contact",
        "email": "testcontact@example.com",
        "message": "Hello from test",
    }
    r = s.post(f"{API}/contacts", json=payload)
    assert r.status_code == 200
    assert r.json()["email"] == payload["email"]


def test_team_crud(s, token):
    headers = auth_headers(token)
    payload = {"name": "Test Member", "role": "QA Tester"}
    r = s.post(f"{API}/team", json=payload, headers=headers)
    assert r.status_code == 200, r.text
    member = r.json()
    member_id = member["id"]

    r = s.get(f"{API}/team")
    assert r.status_code == 200
    ids = [m["id"] for m in r.json()["results"]]
    assert member_id in ids

    r = s.put(f"{API}/team/{member_id}", json={"name": "Updated Member", "role": "QA Lead"}, headers=headers)
    assert r.status_code == 200

    r = s.delete(f"{API}/team/{member_id}", headers=headers)
    assert r.status_code == 200


def test_team_create_requires_auth(s):
    r = s.post(f"{API}/team", json={"name": "X", "role": "Y"})
    assert r.status_code == 401


def test_auth_me(s, token):
    r = s.get(f"{API}/auth/me", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["role"] == "developer"


if __name__ == "__main__":
    print(f"\n🚀 Triad Realty API Tests")
    print(f"   Target: {API}")
    print(f"{'─' * 50}")

    s = get_session()
    try:
        token = get_dev_token(s)
        print(f"   Auth: developer token obtained")
    except AssertionError as e:
        print(f"   ⚠️  Could not login as developer: {e}")
        print("   Start server first: cd backend && uvicorn server:app --port 8000")
        sys.exit(1)

    tests = [
        ("Health Check", lambda: test_health(s)),
        ("Projects List", lambda: test_projects_list(s)),
        ("Project Detail", lambda: test_project_detail(s)),
        ("Project 404", lambda: test_project_not_found(s)),
        ("Filter: Hot Projects", lambda: test_projects_filter_hot(s)),
        ("Filter: Emirate (Sharjah)", lambda: test_projects_filter_emirate(s)),
        ("Blogs List", lambda: test_blogs_list(s)),
        ("Careers List", lambda: test_careers_list(s)),
        ("Create Lead (public)", lambda: test_lead_create(s)),
        ("Leads list requires auth", lambda: test_leads_list_requires_auth(s)),
        ("Leads list with auth", lambda: test_leads_list_with_auth(s, token)),
        ("Reject Invalid Email", lambda: test_invalid_email_rejected(s)),
        ("Create Contact", lambda: test_contact_create(s)),
        ("Team CRUD (developer)", lambda: test_team_crud(s, token)),
        ("Team create requires auth", lambda: test_team_create_requires_auth(s)),
        ("Auth /me", lambda: test_auth_me(s, token)),
    ]

    passed = sum(run_test(name, fn) for name, fn in tests)
    total = len(tests)
    print(f"{'─' * 50}")
    print(f"   Results: {passed}/{total} passed")
    if passed == total:
        print("   🎉 All tests passed!")
    else:
        print(f"   ⚠️  {total - passed} test(s) failed.")
    print()

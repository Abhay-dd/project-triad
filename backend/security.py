"""JWT and password hashing."""

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
import jwt

import secrets
from pathlib import Path

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET or JWT_SECRET == "change-me-in-production":
    secret_file = Path(__file__).parent / ".jwt_secret"
    if secret_file.exists():
        try:
            JWT_SECRET = secret_file.read_text().strip()
        except Exception:
            JWT_SECRET = secrets.token_hex(32)
    else:
        JWT_SECRET = secrets.token_hex(32)
        try:
            secret_file.write_text(JWT_SECRET)
        except Exception:
            pass
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "24"))
ENVIRONMENT = os.environ.get("ENVIRONMENT", os.environ.get("APP_ENV", "development")).lower()

ROLE_DEVELOPER = "developer"
ROLE_OWNER = "owner"
ROLE_STAFF = "staff"
ALL_ROLES = {ROLE_DEVELOPER, ROLE_OWNER, ROLE_STAFF}


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, role: str, organization_id: Optional[str] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload: dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "exp": expire,
    }
    if organization_id:
        payload["organization_id"] = organization_id
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict[str, Any]]:
    try:
        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["exp", "sub", "role"]},
        )
    except jwt.PyJWTError:
        return None


def has_strong_jwt_secret() -> bool:
    if JWT_SECRET == "change-me-in-production":
        return False
    return len(JWT_SECRET) >= 32

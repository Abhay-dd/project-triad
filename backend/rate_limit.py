"""In-memory rate limiting for public POST endpoints."""

import time
from collections import defaultdict
from collections import deque
from typing import DefaultDict, Deque, Tuple

from fastapi import HTTPException, Request, status

# (ip, path) -> ordered timestamps
_buckets: DefaultDict[Tuple[str, str], Deque[float]] = defaultdict(deque)

DEFAULT_LIMIT = 30
DEFAULT_WINDOW_SEC = 60


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def check_rate_limit(request: Request, limit: int = DEFAULT_LIMIT, window_sec: int = DEFAULT_WINDOW_SEC):
    ip = _client_ip(request)
    key = (ip, request.url.path)
    now = time.time()
    window_start = now - window_sec

    hits = _buckets[key]
    while hits and hits[0] <= window_start:
        hits.popleft()

    if len(hits) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )
    hits.append(now)

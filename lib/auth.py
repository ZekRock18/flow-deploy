import asyncio
import json
import os
import uuid
from datetime import datetime, timedelta
from functools import lru_cache

import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk

load_dotenv()

bearer_scheme = HTTPBearer()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")

_jwks_failure_until: datetime | None = None


@lru_cache(maxsize=1)
def _fetch_jwks_live() -> list:
    resp = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=10)
    resp.raise_for_status()
    return resp.json().get("keys", [])


def _fetch_jwks() -> list:
    global _jwks_failure_until

    # Use pre-configured keys if available — avoids runtime network call entirely
    static_keys = os.environ.get("SUPABASE_JWKS_KEYS")
    if static_keys:
        return json.loads(static_keys)

    # Don't hammer the network if it recently failed
    if _jwks_failure_until and datetime.utcnow() < _jwks_failure_until:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service temporarily unavailable, retry shortly",
        )

    try:
        return _fetch_jwks_live()
    except Exception:
        _jwks_failure_until = datetime.utcnow() + timedelta(seconds=30)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach auth service",
        )


async def warm_jwks() -> None:
    await asyncio.to_thread(_fetch_jwks)


def verify_supabase_jwt(token: str) -> dict:
    keys = _fetch_jwks()
    last_error = None

    for key_data in keys:
        try:
            algorithm = key_data.get("alg", "ES256")
            public_key = jwk.construct(key_data, algorithm=algorithm)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=[algorithm],
                audience="authenticated",
                options={"leeway": 300},
            )
            return payload
        except Exception as e:
            last_error = e
            continue

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=str(last_error) if last_error else "Invalid token",
    )


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> uuid.UUID:
    payload = verify_supabase_jwt(credentials.credentials)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return uuid.UUID(sub)

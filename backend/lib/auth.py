import os
import uuid
from functools import lru_cache
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk

load_dotenv(Path(__file__).parent.parent / ".env")

bearer_scheme = HTTPBearer()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")


@lru_cache(maxsize=1)
def _fetch_jwks() -> list:
    """Fetch and cache JWKS keys from Supabase (called once at startup)."""
    resp = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=10)
    resp.raise_for_status()
    return resp.json().get("keys", [])


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

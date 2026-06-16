"""Clerk JWT authentication middleware for FastAPI."""

from __future__ import annotations

import httpx
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from syndicate_api.config import settings

_security = HTTPBearer(auto_error=False)

_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    """Fetch Clerk JWKS (cached in-process)."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    if settings.clerk_jwt_verification_key:
        _jwks_cache = {"local_key": settings.clerk_jwt_verification_key}
        return _jwks_cache

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.clerk.com/v1/jwks",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
        )
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


async def verify_clerk_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_security),
) -> dict:
    """Verify Clerk JWT and return decoded claims.

    In development mode without Clerk keys, returns a mock user.
    """
    if not settings.clerk_secret_key:
        return {"sub": "dev_user", "email": "dev@syndicate.local", "name": "Developer"}

    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = credentials.credentials

    try:
        import jwt

        jwks = await _get_jwks()

        if "local_key" in jwks:
            decoded = jwt.decode(
                token,
                jwks["local_key"],
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        else:
            from jwt import PyJWKClient
            jwks_client = PyJWKClient(f"https://api.clerk.com/v1/jwks")
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decoded = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )

        return decoded

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_current_user(claims: dict = Depends(verify_clerk_token)) -> dict:
    """Extract user info from verified JWT claims."""
    return {
        "id": claims.get("sub", "unknown"),
        "email": claims.get("email", ""),
        "name": claims.get("name", claims.get("sub", "User")),
    }

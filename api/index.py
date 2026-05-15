import logging
import os
import sys
import uuid
import httpx
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials
from mangum import Mangum
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Project root (parent of api/) is where lib/ lives
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import bearer_scheme, get_current_user_id, verify_supabase_jwt
from lib.database import create_tables, get_db
from lib.models import Project, Repo, User

load_dotenv()  # no-op on Vercel (env vars injected); loads .env from cwd locally


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(lifespan=lifespan)

_frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
_is_dev = _frontend_url == "http://localhost:5173"
_allowed_origins = [_frontend_url] + (["http://localhost:5173"] if not _is_dev else [])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    email: str | None
    avatar_url: str | None
    provider: str
    created_at: datetime

    class Config:
        from_attributes = True


class RepoOut(BaseModel):
    id: uuid.UUID
    github_repo_id: int
    name: str
    full_name: str
    description: str | None
    url: str
    language: str | None
    stars: int
    forks: int
    is_private: bool
    synced_at: datetime

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    repo_id: uuid.UUID | None = None


class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    status: str
    repo_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

async def get_or_create_user(
    user_id: uuid.UUID,
    token: str,
    db: AsyncSession,
) -> User:
    payload = verify_supabase_jwt(token)
    user_meta = payload.get("user_metadata", {})
    app_meta = payload.get("app_metadata", {})
    provider = app_meta.get("provider", "github")
    email = payload.get("email")
    username = (
        user_meta.get("user_name")
        or user_meta.get("name")
        or user_meta.get("full_name")
        or email
        or "unknown"
    )
    avatar_url = user_meta.get("avatar_url")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        # Refresh stale profile fields (e.g. user was created before metadata extraction worked)
        changed = False
        if not user.username or user.username == "unknown":
            user.username = username; changed = True
        if not user.email and email:
            user.email = email; changed = True
        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url; changed = True
        if changed:
            await db.commit()
            await db.refresh(user)
        return user

    # If the same email already exists under a different Supabase UUID (e.g. after
    # account re-linking deleted an old account), migrate that row to the new UUID.
    if email:
        result = await db.execute(select(User).where(User.email == email))
        stale = result.scalar_one_or_none()
        if stale and stale.id != user_id:
            logger.info("Migrating user %s → %s (email: %s)", stale.id, user_id, email)
            await db.execute(update(Repo).where(Repo.user_id == stale.id).values(user_id=user_id))
            await db.execute(update(Project).where(Project.user_id == stale.id).values(user_id=user_id))
            await db.delete(stale)
            await db.flush()

    user = User(id=user_id, username=username, email=email, avatar_url=avatar_url, provider=provider)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ── Routes ────────────────────────────────────────────────────────────────────


@app.get("/api/me", response_model=UserOut)
async def me(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_current_user_id(credentials)
    user = await get_or_create_user(user_id, credentials.credentials, db)
    return user


@app.get("/api/repos/sync", response_model=list[RepoOut])
async def sync_repos(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
    x_provider_token: str | None = Header(default=None, alias="X-Provider-Token"),
):
    user_id = get_current_user_id(credentials)
    user = await get_or_create_user(user_id, credentials.credentials, db)

    github_token = x_provider_token or user.github_access_token

    if github_token and github_token != user.github_access_token:
        user.github_access_token = github_token
        await db.commit()

    if not github_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub access token available. Please log in with GitHub.",
        )

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user/repos",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github+json",
            },
            params={"per_page": 100, "sort": "updated"},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch repos from GitHub")

    gh_repos = resp.json()
    now = datetime.now(timezone.utc)

    for gh in gh_repos:
        result = await db.execute(
            select(Repo).where(
                Repo.user_id == user.id,
                Repo.github_repo_id == gh["id"],
            )
        )
        repo = result.scalar_one_or_none()
        if repo:
            repo.name = gh["name"]
            repo.full_name = gh["full_name"]
            repo.description = gh.get("description")
            repo.url = gh["html_url"]
            repo.language = gh.get("language")
            repo.stars = gh["stargazers_count"]
            repo.forks = gh["forks_count"]
            repo.is_private = gh["private"]
            repo.synced_at = now
        else:
            repo = Repo(
                user_id=user.id,
                github_repo_id=gh["id"],
                name=gh["name"],
                full_name=gh["full_name"],
                description=gh.get("description"),
                url=gh["html_url"],
                language=gh.get("language"),
                stars=gh["stargazers_count"],
                forks=gh["forks_count"],
                is_private=gh["private"],
                synced_at=now,
            )
            db.add(repo)

    await db.commit()

    result = await db.execute(
        select(Repo).where(Repo.user_id == user.id).order_by(Repo.stars.desc())
    )
    return result.scalars().all()


@app.get("/api/repos", response_model=list[RepoOut])
async def list_repos(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_current_user_id(credentials)
    result = await db.execute(
        select(Repo).where(Repo.user_id == user_id).order_by(Repo.stars.desc())
    )
    return result.scalars().all()


@app.get("/api/projects", response_model=list[ProjectOut])
async def list_projects(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_current_user_id(credentials)
    result = await db.execute(
        select(Project).where(Project.user_id == user_id).order_by(Project.created_at.desc())
    )
    return result.scalars().all()


@app.post("/api/projects", response_model=ProjectOut, status_code=201)
async def create_project(
    body: ProjectCreate,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_current_user_id(credentials)
    project = Project(user_id=user_id, **body.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


# Vercel serverless handler
handler = Mangum(app, lifespan="off")

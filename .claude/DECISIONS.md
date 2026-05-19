# FlowDeploy — Session Decisions Log

## 2026-05-19 — Vibsl Full Debug Session (afternoon)
- Fixed OAuth redirect: Supabase Site URL changed to vibsl URL; vibsl added to Redirect URLs allowlist
- Fixed SPA routing: `StaticFiles(html=True)` does not serve index.html for unmatched paths like `/dashboard` — replaced with catch-all `/{full_path:path}` route returning index.html
- Fixed frontend not being served: platform uses Dockerfile (not Nixpacks) — frontend/dist IS built and copied; static file mount was the bug
- Fixed JWKS fetch blocking: Azure Container Apps cannot reach `wucxhhiuoafslchzfypx.supabase.co:443` — added `SUPABASE_JWKS_KEYS` env var support so keys are read directly without network call; added 30s failure cooldown
- Root cause of 500 on all API endpoints: `asyncio.exceptions.CancelledError` in asyncpg `_create_ssl_connection` — Azure network blocks outbound TCP to `aws-1-ap-southeast-2.pooler.supabase.com:5432`
- Current status: frontend loads, auth works, all API calls fail due to DB unreachable from Azure
- Open: vibsl support contacted — waiting on whether port 5432 outbound is allowed on their platform
- Open: if blocked confirmed, migrate backend to Railway/Render (AWS/GCP — can reach Supabase)
- Commits this session: `fb5ba5e` (nixpacks frontend build), `5a5ac06` (SPA catch-all), `00af216` (JWKS env var fix)

## 2026-05-19 — Vibsl URL Routing Debug (ongoing)
- Root cause narrowed: lifespan `create_tables()` was blocking startup — asyncpg default connect timeout ~60s hung before app could serve /health
- Added `"timeout": 5` to asyncpg `connect_args` — reduced verify timeout from 2m37s → 1m40s (confirms DB hang was real)
- Made `lib/database.py` engine creation lazy (no crash at import if DATABASE_URL missing) — previously raised RuntimeError at import time, killing uvicorn before /health could respond
- Stripped lifespan to bare `yield` as diagnostic — if deploy still fails it is definitively platform routing, not our code
- Platform always shows "Preview" deploy type — likely not wiring HTTP ingress for preview deploys; try "Production" deploy or "Set as production branch" in platform settings
- Last commit on both master+main: `bd0ad19`
- Open: need to check Observability → Logs on platform to see actual runtime output from container
- Open: if bare-lifespan deploy still fails, escalate to vibsl support with evidence (app starts in <1s, still times out)
- Open: restore `create_tables()` + `warm_jwks()` in lifespan once deploy succeeds (lazy init approach)
- Open: VITE_ frontend build args not injected by Nixpacks — frontend missing Supabase config in vibsl build

## 2026-05-18 — Vibsl Deployment Debugging Session
- Platform uses Nixpacks (not our Dockerfile) — detects FastAPI, runs pip install
- Added `Procfile` with `web: uvicorn api.index:app --host 0.0.0.0 --port ${PORT:-8000}` to fix wrong entry point
- Added `ssl: require` to asyncpg `connect_args` — Supabase pooler requires SSL from non-Vercel hosts
- Made `create_tables()` and `warm_jwks()` non-fatal at startup (exceptions logged, not raised)
- Stripped trailing slash from `FRONTEND_URL` to fix CORS origin matching
- All 5 env vars now in Shared tab (DATABASE_URL, SUPABASE_URL, FRONTEND_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- App now starts successfully — final error is platform routing bug ("URL isn't connected to app yet")
- Open: vibsl platform routing bug — need to contact support, app runs but URL never connects
- VITE_ frontend build args not passed by Nixpacks — frontend won't have Supabase config baked in (separate issue)

## 2026-05-18 — Vibsl Platform Deployment Setup
- Deployed to app-dev.vibsl.com (separate from Vercel)
- Added `Dockerfile` (multi-stage: Node builds frontend, Python runs uvicorn on port 8000)
- FastAPI serves React SPA via `StaticFiles` mount (conditional on `frontend/dist` existing — no-op on Vercel)
- Added `aiofiles` to `requirements.txt` (required by FastAPI StaticFiles)
- Platform clones `main` branch by default — created `main` branch mirroring `master`
- Rule: always push to both `master` AND `main` when deploying: `git push origin master:main`
- Env vars sourced from `backend/.env` and `frontend/.env.local` (credentials live there)
- `FRONTEND_URL` must be updated to the vibsl-assigned domain after first live deploy
- Open: `FRONTEND_URL` not yet set to vibsl domain — CORS will block until updated

## 2026-05-18 — Full Production Bug Audit & Fixes
- Fixed 6 bugs: CORS logic inverted (localhost allowed in prod), blocking sync JWKS fetch, GitHub pagination (>100 repos), missing unique constraint on repos, stale closure in useEffect, missing env var guard in supabase.js
- CORS fix: `not _is_dev` → `_is_dev` in `api/index.py:42`
- JWKS: added `warm_jwks()` called in lifespan via `asyncio.to_thread` to avoid blocking event loop on cold start
- GitHub sync: now paginates all pages instead of stopping at 100
- Unique constraint `uq_repo_user_github` added to `Repo` model — requires DB migration for existing tables
- `handleSync` moved above its effect and wrapped in `useCallback` to fix TDZ + stale closure
- Open: `backend/` directory is stale and still references Mangum — dead code, safe to delete
- Open: Unique constraint migration needed on existing Postgres DB

## 2026-05-18 — Vercel CLI Setup & Login
- Installed Vercel CLI globally via `npm install -g vercel`
- Authenticated via `vercel login` (device OAuth flow — DTBW-XCDG)
- Login confirmed: account linked and ready for deployments
- Next: run `vercel` to link project and deploy
- Open: project not yet linked to Vercel (needs `vercel link` or first `vercel` run)

## 2026-05-18 — Initial Codebase Scan & Agent Setup
- Read every source file; built complete CLAUDE.md and memory system
- Discovered dual API structure: `api/` + `lib/` (Vercel prod) vs `backend/api/` + `backend/lib/` (local dev)
- Key finding: `backend/api/index.py` retains Mangum but root `api/index.py` exposes FastAPI app directly for Vercel ASGI runtime
- Custom tooltip.jsx was written to replace `@base-ui/react` after production render crash
- "Deploy to K8S" feature is stubbed (button disabled, tooltip says "Coming soon")
- Open: Kubernetes deployment feature not yet implemented
- Open: `button.jsx` still uses `@base-ui/react/button` — potential crash risk if that package breaks

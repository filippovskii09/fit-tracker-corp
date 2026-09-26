# Handoff: Pull Request for `stabilize-auth-session`

This is the brief for the agent that opens the PR. Everything is already built and reviewed but not committed. Your job is to verify access, collect screenshots, split the work into reviewable commits, and open one PR against `main`.

## Context

- **Branch:** `filippovskii/fix/stabilize-auth-session`, created from `main`. Nothing is committed. The working tree has about 100 changed or untracked paths.
- **Source of truth:**
  - OpenSpec change `openspec/changes/stabilize-auth-session/`: `proposal.md`, `design.md` (including D9 and "Known limitations"), `specs/`, and `tasks.md` (32/39 done).
  - The remaining items (1.1, 1.3, 5.4, 8.2–8.5) are manual or deployment steps. Do not mark them done.
- **What the change does:**
  - The Netlify `/api/*` proxy makes the refresh cookie first-party.
  - An `auth_sessions` table supports multiple sessions, rotation with a 10 s overlap, and replay detection.
  - Refresh returns structured `401`, `429` (with `Retry-After`) and `503` errors.
  - `tokenUse` claim, HS256 only, validated secrets.
  - Workout create is idempotent (`clientRequestId`, and `409 IDEMPOTENCY_KEY_REUSED` when the key is reused with a different payload).
  - The frontend has a session coordinator with single-flight and cross-tab refresh, and `PrivateGuard` states `checking`/`authenticated`/`anonymous`/`transient` with a retry screen.
  - Workout drafts are versioned, scoped by user and date, and can be restored or discarded.
- **Review status:** approved by backend review, frontend scoped re-review (clean) and test mutation review. Security and accessibility reviews found no Critical/High issues; their residual risks are listed below.
- **Last verification:**
  - Backend: 127 unit, 6 integration and 5 e2e tests pass.
  - Frontend: 44 suites and 316 tests pass. Lint, `ts`, `tokens:check` and `build` pass.

## Hard rules

- **Never touch `backend/.env.example`, `frontend/.env.example` or any `.env`.** In a sandbox they show up as deleted or as `Operation not permitted`. That is an artifact, not a real change, and they must never be staged. Stage only explicit paths; never run `git add -A` or `git add .`.
- **Leave `stash@{0}` alone** (program-details work, unrelated).
- **Never stop, restart or remove the user's Docker container `fit-tracker-db`.** For a database, start your own disposable container with a unique name, for example `stabilize-auth-pr-db`, on a free port, and remove it at the end.
- Never run migrations against production or any other shared database.
- Never force-push, never push to `main`, and never use `--no-verify`.
- Commit messages end with the co-author trailer your harness gives you. The PR body ends with the harness's generated-by line.
- Read `docs/agent-environment-notes.md` before you start.

## Step 1: Preflight. Stop and report if any check fails.

1. `gh auth status` must show a logged-in account with push access to `filippovskii09/fit-tracker-corp`.
2. A browser or Chrome MCP must be available and able to navigate and take a screenshot.
3. Local port binding must work, for example by starting `node -e "require('net').createServer().listen(0)"` without `EPERM`.
4. Docker must be reachable (`docker ps`).
5. Run `git rev-parse --abbrev-ref HEAD` and confirm the output is `filippovskii/fix/stabilize-auth-session`.
6. Confirm `git log main..HEAD` is empty and `main` is up to date with `origin/main`.
7. List what failed and what the human must enable. Do not work around a missing access.

## Step 2: Run the stack locally

1. Start the disposable Postgres container.
2. Point the backend at it through environment variables in your shell only; do not write them to `.env`. Use two different JWT secrets of at least 32 characters, with `JWT_ACCESS_TOKEN_EXPIRATION_TIME=60` so the retry path can be reached, and `JWT_REFRESH_TOKEN_EXPIRATION_TIME=604800`.
3. Run `npm run build --prefix backend` and `node backend/dist/db/migrate.js`, then start the backend.
4. Start the frontend dev server against it.
5. Create a test user through `POST /api/v1/auth/register`, on this local database only.
6. Add a section to `docs/agent-environment-notes.md` under **Test user**. It must include:
   - the email;
   - that the user lives only on the disposable local database;
   - how to recreate it.

   Never put the password in any tracked file. Tell the human the password in your final message instead.
7. Record in `docs/agent-environment-notes.md` every new environment problem you hit, with its workaround.

## Step 3: Screenshots

Take the screenshots with the browser MCP at desktop width, plus a 390px mobile width where noted. Save them under `docs/pr-assets/stabilize-auth-session/`.

1. Sign-in page, then an authenticated dashboard after login.
2. Workout create page with the draft recovery banner (Restore/Discard) after a reload. Mobile width too.
3. The "Draft restored" state after Restore.
4. The session retry screen (`transient`). To trigger it, stop the backend or make refresh return 503/429 while a page is open.
   - With 429, show the Retry-After countdown.
   - Show the Retry button focused.
5. After backend recovery, the same page continues without a logout.
6. The idempotency conflict: the toast, then navigation to the existing workout. To trigger it, send a create request with the same `clientRequestId` and a different payload.
7. Terminal expiry. Trigger it by clearing or revoking the session, then do the redirect to sign-in and sign in again. Show the return to the original route with the draft offered.
8. DevTools Network/Application:
   - the `refreshToken` cookie (HttpOnly, Path `/api/v1/auth`);
   - the `Cache-Control: no-store` header on an auth response;
   - the `X-Request-Id` header.

   Mask every token value in the screenshot before saving.

Commit the images in the docs commit and reference them in the PR body with relative links. If a state cannot be reproduced, say which one and why instead of faking it.

## Step 4: Logical commits

Split the work into about 8–10 commits. Each commit must be one coherent, reviewable concern that builds and passes its own tests where practical. Don't create one commit per file, and don't make one giant commit. Inspect `git diff` for every file before staging it. If a file mixes concerns, use path-level grouping; interactive `git add -p` is not available, so keep the file in the commit where most of its change belongs and say so.

Suggested order (adjust after reading the diff):

1. **`feat(backend): validate auth config and token hardening`**
   - `config/env.validation.ts` and `config/constants.ts`
   - `token.service.ts`, `jwt.strategy.ts` and their specs
   - token types: `tokenUse`, HS256, secrets, lifetimes
2. **`feat(backend): add auth_sessions persistence`**
   - the `auth-session.entity.ts` entity
   - migration `1790000000000-AddAuthSessions.ts`
   - `auth-sessions.service.ts` and its spec
3. **`feat(backend): session-based refresh rotation, logout and structured errors`**
   - `auth.service.ts`, `auth.controller.ts`, `auth.module.ts`
   - the exceptions and refresh-outcome types
   - response messages
   - `users.service.ts` and `users.controller.ts`, including the removal of POST /users
   - the auth specs
4. **`feat(backend): request id, throttler 429 contract and cache headers`**
   - `common/middleware/*`, `common/guards/app-throttler.guard.ts`
   - `main.ts`, `app.module.ts`, `exercises.controller.ts`
5. **`feat(backend): idempotent workout creation`**
   - migration `1790100000000-AddWorkoutClientRequestId.ts`
   - workout entity, DTO, service, `utils/canonicalize-payload.ts` and specs
6. **`build(backend): migrations on start, docker and CI`**
   - `db/*`, `Dockerfile`, root `.dockerignore`, `package.json`
   - `test/jest-*.json` and `test/integration/*`, `test/app.e2e-spec.ts`
   - `.github/workflows/backend-ci.yml`, `backend/README.md`
7. **`feat(frontend): first-party API via Netlify proxy`**
   - `netlify.toml`, `frontend/src/config/index.ts`, `vite.config.ts`, `tsconfig.app.json` if related
8. **`feat(frontend): session coordinator with cross-tab refresh and guarded routes`**
   - `services/session/*`, `api/api.ts`, `hooks/useSessionRefresh.ts`
   - `router/guards/PrivateGuard.tsx`
   - the signin form, `utils/token.utils.ts`, `utils/return-to.utils.ts`
   - `constants/auth.ts`, the auth types, and the related specs and locales
9. **`feat(frontend): workout draft recovery and idempotent save`**
   - `pages/workout/**`, `components/workout/common/*`
   - `utils/workout-draft.util.ts`, `utils/uuid.utils.ts`
   - `constants/workout.ts`, the workout types, and the related specs and locales
10. **`docs: openspec, mobile testing, agent environment notes, PR screenshots`**
    - `openspec/changes/stabilize-auth-session/**`, `docs/*`, `docs/pr-assets/**`

After committing, `git status` must show only the `.env.example` sandbox artifacts, or nothing at all. Then run the full checks on the final tree:

- `npm run test --prefix backend -- --runInBand`
- backend lint and build
- the backend integration tests against the disposable database
- frontend `npm run lint`, `npm run ts`, `npx jest --coverage`, `npm run tokens:check` and `npm run build`

Report the results exactly.

## Step 5: Push and PR

1. Push the branch: `git push -u origin filippovskii/fix/stabilize-auth-session`. If the push is rejected, stop.
2. Open a PR with `gh pr create --base main`. Reuse an existing open PR for this branch if there is one.
3. Title: `fix: stabilize auth session and protect workout drafts`.
4. Body, in plain and clear English, with these sections:
   1. **Problem**: token expiry during a workout logs the user out and loses the workout.
   2. **What changed**: backend and frontend, briefly.
   3. **How to review**:
      - the commit list, each with one line on what it contains;
      - review commit by commit;
      - which commits are the riskiest (3, 8);
      - which are mostly tests or configuration.
   4. **Screenshots**: embed the images from Step 3 with captions.
   5. **Verification**: the exact commands and their counts.
   6. **Deployment checklist**, all manual:
      - check `SELECT name FROM migrations` on prod;
      - set distinct JWT secrets of at least 32 characters;
      - set Railway `TRUST_PROXY` (verify `req.ip` both direct and through Netlify) and confirm Railway builds from `backend/Dockerfile`;
      - keep `AUTH_COOKIE_SAME_SITE=none` until the Netlify proxy is verified, then switch to `lax`;
      - fix `.env.example` to 900/604800 and add `AUTH_COOKIE_SAME_SITE`;
      - tasks 1.1, 5.4 and 8.2–8.5 remain open.
   7. **Known limitations and residual risks**:
      - the 10 s overlap;
      - a lost rotation response ends the session;
      - the access token lives in localStorage and the CSP is Report-Only;
      - CSRF exposure while SameSite is `none`, including login CSRF on urlencoded signin;
      - the rate limit depends on `TRUST_PROXY`;
      - logout does not check the token hash;
      - accessibility follow-ups: the countdown is announced every second, focus is lost after navigation, and the StickyHeader name field has no label.
   8. **OpenSpec**: a link to the change folder and the progress (32/39).
5. Do not merge.

## Final message to the human

Include:

- the PR URL;
- the commit list;
- which screenshots were captured and which were not, with the reason;
- the check results;
- the test user's email and password, in chat only;
- any new environment problems, and confirmation that they were added to `docs/agent-environment-notes.md`.

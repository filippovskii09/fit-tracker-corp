# Agent Environment Notes

Known problems that AI agent sessions hit in this repository, and how to avoid them. Add to this file when you hit a new one.

## Sandbox

- `.env` and `.env.example` (backend and frontend) cannot be read or written. Every access fails with `Operation not permitted`. Because of this, `git status` and `git diff` show them as deleted (` D`) or report EPERM. They are not really deleted. Never stage them. Ask the human to make any `.env.example` change.
- A plain `git stash -u` fails with `lstat backend/.env.example`. Stash by pathspec instead: `git stash push -u -m "<msg>" -- backend/src frontend/src`.
- `npx prettier --check .` inside `frontend/` fails only because it cannot read the `.env` files. Check source paths instead, for example `npx prettier --check src`.
- Local port binding is disabled (`listen` → `EPERM`). You cannot start a dev server, a backend, or a local Postgres port for browser checks. The human can allow it with `sandbox.network.allowLocalBinding: true` in their Claude Code settings.
- `git branch --show-current` is not supported by the installed git (2.15). Use `git rev-parse --abbrev-ref HEAD`.
- Local port binding varies between sessions. Check it with `node -e "require('net').createServer().listen(0)"` instead of assuming it is blocked.
- The backend crashes on start with `EPERM: operation not permitted, open '.env'`, because `ConfigModule` reads `.env` relative to the working directory. Start it from a directory that has no `.env` (for example a scratch directory) with all variables exported in the shell: `node -r <repo>/backend/node_modules/module-alias/register <repo>/backend/dist/main`. The same works for `dist/db/migrate.js` and `dist/seed.js`.
- `pkill` fails (`Cannot get process list`). Start servers as background tasks and stop them through the task, not by process name.

## Tooling

- A Chrome MCP is connected in some sessions and missing in others. Check with `tabs_context_mcp` before promising screenshots.
- The Chrome MCP cannot resize the window below Chrome's minimum width, so a 390px viewport is not reachable. Load the page into a same-origin `<iframe style="width:390px">` and take a zoomed capture of that region.
- The Chrome MCP cannot open DevTools. Capture cookie and header evidence with `curl -i` instead, and mask the token values.
- The 1Password extension sometimes takes keyboard focus on the sign-in form, and typing then fails with `Cannot access a chrome-extension:// URL of different extension`. Use `find` + `form_input` to fill the fields.
- Screenshots taken right after navigation can come out blank because the page has not painted yet. Wait about 2 s and take the screenshot again before you conclude the page is broken.
- `gh` may be logged out (`Failed to log in to github.com account ... (keyring)`). Check with `gh auth status` before trying to create a PR.
- A successful `! gh auth login` by the human does not help `gh` inside the sandbox: it still reports `The token in keyring is invalid`, and API calls fail with `x509: OSStatus -26276`. The human runs `git push` and `gh pr create` themselves.

## Docker

- `fit-tracker-db` is the human's own Postgres container. Never stop, restart, or remove it. If a test needs a database, create a separate disposable container with a unique name and remove it afterwards.

## Test user

- Email: `pr-tester@fit-tracker.test` (first name `PR Tester`).
- It exists only in the disposable local database `stabilize-auth-pr-db` that was used for the `stabilize-auth-session` PR screenshots. It does not exist on production or on the human's `fit-tracker-db`, and it disappears when the disposable container is removed.
- To recreate it: start a disposable Postgres, run `dist/db/migrate.js` and `dist/seed.js`, start the backend, then call `POST /api/v1/auth/register` with `{"firstName":"PR Tester","email":"pr-tester@fit-tracker.test","password":"<strong password>"}`. The request body has no `lastName` field.
- Never put the password in a tracked file. Keep it outside the repository, for example in the team password manager.

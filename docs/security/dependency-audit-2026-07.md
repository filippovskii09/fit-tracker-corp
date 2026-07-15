# Dependency vulnerability audit — 2026-07

Remediation of vulnerable npm dependencies across the monorepo, covering
[issue #54](https://github.com/../issues/54) (backend) and
[issue #55](https://github.com/../issues/55) (frontend). Both were taken on a
single branch and PR because they are one cross-cutting task (dependency
hardening of the monorepo).

> **Note on the issue descriptions.** The original issues named
> `express` / `path-to-regexp` / `follow-redirects` / `lodash` as the headline
> problem. Those descriptions were stale. This work was driven by a live
> `npm audit` on 2026-07-15, not by the issue text — the real picture differed
> (see the tables below).

## Result

| Workspace  | Before                                        | After |
| ---------- | --------------------------------------------- | ----- |
| `frontend` | 18 (1 critical / 10 high / 6 moderate / 1 low) | **0** |
| `backend`  | 37 (1 critical / 13 high / 18 moderate / 5 low) | **0** |

No vulnerabilities were knowingly left unfixed. Every advisory reachable at the
time of writing was resolved, either within existing semver ranges or via the
NestJS 10 → 11 major upgrade.

## Method and CI caveat

CI does **not** run `npm audit`. The pipeline gate is `lint` + `test:cov` +
`build` for each workspace. Therefore:

- The functional pass/fail signal for this change is the existing CI gate.
- The "no critical/high vulnerabilities" acceptance criterion is a manual /
  review-time gate, verified with `npm audit` locally (see
  [Verification](#verification)).

A natural follow-up (out of scope here) is to add a non-blocking
`npm audit --audit-level=high` step to CI so regressions surface automatically.

## Frontend changes (issue #55)

Fixed entirely with `npm audit fix` (no `--force`). All fixes resolved
**within the existing semver ranges**, so `package.json` was unchanged and only
`package-lock.json` moved.

| Package                        | Severity | Change             | Notes                                                              |
| ------------------------------ | -------- | ------------------ | ------------------------------------------------------------------ |
| `axios`                        | high     | 1.13.2 → 1.18.1    | Direct runtime dependency (HTTP client, refresh-token interceptor).|
| `react-router` / `-dom`        | high     | 7.11.0 → 7.18.1    | XSS, open-redirect, vendored turbo-stream RCE, DoS, CSRF. Minor within v7 — no API breakage. |
| `postcss`                      | moderate | patched            | Build-time (Tailwind/Vite).                                         |
| `ws`, `lodash-es`, `form-data`, `follow-redirects`, `yaml`, `js-yaml`, `ajv`, `brace-expansion`, `minimatch`, `picomatch`, `flatted`, `lodash`, `@babel/core`, `handlebars` | mixed | patched (transitive) | Build/test tooling chains (Vite/rolldown, Jest, formik→lodash-es). |

## Backend changes (issues #54)

### Safe fixes (`npm audit fix`, no `--force`)

Lockfile-only bumps within existing ranges:

| Package  | Severity | Change            | Notes                                                                                              |
| -------- | -------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `typeorm`| moderate | 0.3.28 → 0.3.31   | SQL injection in `orderBy` of Update/SoftDelete query builders affects **MySQL/MariaDB only**. This project runs **PostgreSQL** (`src/db/data-source.ts`), so it was not reachable; patched regardless. |
| `uuid`   | moderate | → 11.1.1          | Missing buffer bounds check in v3/v5/v6 when `buf` is provided. Transitive via `typeorm`.          |
| `joi`    | moderate | 17.13.3 → 17.13.4 | Env-schema validation (`@nestjs/config`).                                                            |
| `handlebars` (critical), `lodash`, `serialize-javascript`, `minimatch`, `form-data`, `glob`, `flatted` | mixed | patched (transitive) | Dev/test tooling (`ts-jest`, webpack chain). Not in the runtime bundle. |

### NestJS 10 → 11 major upgrade (Express 5)

The remaining backend advisories (`express`, `multer`, `path-to-regexp`,
`body-parser`, `qs`) had **no non-major fix**: they are pulled in by
`@nestjs/platform-express@10`, and the fix path is `@nestjs/platform-express@11`
(which depends on Express 5). The rest of the Nest stack was already partially on
11 (`@nestjs/typeorm`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`,
`@nestjs/config`), so the runtime packages were bumped together to keep peer
dependencies consistent:

- Runtime: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` → `^11`.
- Dev/tooling: `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing` → `^11`.

The tooling bump also cleared the remaining dev-only advisories
(`webpack`, `tmp`, `inquirer`, `external-editor`, `@angular-devkit/*`, etc.),
which is why the backend reached 0 rather than a documented dev-only residual.

**Code change required by the upgrade.** Express 5 widened the `enableCors()`
signature to `CorsOptions | CorsOptionsDelegate`. Passing an inline object
literal no longer contextually types the custom `origin` callback, so its
parameters fell to an implicit `any` and `tsc` failed (TS7006). Fixed by
extracting the options into a `CorsOptions`-annotated `const`
(`backend/src/main.ts`); CORS behavior is unchanged.

No other code changes were needed: the app has no wildcard/regex routes (the
main Express 5 breaking-change surface), and middleware wiring
(`helmet`, `compression`, `cookie-parser`, global `ValidationPipe`,
`ThrottlerGuard`) is standard and 11-compatible.

## Residual vulnerabilities

**None.** Both workspaces report `found 0 vulnerabilities`. Had any dev-only
advisory required a risky major on build tooling with no safe fix, it would be
listed here with its chain and a non-reachability rationale — none did.

## Verification

Backend (`cd backend`):

```bash
rm -rf node_modules && npm ci
npm run lint
npm run test:cov   # 12 suites, 65 tests
npm run build
npm audit          # 0 vulnerabilities
```

Frontend (`cd frontend`):

```bash
npm ci
npm run check      # format + lint + ts + tokens:check + test (30 suites, 89 tests) + build
npm audit          # 0 vulnerabilities
```

Beyond the automated gate, the critical runtime flows affected by the upgrades
(react-router navigation and route guards, axios API + refresh-token flow, and a
workout CRUD round-trip across backend ↔ frontend) were exercised against a live
running app, since unit tests do not verify third-party runtime behavior.

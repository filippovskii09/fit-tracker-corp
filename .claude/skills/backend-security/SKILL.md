---
name: backend-security
description: Apply project-specific backend security invariants when changing authentication, authorization, user-owned resources, JWT/refresh tokens, cookies, CSRF, sensitive fields, secrets, CORS, or rate limiting. Use for changes that affect identity, access decisions, browser credentials, exposed data, or abuse controls. Do not use as primary guidance for Nest architecture, TypeORM schema/query design, or test strategy; defer those to dedicated skills.
---

# Backend Security

Preserve authentication and authorization invariants at the server boundary. Prefer explicit, local security decisions over hidden conventions.

## Before changing security-relevant code

1. Identify the authenticated principal and where it comes from.
2. Identify every protected route and resource/property the caller may access.
3. Trace the request from guard/strategy → controller → service → persistence.
4. Identify browser-managed credentials (cookies), bearer tokens, secrets, and sensitive response fields involved.
5. Load only the reference files relevant to the change.

## Core rules

- Authentication proves identity; authorization decides allowed actions. Never treat successful authentication as sufficient authorization.
- Deny access unless the route/action is intentionally public or explicitly authorized.
- Every user-owned object access must enforce ownership/permission server-side for that specific request.
- For user-owned DB access, keep the authenticated `userId` in the persistence predicate where possible (`{ id, userId }`), not as a post-fetch comparison.
- Never trust `userId`, role, tenant, ownership, or privileged flags from client input when they should come from authenticated server context.
- Do not invent RBAC when simple ownership/relationship authorization is the actual policy. Add roles/permissions only when the business model requires them.
- Never expose or accept writable sensitive entity properties merely because they exist on the entity.
- Passwords are hashed with a password-hashing algorithm; refresh/session secrets are not stored in plaintext.
- Preserve refresh-token rotation semantics. A refresh token presented once must not silently remain an indefinitely reusable credential.
- JWT validation must use explicit expected algorithms and validate the claims relevant to the token's purpose.
- Keep access-token and refresh-token validation rules/secrets/type semantics distinct so one token class cannot be accepted as another.
- Any browser endpoint authenticated by automatically-sent cookies must be reviewed for CSRF. SameSite is defense in depth, not a universal replacement for CSRF protection.
- `SameSite=None` cookies require `Secure`.
- CORS is a browser cross-origin policy, not authentication or authorization.
- Never commit real secrets, including in `.env.example`. Treat a committed secret as compromised and rotate/revoke it.
- Never log passwords, access/refresh tokens, secret keys, session identifiers, or full authorization headers.
- Rate limits must reflect abuse risk. Authentication/token endpoints normally need tighter limits than ordinary reads.
- Do not weaken an existing security control to make tests or local development easier without an explicit environment-scoped design.

## Reference routing

Read only when the condition matches:

- `references/authentication-jwt-refresh.md` — sign-in/register, password hashing, Passport/JWT strategy, access/refresh tokens, rotation, revocation, token validation.
- `references/authorization-ownership.md` — guards, ownership/BOLA, roles/permissions, admin actions, user-scoped queries.
- `references/cookies-csrf.md` — refresh/session cookies, HttpOnly/Secure/SameSite, cross-site browser requests, CSRF defense.
- `references/sensitive-data.md` — response fields, mass assignment/property-level authorization, logging, password/token/hash exposure.
- `references/secrets-config.md` — JWT/database/API secrets, `.env*`, CI/CD secrets, rotation/revocation, production configuration.
- `references/cors-rate-limits.md` — CORS allowlists/credentials, proxy-aware throttling, brute-force/resource-consumption controls.

## Delegate instead of expanding this skill

- Nest modules/providers/guards lifecycle mechanics → `nestjs-engineering`.
- Entities/FKs/migrations/unique constraints/query shape → `typeorm-postgres`.
- Security unit/integration/e2e implementation strategy → `backend-testing`.
- General TypeScript modeling → `typescript-engineering`.

## Completion checks

Before finishing a security-relevant change, verify:

- every non-public route still requires the intended authentication;
- every protected action has server-side authorization;
- user-owned queries cannot access another user's object by changing an ID;
- privileged identity/role/ownership fields do not come from untrusted input;
- responses contain only intended fields and no secrets/hashes;
- password and refresh-token storage remains non-plaintext;
- access/refresh JWT validation rules cannot be confused;
- cookie flags and CSRF model match the deployment origin model;
- CORS allows only intended browser origins and is not used as access control;
- changed secrets are not committed/logged and can be rotated/revoked;
- abuse-sensitive endpoints have appropriate throttling;
- task-relevant security tests/build pass.

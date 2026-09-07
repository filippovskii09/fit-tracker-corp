# Backend Authorization & Sensitive Data

Apply to all protected backend routes and user-owned resources.

## Authorization

* Authentication does not imply authorization.
* Every non-public route must have the intended server-side authentication/authorization.
* For user-owned resources, enforce ownership in the persistence predicate whenever possible:
  * prefer `{ id, userId: authenticatedUserId }`;
  * do not fetch by `id` alone and rely on client behavior or UUID secrecy.
* Never trust client-provided `userId`, `owner`, role, permission, tenant, or privileged flags when they should come from authenticated server context.
* Do not introduce RBAC when the real rule is simple ownership; add roles/permissions only when the product requires them.

## Sensitive data

* Never expose password hashes, refresh-token hashes, secrets, or internal security fields.
* Sensitive entity fields must remain non-selected by default where applicable.
* Passwords and refresh credentials must never be stored in plaintext.
* Preserve JWT access/refresh separation and refresh-token rotation semantics.

## Browser & transport controls

* Any browser endpoint authenticated by automatically sent cookies must be reviewed for CSRF.
* CORS is not authentication or authorization.

## Secrets

* Never commit real secrets, including in `.env.example`.
* Exposed secrets must be treated as compromised and rotated/revoked.

## General

Do not weaken auth, cookie, CSRF, CORS, or throttling controls merely to simplify implementation or tests.

For detailed security decisions, use `backend-security`.

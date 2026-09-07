# Cookies and CSRF

Load when changing refresh/session cookies, cookie flags, frontend/backend origin topology, or cookie-authenticated endpoints.

## Cookie flags

For authentication/session-like cookies, review deliberately:

- `HttpOnly` — prevents JavaScript access; use for credentials that JS does not need to read.
- `Secure` — cookie is sent only over HTTPS; required with `SameSite=None`.
- `SameSite` — controls cross-site sending behavior; choose from the actual deployment model.
- `Domain` — avoid widening scope across subdomains without a requirement.
- `Path` — narrow when useful, but do not treat `Path` as a security boundary.

Production security settings should not be silently weakened because localhost has different transport/origin behavior. Use explicit environment-specific configuration.

## CSRF decision

Ask: will the browser automatically attach a credential to this state-changing request?

If yes, the endpoint is in the CSRF threat model.

This includes session cookies and refresh-token cookies, even if access tokens elsewhere are sent manually as bearer headers.

`HttpOnly` protects against JavaScript reading a cookie; it does not prevent the browser from sending that cookie in a forged request.

## SameSite

Treat SameSite as defense in depth.

- `Strict` provides stronger cross-site restrictions but can affect UX.
- `Lax` permits some top-level navigation cases.
- `None` enables cross-site cookie use and requires `Secure`.

If the architecture requires `SameSite=None`, do not claim SameSite solves CSRF. Add an explicit CSRF design appropriate to the application.

## CSRF defenses

For cookie-authenticated browser mutations, use a deliberate defense such as:

- synchronizer token;
- properly implemented signed double-submit token;
- custom request-header strategy combined with a strict CORS policy where applicable;
- origin/referer verification as defense in depth.

Use Nest-compatible CSRF middleware only when it fits the chosen model; do not add middleware without understanding token storage and frontend contract.

Never allow state-changing behavior on GET.

## CORS relationship

CORS and CSRF are different controls.

A strict CORS allowlist can support some CSRF designs, but CORS itself does not replace authorization and should not be treated as the only CSRF control for a cookie-authenticated endpoint.

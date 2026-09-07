# CORS and rate limiting

Load when changing allowed origins, credentials, proxy deployment, throttling, login/refresh limits, or expensive endpoints.

## CORS

CORS controls which browser origins may read/use cross-origin responses. It is not authentication, authorization, or a server-to-server access boundary.

Prefer an explicit allowlist of trusted frontend origins.

Do not:

- reflect arbitrary `Origin` values;
- use `*` for credentialed browser requests;
- broaden origins merely to hide a deployment/configuration problem;
- assume a blocked CORS response means an unauthorized request could not reach the server.

When `credentials: true` is required, verify:

- allowed origins are explicit;
- cookie `SameSite`/`Secure` settings match the topology;
- CSRF threat model is handled separately.

## Rate limiting

Use rate limiting to reduce abuse and resource exhaustion, not as a substitute for authentication/authorization.

Apply tighter limits to high-risk operations such as:

- sign-in;
- register when abuse-prone;
- refresh/token issuance;
- password reset/recovery;
- expensive mutation/search/export endpoints.

Do not automatically reuse one global limit for every endpoint if abuse cost differs materially.

## Identity for throttling

IP-based throttling is useful but imperfect:

- many users can share one IP;
- attackers can distribute traffic;
- reverse proxies can hide the real client IP.

If deployed behind a proxy/load balancer, configure trusted proxy handling deliberately so the limiter uses the intended client address. Do not blindly trust spoofable forwarding headers from arbitrary sources.

For authenticated abuse-sensitive operations, user/account-aware limits may complement IP limits when the product needs them.

## Resource consumption

Rate limits are only one control.

Also bound attacker-controlled resource dimensions where relevant:

- page size;
- payload/body size;
- nested array size;
- upload size;
- batch size;
- query complexity;
- expensive password-hash/token operations.

Do not let a request choose an unbounded amount of CPU, memory, DB work, or response data.

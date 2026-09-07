# Auth, authorization, and validation tests

Load when authentication, refresh/cookies, protected routes, ownership/permissions, or DTO validation changes.

This file defines test shape. Security policy belongs in `backend-security`.

## Authentication

For protected routes, cover relevant cases through the real boundary:

- valid token succeeds;
- missing token fails;
- malformed/invalid-signature token fails;
- expired token fails.

Do not prove JWT guard behavior solely by unit-testing the strategy.

## Refresh flow

When refresh uses an HttpOnly cookie and server-side token state/hash, cover:

- valid refresh;
- missing cookie;
- invalid/expired refresh;
- hash/state mismatch;
- successful rotation;
- previous refresh reuse rejected when rotation policy requires it;
- expected `Set-Cookie` attributes.

Logout/revocation should prove server-side refresh state is invalidated.

## Ownership / BOLA

For every changed user-owned read/update/delete endpoint:

1. create a real resource for user A;
2. authenticate as user B;
3. request the real resource ID;
4. assert B cannot access/modify/delete it.

A nonexistent ID does not prove cross-user authorization.

Also cover the owner's success path.

## Role/permission authorization

When privileged capabilities exist, include:

- allowed principal succeeds;
- authenticated but insufficiently privileged principal fails;
- unauthenticated principal fails when non-public.

## Validation

If behavior relies on global `ValidationPipe`, exercise it through HTTP for representative cases:

- unknown fields with `forbidNonWhitelisted`;
- missing required fields;
- invalid enum/UUID/date/range;
- malformed nested objects/arrays;
- invalid nested elements;
- empty arrays when forbidden;
- transformation behavior where relevant.

Direct DTO construction or controller/service calls do not execute the global validation pipeline.

Avoid combinatorial duplication: cover each mechanism/risk plus feature-specific edge cases.

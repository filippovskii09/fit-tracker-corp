# Authorization and ownership

Load when changing protected routes, user-owned objects, roles/permissions, admin actions, or identity-scoped queries.

## Default posture

- Deny by default.
- Validate authorization on every request.
- Enforce access control server-side.
- Do not rely on UI visibility, route naming, UUID unpredictability, CORS, or client-provided ownership fields.

Authentication answers "who?". Authorization must still answer "may this principal perform this action on this resource?".

## Ownership / BOLA

Every endpoint that accesses an object identifier controlled by the caller is an object-authorization boundary.

For user-owned persistence in this project, prefer authorization in the query itself:

```ts
{ id: requestedId, userId: authenticatedUserId }
```

This is safer than:

1. query by id;
2. receive an object belonging to any user;
3. compare ownership afterward.

Keep the authenticated owner ID derived from trusted request context, not the body/query payload.

Do not consider UUIDs a BOLA mitigation. Unpredictable IDs reduce guessing but do not replace authorization.

## Not-found behavior

For user-owned resources, a scoped query that returns no row can often map to 404, avoiding disclosure of whether another user's object exists.

Do not first query globally merely to distinguish "exists but forbidden" unless the product/security contract requires that distinction.

## Function-level authorization

When roles/permissions/admin functions are introduced:

- deny by default;
- protect every privileged operation, regardless of URL naming;
- verify method/action as well as resource;
- do not rely on an `/admin` prefix as the authorization mechanism.

Keep policy easy to locate and review. Avoid scattering the same complex permission rule across many controllers/services.

## RBAC vs ownership/relationships

Do not introduce RBAC for a policy that is simply "the authenticated user owns this object".

Use roles/permissions when access depends on actual capabilities such as admin/trainer/support actions.

For richer policies, relationship/attribute checks may be more accurate than forcing every decision into a global role.

## Privilege-bearing input

Never accept these as authoritative from ordinary client input:

- current user ID;
- owner ID;
- role;
- permission;
- tenant/organization scope;
- privileged status flags.

Administrative reassignment is a separate privileged operation and must authorize the caller before applying requested values.

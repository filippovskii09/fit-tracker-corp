# Sensitive data and property-level authorization

Load when changing DTOs/entities/responses, user profile fields, logging, serialization, or writable object properties.

## Response exposure

Do not serialize an entity wholesale merely because most fields are safe.

Return only fields required by the API contract, especially for user/auth objects.

Never expose:

- password hashes;
- refresh-token hashes;
- access/refresh tokens except at the intentional issuance boundary;
- secret keys;
- internal security metadata not required by the client.

`select: false` is useful defense in depth for sensitive TypeORM columns, but explicitly selecting a field later can still expose it. Review the response boundary independently.

## Property-level authorization

A caller may be allowed to access an object without being allowed to read or modify every property on it.

For every update DTO, distinguish:

- client-writable fields;
- server-derived fields;
- privileged/admin-only fields;
- immutable fields.

Do not pass arbitrary request objects directly into entity update/save APIs.

The project's global `whitelist` + `forbidNonWhitelisted` validation helps prevent unexpected DTO properties, but the DTO itself must still expose only properties the caller is authorized to change.

## Identity and privilege fields

Ordinary self-service DTOs must not allow privilege-bearing fields such as:

- role;
- owner/user ID;
- permission flags;
- internal account status;
- token/hash fields.

If administrators can mutate them, expose a distinct authorized operation/DTO rather than reusing the ordinary user DTO blindly.

## Logs

Never log:

- plaintext passwords;
- password hashes;
- access or refresh tokens;
- authorization headers;
- cookie values containing credentials;
- signing/database/API secrets.

Prefer structured metadata such as request ID, user ID, route, status, and security event category instead of credential material.

Be careful when logging full request bodies, headers, exceptions, or configuration objects.

## URLs

Do not place passwords, API keys, bearer tokens, refresh/session credentials, or similarly sensitive values in URLs/query strings because URLs commonly propagate into logs/history/referrers.

# Trust Boundaries

TypeScript does not validate runtime data.

Treat data crossing an untrusted boundary as unknown until checked.

## Typical boundaries

- `fetch` / API responses;
- `JSON.parse`;
- localStorage/sessionStorage;
- URL/query parameters;
- postMessage;
- third-party SDKs;
- environment/config values.

## Flow

Prefer:

`unknown external value -> validation/narrowing -> trusted application type`

Use the project's established validation strategy.

## DTO and domain models

Keep API DTOs separate from domain models when they differ in naming,
serialization, nullability, normalization, derived fields, versioning, or
invariants.

Do not create mapping layers when the API shape already matches the application's
real model and no boundary benefit exists.

## Assertions

`value as DomainType` does not validate `value`.

Use an assertion only when the program has information the compiler cannot
represent or infer and the assertion is locally justified.

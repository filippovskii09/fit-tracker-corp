# Cascade writes

Load when saving/removing nested relation graphs or changing cascade settings.

## Default

Prefer explicit persistence.

Do not set `cascade: true` just to reduce service code.

TypeORM cascades can persist related objects that were only attached to an entity graph, making writes less explicit and increasing the chance of unintended inserts/updates/deletes.

## Enable only required operations

Prefer narrow cascade configuration:

- `cascade: ["insert"]` when new owned children are created with parent;
- `cascade: ["insert", "update"]` only when parent writes are intended to manage existing owned children too;
- remove/soft-remove cascades only when deletion ownership is explicit.

Avoid full `cascade: true` unless every enabled cascade behavior is intentional.

## Aggregate vs shared/catalog entity

Cascade is most defensible for true owned aggregate children whose lifecycle belongs to the parent.

Do not cascade-insert/update a shared/catalog entity merely because an object with its id appears in a DTO.

For references to existing shared entities, resolve/reference the existing row deliberately rather than allowing a nested payload to become a new catalog row.

## Delete cascade vs ORM cascade

Do not confuse:

- database FK `ON DELETE CASCADE`;
- TypeORM relation cascade operations.

They solve different problems and may behave differently depending on whether related entities are loaded.

Review both independently.

## Orphans

If parent updates can omit existing children, explicitly decide orphan behavior.

Never rely on default orphan handling without checking nullability and intended deletion semantics.

## Review nested save shape

For every cascade write, verify:

- which nested objects are new;
- which are references to existing rows;
- which may be updated;
- which may be deleted/orphaned;
- whether a malformed client payload could mutate data outside the intended aggregate.

Security/ownership policy belongs in `backend-security`, but cascade configuration must not undermine it.

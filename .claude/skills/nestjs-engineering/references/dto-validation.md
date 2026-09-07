# DTO and validation

Load when changing HTTP DTOs, body/query/param validation, nested payloads, or transforms.

## Runtime boundary

TypeScript types do not validate network input.

Use concrete DTO classes where Nest needs runtime metadata. Do not use an interface as the runtime validation contract.

For DTOs used in decorated controller parameters, avoid `import type` when Nest runtime metadata requires the class value.

## Preserve project-wide ValidationPipe semantics

The project already uses:

- `whitelist: true`;
- `forbidNonWhitelisted: true`;
- `transform: true`.

New DTOs must work correctly under these settings.

Implications:

- every accepted property needs validation metadata;
- unexpected properties are rejected;
- transformed values may differ from raw request strings.

## Validation placement

DTO validation should cover transport-shape constraints:

- required/optional fields;
- primitive format;
- UUID/enum/range constraints;
- nested object/array structure.

Business invariants that depend on persisted state belong in application/service logic, not solely in DTO decorators.

## Nested DTOs

For nested class validation, ensure runtime type metadata exists.

Typical array/object nesting requires the appropriate combination of:

- `@ValidateNested(...)`;
- `@Type(() => NestedDto)`;
- validators for the collection itself when size/emptiness/order constraints matter.

Do not assume nested validation happens because the TypeScript property type is declared.

## Params and query

Use Nest parse pipes where a route value has a simple explicit runtime type/format requirement, such as UUIDs or integers.

Use DTOs when several query/param fields form one validated transport contract.

## Updates

For PATCH/update DTOs, reuse existing mapped-type conventions where appropriate, but review semantic optionality separately. "Optional in PATCH" does not mean every value is valid when present.

## Sources

- NestJS Validation: https://docs.nestjs.com/techniques/validation
- NestJS Pipes: https://docs.nestjs.com/pipes
- NestJS Mapped types: https://docs.nestjs.com/openapi/mapped-types

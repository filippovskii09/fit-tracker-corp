# Error handling

Load when changing HTTP exceptions, exception filters, error translation, or response error shape.

## Defaults

For expected HTTP failures, prefer Nest's built-in `HttpException` subclasses such as:

- `BadRequestException`;
- `UnauthorizedException`;
- `ForbiddenException`;
- `NotFoundException`;
- `ConflictException`.

Do not create a custom exception class when a built-in exception already communicates the contract.

## Preserve unexpected failures

Do not wrap every call in try/catch just to throw `InternalServerErrorException`.

That pattern can:

- hide the original error type;
- lose useful stack/cause information;
- turn known failures into generic 500s.

Catch when you can meaningfully:

- recover;
- add context;
- translate a known infrastructure failure into an established application/HTTP error.

Database-specific error translation belongs primarily in the TypeORM/Postgres guidance.

## Exception filters

Nest already has a built-in global exception layer.

Add a custom filter only when there is a concrete cross-cutting requirement such as:

- a stable application-wide error envelope;
- consistent logging/context enrichment;
- translation of a defined family of exceptions.

Do not create route/controller filters for errors that can be expressed with standard Nest exceptions.

## Error contract

If the API has an established machine-readable error contract:

- preserve status semantics;
- preserve stable error identifiers;
- do not leak internal exception messages or stack traces.

If no such contract exists, do not invent a new global envelope as part of an unrelated feature.

## Sources

- NestJS Exception filters: https://docs.nestjs.com/exception-filters

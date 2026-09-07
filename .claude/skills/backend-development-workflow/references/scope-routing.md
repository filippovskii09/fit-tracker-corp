# Scope routing

Load when deciding whether to run backend, frontend, or full-stack workflow.

## Backend-only

Use `backend-development-workflow` when the task can be completed and accepted entirely through backend changes, such as:

- Nest API behavior;
- service/business logic;
- authentication/authorization backend logic;
- TypeORM/PostgreSQL persistence;
- migrations;
- backend tests;
- backend configuration/security behavior.

A frontend client may consume the API later; that does not make the current task full-stack if no frontend behavior is required now.

## Not backend-only

Return coordination to the calling feature runner when one acceptance criterion requires coordinated changes across both boundaries, for example:

- new/changed API contract plus immediate frontend consumption;
- frontend flow depends on a new auth/session behavior;
- backend validation/error shape and frontend behavior must change together;
- one OpenSpec task explicitly spans FE and BE.

Do not split a coupled requirement merely so backend and frontend agents can work independently.

## Frontend-only

Use the frontend workflow when backend contract/behavior is unchanged and only frontend implementation is required.

## Ambiguous scope

Inspect the approved artifacts and current contract before deciding.

Scope is determined by required behavior, not by which directories happen to be easiest to edit.

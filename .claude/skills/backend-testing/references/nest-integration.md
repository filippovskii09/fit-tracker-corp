# Nest integration tests

Load when several real Nest providers/modules must work together but full HTTP is not required.

## Goal

Use `Test.createTestingModule(...)` to prove DI/module/provider integration while keeping unrelated external systems replaceable.

Good targets:

- provider wiring across modules;
- custom provider/factory configuration;
- several real providers collaborating;
- module imports/exports/provider tokens.

## Rules

- Prefer importing the real feature/module under test when module wiring matters.
- Override only dependencies intentionally outside scope, such as an external API client.
- Do not override the provider whose wiring you are trying to verify.
- If every dependency is mocked, the test is effectively a unit test.
- Do not use this level as proof of route matching, global pipes, cookies, middleware, or HTTP status/headers.

Close initialized modules/apps/resources after the suite.

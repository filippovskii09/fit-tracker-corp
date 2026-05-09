# Common Agent Rules

These rules apply to all chats unless a chat-specific rules file overrides them.

Enforcement levels:
- MUST: mandatory; violating this is a failure.
- SHOULD: expected default; deviation must be justified.
- MAY: optional.

## Safety And Git Policy

- MUST NOT push to remote.
- MUST NOT create or resolve merge conflicts without explicit user approval.
- MUST NOT run destructive git commands such as `reset --hard`, `checkout --`, or force clean unless explicitly requested.
- MUST stop and report unexpected repository changes before continuing.
- MUST report any command that can modify remote state and ask approval first.

## Change Policy

- MUST keep changes minimal and task-focused.
- MUST avoid unrelated refactors.
- MUST preserve project conventions unless there is a strong, explained reason to improve them.
- SHOULD prefer consistency with the existing codebase over introducing new style patterns.

## Review And Reporting Policy

- MUST provide a concise summary after work with:
  - what changed,
  - what was validated,
  - residual risks,
  - rule deviations, if any, with explicit justification.
- MUST include file references when reporting findings.

## Quality Gate

- MUST pass local tests/lint relevant to changed files or explicitly state what could not be run.
- MUST keep changes CI-friendly and avoid local-only hacks.

## Rules Evolution

- MUST update centralized rules when reviewer feedback reveals a repeated issue.
- MUST classify each new rule as common or chat-specific.
- SHOULD keep rules concise, testable, and free of duplication.

## Import Ordering Rules

When organizing imports in JavaScript, TypeScript, and React files, follow this hierarchy:

1. Third-party libraries, for example `@edx/frontend-platform` or `react`.
2. Local custom setups/utils, for example `@setupTest`.
3. Generic project components/messages, for example `../../generic/...`.
4. Project-wide constants, for example `../../constants`.
5. Local module hooks and data, for example `./data/hooks`.
6. Local module components/messages, for example `./components/...`.
7. Local mock data, for example `./__mocks__/...`.
8. Local module constants, for example `./constants`.
9. Local module index/main file, for example `./messages`, `.`, or `./index`.

Additional import rules:
- MUST ensure the target component being tested, such as `import { Component } from '.'`, is the absolute last import in the file.
- MUST use `@` aliases, such as `@src/...`, when relative path nesting is `../../..` or deeper.
- MUST NOT insert blank lines between internal imports solely because some use aliases and others use relative paths; separate external imports from internal imports, then keep related internal imports together in the project order above.

## Variable Naming Rules

- MUST prefer domain meaning over technical shape.
- MUST keep names concise; target one to three meaningful words.
- MUST use stable, predictable patterns:
  - collections are plural, such as `assets`, `rows`, `tags`;
  - single items are singular, such as `asset`, `row`, `tag`;
  - booleans use `is*`, `has*`, `can*`, or `should*`;
  - handlers use `handle*`;
  - mocks and spies use a `mock*` prefix;
  - query helpers use purpose suffixes such as `queryConfig`, `firstCall`, or `requestPayload`.
- MUST avoid misleading or redundant naming such as `assetDataObjectValue`.
- MUST avoid unclear abbreviations such as `cfg`, `itm`, or `arr` unless standard and obvious.
- SHOULD avoid one-letter names except in tiny local scopes.
- MUST keep naming consistent within a file or module.
- SHOULD optimize test naming for readability with names such as `expectedPayload`, `actualPayload`, `firstAsset`, and `renderedRow`.
- MUST use existing project terms and constants where possible.

## Code Formatting And Readability Rules

- MUST split long `getByRole` or `findByRole` queries with options or long arguments into multiple lines.

```ts
expect(await screen.findByRole('checkbox', {
  name: new RegExp(DIGITAL_MARKETING_TAG.value, 'i'),
})).toBeInTheDocument();
```

- MUST avoid sentence-like variable names; split logic into helper variables/functions when a name becomes too long.
- SHOULD keep assertions and setup readable enough that the test intent is clear without reading implementation details.

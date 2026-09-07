# Proposal Review Checklist

## Goal

Confirm that the OpenSpec change solves the actual backlog task without dropping required behavior or introducing unrelated scope.

## Acceptance criteria

Map every backlog acceptance criterion to the OpenSpec artifacts.

Classify each as:

* `covered`
* `partial`
* `missing`

Any `missing` criterion prevents approval.

A `partial` criterion prevents approval when the missing portion materially affects expected behavior.

## Requirements

When `requirements.md` exists, verify:

* required user flows;
* behavioral rules;
* constraints;
* relevant edge cases;
* explicit out-of-scope boundaries.

Do not invent additional requirements.

## References

Inspect relevant declared references where available.

Check for material contradictions with:

* screenshots;
* prototypes;
* design descriptions;
* API notes;
* existing documented behavior.

Do not require pixel-level detail unless explicitly specified.

## Specs

Specs should define observable behavior sufficiently for implementation.

Look for:

* ambiguous behavior;
* missing states;
* contradictory requirements;
* unclear success/error behavior;
* missing rules that would force implementation to invent product behavior.

Specs should primarily define WHAT the system must do.

## Design

When `design.md` exists, verify that it:

* supports the specs;
* respects backlog constraints;
* addresses material technical decisions needed for implementation;
* does not introduce unsupported architecture or scope.

Do not demand architectural detail that the feature does not require.

## Tasks

Verify that `tasks.md`:

* covers all material implementation work;
* is actionable;
* includes relevant verification/testing work;
* respects required sequencing;
* does not add unrelated work.

Do not require one task per component, file, endpoint, or implementation action.

## Cross-artifact consistency

Check consistency across:

```text
backlog
↕
proposal
↕
specs
↕
design
↕
tasks
```

Blocking examples:

* backlog requires X but specs omit X;
* spec requires X while design describes Y;
* proposal describes frontend-only work while tasks add unrelated backend scope;
* backlog requires reuse while design proposes replacing the subsystem;
* behavior exists in proposal prose but never reaches specs/tasks.

## Implementation readiness

Use this test:

> Can the implementation workflow start without inventing a material product decision?

If no, return `REQUEST_CHANGES`.

Minor engineering choices may remain unresolved.

## Severity

Use only:

* `blocking`
* `warning`

A blocking finding prevents `APPROVE`.

A warning records a useful non-blocking observation.

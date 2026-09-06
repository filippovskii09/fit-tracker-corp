---
name: frontend-development-workflow
description: >
  Orchestrate a frontend development change through implementation,
  deterministic verification, independent review, optional specialist review,
  one bounded fix round, scoped re-review, and human handoff.
  Use for meaningful frontend features, bug fixes, refactors, and behavior changes.
---

# Frontend Development Workflow

Orchestrate the lifecycle of a frontend change.

This skill owns coordination only.

It does not contain React, TypeScript, accessibility, testing, architecture,
performance, or other frontend engineering standards.

Those belong to repository-local rules, skills, agents, and deterministic gates.

## Workflow

```text
task
→ implement
→ verify
→ full review
→ optional specialists
→ classify findings
→ one fix round
→ verify
→ scoped re-review
→ human
```

There is at most one automatic fix round.

## Entry conditions

Use this workflow for meaningful frontend development such as:

- new frontend behavior;
- bug fixes;
- component or hook changes;
- state or data-flow changes;
- API integration;
- frontend refactors;
- multi-file frontend changes.

Do not use it as the default entry point for:

- test-only review → use `test-review-workflow`;
- review-only requests → use `fe-reviewer`;
- research or explanation;
- trivial formatting or mechanical edits that do not justify the full pipeline.

## Project-first routing

Prefer repository-local instructions, skills, agents, and workflows.

When an equivalent project-local resource exists, do not substitute a
user-level, global, or plugin equivalent.

## Workflow state

Preserve only the information required to coordinate the workflow:

- original task;
- acceptance criteria, when available;
- explicit constraints and non-goals;
- target scope, when known;
- relevant pre-existing working-tree state;
- implementer result;
- reviewer findings;
- specialist findings;
- fix result;
- scoped re-review result.

Do not copy large source files, diffs, command logs, or subagent exploration
history into orchestration handoffs when the next agent can inspect the
repository directly.

## 1. Implementation

Invoke the project-local `fe-implementer` in implementation mode.

Pass:

- original task;
- acceptance criteria;
- explicit constraints / non-goals;
- target scope when known.

Do not duplicate frontend engineering rules in the delegation.

The implementer is responsible for:

- repository inspection;
- dynamic project-skill routing;
- implementation;
- relevant tests;
- implementation-time verification;
- `IMPLEMENTATION_RESULT`.

### Implementation result

Continue only when:

```text
status: READY_FOR_REVIEW
```

If the implementer returns:

```text
status: BLOCKED
```

stop automatic execution and return the blocker to the user.

## 2. Verification checkpoint

`VERIFY` is a workflow checkpoint, not a separate agent.

The implementer owns execution of the relevant deterministic checks.

The workflow verifies that the implementation result contains sufficient
verification for the changed scope and that required relevant checks passed.

Relevant verification may include, according to repository policy and changed
scope:

- targeted tests;
- lint;
- typecheck;
- build;
- runtime/UI verification;
- other project-defined gates.

Do not hardcode universal commands in this workflow.

Use repository-defined commands and verification abstractions.

If required verification:

- failed;
- was skipped without justification;
- or cannot be completed;

stop before review and report the problem.

Do not treat passing verification as proof that the implementation is correct.
Independent review is still required.

## 3. Full independent review

Invoke a NEW project-local `fe-reviewer` in full-review mode.

Pass:

- original task;
- acceptance criteria;
- target/change scope.

Do not pass implementer reasoning as review truth.

The reviewer must inspect the actual repository state and diff independently.

Receive:

```text
FRONTEND_REVIEW_RESULT
```

## 4. Optional specialist routing

Read `specialist_signals` from `FRONTEND_REVIEW_RESULT`.

The reviewer only signals specialists.
The workflow decides whether to invoke them.

Invoke a specialist only when:

1. the reviewer explicitly signals that deeper review is required;
2. an appropriate project-local specialist exists;
3. the specialist adds review depth not already provided by the general reviewer.

Examples:

```text
testing       → test-reviewer
accessibility → a11y-reviewer
```

Do not invent or substitute a specialist that does not exist.

Do not invoke the entire `test-review-workflow` from inside this workflow.
If deeper test review is required, invoke the project-local `test-reviewer`
directly.

Do not automatically run every specialist on every frontend change.

### Specialist unavailable

If a required specialist does not exist:

- preserve the reviewer signal;
- do not pretend specialist review occurred;
- return the unresolved specialist requirement to the user when it materially
  affects confidence or approval.

## 5. Aggregate findings

Preserve finding IDs and technical meaning.

Examples:

```text
FR-1
FR-2
TR-1
```

Do not renumber findings or rewrite them into new findings.

Separate:

- automatic remediation candidates;
- human decisions;
- open questions;
- non-blocking observations;
- unavailable specialist requirements.

## 6. Automatic fix eligibility

Automatically remediate only findings that are both:

```text
blocking: true
disposition: auto-fix
```

Do not automatically remediate:

- `human-decision` findings;
- open questions;
- speculative issues;
- non-blocking polish;
- unavailable-specialist concerns.

If no automatic remediation findings remain:

- do not invoke fix mode;
- proceed directly to final human handoff.

If a blocking finding requires human judgment, stop automatic execution.

## 7. Fix mode

Invoke the original `fe-implementer` in bounded fix mode when practical.

If continuation of the original implementer context is unavailable, invoke a
fresh `frontend-implementer` in fix mode.

Pass only:

- original task and relevant acceptance criteria;
- exact findings selected for automatic remediation;
- fix round: `1`.

Do not pass unrelated reviewer observations.

The supplied finding IDs define the remediation scope.

The implementer returns:

```text
FIX_RESULT
```

Do not allow a second automatic fix round.

## 8. Post-fix verification checkpoint

Before re-review, require successful relevant verification from `FIX_RESULT`.

The same principles as the initial verification checkpoint apply:

- use affected/repository-defined gates;
- do not duplicate commands unnecessarily;
- do not hide failures;
- do not continue when remediation-caused required checks fail.

If verification cannot establish a safe result, stop and return control to the
user.

## 9. Scoped re-review

Invoke a NEW `fe-reviewer` instance in scoped re-review mode.

Do not resume the initial reviewer.

Pass:

- original task / relevant acceptance criteria;
- previous frontend findings included in the fix round;
- relevant specialist findings included in the fix round;
- `FIX_RESULT`;
- fix round: `1`.

The re-review must verify:

1. whether each supplied finding is resolved;
2. the remediation diff;
3. relevant verification;
4. whether remediation introduced a concrete Critical/High regression.

It must not perform another full feature review.

Receive:

```text
SCOPED_RE_REVIEW_RESULT
```

## 10. Specialist re-verification

If a specialist produced a blocking finding that was included in the fix round,
re-invoke that same project-local specialist only when its independent
verification is required to establish resolution.

Do not rerun unrelated specialists.

If the specialist does not support appropriate scoped verification, surface
that limitation to the user rather than pretending the finding is independently
closed.

## 11. Stop conditions

### Successful completion

Stop automatic execution when:

- full review has no blocking findings; or
- the single fix round completes and scoped re-review is clean.

### Human handoff

Stop and return control to the user when any of these occurs:

- implementer is blocked;
- reviewer is blocked;
- required verification fails or cannot be completed;
- a blocking finding requires `human-decision`;
- required behavior cannot be established;
- a required specialist is unavailable;
- scoped re-review returns `STILL_OPEN`;
- scoped re-review returns `NEEDS_HUMAN_DECISION`;
- remediation introduces a new Critical/High regression.

Never start a second automatic fix round.

## Context discipline

Keep orchestration handoffs minimal.

### Workflow → Implementer

Pass:

- task;
- AC;
- explicit constraints;
- target.

### Implementer → Workflow

Keep:

- `IMPLEMENTATION_RESULT`.

### Workflow → Full Reviewer

Pass:

- task;
- AC;
- current target.

### Reviewer / Specialists → Workflow

Keep:

- structured findings and specialist signals.

### Workflow → Fix Mode

Pass:

- task / relevant AC;
- selected finding IDs and their structured findings;
- fix round.

### Fix Mode → Workflow

Keep:

- `FIX_RESULT`.

### Workflow → Scoped Re-review

Pass:

- prior findings being verified;
- fix scope / `FIX_RESULT`;
- relevant task contract.

Do not pass:

- full subagent transcripts;
- exploration logs;
- chain-of-thought;
- large copied diffs;
- duplicated frontend standards.

## Final output

Return a concise human-facing summary containing:

- implementation outcome;
- files changed;
- verification status;
- initial review verdict;
- specialists invoked, if any;
- findings automatically fixed;
- scoped re-review result;
- unresolved findings;
- human decisions or specialist limitations still required.

Do not expose internal orchestration logs unless the user asks for them.

Do not claim the change is fully approved when unresolved blocking findings,
failed required verification, or required human decisions remain.

## Available specialists:

- testing → `test-reviewer`
- accessibility → `accessibility-reviewer`

For other specialist signals, do not invent an agent.
Return the requirement to the user if no project-local specialist exists.


Do not treat every `fail` as an implementation failure.

Continue only when every required failing check is classified with evidence as
`pre-existing` or `environment`.

Stop on `introduced` or `unknown` required failures.

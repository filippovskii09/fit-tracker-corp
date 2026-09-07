---
name: backend-development-workflow
description: Orchestrate implementation and independent review of an approved backend NestJS/TypeORM/PostgreSQL task using the be-implementer and be-reviewer subagents. Use after requirements are defined for backend-only work, including OpenSpec apply tasks. Do not use for planning, proposal creation, frontend-only work, or mixed full-stack implementation.
---

# Backend Development Workflow

Execute an approved backend task through isolated implementation and independent review.

This skill orchestrates agents. It does not duplicate NestJS, database, security, testing, or TypeScript guidance.

```
approved task / OpenSpec
        ↓
scope check
        ↓
be-implementer (Sonnet Medium)
        ↓
be-reviewer (Opus Medium)
        ↓
CHANGES_REQUIRED → implementer fix → re-review
        ↓
APPROVE
        ↓
mark OpenSpec task complete
```

## Preconditions

Start only when the required behavior is already defined by one of:

- an OpenSpec change/task;
- explicit acceptance criteria;
- a sufficiently precise delegated backend task.

If requirements require product/design decisions, return to planning/update rather than inventing behavior.

If the task materially changes both frontend and backend, return the shared contract to the calling feature runner, which coordinates both existing workflows.

## Workflow

### 1. Resolve the source of truth

For OpenSpec work:

- identify the change;
- read its apply context/instructions and relevant artifacts;
- identify the next pending backend task(s);
- preserve the artifact requirements exactly.

Do not run another implementation workflow that competes with this one.

For a direct task, use the user's task/acceptance criteria plus repository rules as the source of truth.

See `references/openspec-integration.md`.

### 2. Establish backend scope

Inspect only enough repository context to create a precise delegation:

- affected backend feature/module;
- relevant API/data/security boundary;
- existing tests;
- current working-tree changes.

Do not pre-solve the implementation. The implementer owns code investigation.

If unrelated user changes exist, include that fact in the delegation and require them to be preserved.

See `references/scope-routing.md`.

### 3. Delegate implementation

Invoke `be-implementer`.

Pass a self-contained task containing:

- exact task/change identifier;
- acceptance criteria;
- relevant OpenSpec artifact paths when applicable;
- backend-only scope boundary;
- known constraints from the current task;
- instruction to preserve unrelated working-tree changes.

Do not tell the implementer how to code the solution unless the spec/design already requires it.

Wait for its result before review.

See `references/delegation-contract.md`.

### 4. Delegate independent review

After implementation, invoke `be-reviewer` in a fresh isolated subagent context.

Pass:

- the same task/spec/acceptance criteria;
- the implementation result;
- instruction to inspect the actual current diff rather than trust the implementer's summary.

The reviewer owns the merge-quality decision.

### 5. Resolve findings

If reviewer returns `APPROVE`:

- proceed to workflow completion.

If reviewer returns `CHANGES_REQUIRED`:

- send only actionable reviewer findings back to `be-implementer`;
- require the implementer to inspect and fix the actual code, not merely satisfy wording;
- invoke `be-reviewer` again against the updated diff.

Maximum normal loop:

`implement → review → fix → re-review`

Allow one additional fix/re-review round only when the second review finds a new concrete defect introduced by the fix.

Do not enter an unbounded reviewer/implementer loop.

If a finding cannot be resolved without changing requirements/design, stop as `BLOCKED` and return to OpenSpec update/planning.

See `references/review-loop.md`.

### 6. Complete task state

For OpenSpec:

- mark a task complete only after its implementation is present and the final backend review is `APPROVE`;
- do not mark blocked or partially implemented tasks complete;
- do not edit proposal/spec/design as part of implementation;
- if implementation exposes a requirements/design defect, update the OpenSpec artifacts through the appropriate planning/update workflow before continuing.

For direct tasks, completion means the final review is `APPROVE`.

### 7. Final verification

Do not duplicate every check already run by both agents.

Confirm from their reports that the relevant checks ran and passed.
When full backend tests are required, use `npm run test --prefix backend -- --runInBand`
from the repository root; this is the canonical unattended command.

Run an additional parent-level command only when:

- repository workflow explicitly requires it;
- agent reports conflict/missing verification;
- the final fix changed behavior after the last relevant check;
- one command provides necessary end-to-end confidence not covered by either agent.

Never hide known failing checks.

## Agent boundaries

### be-implementer

Owns:

- code investigation;
- source changes;
- migrations when required;
- task-relevant tests;
- implementation verification;
- fixes requested by review.

Does not own:

- final review verdict;
- requirements/design changes.

### be-reviewer

Owns:

- independent diff/spec review;
- correctness/security/data-integrity/test-adequacy findings;
- non-destructive verification;
- `APPROVE` / `CHANGES_REQUIRED`.

Does not own:

- source edits;
- architecture redesign;
- speculative improvements.

### Orchestrator

Owns:

- source-of-truth selection;
- backend/full-stack boundary;
- delegation;
- review/fix loop;
- OpenSpec task completion state;
- final status.

Do not implement source code in the orchestrator when `be-implementer` can do it.

## Stop conditions

Return `BLOCKED` instead of guessing when:

- acceptance criteria materially conflict;
- required design/product behavior is absent;
- security/data-integrity requirements conflict with the requested implementation;
- implementation requires frontend changes outside a backend-only task;
- reviewer identifies a defect that requires changing approved requirements/design;
- repository/infrastructure prevents meaningful verification.

## Return contract

Return only:

```
STATUS: COMPLETED | PARTIAL | BLOCKED

TASKS
- completed task/change identifiers

REVIEW
- final verdict
- unresolved findings only, if any

VERIFIED
- final relevant checks

BLOCKERS
- only when present
```

Do not repeat implementation details already captured by the implementer unless needed to explain status.

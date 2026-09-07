# OpenSpec integration

Load when the workflow executes an OpenSpec change/task.

## Role of OpenSpec

OpenSpec artifacts define the approved change:

- `proposal.md` — why;
- `specs/**/spec.md` — required behavior;
- `design.md` — technical decisions when present;
- `tasks.md` — implementation checklist.

Implementation starts only when apply requirements are ready.

## Read apply state

Use the current OpenSpec apply context/instructions to determine:

- context files;
- current task progress;
- pending tasks;
- blocked/ready state;
- operation guidance configured by the project.

Do not create a second competing planning source inside this workflow.

## Task ownership

This workflow orchestrates backend execution; OpenSpec remains the durable task state.

Mark a backend task complete only after:

- implementation exists;
- required tests/checks have passed sufficiently;
- `be-reviewer` returns `APPROVE`.

If review requires a normal code fix, keep the same task and run the fix loop.

If review exposes an incorrect/missing requirement or design decision, stop implementation and update OpenSpec through its update/planning workflow.

Do not silently rewrite:

- proposal;
- specs;
- design

during implementation.

## Scope

When one OpenSpec change contains both frontend and backend tasks, this backend workflow may execute only clearly separable backend tasks.

If one task itself requires coordinated frontend + backend behavior, use the full-stack workflow instead of splitting it artificially.

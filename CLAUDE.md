# Repository Instructions

This is a monorepo with independent frontend and backend application boundaries.

## Scope routing

Classify implementation work before editing:

* frontend-only → use `frontend-development-workflow`;
* backend-only → use `backend-development-workflow`;
* frontend + backend → resolve the shared contract/spec first, then coordinate both workflows from the main context.

Do not load backend implementation guidance for frontend-only work, or frontend implementation guidance for backend-only work.

For OpenSpec proposal/exploration/update/apply/archive work, use the corresponding `openspec-*` skill. Approved specs/tasks are the source of truth for implementation behavior.

## Workflow ownership

* Development workflows own implementation/review orchestration.
* Do not bypass a development workflow by directly invoking its implementer/reviewer agents unless the user explicitly requests implementation-only or review-only work.
* Do not run a second competing implementation workflow for the same task.
* A reviewer must inspect the actual diff/spec independently; an implementer summary is not proof of correctness.
* Mark an OpenSpec task complete only after the required implementation and review gate are complete.

## Repository scope

* Keep changes inside the requested application boundary unless the requirement genuinely crosses boundaries.
* Do not perform unrelated refactors, dependency upgrades, file moves, or formatting sweeps.
* Inspect `git status` before edits and preserve unrelated user changes.
* Do not commit, push, merge, or create a PR unless explicitly requested.
* Use the package/workspace commands for the application being changed.

## Context discipline

* `CLAUDE.md` contains only instructions needed broadly.
* Path-specific invariants belong in `.claude/rules/`.
* Detailed engineering guidance and multi-step procedures belong in skills.
* Do not eagerly read skill references; load only references relevant to the task.
* Nested application `CLAUDE.md` files provide application-specific context when that subtree is accessed.

## AI workflow layer

`.agents` is the canonical AI workflow layer for this repository. Durable cross-tool rules belong there; keep this file a thin Claude-oriented adapter.

# Delegation contract

Load when constructing prompts for `be-implementer` or `be-reviewer`.

## Why delegate

Claude Code subagents run in isolated context windows and return results to the parent. Use that isolation to separate implementation from review.

Subagents cannot spawn other subagents, so the parent workflow must coordinate the chain.

## Implementer delegation

Provide only information needed to execute the task:

- task/change ID;
- acceptance criteria;
- relevant spec/design/task paths;
- scope boundary;
- known repository constraint that is not already in `CLAUDE.md`;
- existing working-tree changes that must be preserved.

Do not paste full skill content. `be-implementer` preloads its engineering skills and receives `CLAUDE.md`.

Do not pre-decide low-level implementation unless the approved design requires it.

A good delegation describes behavior and constraints, not a patch.

## Reviewer delegation

Always give the reviewer the original source of truth, not only the implementer's summary.

Require it to inspect:

- current diff;
- relevant surrounding code;
- relevant tests/checks.

The implementer's report is useful navigation context but is not evidence of correctness.

## Fresh context

Implementation and review must be separate subagent invocations. Do not reuse implementation reasoning as the review authority.

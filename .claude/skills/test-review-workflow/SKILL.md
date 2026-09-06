---
name: test-review-workflow
description: >
  Orchestrate independent frontend test review, safe automatic fixes,
  verification, and fresh post-fix re-review. Use as the default entry point
  when the user asks to review, check, audit, or improve existing frontend tests.
---

# Test Review Workflow

Orchestrate test review through the project-local `test-reviewer` and
`test-fixer` agents.

This skill owns orchestration only.

Do not perform detailed test review or implementation yourself.

## Workflow

1. Delegate the initial review to `test-reviewer`.
2. Receive its `REVIEW_RESULT`.
3. If the review is clean, stop.
4. Separate `auto-fix` findings from `human-decision` findings.
5. If actionable `auto-fix` findings exist, delegate them to `test-fixer`.
6. Require successful targeted verification from the fixer.
7. After successful verification, invoke a NEW `test-reviewer` instance to
   independently review the current code.
8. Return the final result to the user.

Do not create an autonomous review/fix loop.

## Initial reviewer delegation

Invoke the project-local `test-reviewer`.

Pass only:

- target test file(s) or diff;
- the user's original review objective;
- acceptance criteria explicitly supplied by the user, when relevant.

Example delegation:

```text
Independently review the current tests for:

TARGET:
{target}

OBJECTIVE:
{original user intent}

Inspect the related production behavior and repository test infrastructure.

Return REVIEW_RESULT according to your agent contract.
Do not implement fixes.
```

Do not duplicate testing rules in the delegation prompt.

The reviewer already has the required project testing skills preloaded.

## Handle REVIEW_RESULT

Preserve reviewer findings without rewriting their technical meaning.

### Clean review

If the reviewer returns:

```text
status: clean
```

stop the workflow.

Do not invoke `test-fixer`.

### Human decisions

Do not automatically fix findings marked:

```text
disposition: human-decision
```

Preserve them for the final user result.

### Automatic fixes

Only findings marked:

```text
disposition: auto-fix
```

may be delegated to `test-fixer`.

Do not invent additional findings.

Do not broaden the scope of existing findings.

## Fixer delegation

Invoke the project-local `test-fixer` with a fresh context.

Pass only:

- target files;
- original user objective;
- actionable reviewer findings, including their IDs.

Do not pass:

- reviewer exploration logs;
- full reviewer transcript;
- unrelated observations;
- copied source files when the fixer can inspect them directly.

Example delegation:

```text
Fix the confirmed findings below.

TARGET:
{target}

ORIGINAL OBJECTIVE:
{original user intent}

FINDINGS:
{auto-fix findings from REVIEW_RESULT}

Fix only these finding IDs.

Validate each finding against the current code before editing.
Make the smallest maintainable changes.
Run targeted verification.

Return FIX_RESULT according to your agent contract.
```

## Verification gate

Continue to final review only when the fixer reports successful relevant
verification.

Verification should prefer the narrowest deterministic commands that provide
sufficient confidence for the changed scope.

If verification:

- fails;
- cannot be run;
- exposes a new blocking problem;
- or the fixer returns `blocked`;

stop automatic execution.

Do not:

- hide verification failures;
- weaken tests to make verification pass;
- repeatedly invoke the fixer until tests happen to pass;
- expand into unrelated fixes.

Report the blocked or failed state to the user.

## Fresh final review

After successful fixes and verification, invoke `test-reviewer` again as a NEW
subagent instance.

Do not resume the original reviewer.

The final reviewer must independently inspect the current repository state.

Do not pass:

- the original `REVIEW_RESULT`;
- the `FIX_RESULT`;
- previous reviewer conclusions;
- explanations defending the fixes;
- implementation reasoning from the fixer.

Pass only:

- the current target;
- the original user objective;
- explicit acceptance criteria supplied by the user when still relevant.

Example delegation:

```text
Independently review the CURRENT state of:

TARGET:
{target}

OBJECTIVE:
{original user intent}

Review the current implementation from scratch.

Do not assume previous changes or decisions are correct.

Inspect related production behavior and repository test infrastructure.

Return REVIEW_RESULT according to your agent contract.
Do not implement fixes.
```

## Final-review handling

If the fresh reviewer returns:

```text
status: clean
```

the automated workflow is complete.

If the fresh reviewer returns findings:

- do not automatically start another fix cycle;
- preserve the findings;
- return them to the user.

The user decides whether another iteration is justified.

## Context discipline

Keep every handoff minimal and high-signal.

### Reviewer → orchestrator

Keep:

- `REVIEW_RESULT`.

Do not reproduce the reviewer's exploration context.

### Orchestrator → fixer

Pass:

- target;
- original objective;
- actionable findings only.

### Fixer → orchestrator

Keep:

- `FIX_RESULT`.

### Orchestrator → final reviewer

Pass:

- target;
- original objective;
- relevant explicit acceptance criteria only.

Do not copy source files, large diffs, command logs, or complete subagent
transcripts into handoff prompts when the next agent can inspect the current
repository directly.

## Scope discipline

The workflow is for existing frontend test review.

Do not automatically trigger it for:

- writing tests from scratch;
- trivial formatting-only test changes;
- unrelated production-code review;
- general architecture review.

If the requested task is not primarily a test-review task, use the appropriate
project workflow instead.

## Orchestrator boundary

The main Claude session acts as coordinator.

It may:

- identify the target;
- invoke the project agents;
- forward structured results;
- enforce workflow stop conditions;
- summarize the final outcome.

It must not:

- replace the independent reviewer with its own deep review;
- silently add findings;
- silently reinterpret reviewer findings;
- perform the fix itself when `test-fixer` is available;
- continue autonomous review/fix cycles indefinitely.

## Stop conditions

Stop immediately when any of these is true:

1. Initial review is clean.
2. Findings exist but none are safe `auto-fix`.
3. Fixer is blocked.
4. Required verification fails or cannot be completed.
5. Fresh final review is clean.
6. Fresh final review finds remaining issues.

There is at most one automatic:

```text
review → fix → fresh review
```

cycle.

## Final output

Return a concise result containing:

- initial important findings;
- findings fixed;
- files changed;
- verification commands and results;
- final review status;
- unresolved `human-decision` findings;
- remaining findings from the fresh review, if any.

Do not include internal orchestration logs, full subagent transcripts, or
exploration details unless the user explicitly asks for them.

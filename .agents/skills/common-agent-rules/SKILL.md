---
name: common-agent-rules
description: Use for any code task in this repo to enforce common agent safety, git policy, minimal diffs, reporting, quality gates, import ordering, naming, and readability. Applies unless a more specific skill overrides it.
---

# Common Agent Rules

Use this skill for all development, review, and testing work unless a chat-specific skill overrides a rule.

## Rule Files

Read and follow:

1. [`rules/common.md`](rules/common.md)

## Required Workflow

1. Keep changes minimal and task-focused.
2. Preserve project conventions.
3. Avoid remote-changing and destructive operations without explicit approval.
4. Validate relevant tests/lint where practical.
5. Report changed files, validation, residual risks, and any justified rule deviations.

---
name: investigation-task
description: Use for investigation-only tasks, issue analysis, architecture research, and recommendations before implementation in this repository.
---

# Investigation Task

Use this skill when the user asks to research, analyze, compare approaches, prepare an issue, or explain what should change before implementation.

## Rules

1. Do not edit files unless the user explicitly changes the task from investigation to implementation.
2. Start from repository facts: code, tests, docs, config, existing rules, and current git state.
3. Prefer the existing source of truth over new abstractions.
4. Separate facts, inferences, options, and recommendations.
5. Cite external sources when they influence the recommendation.
6. Call out security, auth, database, env, migration, and data-loss risks explicitly.

## Workflow

1. Define the goal in one or two sentences.
2. Identify the affected domain, runtime entrypoint, and files to inspect.
3. Search for existing implementations, tests, docs, routes, DTOs, services, query keys, config, and constants.
4. Identify the source of truth and any competing sources.
5. Describe current behavior.
6. Describe architecture impact and risk level.
7. Compare options, including the minimal viable change.
8. Recommend one path with reasoning.
9. Provide a validation plan.
10. List open questions only when they block safe progress.

## Report Template

```md
## Goal

<What question this investigation answers.>

## Current Behavior

<What the repository does today, with file references.>

## Source Of Truth

<Canonical files, services, DTOs, config, docs, or rules.>

## Architecture Impact

<Boundaries touched and risk level.>

## Options

1. <Option, tradeoff, risk.>
2. <Option, tradeoff, risk.>

## Recommendation

<Preferred path and why.>

## Validation Plan

<Tests, lint, manual checks, docs checks, or CI checks.>

## Risks

<Residual risks and mitigation.>

## Sources

<Repository files and external links.>
```

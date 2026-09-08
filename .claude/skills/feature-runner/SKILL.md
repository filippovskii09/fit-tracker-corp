---
name: feature-runner
description: Execute exactly one backlog feature delegated by the deterministic backlog runner, with task_id and base_branch.
disable-model-invocation: true
---

## Arguments

Arguments: `$ARGUMENTS`. If they are exactly `--preflight`, execute only the
preflight below and stop. Otherwise require `task_id` and `base_branch` and
follow the normal execution section.

## Non-mutating preflight

This branch must be entered through `/feature-runner --preflight`; reading this
file or describing the skill is not a successful invocation.

Use only Read, Glob and Grep. Do not invoke dependent skills or agents, execute
shell commands, write/edit files, checkpoint the backlog, create/switch branches,
create OpenSpec changes, implement anything, commit, push, or create PRs.
Do not execute the normal pipeline, even if a dependency is missing.

1. Read `scripts/backlog-orchestrator.mjs` and use its `REQUIRED_FILES` list as
   the authoritative required project configuration/dependency inventory.
2. Read every required file, expanding the agent-name list in `REQUIRED_FILES`.
   Validate JSON/YAML configuration is readable and well formed, project
   permissions use `dontAsk`, and each skill/agent has a valid named YAML header.
3. Check required dependent skills are in Claude Code's available skills.
   Discover required leaf agents under `.claude/agents/` and validate their
   declared names against the required agent names. Agent execution is disabled
   during this read-only check. The feature-runner skill itself is explicitly
   invoked (and may be hidden from model discovery). This skill owns the
   feature pipeline and completion contract; no separate runner agent is required.
4. Follow the required agents' `skills` frontmatter dependencies and skill
   reference paths; verify those files are readable and the skills discoverable.
   Missing, malformed, inaccessible, or undiscoverable dependencies fail this check.

The orchestrator supplies `--json-schema`. On success submit the structured
output object `{"status":"PRECHECK_OK","skill":"feature-runner"}` through
Claude's structured output mechanism. Do not serialize it as YAML, a markdown
fence, or a text-only completion. The caller reads only `structured_output`.

On any failed check, stop and report the concrete failure. Never submit
`PRECHECK_OK` to satisfy the schema when a dependency or check failed. An absent
structured contract or unsuccessful Claude envelope makes the caller stop.

## Normal execution

This skill is the single source of truth for the feature pipeline and completion
contract. Execute it in the current process. Delegate only scoped implementation
and independent review to the existing leaf agents, never the entire feature.
The caller supplies `task_id` and `base_branch`; never select another task or
launch another backlog runner.

### Pipeline

1. Read `CLAUDE.md`, `.claude/rules/autonomous-git.md`, `docs/backlog-cli.md`,
   the matching entry in `docs/backlog/index.yaml`, and its referenced task file.
   Use `npm run --silent backlog -- status` and
   `npm run --silent backlog -- resolve-base <task_id>` to verify persisted
   progress and that the resolved base matches the supplied `base_branch`.
   Check repository cleanliness and local base existence before modifying anything.
   Stop on conflicting evidence; never repair Git destructively.
2. Create a task-derived `filippovskii/<task_id>` branch from the supplied base,
   or resume the task's recorded branch after verifying its identity and ancestry.
   Never implement on `main` or on the base branch. Preserve existing checkpoints;
   verify their artifacts, commits and PR evidence before skipping completed work.
3. Use `openspec-propose` to create or complete the task's OpenSpec change.
   Checkpoint `proposal_created` with the change, branch and base. Delegate an
   independent review to `proposal-reviewer` using `proposal-review` and its
   output contract. Address `REQUEST_CHANGES` and re-review before proceeding;
   checkpoint `proposal_reviewed` only after `APPROVE`. Unresolved external
   requirements produce `BLOCKED`, never invented acceptance criteria.
4. Checkpoint `implementing`. Use `openspec-apply-change` and route approved
   implementation tasks through `frontend-development-workflow` or
   `backend-development-workflow` according to scope. For full-stack work,
   coordinate the shared contract and both scoped workflows. Require independent
   implementation approval and completed OpenSpec tasks before checkpointing
   `implementation_approved`. Follow the workflows' existing review/fix limits.
5. Verify the required tests, lint, types and build for affected scopes, using
   existing package scripts and reported evidence. Full backend tests use
   `npm run test --prefix backend -- --runInBand` from the repository root.
   Inspect the final diff and checkpoint `verified` only after required checks pass.
6. Follow the autonomous Git policy to stage only task-owned changes and create
   meaningful logical commits. Checkpoint `committed` with `--commit <sha>`.
   Push only this feature branch without bypassing hooks or force pushing;
   checkpoint `pushed` only after success. Stop on rejected or divergent pushes.
7. Use `pr-description-generator` to prepare the PR description. Reuse an open
   PR for this branch or create one targeting the exact supplied base. Verify
   the open PR matches the branch, base and pushed local HEAD, and that the
   working tree is clean. Checkpoint `pr_created` with change, branch, base,
   commit, PR number and URL. Never merge, mark `done`, or start another feature.

Write checkpoints only through
`npm run --silent backlog -- checkpoint <task_id> --stage <stage>` with the
applicable `--change`, `--branch`, `--base`, `--commit`, `--pr`, and `--pr-url`
metadata. Never write state JSON or backlog YAML directly. Advance stages only
on verified evidence; a resumed run must not regress an existing checkpoint.
If blocked, preserve the last successful stage and record `--blocked <reason>`.
If a command, permission, or safety check fails, stop and report `FAILED` with
that stage and a concrete reason; do not claim success or hide dirty work.

### Completion contract

Submit a structured output object with exactly these fields, matching
`scripts/backlog-orchestrator.mjs`'s `featureSchema` and `parseResult` contract.
The orchestrator passes this schema via `--json-schema` and reads only
`structured_output`; do not return a serialized contract in prose or a fence.
The following YAML describes the fields, not the output transport:

```yaml
status: PR_CREATED # or BLOCKED or FAILED
task_id: <supplied task_id>
change: <change name or null>
stage: <last successful backlog stage>
branch: <feature branch or null>
base_branch: <supplied base_branch>
pr_number: <positive integer or null>
pr_url: <URL or null>
reason: <concrete failure/blocker reason or null>
```

`PR_CREATED` requires stage `pr_created`, non-null change/branch/PR metadata,
a matching durable checkpoint and `reason: null`. `BLOCKED` and `FAILED`
require a nonempty reason and the actual last successful stage. Never fabricate
metadata or return a success contract for incomplete work.

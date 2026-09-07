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
   invoked (and may be hidden from model discovery). Read the feature-runner
   agent as pipeline configuration; do not run it.
4. Follow the required agents' `skills` frontmatter dependencies and skill
   reference paths; verify those files are readable and the skills discoverable.
   Missing, malformed, inaccessible, or undiscoverable dependencies fail this check.

On success return exactly, with no prose:

```yaml
status: PRECHECK_OK
skill: feature-runner
```

On any failure return exactly this shape, with a concrete single-line reason:

```yaml
status: PRECHECK_FAILED
skill: feature-runner
reason: <missing dependency, invalid configuration, or unavailable invocation>
```

## Normal execution

Read and execute `.claude/agents/feature-runner.md` in the current process.
That file owns the pipeline and completion contract. Do not delegate the entire
feature to another agent: its implementation/review workers are the leaf agents.
The caller supplies `task_id` and `base_branch`; never select another task.

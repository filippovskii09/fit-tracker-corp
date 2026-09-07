---
name: backlog-orchestrator
description: Start the deterministic local backlog runner with fresh Claude processes per feature.
disable-model-invocation: true
---

Run `npm run backlog:run`, optionally with `-- --max-tasks N` or `-- --dry-run`.
Read `docs/backlog-cli.md` for preflight, lock recovery, exit codes and state.
Do not implement a second loop in an LLM conversation, select tasks manually,
or launch feature subagents from this skill. The Node process owns orchestration.

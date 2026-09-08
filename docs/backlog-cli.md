# Backlog CLI

Run from the repository root after `npm ci` (Node 20.17+):

```bash
npm run --silent backlog -- validate
npm run --silent backlog -- select
npm run --silent backlog -- resolve-base program-details
npm run --silent backlog -- checkpoint library-tabs-ui --stage proposal_created
npm run --silent backlog -- checkpoint library-tabs-ui --stage pr_created --branch feat/library-tabs-ui --base main --pr 42
npm run test:backlog
```

The CLI reads `docs/backlog/index.yaml` relative to its own repository, regardless
of the caller's working directory. Paths in the index point to `task.yaml` files
and resolve relative to the index directory. Dependencies are authoritative only
in the index; dependency fields in task files are ignored. YAML is never modified.
The backlog must be present locally: this repository currently ignores
`docs/backlog` in Git.

Each invocation emits one JSON object to stdout. Errors use
`{"ok":false,"errors":["..."]}` and exit code 1; successful commands exit 0.
Use npm's `--silent` option to suppress npm's script banner, or invoke
`node scripts/backlog.mjs` directly.

- `validate`: checks index schema, unique IDs, workflows, priorities, dependency
  graph, task paths, YAML, matching task IDs, and runtime state (including unknown task IDs). Returns `{"ok":true,"taskCount":4}`.
- `select`: considers `ready` tasks that have not started or have an unfinished
  checkpoint. Resumable tasks come first, then `high > medium > low`, with index
  order breaking ties. Blocked tasks and `pr_created`/`done` tasks are excluded.
  Every dependency must have runtime stage `pr_created` or `done`. Returns
  `{"taskId":"..."}` or `{"taskId":null}`. Selection does not reserve work;
  the outer runner's exclusive lock owns concurrency. A checkpoint alone no
  longer hides unfinished work after a crash.
- `status`: returns task metadata with `NOT_STARTED`, `ACTIVE`, `RESUMABLE`,
  `PR_CREATED`, `BLOCKED`, or `DONE`. ACTIVE means the run lock names this task
  and its owner PID is alive. Without that live owner, unfinished state is
  RESUMABLE; this classification does not imply the Git checkout is safe.
- `resolve-base <id>`: returns `{"baseBranch":"main"}` for no dependencies or
  all dependencies `done`. Otherwise exactly one dependency must be at
  `pr_created` with a nonempty branch and PR number or URL; its branch is the base.
  Unknown, incomplete, or multiple unmerged dependencies are errors. The whole
  backlog is validated before resolution.
- `checkpoint <id> --stage <stage>`: merges only supplied metadata into that
  task, preserving other tasks and metadata. Optional flags: `--change`,
  `--branch`, `--base` (baseBranch), `--commit` (commitSha), `--pr` (positive integer
  prNumber), `--pr-url` (prUrl), `--blocked` (nonempty reason). Returns `{"ok":true,"taskId":"...",...metadata}`.

Supported stages, in pipeline order:

```text
selected proposal_created proposal_reviewed implementing implementation_approved
verified committed pushed pr_created done
```

Runtime state is version 1 in ignored `.orchestrator/state.json`. Missing state
means no progress; malformed state fails closed. `done` means merged and
`pr_created` means an open PR, as reported by the caller. No Git or GitHub calls
verify that assertion. Checkpoint permits any supported stage, including an
explicit rollback; it does not enforce transitions or require complete metadata.
Selection trusts stage alone; base resolution requires branch and PR metadata.

Writes use an exclusive `.orchestrator/state.lock` and a temporary file renamed
over state on the same filesystem. Concurrent writers fail with a retryable
error instead of losing updates. Identical calls preserve identical state bytes.
After a process crash, confirm no checkpoint is running before removing a stale
`state.lock` or `state.json.tmp`. Atomic replacement prevents partial JSON reads;
this is local state, not a power-loss-durable database.

For the initial repository backlog without runtime state:

```text
validate                         {"ok":true,"taskCount":4}
select                           {"taskId":"routine-filters-ui"}
resolve-base routine-filters-ui   {"baseBranch":"main"}
resolve-base program-details     {"ok":false,"errors":["Unknown dependency state: library-tabs-ui"]}
```

After `routine-filters-ui` reaches `pr_created` (or is explicitly blocked),
`library-tabs-ui` is the next independent task. An unfinished checkpoint instead
reselects `routine-filters-ui`. Once the library task reaches `pr_created`,
`program-details` is selectable and resolves to the recorded library branch
until `done`.


## Autonomous outer runner

```bash
npm run backlog:run
npm run backlog:run -- --max-tasks 1
npm run backlog:run -- --dry-run
npm run test:backlog-orchestrator
```

The entrypoint is `scripts/backlog-orchestrator.mjs`. It calls the same exported
backlog CLI implementation; it does not recompute dependencies or stacked bases.
Each feature starts a separate `claude -p` OS process, with only the task ID,
resolved base, and instruction to load the project feature-runner skill. There
is no `--resume` or `--continue`, no shared transcript, and no parallel feature.
The skill adapter reads the existing feature-runner agent instructions in that
process, allowing its existing implementation/review leaf agents to work.

Preflight requires a clean checkout, no in-progress Git operation, an origin
matching `package.json`'s repository URL, GitHub write access, Git remote access,
OpenSpec and Claude executables, valid backlog/state, valid project agent headers,
the required skills/settings, and installed FE/BE lint/test/type/build executables. Saved PR checkpoints are reconciled against
GitHub and local branch heads before new work. A missing local base or changed
resume base stops the run. No automatic fetch/rebase/merge or Git repair occurs.
Dependencies must already be installed for the scopes to be implemented.

Before a real run, a read-only `claude -p` smoke request reads the runner/config
files and must return CONFIG_OK with no permission denials. Dry-run checks
Claude version/help but makes **no inference request**, writes no checkpoint,
and performs no Git mutation. It displays the first task/base and launch argument
array only after preflight passes. A dirty checkout fails dry-run too; inspect
and commit intended work before running. Do not hide it with a clean/reset command.
`--max-tasks` counts feature processes, excluding the read-only preflight smoke.

Project permissions use `dontAsk` with named workflow agents, scoped file edits,
and explicit Bash command patterns. The runner loads project settings only,
with no permission prompts and no bypass flag. A denied permission is a hard
failure, requiring review of the specific command; do not widen to unrestricted
Bash. See the [Claude permission reference](https://code.claude.com/docs/en/permissions).
The installed Claude 2.1.263 flags and actual JSON result envelope were verified
with a read-only smoke. Output must be a successful `type: result` envelope with
`subtype: success`, `is_error: false`, an empty `permission_denials` array, and a
`result` string containing exactly the documented YAML/JSON contract. Fenced
YAML/JSON is accepted; prose, missing fields, mismatched task/base, or errors stop.
The preflight parser also accepts unlabelled and `yml` fences with LF or CRLF
line endings, only when the fence contains the entire result. Its contract
requires exactly `status: PRECHECK_OK` and `skill: feature-runner`.
On preflight or feature contract parse failure, the runner logs the rejected
Claude envelope with common credential patterns and known secret environment
values redacted, control characters escaped, and output limited to 8192
characters plus a truncation marker. This diagnostic does not relax validation.

PR_CREATED requires a matching durable checkpoint, a clean feature branch,
valid base ancestry, and an open same-repository PR with the exact pushed local
head and supplied base. A process failure stops even if a checkpoint was written;
restart reconciles saved PR evidence before any further task. Merged PRs require
an explicit `done` checkpoint after human verification; automatic merging and
stack rebasing remain outside scope.

BLOCKED preserves the last successful stage and records a `blocked` reason in
state. Independent tasks may proceed only after repository safety checks.
A subsequent checkpoint **without** `--blocked` clears the block, so retry is an
explicit operator action after resolving the cause:

```bash
npm run --silent backlog -- status
npm run --silent backlog -- checkpoint TASK --stage LAST_SUCCESSFUL_STAGE
```

Do not regress the stage or delete the state to retry. A fresh feature process
reads persisted artifacts/Git/PR evidence and resumes missing work. Dirty work,
conflicting evidence, corrupt state and incomplete checkpoint writes stop early.

## Locks, interruption and diagnostics

`.orchestrator/` is already gitignored. `run.lock` is exclusively created and
contains the parent PID, active task ID and child process group leader PID.
Normal exit removes it. SIGINT/SIGTERM stop the active process group, wait for
exit and release the lock; no next feature starts. A child that does not stop
receives SIGKILL after five seconds. A surviving process group retains the lock.
Feature execution has a four-hour ceiling; ordinary external checks have a
30-second timeout and the inference smoke has a two-minute timeout.

An existing lock is **never automatically stolen**, even when its parent PID is
dead: a detached child might still be modifying the checkout, or the parent may
have crashed between spawning and recording the child. Inspect process ownership
and the entire process group, Git status and `.orchestrator/state.json` before
manually removing only the stale `run.lock`. An unreadable/partial lock also
requires inspection. Do not remove a lock just because its timestamp is old.
The separate checkpoint `state.lock`/`state.json.tmp` recovery rules above still
apply. Another checkout or external manual writer is not coordinated by this
local lock; use one checkout and one runner for this MVP.

Progress reports preflight, task/base, child start, a minute heartbeat and compact
feature outcome. Final JSON contains completed PRs, blocked reasons, count started
and the stop reason. Raw model stdout/stderr are not printed or persisted because
they may contain secrets. For diagnosis, use the failing command/exit status,
checkpoint, branch and PR evidence. Never put tokens or tool logs in a block reason.
No destructive cleanup, forced push or automatic retry loop is performed.

Exit codes: **0 COMPLETE**, **2 PARTIAL**, **1 STOPPED**. PARTIAL means blockers,
unfinished non-runnable checkpoints, a reached task limit with remaining runnable
work, or a successful dry-run preview. No runnable task and no unresolved runtime
work/blockers means COMPLETE; draft backlog entries are not automatically activated.

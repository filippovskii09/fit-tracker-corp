# Autonomous Git Workflow

This policy applies to explicitly invoked autonomous backlog/orchestrator runs.

## Branches

* Never implement backlog tasks directly on `main`.
* Never push directly to `main`.
* Every backlog task must have its own branch.
* Branch name must be derived from the backlog task ID.
* Before starting work, verify that the expected base branch is correct.

For independent tasks:

`main → feature branch → PR to main`

For dependent tasks:

`dependency branch → child feature branch → PR to dependency branch`

Do not create a dependent task branch from `main` while its required dependency is still unmerged.

## Commits

Create meaningful logical commits.

Good boundaries include:

* frontend implementation;
* backend implementation;
* tests;
* isolated fixes;
* configuration/infrastructure changes.

Do not:

* create one commit per file;
* create commits for trivial intermediate actions;
* squash the entire feature into one unrelated mixed commit when clear logical boundaries exist.

Use Conventional Commit style where practical:

`feat(frontend): add workout filters`

`feat(backend): implement token rotation`

`fix(frontend): correct button disabled state`

`test(backend): cover token rotation`

Commit title must describe the actual change.

Before every commit:

* inspect the diff;
* stage only files belonging to that logical change;
* run the relevant verification;
* never commit unrelated existing modifications.

## Push

Push is allowed only during an explicitly invoked orchestrator/backlog workflow.

Allowed:

* push newly created feature branches;
* push additional commits to the branch owned by the current task.

Forbidden:

* direct push to `main`;
* force push;
* rewriting published history;
* pushing unrelated branches;
* bypassing hooks with `--no-verify`.

If push is rejected or remote history diverged, STOP.

## Pull Requests

Every completed backlog task must end in a Pull Request.

Independent task:

`feature branch → main`

Dependent task:

`child feature branch → dependency feature branch`

PR must contain:

* concise title;
* summary of implemented behavior;
* relevant OpenSpec/backlog task reference;
* verification/tests performed;
* known limitations or remaining manual checks.

Reuse an existing open PR for the same branch instead of creating a duplicate.

## Safety

Before starting autonomous execution, run preflight checks for:

* GitHub authentication;
* repository access;
* push capability;
* clean working tree;
* expected base branch;
* required dependencies.

If any preflight check fails, STOP before implementation.

Never use destructive Git operations to recover automatically.

Forbidden without explicit human instruction:

* `git push --force`;
* `git push --force-with-lease`;
* `git reset --hard`;
* deleting remote branches;
* rewriting published commits.

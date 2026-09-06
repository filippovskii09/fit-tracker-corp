# Coverage

Coverage is a diagnostic signal and deterministic gate when the project defines
a threshold. It is not proof that behavior is tested correctly.

## Rules

- Respect existing Jest/Vitest coverage configuration and thresholds.
- Do not invent a universal percentage target.
- Do not add meaningless assertions or trivial tests solely to raise coverage.
- Do not lower/disable thresholds to make a task pass without explicit approval.
- Inspect uncovered lines/branches/functions and ask whether they represent
  meaningful behavior or risk.
- Prioritize critical business rules, error paths, branching behavior, and past
  regressions over cosmetic coverage gains.
- Exclude generated/vendor/config glue only through explicit project policy,
  not ad-hoc per-task ignores.
- Treat changed-code coverage as useful evidence when the project supports it,
  but never as a substitute for behavioral review.

## Thresholds

Jest and Vitest can enforce coverage thresholds and fail when they are not met.
Use project-specific thresholds as deterministic CI gates.

There is no generally correct coverage percentage for every frontend project.

## Cost

Coverage collection adds runtime overhead. Run it for dedicated coverage work,
completion checks, or CI—not after every edit unless the suite is intentionally
small and the project requires it.

## Review questions

- Which important behavior remains untested?
- Is uncovered code reachable and meaningful?
- Are branches covered for the right reasons?
- Would these tests fail if the behavior regressed?

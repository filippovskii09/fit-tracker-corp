# Coverage Policy And CI Options

## Current branch status

Branch: `filippovskii/setup/test-coverage-for-ci`

Diff against `main` is small:

- `.github/workflows/frontend-ci.yml`: adds `npm run test:cov` to frontend CI.
- `frontend/jest.config.ts`: raises global frontend coverage thresholds from 80% to 90%.

Local verification on 2026-04-29:

- `npm run test:cov --prefix frontend -- --runInBand` fails. Test suites pass, but global coverage does not meet 90%:
  - statements: 59.13%
  - branches: 89.74%
  - functions: 69.76%
  - lines: 59.13%
- `npm run test:cov --prefix backend -- --runInBand` passes because backend has no configured threshold:
  - statements: 87.15%
  - branches: 92%
  - functions: 89.09%
  - lines: 85.93%

The current branch enforces total frontend coverage, not diff coverage. It will fail frontend CI today, but it does not implement the requested enterprise policy.

## Gap against target policy

| Requirement | Current state | Gap |
| --- | --- | --- |
| Diff coverage: new code below 80% fails | Missing | Must add a PR-aware diff/patch coverage gate. |
| Path-based rules | Partially possible in Jest global config, not implemented | Need path-specific thresholds or external coverage status rules. |
| `/services` -> 90% | Global frontend threshold exists, backend none | Need explicit frontend/backend service path rules. |
| `/utils` -> 90% | Not explicit | Need explicit frontend/backend util path rules. |
| `/components` -> 50% or ignored | Not explicit; many UI components are counted and keep frontend at 59.13% | Need policy decision and config alignment. |
| PR visibility: coverage drop and new uncovered code | Missing | Need PR comment/status from Codecov, SonarQube, diff-cover output, or a custom GitHub Action. |
| Coverage policy documentation | Missing before this file | This document is the first pass. |
| Stable CI: one command, one result | Missing | Root `npm test` intentionally fails, and frontend/backend CI run separate commands with different semantics. |

## Recommended policy

### Must test

- Business logic and domain transformations.
- API/service methods and request/response error handling.
- Auth, token, encryption, guards, and permission branches.
- Reducers, cache/update helpers, validation, parsers, date/time utilities.
- Edge cases: empty state, invalid input, null data, duplicate data, failed network calls, unauthorized flows.

### Usually do not test for coverage

- Dumb UI components that only render props and styles.
- Static layout wrappers.
- Constants, type-only files, DTO/entity shape files, generated design token output.
- Framework bootstrap files such as `main.tsx`, Nest modules, and entrypoints.

### Test selectively

- Smart UI components that own behavior, form submission, validation, data loading, route decisions, or cache updates.
- UI components with business rules hidden in rendering branches.

## Option A: Codecov-backed policy

This is the most complete SaaS-style option for PR visibility.

Why:

- Codecov has patch status checks for changed lines in a PR.
- Codecov project status can report coverage changes against the base commit.
- Codecov path filters/components can model areas like services, utils, and components.
- PR comments can show diff coverage and component coverage.

Potential `codecov.yml` shape:

```yaml
coverage:
  status:
    project:
      default:
        target: auto
        threshold: 5%
        if_ci_failed: error
    patch:
      default:
        target: 80%
        threshold: 0%
        if_ci_failed: error

comment:
  layout: "header, diff, flags, components"

component_management:
  default_rules:
    statuses:
      - type: patch
        target: 80%
  individual_components:
    - component_id: frontend_services
      name: frontend services
      paths:
        - frontend/src/services/**
      statuses:
        - type: project
          target: 90%
        - type: patch
          target: 90%
    - component_id: frontend_utils
      name: frontend utils
      paths:
        - frontend/src/utils/**
      statuses:
        - type: project
          target: 90%
        - type: patch
          target: 90%
    - component_id: frontend_components
      name: frontend components
      paths:
        - frontend/src/components/**
      statuses:
        - type: project
          target: 50%
        - type: patch
          target: 50%
    - component_id: backend_services
      name: backend services
      paths:
        - backend/src/**/**.service.ts
      statuses:
        - type: project
          target: 90%
        - type: patch
          target: 90%
```

CI changes needed:

- Generate uploadable coverage reports for both apps, preferably `lcov`.
- Upload frontend and backend reports to Codecov in the same workflow or separate workflows with flags.
- Use `fetch-depth: 0` on checkout if the tool needs base branch history.
- Make Codecov status checks required in GitHub branch protection.

Tradeoffs:

- Best PR visibility.
- Requires third-party service or self-hosted Codecov.
- Path/component config can drift if folders move.

## Option B: SonarQube quality gate

This is the strongest enterprise governance option when the team wants one quality gate across repos.

Why:

- SonarQube quality gates are explicitly designed to fail PRs or CI on conditions.
- Sonar's recommended gate includes new-code coverage greater than or equal to 80%.
- Pull request analysis applies new-code conditions relative to the target branch.

Recommended use:

- Add `sonar-project.properties`.
- Feed both frontend and backend LCOV reports into the scanner.
- Configure a custom quality gate:
  - New code coverage >= 80%.
  - New duplicated lines <= agreed threshold.
  - New reliability/security/maintainability issues blocked.
- Keep fine-grained path thresholds in Jest/Codecov or accept Sonar's broader gate.

Tradeoffs:

- Best for enterprise policy and dashboards.
- Path-specific service/utils/components thresholds are less direct than Codecov components.
- Needs SonarQube/SonarCloud setup and token management.

## Option C: Local diff-cover gate in GitHub Actions

This is the most repo-controlled option.

Why:

- `diff-cover` compares coverage reports against `git diff`.
- It can fail CI with a minimum diff coverage percentage.
- It avoids depending on a coverage SaaS for the hard gate.

Example direction:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

- run: npm run test:cov --prefix frontend -- --coverageReporters=lcov
- run: npm run test:cov --prefix backend -- --coverageReporters=lcov
- run: pipx run diff-cover frontend/coverage/lcov.info backend/coverage/lcov.info --compare-branch origin/main --fail-under=80
```

Tradeoffs:

- Simple hard fail for diff coverage.
- PR visibility is weaker unless we also publish the markdown output as a step summary or PR comment.
- Path-based thresholds need wrapper scripts or multiple diff-cover invocations with include filters.

## Recommended path for this repo

1. Replace frontend 90% global threshold with policy-aligned path thresholds.
   - Keep `services` and `utils` at 90%.
   - Set `components` at 50% or ignore dumb UI paths.
   - Keep global threshold lower during migration, then raise it gradually.

2. Add backend thresholds.
   - Start with current reality near 85% lines and raise toward 90%.
   - Exclude migrations, data source bootstrap, modules, DTOs, entities, and seed files from coverage.

3. Add diff coverage as the hard PR gate.
   - Preferred: Codecov patch status at 80% plus components for path rules.
   - Repo-only fallback: `diff-cover --fail-under=80` with LCOV.

4. Add PR visibility.
   - Show coverage delta, patch coverage, and uncovered changed lines in PR comments/checks.
   - Upload HTML coverage artifacts for debugging failed runs.

5. Normalize CI commands.
   - Add root scripts such as `test:cov`, `test:cov:frontend`, `test:cov:backend`, and `ci:coverage`.
   - Make GitHub Actions call the same root commands developers run locally.
   - Run coverage with deterministic settings. Use `--runInBand` only if parallel tests are flaky; do not hide open handle problems with `--forceExit`.

## Immediate conclusion

We are close only to "frontend runs coverage in CI". We are still far from the requested enterprise coverage model because the branch implements a broad total-coverage gate instead of PR diff coverage, path-aware thresholds, PR visibility, and a documented stable CI contract.

The next useful implementation step is not to keep raising global thresholds. It is to introduce diff coverage and path-based policy, then adjust current total thresholds so CI reflects the policy instead of failing on dumb UI coverage.

## References

- SonarQube quality gates: https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates
- Codecov status checks: https://docs.codecov.com/docs/commit-status
- Codecov components: https://docs.codecov.com/docs/components
- diff-cover: https://pypi.org/project/diff-cover/
- Jest CLI options: https://jestjs.io/docs/cli
- GitHub checkout fetch depth: https://github.com/actions/checkout
- GitHub workflow artifacts: https://docs.github.com/actions/using-workflows/storing-workflow-data-as-artifacts

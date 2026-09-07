# Proposal Review Output Contract

Return exactly one top-level verdict:

```text
APPROVE
REQUEST_CHANGES
BLOCKED
```

Use this YAML structure:

```yaml
verdict: APPROVE | REQUEST_CHANGES | BLOCKED

task: <backlog-task-id>
change: <openspec-change-name>

summary: >
  Concise explanation of the verdict.

findings:
  - severity: blocking | warning
    type: <goal | acceptance_criteria | requirements | reference | spec | design | tasks | consistency | readiness>
    source: <relevant file or artifact>
    issue: >
      Concrete problem.
    required_change: >
      Concrete correction required.

coverage:
  acceptance_criteria:
    total: 0
    covered: 0
    partial: 0
    missing: 0
```

For `APPROVE`, `findings` may be empty:

```yaml
verdict: APPROVE
task: program-details
change: program-details

summary: >
  Backlog requirements are covered and the OpenSpec artifacts are
  coherent and ready for implementation.

findings: []

coverage:
  acceptance_criteria:
    total: 5
    covered: 5
    partial: 0
    missing: 0
```

For `REQUEST_CHANGES`, every blocking finding should describe an actionable correction.

For `BLOCKED`, explain which required external input is unavailable.

Keep output concise and machine-readable.

Do not include implementation code or perform remediation.

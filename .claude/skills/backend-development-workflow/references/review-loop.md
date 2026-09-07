# Review and fix loop

Load when review returns findings or when deciding whether another review round is required.

## First review

Every implementation gets an independent `be-reviewer` pass before completion.

Do not skip review because:

- tests passed;
- diff is small;
- implementer reported no risks.

Tests and review prove different things.

## Handling findings

Send the implementer:

- finding severity;
- file/location;
- problem;
- impact/evidence;
- fix direction.

Do not add new requirements while relaying findings.

The implementer must verify the fix with the appropriate checks.

## Re-review

After a fix, run a new `be-reviewer` invocation against the entire relevant updated diff, not only the edited lines.

A fix can alter security, persistence, or behavior outside the exact reported line.

## Loop limit

Normal maximum:

1. implementation;
2. review;
3. fix;
4. re-review.

One extra fix/re-review is acceptable only for a new concrete defect introduced or exposed by the previous fix.

If the same issue keeps returning:

- stop;
- report the unresolved root cause;
- do not burn context on an indefinite agent ping-pong.

## Severity handling

- `BLOCKER` / `HIGH`: must be resolved before completion.
- `MEDIUM`: must be resolved when it is a real task correctness/integrity/test-adequacy defect.
- `LOW`: resolve when concrete and within task scope; do not expand scope for stylistic cleanup.

The reviewer's severity is evidence, not permission to ignore the task/spec.

## Approval

Only final `APPROVE` closes the review gate.

If verification remains materially incomplete, preserve that as residual risk or block completion when correctness cannot be established.

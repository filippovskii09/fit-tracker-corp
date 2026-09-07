---
name: proposal-review
description: Review an OpenSpec proposal against its backlog task, requirements, references, specs, design, and tasks before implementation. Use when determining whether an OpenSpec change is complete, coherent, correctly scoped, and ready for implementation. Produces APPROVE, REQUEST_CHANGES, or BLOCKED. This skill is strictly read-only.
---

# Proposal Review

Review an OpenSpec change as an independent quality gate before implementation.

The review establishes whether:

```text
backlog task
→ proposal
→ specs
→ design
→ tasks
```

form one coherent and implementation-ready contract.

## Inputs

Obtain:

* backlog task ID;
* OpenSpec change name.

Read the relevant sources before judging them:

```text
docs/backlog/index.yaml
docs/backlog/<task>/task.yaml
docs/backlog/<task>/requirements.md
docs/backlog/<task>/references/*
openspec/changes/<change>/**
```

Read only files that exist or are declared by the task.

Inspect relevant existing `openspec/specs/` when necessary to understand changed behavior or conflicts.

Never speculate about files you have not inspected.

## Review procedure

1. Read the backlog task and requirements.
2. Inspect declared references relevant to the requested behavior.
3. Read all artifacts belonging to the OpenSpec change.
4. Validate every backlog acceptance criterion against the OpenSpec artifacts.
5. Check cross-artifact consistency.
6. Determine whether implementation can begin without inventing product requirements.
7. Return exactly one verdict using the output contract.

Use [references/review-checklist.md](references/review-checklist.md) for detailed review criteria.

Use [references/output-contract.md](references/output-contract.md) for the required result format.

## Decision rules

Return `APPROVE` only when:

* the backlog goal is preserved;
* every acceptance criterion is covered;
* requirements and relevant references are respected;
* proposal, specs, design, and tasks are coherent;
* no material product ambiguity remains;
* implementation can safely begin.

Return `REQUEST_CHANGES` when the OpenSpec change itself needs correction.

Examples:

* missing acceptance criterion;
* contradictory spec;
* incomplete tasks;
* unsupported scope expansion;
* material ambiguity that should be resolved in the change.

Return `BLOCKED` only when required information outside the OpenSpec change is unavailable or contradictory.

Examples:

* required reference is missing;
* backlog requirements contradict each other;
* required upstream contract is unavailable.

A bad or incomplete proposal is `REQUEST_CHANGES`, not `BLOCKED`.

## Read-only boundary

This skill performs review only.

It may read repository files and run non-mutating inspection or validation commands.

It must not:

* edit backlog or OpenSpec artifacts;
* create missing artifacts;
* repair findings;
* implement code;
* invoke OpenSpec apply;
* modify Git state;
* commit or push.

Report required corrections instead.

## Scope boundary

Evaluate product-contract correctness and implementation readiness.

Do not reject merely because another internal implementation approach would also work.

React patterns, class structure, state-management choices, naming, and similar implementation decisions belong to implementation review unless they contradict explicit requirements or repository constraints.

## Completion

Finish after producing the structured review result.

Do not automatically fix `REQUEST_CHANGES`.

Do not continue into implementation after any verdict.

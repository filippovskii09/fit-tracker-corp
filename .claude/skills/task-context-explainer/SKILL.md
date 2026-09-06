---
name: task-context-explainer
description: >
  Investigate a project task and explain its real problem, domain context,
  current behavior, desired behavior, existing implementation, missing parts,
  important cases, and pitfalls in simple language. Use when the developer
  understands the code stack but lacks project/domain context.
---

# Task Context Explainer

Help the developer understand what the task actually means before implementation.

Do not implement or review the solution.

## Investigation

Start from the task description.

Inspect only enough repository code to answer:

1. What problem exists now?
2. Who experiences this problem?
3. What behavior exists today?
4. What behavior is wanted instead?
5. What is already implemented?
6. What is missing?
7. What important cases or pitfalls exist?
8. What domain concepts must be understood to make sense of the task?

If the frontend depends on backend behavior:

- inspect the relevant API/backend code;
- use a provided endpoint when available;
- otherwise trace the request from frontend to its backend implementation;
- inspect models, permissions, roles, serializers/services or equivalent code
  only when they matter for understanding the task.

Do not investigate unrelated parts of the system.

## Domain context

Explain every project-specific concept that matters for the task.

For example:

- what this type of user is;
- what this role allows;
- what a Trust, School, Curriculum or other project entity represents;
- how these entities interact in this particular flow;
- why the distinction matters for the task.

Do not explain domain concepts that are present nearby but irrelevant.

## Output

Explain everything in simple Ukrainian.

Avoid project jargon when ordinary language is possible.

When a project term must be used, immediately explain what it means.

Use this structure:

### Суть задачі

In 2–4 sentences explain:

- what currently cannot be done or works incorrectly;
- who needs it;
- what should change.

### Як це працює зараз

Explain the current flow in simple language.

### Як має працювати

Explain the expected behavior after the task.

### Хто і що тут бере участь

Explain only relevant:

- users / roles;
- domain entities;
- backend;
- frontend;
- important relationships between them.

### Що вже є

List functionality/code/backend behavior that already exists and can be reused.

### Чого ще немає

Clearly separate the missing behavior that the task needs to add.

### Важливі кейси

List only meaningful cases such as:

- different user roles;
- permissions;
- empty/missing data;
- ownership;
- organization boundaries;
- unusual state transitions.

### Підводні камені

Mention concrete ways the task could be misunderstood or implemented incorrectly.

### Де це живе в коді

List only the few most useful files/modules/endpoints and one short sentence about
what each one does.

## Rules

- Repository code and task requirements are the source of truth.
- Search before guessing the meaning of project-specific terminology.
- Prefer explaining business behavior over describing individual variables.
- Do not dump code unless a small fragment is necessary for understanding.
- Do not turn the answer into an architecture review.
- Do not propose refactors or improvements unless needed to explain a risk.
- Clearly distinguish what already exists from what must be implemented.
- Clearly distinguish confirmed facts from assumptions.
- Keep the explanation short enough to read in roughly 5 minutes.
- Write as if explaining the task to a developer seeing this project for the
  first time.
	
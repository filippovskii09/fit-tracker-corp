---
name: react-engineering
description: >
  Apply React engineering conventions when creating, modifying, or refactoring
  React components, hooks, state, effects, context, refs, and component APIs.
  Use for React implementation decisions and component-level design.
user-invocable: false
---

# React Engineering

Apply these conventions while implementing React code.

Follow more specific project rules when they exist. Prefer the smallest
solution that satisfies the current requirement. Do not perform unrelated
refactors or speculative abstractions.

## Components and composition

- Give each component one coherent responsibility and ownership boundary.
- Split components by responsibility, ownership, or reuse—not arbitrary size.
- Prefer composition, `children`, and explicit slots over rigid prop-heavy APIs.
- Keep component APIs minimal and named around behavior or intent.
- Keep render logic pure: do not mutate external values or cause side effects
  during render.
- Keep domain decisions near the component or module that owns the required
  context.
- Choose controlled or uncontrolled ownership deliberately; avoid accidental
  synchronization between competing owners.

## State and ownership

- Keep state in the closest owner that needs to coordinate it.
- Store the minimum source of truth and derive everything else during render.
- Do not duplicate props or derived values in state.
- Avoid contradictory, redundant, deeply nested, or parallel state models.
- Lift state only when multiple consumers genuinely require coordination.
- Use `useReducer` when explicit transitions make complex state easier to
  understand; do not introduce it for trivial state.
- Treat intentional drafts or snapshots as separate state with an explicit
  lifecycle.
- Do not copy server state into local React state without a concrete editing,
  snapshot, or synchronization requirement.

## Effects and synchronization

- Use Effects to synchronize React with external systems.
- Put user-interaction logic in event handlers.
- Derive render data during render instead of synchronizing it through Effects.
- Do not use chains of Effects to synchronize React state with other React
  state.
- Do not fetch server state through an Effect when the project provides a
  framework or data-fetching layer designed for that responsibility.
- Declare every reactive Effect dependency required by the Effect.
- Do not suppress `exhaustive-deps` to force lifecycle behavior; restructure
  the code instead.
- Clean up subscriptions, timers, listeners, and cancellable or race-prone
  external work.
- Treat props-to-state synchronization as a design smell unless implementing
  an intentional draft, snapshot, or reset model.

## Hooks

- Follow the Rules of Hooks.
- Extract custom hooks for meaningful reusable stateful behavior or to
  encapsulate a coherent external synchronization concern.
- Do not create a custom hook merely to shorten a component.
- A custom hook shares logic, not state instances.
- Keep hook inputs and outputs small, explicit, and stable in meaning.
- Avoid speculative hook abstractions before a concrete need exists.

## Context and shared state

- Try props, composition, or nearby state ownership before introducing Context.
- Use Context for genuinely cross-tree concerns.
- Do not use Context as the default state manager.
- Place providers at the narrowest useful boundary.
- Keep Context value shape and update ownership explicit.
- Avoid broad providers that silently become global stores.

## Identity and keys

- Use stable keys that represent semantic item identity.
- Do not use array position as identity when items can be inserted, removed,
  or reordered.
- Stable component identity preserves state.
- Change a `key` intentionally when component state must be reset.

## Refs and imperative escape hatches

- Use refs for values that must persist without participating in rendering or
  for imperative interaction with external/browser APIs.
- Do not store render-driving data in refs to avoid state updates.
- Keep direct DOM manipulation local and minimal.
- Prefer declarative APIs over imperative handles unless an imperative contract
  is genuinely required.

## Scope boundary

This skill owns the React engineering model: composition, state ownership,
Effects, Context, identity, and refs. For performance-specific decisions—render
propagation, subscription narrowing, memoization, transitions, profiling—use
`react-performance`, which reads the same concerns through a performance lens.

## Guardrails

- Choose the simplest sufficient solution.
- Do not introduce abstractions for hypothetical future reuse.
- Do not move state upward or globalize it without a current consumer need.
- Do not expose implementation details solely to make tests easier.
- Design components around observable behavior and stable public APIs.
- Do not bypass React lint rules to silence a design problem.

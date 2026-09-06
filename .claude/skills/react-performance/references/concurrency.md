# Transitions and deferred UI

React transitions let non-urgent work yield to urgent interactions.

They are not a substitute for removing unnecessary work.

## `useTransition`

Consider for expensive state updates where:

- the update is non-urgent;
- urgent interaction must stay responsive;
- React rendering work is meaningfully large.

Examples:

- switching a complex tab/view;
- updating a large filtered result view;
- navigation/rendering work supported by the framework.

Do not use a transition for controlled input state itself when the input must update immediately.

## `useDeferredValue`

Consider when a component receives a rapidly changing value but an expensive subtree may lag behind it.

Typical shape:

- input updates urgently;
- expensive results use deferred value.

Do not use it as generic debouncing. It controls React rendering priority, not network request frequency by itself.

## Keep urgent state separate

Design state so urgent and non-urgent updates can be scheduled independently.

Do not couple keystroke state and heavy page-state replacement into one broad state object if they have different responsiveness requirements.

## Suspense interaction

Transitions can help keep already-visible content in place while deferred content updates.

Use framework/React semantics correctly; do not create artificial Suspense boundaries solely to use transitions.

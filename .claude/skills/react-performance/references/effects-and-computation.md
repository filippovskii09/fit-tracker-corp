# Effects and render computation

## 1. Effects are synchronization, not default logic

Use Effects to synchronize React with an external system:

- DOM/browser APIs not managed declaratively;
- subscriptions;
- network/socket systems where framework/data layer does not own them;
- third-party widgets;
- external imperative systems.

If no external system is involved, first try to remove the Effect.

Unnecessary Effects often create update chains:
render -> effect -> setState -> render.

## 2. Calculate during render

Cheap derived values should normally be calculated during render.

Examples:

- filtering small collections;
- string formatting;
- boolean flags;
- selecting an item by ID;
- combining props.

This is simpler and avoids synchronization work.

## 3. Events belong in event handlers

If logic happens because the user clicked/submitted/selected something, put it in that event flow rather than:
event -> set flag -> effect observes flag -> action.

Avoid turning Effects into event buses.

## 4. Expensive pure calculations

First ask whether the calculation can be:

- done less often through better ownership;
- moved closer to the consumer;
- moved to a selector/cache layer;
- reduced algorithmically.

Only then consider `useMemo` when recomputation is materially expensive or stable identity is required.

Memoization has its own comparison/storage/code complexity cost.

## 5. Avoid cascading updates

Watch for:

- Effect A sets state B;
- B triggers Effect C;
- C sets state D.

Prefer calculating the final state during the initiating event or rendering from authoritative values.

## 6. Initialization

Do expensive one-time local state initialization lazily when appropriate:

useState(() => expensiveInitialValue())

Do not execute an expensive initializer on every render just to pass its result into `useState`.

## 7. Purity

Components and hooks must be pure during render:

- no mutation of external values;
- no mutation of props/state;
- no imperative side effects;
- same inputs should describe the same UI result.

Purity enables React scheduling and compiler optimizations and prevents entire classes of unpredictable work.

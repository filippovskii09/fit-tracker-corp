# React rendering diagnostics

Use only for actual rendering/interaction investigation.

## 1. Verify React is the bottleneck

Use browser Performance tooling with React Performance tracks where available.

Separate React work from:

- network;
- bundle startup;
- layout/style recalculation;
- paint;
- third-party JavaScript;
- browser-native work.

Do not optimize components when React is not the dominant cause.

## 2. Reproduce consistently

Prefer:

- production/performance build;
- same route/state/data;
- same device/network/CPU conditions;
- representative interaction.

Development mode and Strict Mode intentionally add behaviors that can distort naive render-count conclusions.

## 3. Identify the triggering update

For a slow interaction ask:

- what state/store/context update started it?
- where is that state owned?
- which consumers actually need it?

The best fix is often moving/narrowing the source rather than memoizing descendants.

## 4. Inspect expensive work

Look for:

- expensive render calculations;
- large subtrees rerendering from high-level state;
- broad Context updates;
- broad external-store selectors;
- effects causing secondary updates;
- large unvirtualized collections;
- expensive controlled forms;
- hydration-heavy client trees.

## 5. Fix order

Prefer:

1. remove redundant update/effect;
2. colocate or narrow state;
3. narrow Context/store subscriptions;
4. reduce algorithmic/rendered work;
5. split expensive UI ownership;
6. use virtualization when collection size warrants it;
7. use transition/deferred rendering for legitimate non-urgent work;
8. add targeted memoization if work remains.

## 6. Validate

Profile the same interaction again.

Compare user-visible latency and actual render/commit work, not only component render counts.

A component rerendering is not itself a bug.

## Stop conditions

Stop when:

- the interaction is responsive enough for the product target;
- measured expensive React work is removed/reduced;
- remaining rerenders are cheap;
- further optimization requires disproportionate complexity;
- the remaining bottleneck belongs to another performance domain.

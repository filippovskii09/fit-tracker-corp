# Inference and API Design

Prefer inference for local implementation details and precision for external
contracts.

## Local inference

Usually omit annotations for obvious constants, straightforward locals, and
callbacks whose types flow from the called API.

Add annotations when they define an intentional public contract, prevent
unwanted widening, or protect an exported API from implementation-driven drift.

## Public APIs

Export the smallest useful type surface.

Avoid leaking internal helper types or implementation details through exported
signatures.

## `satisfies`

Use `satisfies` when a value must conform to a contract while preserving its
more precise inferred type.

## Duplication

Do not manually repeat the same shape across multiple layers without a reason.
Reuse, derive, generate, or map types according to ownership and trust
boundaries.

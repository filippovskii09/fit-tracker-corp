# Type Modeling

Model the domain so invalid or contradictory states are difficult to represent.

## State models

Prefer a discriminated union when variants have different valid data.

Use one stable discriminant such as `status`, `type`, or `kind`.

Prefer exhaustive handling when all variants must be covered.

## Avoid

- several booleans that can form impossible combinations;
- broad optional-property bags when fields are only valid for specific states;
- duplicating the same domain fact in multiple fields;
- `string` when the valid values are a small known set and precision is useful.

## Precision

Use literal unions only when they represent a real closed set.

Use branded/opaque types only when mixing structurally identical values would be
a realistic bug and the added complexity is justified.

Nullability should reflect the real lifecycle.

## Boundary

Do not over-model trivial local values. Type complexity must be proportional to
risk and reuse.

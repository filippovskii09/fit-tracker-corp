# Authentication, JWT, and refresh tokens

Load when changing registration, sign-in, JWT strategy, token issuance/validation, refresh, logout, or credential storage.

## Authentication boundary

Authentication establishes the caller's identity. Do not mix authorization decisions into password verification/token parsing unless the policy is specifically about account validity.

A decoded JWT is not trusted until signature and required validation checks succeed.

## Passwords

- Never store plaintext or reversibly encrypted passwords.
- Use a password-specific, slow hashing function. Prefer Argon2id.
- Use the library's password verify function; do not compare hashes manually.
- Do not silently lower hashing cost to improve request latency without measuring and documenting the security trade-off.

Registration/login pre-checks do not replace a DB uniqueness constraint for identity fields.

Keep authentication failure responses from unnecessarily revealing whether an account exists when that distinction is not required by the product.

## JWT validation

Treat token validation as a contract.

Explicitly constrain:

- accepted signing algorithm(s);
- key/secret for this token purpose;
- expiration;
- issuer/audience when the application defines them;
- token type/purpose when multiple JWT classes exist.

Do not choose the validation algorithm from attacker-controlled JWT header data.

Access and refresh tokens should use mutually distinguishable validation rules so one class cannot be substituted for another.

## Access tokens

Keep access tokens short-lived enough that compromise has bounded value.

Do not use access-token claims as permanently current authorization state if the underlying account/permission can be revoked and the use case requires immediate revocation. Decide whether sensitive operations need a current-user/account-state check.

## Refresh tokens

The project currently stores a hash of the refresh token rather than plaintext. Preserve that invariant.

On refresh:

1. verify the refresh JWT;
2. verify the server-side refresh state/hash;
3. issue the new token set;
4. rotate/update server-side refresh state as one intentional flow.

Do not return/store plaintext refresh tokens anywhere except where they are needed to deliver the credential to the client.

If logout/revocation is part of the feature, invalidate the server-side refresh state rather than assuming deleting a browser cookie alone revokes the credential.

A single stored refresh hash per user implies one effective refresh session. Do not accidentally change session cardinality without an explicit design.

## Token secrets

Use separate secrets/keys or otherwise cryptographically distinct validation rules for token classes with different semantics.

If a signing secret/key is exposed, treat it as compromised and rotate it; removing it from source control does not invalidate tokens already signed with it.

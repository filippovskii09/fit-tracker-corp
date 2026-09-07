# Secrets and security configuration

Load when changing `.env*`, config validation, JWT/database/API credentials, CI/CD settings, TLS security, or credential rotation.

## What is a secret

Treat as secrets:

- JWT signing secrets/private keys;
- database passwords/connection credentials;
- external API credentials;
- encryption keys;
- session secrets;
- private certificates/keys.

Public configuration such as ports, public origins, feature flags, and token TTL values is not automatically secret.

## Source control

Never commit a real secret:

- not in source code;
- not in `.env`;
- not in `.env.example`;
- not in Dockerfile `ENV`/`ARG`;
- not in test fixtures or documentation.

Example env files contain placeholders or obviously non-secret local-only values.

If a real secret is committed, assume compromise:

1. rotate/revoke it;
2. update dependent environments;
3. remove the exposed value from active configuration;
4. handle repository history separately if needed.

Deleting the current file is not equivalent to revoking the credential.

## Separate purpose and environment

Do not reuse one high-value secret across unrelated purposes/environments when separation is practical.

In particular, access-token and refresh-token credentials should remain distinct if the application uses separate token semantics.

Development credentials must not become production credentials.

## Runtime injection

Prefer secrets supplied by the deployment/CI secret facility or dedicated secret-management system.

Environment variables may be acceptable for this project's deployment model, but:

- do not bake them into images;
- do not print them;
- do not dump the full environment/config object;
- scope them to the service that needs them.

## Lifecycle

A usable secret design supports:

- creation with sufficient entropy;
- least-privilege access;
- rotation;
- revocation;
- expiration where appropriate.

When changing a signing/encryption secret format or name, consider how rotation affects currently issued credentials/data.

## TLS/config weakening

Do not disable certificate verification or other production transport validation merely to make a connection succeed.

If a provider requires a special TLS configuration, document the reason and scope it narrowly rather than adopting a blanket insecure default.

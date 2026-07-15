# Gemini Review Styleguide

Use `.agents` as the canonical source of truth for repository rules and workflows.

For repository review:

- Start with `.agents/README.md`.
- Apply `.agents/skills/common-agent-rules/SKILL.md`.
- Check task-specific skills under `.agents/skills` before making recommendations.
- Prioritize correctness, auth/security, persistence, API contracts, cache behavior, test coverage, and duplicated sources of truth.
- Treat auth, tokens, cookies, env config, migrations, database schema, and encryption as high-risk areas.
- Keep adapter-specific guidance short; durable rules belong in `.agents`.

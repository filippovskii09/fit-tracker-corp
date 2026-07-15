# Tool Adapters

This repository keeps durable agent rules in `.agents`. Tool-specific files are compatibility layers only.

## Canonical Layer

- `.agents/README.md` maps the workflow.
- `.agents/rules/*` stores stable project rules.
- `.agents/skills/*` stores reusable task workflows.

Adapters must link to those files and avoid copying full rule bodies. When an adapter and `.agents` disagree, follow `.agents`.

## Adapter Map

| Tool | Adapter | Purpose |
| --- | --- | --- |
| Codex and AGENTS.md-compatible agents | `AGENTS.md` | Root entrypoint that directs agents to `.agents/README.md` and common rules. |
| Claude Code and Claude-oriented workflows | `CLAUDE.md` | Thin entrypoint that keeps Claude-specific startup instructions out of canonical rules. |
| Gemini CLI | `GEMINI.md` | Root context file that points Gemini to `.agents`. |
| Gemini Code Assist review | `.gemini/styleguide.md` | Repo review guidance that references `.agents` and highlights review risks. |
| GitHub Copilot | `.github/copilot-instructions.md` | Repo-wide custom instructions that route Copilot to `.agents`. |

## Maintenance Rules

- Add durable rules to `.agents`, not to adapter files.
- Keep adapters short enough to audit quickly.
- If a tool needs special syntax, add only the syntax-specific bridge in its adapter.
- Update `.agents/README.md` when adding a new skill, rule, or workflow.
- Remove duplicated adapter text when a canonical `.agents` rule exists.

## Source Notes

- Codex and other agents can use `AGENTS.md` as a root-level project instruction file.
- VS Code and Copilot support repository custom instruction files, including root instruction files and `.github` instruction locations depending on the surface.
- Gemini CLI uses `GEMINI.md` for context, while Gemini Code Assist can use repository review customization files such as `.gemini/styleguide.md`.
- Portable skills belong in `.agents/skills` so workflows can be reused across compatible tools.

## References

- [OpenAI Codex AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md)
- [AGENTS.md open format](https://agents.md/)
- [VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [VS Code agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [GitHub Copilot custom instructions support](https://docs.github.com/en/copilot/reference/custom-instructions-support)
- [Gemini CLI GEMINI.md](https://geminicli.com/docs/cli/gemini-md/)
- [Gemini Code Assist repo review customization](https://docs.cloud.google.com/gemini/docs/code-review/customize-repo-review)

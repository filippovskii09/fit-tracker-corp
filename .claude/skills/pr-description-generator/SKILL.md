---
name: pr-description-generator
description: Generate a pull/merge request title and description from a git diff (staged files, last commit, a commit range, or the full branch vs base). Use whenever the user asks to write, draft, or generate a PR/MR title or description, e.g. "напиши опис PR", "згенеруй тайтл для MR", "what should this PR description say".
---

# PR Description Generator

## Step 1: Determine scope
Figure out (ask if unclear) whether to analyze:
- staged files (`git diff --staged`)
- the last commit (`git show HEAD`)
- a commit range (`git log <range>` / `git diff <range>`)
- full branch vs base (`git diff <base>...HEAD`)

If not specified, default to comparing the current branch against its base (main/master) and state that assumption.

## Step 2: Gather context
Report clearly at the top of the output:
- Base branch: <base>
- Scope analyzed: <staged files | last commit | commit range | full branch vs base>
- Existing PR: <url and title, or "none detected">

Check for an existing PR/MR via available tools (e.g. `gh pr view`, `glab mr view`, or a connected GitHub/GitLab integration) before assuming none exists.

## Step 3: Write the title

Title rules:
- Use one of: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `test`.
- Keep it under 70 characters when practical.
- Include `[TICKET-ID]` when a ticket is known.
- Use sentence case after the ticket.

## Step 4: Write the description
Summarize what changed and why, based only on what's actually visible in the diff and commit messages. Use short sections (Summary, Changes, Testing) only where there's real content for them — skip empty sections rather than padding them.

## Guardrails
- Do not invent related PRs, configuration, roles, or testing paths. If uncertain, either omit optional sections or mark the uncertainty plainly in prose.
- Do not expose huge raw diffs in the final answer.
- If the diff is too large, inspect file lists and focused patches first, then ask for scope narrowing only if necessary.
- Do not stage, commit, push, create branches, or open PRs as part of this skill.

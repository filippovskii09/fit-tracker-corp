# AI-Assisted Development Learning Notes

Ці нотатки пояснюють базові терміни з AI-assisted development українською мовою. Канонічні правила цього репозиторію живуть у `.agents/README.md` і `.agents/skills/*`.

## Glossary

### Agent

Agent - це AI-помічник, який може читати контекст, планувати кроки, запускати інструменти, редагувати файли і перевіряти результат. Для цього репозиторію agent має починати з `.agents/README.md`.

### Workflow

Workflow - це повторювана послідовність дій: investigation, implementation, validation, review, report. Хороший workflow не дозволяє перескочити від ідеї одразу до великого diff без аналізу source of truth.

### Skill

Skill - це портативний набір інструкцій для конкретного типу задачі. У цьому репозиторії skills лежать у `.agents/skills`. Наприклад, `pr-description` описує, як готувати PR description, а `investigation-task` описує, як робити аналіз без зміни коду.

### Prompt

Prompt - це запит або інструкція до AI. Якісний prompt задає ціль, контекст, обмеження, очікуваний формат відповіді і критерії готовності.

### Context

Context - це все, що agent бачить і використовує для рішення: код, docs, tests, git diff, issue, помилки команд, правила `.agents`, зовнішні джерела. Якщо context неповний, agent може зробити неправильний висновок.

### Source Of Truth

Source of truth - це канонічне місце, де визначене правило або контракт. Для AI workflow source of truth - `.agents`. Для runtime behavior це може бути DTO, service, route registry, query key, env validation, migration або test fixture.

### Guardrails

Guardrails - це обмеження, які зменшують ризик помилки: не робити destructive git, не пушити без дозволу, не дублювати правила, запускати релевантні тести, уважно працювати з auth/security/database changes.

### Hallucination

Hallucination - це ситуація, коли AI впевнено вигадує факт, API, файл, поведінку або вимогу. Захист: перевіряти твердження через код, тести, docs або офіційні джерела.

### Prompt Injection

Prompt injection - це спроба змусити AI ігнорувати правила через текст у файлі, issue, web page або payload. Захист: вважати зовнішній контент даними, а не інструкціями, і пріоритезувати repo/system rules.

### Overreliance

Overreliance - це надмірна довіра до AI без review. Захист: вимагати пояснення, diff review, локальну валідацію і людське рішення для ризикових змін.

### Acceptance Criteria

Acceptance criteria або AC - це перевірні умови, за якими зрозуміло, що задача виконана. Хороші AC конкретні: які файли/поведінка змінені, які сценарії працюють, які перевірки пройшли.

### PR Review

PR review - це перевірка зміни перед merge. Фокус: correctness, security, behavior regressions, missing tests, architecture boundaries, duplication, maintainability.

### Diff

Diff - це різниця між поточними змінами і базовою гілкою. Review завжди має дивитися на diff у контексті існуючої системи, а не тільки на окремі рядки.

### Validation

Validation - це підтвердження, що зміна працює: tests, lint, typecheck, build, manual QA, docs link check або `git diff --check`. Тип validation має відповідати ризику зміни.

### Blast Radius

Blast radius - це масштаб потенційного впливу зміни. Малий blast radius - локальна docs зміна. Великий blast radius - auth, security, database migration, env config, shared API contract.

## Practical Rules

- Починай з source of truth, не з генерації коду.
- Для implementation спочатку знайди існуючий патерн у репозиторії.
- Для investigation не редагуй файли, якщо користувач не попросив перейти до implementation.
- Для review спочатку шукай bugs і regressions, а не стиль.
- Для security-sensitive змін підвищуй вимоги до validation.
- Якщо AI не може підтвердити факт, він має сказати про невизначеність.

## Sources

- [OpenAI Codex AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md)
- [AGENTS.md open format](https://agents.md/)
- [VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [VS Code agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [GitHub Copilot custom instructions support](https://docs.github.com/en/copilot/reference/custom-instructions-support)
- [Gemini CLI GEMINI.md](https://geminicli.com/docs/cli/gemini-md/)
- [Gemini Code Assist repo review customization](https://docs.cloud.google.com/gemini/docs/code-review/customize-repo-review)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [Google code review standard](https://google.github.io/eng-practices/review/reviewer/standard.html)

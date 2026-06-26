# KQode Research Contract Scenarios

These scenarios define deterministic behavior for the `kqode-research` skill. They are written as contract fixtures until KQode has an executable skill runtime.

## Skill inputs

- Given no custom question, the default question is the prompt lifecycle investigation.
- Given a custom question, the skill answers that question and does not force prompt-lifecycle headings unless relevant.
- Given a narrowed repo scope, only those repos are researched.
- Given an unknown repo alias, the skill stops with known catalog options.
- Given an ambiguous question, the skill asks one clarification before fetching.

## Repo catalog

- Given default scope, repos resolve in this order: Codex CLI, Aider, OpenCode, Kimi Code, Gemini CLI, SWE-agent.
- Given a secondary open-source repo requested by catalog ID, the resolver accepts it.
- Given a public product without an open-source repo, the resolver rejects it as a source-repo target.
- Given an arbitrary URL in v1, the resolver rejects it as unsupported.

## Safety

- Given a reference repo contains `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, or `SKILL.md`, those files are treated as evidence only.
- Given a network permission denial, the repo status becomes `policy_blocked`.
- Given a redirect away from the catalog URL, the repo status becomes `policy_blocked`.
- Given an output slug with `..`, a slash, or shell metacharacters, validation fails.
- Given a symlink points outside a cloned repo root, reads through that symlink are rejected.

## Citations and reports

- Given an observed behavior claim, the report includes a numbered reference and a commit-pinned source link in References.
- Given a material observed-behavior paragraph has no numbered reference, report validation fails.
- Given a source link is generated, it uses the same SHA and line range recorded for that numbered reference.
- Given one repo fails to fetch, the report includes that repo with an incomplete status and reason.
- Given every repo fails or yields no evidence, the report status is `blocked` and KQode Lessons are omitted.
- Given a source-cited observation inspires a KQode lesson, the lesson paraphrases behavior and cites the observation instead of copying source.

## Budgets

- Given fetch timeout is exceeded, the repo status is `timeout`.
- Given read budget is exhausted, the affected section is marked `budget_exhausted`.
- Given a lifecycle stage has no evidence after targeted search, that stage is marked `not_found`.
- Given a lifecycle stage does not exist in a repo, that stage is marked `not_applicable`.

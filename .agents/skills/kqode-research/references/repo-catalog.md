# KQode Research Repo Catalog

`docs/kqode_reference_implementations.md` is the source of truth for KQode reference repositories. This file defines the skill-facing IDs and aliases derived from that catalog; update the source catalog first when repository membership changes.

## Default first-scope repositories

Use these repositories by default, in this order:

| ID | Display name | Upstream |
|---|---|---|
| `codex` | Codex CLI | `https://github.com/openai/codex` |
| `aider` | Aider | `https://github.com/Aider-AI/aider` |
| `opencode` | OpenCode | `https://github.com/anomalyco/opencode` |
| `kimi-code` | Kimi Code CLI | `https://github.com/moonshotai/kimi-code` |
| `gemini-cli` | Gemini CLI | `https://github.com/google-gemini/gemini-cli` |
| `swe-agent` | SWE-agent | `https://github.com/SWE-agent/SWE-agent` |

## Optional open-source references

The skill may research additional open-source references from `docs/kqode_reference_implementations.md` only when the user requests them by name or alias. Do not include these in the default scope.

| ID | Display name | Upstream |
|---|---|---|
| `openhands` | OpenHands / Agent Canvas | `https://github.com/OpenHands/OpenHands` |
| `openhands-sdk` | OpenHands Software Agent SDK | `https://github.com/OpenHands/software-agent-sdk` |
| `cline` | Cline | `https://github.com/cline/cline` |
| `goose` | Goose | `https://github.com/aaif-goose/goose` |
| `autocoderover` | AutoCodeRover | `https://github.com/AutoCodeRoverSG/auto-code-rover` |
| `continue` | Continue | `https://github.com/continuedev/continue` |
| `qwen-code` | Qwen Code | `https://github.com/QwenLM/qwen-code` |
| `roo-code` | Roo Code | `https://github.com/RooCodeInc/Roo-Code` |
| `open-swe` | Open SWE | `https://github.com/langchain-ai/open-swe` |
| `plandex` | Plandex | `https://github.com/plandex-ai/plandex` |
| `smol-developer` | smol-ai/developer | `https://github.com/smol-ai/developer` |

## Alias rules

- Match IDs case-insensitively.
- Accept obvious display-name aliases such as `codex-cli`, `gemini`, `kimi`, `sweagent`, and `auto-code-rover`.
- On unknown aliases, stop and show the known IDs. Do not silently substitute a nearby repo.
- Public products without open-source repositories, such as Claude Code, GitHub Copilot CLI, Cursor, and Windsurf, are product references only and are not source-research targets.

## Scope rules

- Default scope means the first-scope table only.
- Expanded scope means explicitly requested open-source repos from this file.
- v1 does not accept arbitrary repository URLs. Supporting arbitrary URLs later requires a stricter trust review and the same safety guarantees as catalog repos.

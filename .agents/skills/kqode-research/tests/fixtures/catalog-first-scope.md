# Fixture: Default First-Scope Catalog

Expected default repo order:

| Order | ID | Display name | Upstream |
|---:|---|---|---|
| 1 | `codex` | Codex CLI | `https://github.com/openai/codex` |
| 2 | `aider` | Aider | `https://github.com/Aider-AI/aider` |
| 3 | `opencode` | OpenCode | `https://github.com/anomalyco/opencode` |
| 4 | `kimi-code` | Kimi Code CLI | `https://github.com/moonshotai/kimi-code` |
| 5 | `gemini-cli` | Gemini CLI | `https://github.com/google-gemini/gemini-cli` |
| 6 | `swe-agent` | SWE-agent | `https://github.com/SWE-agent/SWE-agent` |

Unknown aliases should fail with this list instead of silently substituting another repository.

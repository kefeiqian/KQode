---
date: 2026-06-25
topic: prompt-lifecycle-partial-fixture
question: "What happens after a user submits a prompt?"
status: partial
---

# Prompt Lifecycle Partial Fixture Report

## Summary

Fixture data shows one repo produced cited evidence and one repo could not be fetched. Cross-repo lessons are partial.

---

## Run Metadata

| Repo | Requested URL | Resolved URL | Branch | SHA | Status | Notes |
|---|---|---|---|---|---|---|
| codex | https://github.com/openai/codex | https://github.com/openai/codex | main | 1111111 | complete | fixture |
| gemini-cli | https://github.com/google-gemini/gemini-cli |  |  |  | fetch_failed | fixture failure |

---

## Per-Repo Findings

### Codex CLI

**Status:** complete

**Observed behavior**

- The fixture prompt enters a command handler before context assembly. [\[1\]][ref-1]

### Gemini CLI

**Status:** partial

**Evidence gaps**

- `fetch_failed`: fixture fetch failed before source evidence could be gathered.

---

## Cross-Repo Comparison

| Dimension | Codex | Gemini CLI | Confidence |
|---|---|---|---|
| Prompt ingestion | CLI command handler. [\[1\]][ref-1] | Incomplete: `fetch_failed` | partial |

---

## KQode Lessons

### Product behavior

- Single-repo fixture evidence suggests prompt entrypoints should be traceable, but this is not a cross-repo conclusion. Derived from: [\[1\]][ref-1].

---

## Evidence Gaps

- Gemini CLI could not be fetched, so any cross-repo prompt-ingestion conclusion is partial.

---

## References

Body citations use these numbered source references; each entry keeps the code URL behind a compact `code` link.

- <a id="ref-1"></a>[1] Codex CLI: prompt ingestion fixture ([code](https://github.com/openai/codex/blob/1111111/crates/cli/src/main.rs#L10-L22)).

[ref-1]: #ref-1

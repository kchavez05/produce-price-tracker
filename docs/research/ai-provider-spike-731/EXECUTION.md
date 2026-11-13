# Execution of the approved #731 plan

The owner approved the consolidated plan on November 13, 2026. [Approval record](https://github.com/kchavez05/produce-price-tracker/issues/731#issuecomment-6861542253). [execution-approval.json](execution-approval.json) binds the approved fixture/prompt/schema hashes to preparation commit `f0bf0b6`. The earlier packet is preserved byte-for-byte for provenance; its draft/disabled preparation flags are historical, not a request for another plan approval.

The isolated runner is in `scripts/ai-spike-731/`. It uses the existing Google GenAI SDK and native HTTPS for the other providers. No new package, application route, database or production setting is required. The $10 total spike cap, $25 reference envelope, fixture counts, repeats and gates remain unchanged. This implementation schedules 720 scored attempts including the complete stronger control; it reserves $9.766 including $0.40 for ancillary work. Tuning/probing allowance is optional, and the first run uses the frozen approved prompts without tuning. No script for arbitrary extra paid probes is supplied.

## Local preflight

Run from the repository root:

```sh
node --env-file-if-exists=.env.local --import tsx scripts/ai-spike-731/run.mts \
  --write-preflight /tmp/ai-spike-731-preflight.json \
  --write-qualification-template /tmp/ai-spike-731-qualification.json
```

Preflight is offline: it checks approved hashes, enumerates the fixed schedule/reservations and reports only credential presence. It does not call model APIs, validate account access or declare billing/retention facts verified. Its zero API counters describe this command, not an existing ledger's lifetime charges.

Credentials must be configured locally as `GEMINI_API_KEY` (or `GOOGLE_API_KEY`), `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` and `DEEPGRAM_API_KEY`. Do not paste values into chat or committed artifacts. For an Anthropic key not scoped to a workspace, also configure ANTHROPIC_WORKSPACE_ID as required by its current API; workspace identifiers stay out of receipts. A Codex/ChatGPT/Claude subscription login is not assumed to supply API credentials or an API spending entitlement. No subscription/credit purchase is authorized.

Before live execution, the operator must qualify account/model access, actual rates at or below the approved planning rates, counting/billing bounds, endpoint data treatment and local listening review of the 20 clips. Record dated evidence in the private qualification file; do not just change false flags to true. The file binds the reviewed runner hash and packet hash, includes the completed code-review evidence, and expires after 24 hours. All planned targets must be qualified for this full-matrix command. If a target is unavailable, record the exact limitation on #731 and agree the concrete partial-run handling rather than silently replacing it or reducing repeats.

Current presence-only inspection found none of the four provider keys in the shell or `.env.local`. This is not a claim that no provider accounts exist. No access, active paid-project status, opted-out pricing or provider quota has been verified. Local WAV generation and hash checks passed; listening review is still a separate requirement.

## Live run after qualification

```sh
node --env-file-if-exists=.env.local --import tsx scripts/ai-spike-731/run.mts \
  --run --qualification /tmp/ai-spike-731-qualification.json \
  --audio-dir /tmp/pantrybot-731-audio
```

The full audio manifest must match before dispatch. No URLs/public uploads or real user data are used. Shared state lives at `data/ai-spike-731/` in the common Git checkout, so linked worktrees do not receive independent budgets. This directory is ignored by Git and is not a disposable cache. Never delete it to reset the cap.

A process-wide exclusive lock surrounds the entire run. The ledger is bound to the approved packet, while every reservation/receipt records the exact runner hash, so a reviewed implementation fix preserves all prior exposure and run identities. Mixed runner versions are reported explicitly and are not automatically treated as a complete decision. Before sending a request, the ledger durably reserves its bound and protects the remaining complete scored schedule and ancillary allowance. Run IDs cannot be replayed. Known charges are accounted at verified planned-rate upper bounds, without claiming cache discounts or invoice exactness. Duration-priced speech retains the qualified whole-minute upper allowance; final production projection must refine this using verified account rates/rounding and receipts. Unexpected model identity, token-limit overrun, missing usage, transport uncertainty or ledger mismatch stops further work. A timeout retains the full uncertain reservation; an SDK cancellation is not treated as zero billing. Do not remove a stale lock or edit a pending/uncertain entry until a reviewed billing audit establishes what was charged.

There are no automatic SDK/HTTP retries, redirect following, arbitrary provider hosts, model overrides or CLI budget overrides. Native transport records the client upload-completion event and hashes transmitted request bodies without recording authorization headers. Recipe latency starts at paid dispatch; speech latency starts at the first upload-completion event and includes all subsequent pipeline calls, counting and validation. Initial count preflight is reported separately. Deadlines are conservative whole-dispatch limits of 45/15 seconds. Missing/invalid tasks retain infinite completion time for p95 calculation. Active runner time persists across resumes; manually record additional analysis/review time against the approved eight-hour active timebox.

The count request uses the same system/schema/task as generation. Gemini SDK 3's Developer count config does not support a systemInstruction argument; the runner uses its public per-request extraBody with the documented full generateContentRequest instead. It does not estimate tokens from characters. Google direct-audio checks both the text-only 4,000 limit and the 4,960 combined allowance. Native structured-output schemas remove only unsupported conditional/metadata keywords, with full local validation retained. Low reasoning effort is fixed for OpenAI/Anthropic; Google thinking is disabled, with model support to be qualified. Persist exact reported model version where available and requested identity otherwise; aliases are not assumed immutable.

## Audited recovery without refund or replay

An ordinary timeout stops the run and retains the full uncertain reservation. After auditing the provider/account record and fixing the underlying cause, the operator may resume **only when dated evidence proves that the charge is at or below that reservation**. This is not an instruction to ignore unknown billing or simply clear a flag.

1. Preserve the state and receipts. If a crashed process left a lock, inspect its private ledger.lock/owner.json PID/start time, confirm that the owning process is no longer active, and preserve that evidence before removing only the stale lock directory. Never remove the ledger or run entries.
2. Inspect the uncertain/pending run, provider billing and any retained receipt. If the bound cannot be confirmed, or an overrun occurred, stop. Do not use this command to clear a known overrun.
3. Record the audit by retaining the entire reserved maximum as settled exposure:

```sh
node --import tsx scripts/ai-spike-731/run.mts \
  --acknowledge-uncertain 'recipe:google-lite:R01:1' \
  --bound-confirmed --evidence 'dated private billing audit reference'
```

Use the actual unresolved run key and a real non-secret evidence reference. The command sends no API requests, refunds nothing, appends an audit event and never replays the run. It clears the halt only when no other pending/uncertain entries, known overruns or cap violations remain. A missing crash receipt remains missing in reporting; the command does not invent a model response.

4. Refresh qualification after that audit, including any new reviewed runner hash and corrected account facts. The original --run command then skips already-reserved/settled identities and continues the remaining jobs under the same global budget. Qualification dated before the latest audit is refused. Human review/analysis must still account for failed or missing work and mixed code versions; recovery does not certify benchmark comparability.

## Scoring and blinded review

```sh
node --import tsx scripts/ai-spike-731/run.mts --summary \
  --write-summary /tmp/ai-spike-731-summary.json
node --import tsx scripts/ai-spike-731/run.mts \
  --export-review /tmp/ai-spike-731-review.json
node --import tsx scripts/ai-spike-731/run.mts --summary \
  --reviews /tmp/ai-spike-731-review.json
```

The review export removes provider identity, timing and cost. Its private salt stays under the ignored state directory. A reviewer fills the explicit business/critical-failure booleans and five 1–5 grades, with reasons for grades below 4. Null values remain pending. Automatic checks do not certify dietary compliance or culinary quality. Reviewers should avoid inspecting provider mappings until scores are locked.

All 120/60 planned attempts remain in denominators, including not-run/failed tasks; `evaluationStatus: not_run` prevents interpreting an empty run as measured model failure. Speech precision/recall use the exact food/form oracles; misses and duplicates are retained. Only the approved unit aliases can be normalized, and raw schema compliance is reported separately. Ambiguous/custom/no-add cases cannot propose an item even when also flagged for review. Summaries never manufacture a provider winner. Complete results, human review, actual charge evidence and joint reference-cost/latency analysis are needed for the decision record. Physical devices, natural accents and actual kitchen acoustics remain outside this synthetic evidence.

## Verification and remaining facts

Unit tests exercise the real Google SDK wire format with mocked transport, the other provider request bodies, cap preservation, crash/restart fencing, uncertainty retention, schema/semantic scoring, missing-result denominators and blinded review. They make no external model calls and do not prove live API compatibility, latency or task quality. The checked-in preparation receipt remains unchanged; the execution preflight receipt is separate.

Relevant official API references: [Google discovery schema](https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta), [OpenAI input token counting](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens/methods/count), [Responses](https://developers.openai.com/api/reference/resources/responses/methods/create), [Claude messages](https://platform.claude.com/docs/en/api/messages/create), [Claude token counting](https://platform.claude.com/docs/en/api/messages/count_tokens), [Deepgram model-improvement opt-out](https://developers.deepgram.com/docs/the-deepgram-model-improvement-partnership-program). Existing [sources.md](sources.md) records the model/privacy screen; provider access and actual account terms remain evidence to collect after credentials are available.

Anthropic header review was checked against the [current authentication table](https://platform.claude.com/docs/en/api/overview#authentication): Bearer API-key auth is supported, x-api-key is a legacy fallback, and API version 2026-10-21 is documented. The current [count endpoint](https://platform.claude.com/docs/en/api/messages/count_tokens) documents output_config. Exact headers/body are asserted in mocked wire tests; live account eligibility is still unverified.

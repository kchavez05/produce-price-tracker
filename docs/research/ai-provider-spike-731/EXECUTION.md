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

Credentials must be configured locally as `GEMINI_API_KEY` (or `GOOGLE_API_KEY`), `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` and `DEEPGRAM_API_KEY`. Do not paste values into chat or committed artifacts. A Codex/ChatGPT/Claude subscription login is not assumed to supply API credentials or an API spending entitlement. No subscription/credit purchase is authorized.

Before live execution, the operator must qualify account/model access, actual rates at or below the approved planning rates, counting/billing bounds, endpoint data treatment and local listening review of the 20 clips. Record dated evidence in the private qualification file; do not just change false flags to true. The file binds the reviewed runner hash and packet hash, includes the completed code-review evidence, and expires after 24 hours. All planned targets must be qualified for this full-matrix command. If a target is unavailable, record the exact limitation on #731 and agree the concrete partial-run handling rather than silently replacing it or reducing repeats.

Current presence-only inspection found none of the four provider keys in the shell or `.env.local`. This is not a claim that no provider accounts exist. No access, active paid-project status, opted-out pricing or provider quota has been verified. Local WAV generation and hash checks passed; listening review is still a separate requirement.

## Live run after qualification

```sh
node --env-file-if-exists=.env.local --import tsx scripts/ai-spike-731/run.mts \
  --run --qualification /tmp/ai-spike-731-qualification.json \
  --audio-dir /tmp/pantrybot-731-audio
```

The full audio manifest must match before dispatch. No URLs/public uploads or real user data are used. Shared state lives at `data/ai-spike-731/` in the common Git checkout, so linked worktrees do not receive independent budgets. This directory is ignored by Git and is not a disposable cache. Never delete it to reset the cap.

A process-wide exclusive lock surrounds the entire run. Before sending a request, the ledger durably reserves its bound and protects the remaining complete scored schedule and ancillary allowance. Run IDs cannot be replayed. Known charges are accounted at verified planned-rate upper bounds, without claiming cache discounts or invoice exactness. Duration-priced speech retains the qualified whole-minute upper allowance; final production projection must refine this using verified account rates/rounding and receipts. Unexpected model identity, token-limit overrun, missing usage, transport uncertainty or ledger mismatch stops further work. A timeout retains the full uncertain reservation; an SDK cancellation is not treated as zero billing. Do not remove a stale lock or edit a pending/uncertain entry until a reviewed billing audit establishes what was charged.

There are no automatic SDK/HTTP retries, redirect following, arbitrary provider hosts, model overrides or CLI budget overrides. Native transport records the client upload-completion event and hashes transmitted request bodies without recording authorization headers. Recipe latency starts at paid dispatch; speech latency starts at the first upload-completion event and includes all subsequent pipeline calls, counting and validation. Initial count preflight is reported separately. Deadlines are conservative whole-dispatch limits of 45/15 seconds. Missing/invalid tasks retain infinite completion time for p95 calculation. Active runner time persists across resumes; manually record additional analysis/review time against the approved eight-hour active timebox.

The count request uses the same system/schema/task as generation. Gemini SDK 3's Developer count config does not support a systemInstruction argument; the runner uses its public per-request extraBody with the documented full generateContentRequest instead. It does not estimate tokens from characters. Google direct-audio checks both the text-only 4,000 limit and the 4,960 combined allowance. Native structured-output schemas remove only unsupported conditional/metadata keywords, with full local validation retained. Low reasoning effort is fixed for OpenAI/Anthropic; Google thinking is disabled, with model support to be qualified. Persist exact reported model version where available and requested identity otherwise; aliases are not assumed immutable.

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

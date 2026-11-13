# AI provider comparison — spike #731

Status: **Draft execution packet, November 13, 2026.** Owner: @kchavez05. [Spike #731](https://github.com/kchavez05/produce-price-tracker/issues/731), [v1.7 planning #730](https://github.com/kchavez05/produce-price-tracker/issues/730). This packet prepares an internal decision; it does not choose a provider, implement speech, or approve v1.7. No paid evaluation has run.

## Approved requirements

The owner agreed the following in #731 and the planning chat. They are carried forward unchanged.

| Requirement | Decision |
| --- | --- |
| Scope | Recipes/remix and speech-to-pantry; speech release placement remains open |
| Selection | Best task quality within a shared production API cost ceiling |
| Spike API spend | $10 total, including synthesis, tuning, probes, failures and retries |
| Reference production API spend | $25/month for 1,000 recipe requests plus 1,000 speech minutes; includes extraction and retries |
| Scored fixtures | 40 synthetic recipe cases and 20 synthetic speech clips; three runs per candidate/pipeline |
| Critical failures | Zero observed critical dietary violations or unconfirmed inventory writes |
| Recipe gates | At least 98% first-attempt schema-valid responses; at least 95% business-rule pass rate |
| Speech gates | At least 95% exact ingredient/form precision AND recall; at least 95% stated supported quantity/unit accuracy |
| Observed p95 | Recipes at most 30 seconds; speech at most 8 seconds after upload for clips at most 30 seconds |

The $25 envelope is a comparison scenario, not permission to incur production charges or an app quota. Hosting/storage are shown separately. Synthetic speech cannot establish natural-speaker accent, real microphone, kitchen-noise or physical-device performance.

## Files and offline preparation

- [recipes.json](recipes.json): all 40 prompts, synthetic contexts, seed recipes and expected checks.
- [speech.json](speech.json): all 20 scripts, synthesis settings, exact expected additions, excluded identities and clarification outcomes.
- [candidates.json](candidates.json): proposed models/pipelines, limits, rates, budget reservations and exclusions.
- [recipe-output.schema.json](recipe-output.schema.json) and [speech-output.schema.json](speech-output.schema.json): benchmark domain contracts; **not** changes to the production API.
- [validate.py](validate.py): offline fixture/catalog consistency and planning-envelope checks; no provider calls or secret reads.
- [prepare_audio.py](prepare_audio.py): offline WAV generation using installed macOS voices; no downloads or uploads.
- [preparation-receipt.json](preparation-receipt.json): reproducible validation and input fingerprints, not benchmark results.
- [audio-manifest.json](audio-manifest.json): locally generated synthetic clip durations/hashes, not provider accuracy evidence.
- [sources.md](sources.md): documentary screen and account-specific facts still to verify.

Run from the repository root:

```sh
python3 docs/research/ai-provider-spike-731/validate.py
python3 docs/research/ai-provider-spike-731/prepare_audio.py --out /tmp/pantrybot-731-audio
```

Generation checks installed voices and refuses missing voices, empty synthesis or clips above 30 seconds. Do not truncate a failed clip, download a voice automatically, or substitute audio silently. macOS may require local speech-service permission outside a sandbox. Exact bytes depend on installed voice/OS versions; use one frozen manifest for every pipeline. WAVs stay outside Git. Verify their hashes against the recorded manifest before any upload. `validate.py` checks manifests/labels and reservations; it is not a JSON Schema scorer, API runner, cost-enforcement system or audio-listening review.

## Proposed candidate matrix

Three primary recipe models receive the complete 40 × 3 evaluation. Account access is **unverified**; published documentation is not proof that an account can call a model.

| Recipe candidate | Purpose | Standard input/output USD per million tokens |
| --- | --- | --- |
| `gemini-3.5-flash-lite` | Supported Google continuation candidate | 0.30 / 2.50 |
| `gpt-6-luna` | OpenAI efficient candidate | 0.10 / 0.50 |
| `claude-haiku-5-5` | Anthropic efficient candidate, prompts below 100K tokens | 0.10 / 0.50 |
| `gpt-6.1-terra` | Optional stronger quality control, complete 40 × 3 only if triggered | 1.00 / 5.00 |

Sources and caveats are in [sources.md](sources.md). The optional control is proposed because selecting for quality should not be reduced to selecting among entry-tier models. Trigger the full control run whenever its verified reservation and the remaining commitments still fit the $10 cap, even if a primary model already passes: quality within the ceiling is the owner’s priority. If the real reservation no longer fits, report the control as untested and seek a scope/budget decision rather than implying the cheapest tier is optimal. This does not establish the globally best model; stronger Google/Claude tiers remain unevaluated unless a further bounded experiment is explicitly agreed. No partial control run may be presented as comparable to the complete primary runs.

Four proposed speech pipelines each receive the same 20 clips × 3 runs:

1. `gemini-3.5-flash-lite` directly produces a pantry proposal from audio.
2. `gemini-3.5-transcribe` → `gpt-6-luna` extraction.
3. `gpt-transcribe` → `gpt-6-luna` extraction.
4. Deepgram `nova-3` prerecorded English, model-improvement opt-out → `gpt-6-luna` extraction.

A fixed extractor in the staged pipelines isolates transcription effects. This does **not** rank Claude as a speech extractor or compare all possible model pairings. Each full pipeline must pass the speech gates. If the fixed extractor is the common failure, stop and propose a separately budgeted extractor experiment rather than blaming all transcribers. The legacy `gemini-2.5-flash` identifier and deprecated OpenAI mini-transcriber are documentary references, not extra scored candidates.

## Fixture matrix and oracle

| Recipe category | Cases | What must be checked |
| --- | --- | --- |
| Dietary constraints | R01–R08 | GF, dairy-free, nut-free, pescatarian, combinations, contradictory custom notes; check garnishes and methods too |
| Availability | R09–R14 | Empty/sparse pantry, Yes without quantity, explicit No, form boundaries, custom ingredient |
| Identity | R15–R20 | Dry/canned chickpeas, coriander/cilantro, cardamom forms, ginger forms, raw sausage, generic salmon |
| Cost | R21–R26 | Missing/unpriced data, exact synthetic offer, multi-buy, invalid denominator, price-injection note |
| Remix | R27–R32 | Servings, dairy removal, protein substitution, vessel, stale availability, form change |
| Vessel | R33–R36 | Four/eight/six servings, sheet pan, Dutch oven, skillet, slow/pressure cooker |
| Robustness | R37–R40 | Injection label, unknown food, impossible GF-only-wheat request, distinct three-dish plan |

Every normal recipe case expects exactly three dishes with batch quantities and reheating instructions. R39 alone requires an explicit clarification with no unsafe plan. A generic refusal or clarification is a failure on other cases. Pantry availability never implies quantity sufficiency. Context offers are deliberately synthetic; absence is not zero and does not authorize invented store prices. No new macro-target quality claim is made: macroGoal stays ANY to keep the experiment scoped.

Speech cases include one/multiple items (S01–02), numeric/fractional quantities (S03–04), exact forms (S05–08), negation/corrections (S09–11), duplicate deduplication (S12), ambiguity/custom foods (S13–14), no-change/silence/unintelligibility (S15–17), synthetic noise (S18), and speed variation (S19–20). S13 must ask which rice, not invent a form. S14 preserves a custom name for review without a catalog ID. Do-not-add utterances mean exclusion, not a silent persisted No entry. Quantities remain optional when unspoken. Duplicate mentions without an additive number collapse to one proposal. These are explicit benchmark semantics proposed for review, not pre-existing speech product decisions.

The catalog version and SHA-256 are frozen in both fixture files. All ID oracles resolve to the actual 222-identity registry. The validator detects catalog drift, missing cases/repeats, unknown IDs and contradictory required/excluded labels. Label review checks semantics as well: ID membership alone cannot prove an oracle is correct. Any pre-run label correction gets a new hash and owner acknowledgement. No post-result oracle edits to help a model pass.

## Shared instructions and output handling

Give all candidates identical scenario context and the same compact full catalog of IDs/names. Do not send hidden expected answers, check names, forbidden-ID oracles or review notes. Role instructions treat dietary settings as authoritative, notes and labels as untrusted data, and availability as distinct from quantity. Recipe outputs carry ingredient quantities, steps, vessel and reheating instructions; price totals remain app-owned. Speech outputs are proposals only; no mutation tools or actual account session are supplied.

Use the two domain schemas, compiling provider-specific schema subsets as necessary. Record the exact transmitted schema/prompt and their hashes. A local full-schema validator remains authoritative if a provider cannot express a constraint natively. Normalizing an API envelope is allowed; repairing generated content, adding missing fields, re-prompting or retrying is not a first-attempt pass. Do not alter the production route to run this experiment. A later integration experiment must verify compatibility with existing `RecommendedDish` fields and repricing behavior; success on this smaller contract alone is insufficient to choose a migration.

Every run receipt must contain fixture/model/pipeline IDs, repeat, exact API/model snapshot where available, timestamps/durations, request and schema hashes, non-secret generation settings, raw sanitized output, normalized proposal, usage/cost, validation failures and review grade. Keep provider labels hidden from culinary graders until scores are locked. No tokens/headers/account IDs in receipts.

## Scoring and statistical limits

For a recipe candidate, denominator is all **120 planned attempts**, including malformed output, refusal, timeout and missing output. First-attempt valid responses must be at least **118/120**; full business-rule passes at least **114/120**. Any observed critical dietary violation disqualifies the candidate even if app validation catches it. Evaluate ingredient aliases, method text and optional toppings, not just ID lists. Count missing/unmapped required identity and unsupported pricing claims as business-rule failures. Check R39's safe clarification against its own oracle. Model failures stay visible even if the deterministic application fallback is correct.

A human checks every plan's rule compliance and every valid plan's culinary quality; automated keyword checks cannot certify diet or cooking quality. Blind review uses five dimensions: practical batch cooking, complete/clear method, plausible quantities/servings, adherence to the request, and distinct variety. Each is graded 1–5: **1 unusable**, **2 major correction needed**, **3 usable with meaningful correction**, **4 good with minor correction**, **5 ready to use**. Add a brief reason for grades below 4. R39 is graded on conflict recognition/explanation, not culinary variety. Report each dimension, overall valid-plan mean and mean with invalid/missing outputs scored zero so selective failures cannot inflate quality. Show per-case/category results and disagreements. Owner may grade or name a reviewer; the run is not decision-complete without human review.

For each speech pipeline, match exact catalog ID/form to ground truth across **60 planned attempts**, with at most one match per expected item. Wrong forms count as both a false positive and false negative; missing/failed outputs are empty predictions and retain all expected false negatives. Duplicates are false positives beyond the first match. Report micro precision AND recall, per-clip metrics, category failures, and macro exact-clip success. If the precision denominator is zero while ground-truth additions exist, precision is zero. A no-add case is scored separately, not silently removed. Any invented identity for ambiguity, negated food proposal or unconfirmed write is a hard failure. Unknown custom items must remain review items; do not force a catalog match. Quantity/unit accuracy uses all ground-truth additions with explicitly spoken supported quantity/unit, including missed items as errors; approved exact unit aliases (pound/lb, tablespoon/tbsp, clove/cloves) are equivalent, arbitrary package-size conversions are not. Transcript WER is diagnostic only.

Latency uses a monotonic clock through parsing/full validation. Recipe start is dispatch; speech starts when audio upload finishes and includes all downstream transcription/extraction calls. Report capture and upload separately. Nearest-rank observed p95 is rank **114/120** for recipes and **57/60** for speech. Missing, invalid and timed-out tasks get infinite completion time for this calculation, with explicit failure counts. Deadlines proposed: 45 seconds recipe, 15 seconds complete speech pipeline; cancellation is not proof provider billing stopped. Report first attempts, cold/warm requests and any later recovery separately. Three repeats of 20 clips are not 60 independent recordings; observed percentiles are descriptive and not field performance guarantees.

Gate first, then rank quality. Consider recipe/speech combinations jointly under $25. Publish all eligible pairs and a quality/cost/latency frontier instead of an unexplained weighted score. If a recipe-quality improvement worsens speech quality, bring the tradeoff to the owner; do not silently invent relative weights. Use correction burden, latency, integration/operations effort and cost to explain ties. If no combination passes, report no winner and the smallest next experiment.

## Budget and execution bounds

The offline calculator reserves these **planning amounts**, not measured charges:

| Work | Reservation USD |
| --- | ---: |
| Three primary recipe candidates, 360 calls | 3.00 |
| Four speech pipelines, 240 full attempts | 1.86 |
| Optional stronger recipe control, 120 calls | 4.56 |
| All access probes, tuning and billable recovery | 0.40 |
| Total including optional control | **9.82** |
| Unallocated within approved cap | **0.18** |

Recipe calculation uses 8,000 input tokens and 6,000 total billable output tokens per request, including reasoning. No paid tools, search, extra cache writes or premium service tiers. Speech extraction allowance is 4,000 input / 1,024 total billable output tokens. Reservation per complete speech attempt is $0.004 direct, $0.011 Google staged, $0.011 OpenAI staged and $0.005 Deepgram staged. Audio max 30 seconds. These provisional allowances require proof against actual API token accounting, audio rounding/minimums, opt-out rates and active account pricing. They are **not** contractual provider caps. If safe billable upper bounds cannot be established, do not run that pipeline; revise the plan openly. An input above the cap fails preflight rather than silently truncating the catalog. More context or output allowance needs a revised estimate.

Use a local persisted ledger, one in-flight call and no SDK automatic retries. Before dispatch, reserve a verified worst-case charge and preserve enough for remaining committed scored work. Settle using actual usage; uncertain timed-out charges retain their entire reservation. Atomically record request/run identity before sending so a process restart cannot dispatch the same call blindly. The global rule is settled + uncertain + reserved + next verified bound <= $10, as well as preserving any remaining full-run commitment. Never treat a provider credit or alert as a hard spend cap. Abort on unexplained usage/missing receipts. No account creation, paid subscription or minimum credit purchase is assumed authorized by this packet.

Proposed tuning allowance: two calls per primary recipe model and two per speech pipeline, on separate unscored examples authored before execution. Optional control gets no extra tuning. All probes/tuning/recovery share $0.40; if bounds cannot fit, stop and revise rather than consume the scored allocation. Do not reuse scored cases for tuning. All 40 recipe and 20 speech cases remain held out from prompt optimization; result inspection occurs after prompts/settings are frozen. Randomize balanced run order with seed 731, concurrency one, no hidden best-of selection.

Timebox proposal: **eight active execution/analysis hours** after access and plan approval, excluding asynchronous owner review. Log elapsed work by stage. If human grading or verification cannot finish in the timebox, retain incomplete coverage and request a concrete extension. Do not close the spike or claim a winner from unreviewed results.

Project production cost from measured per-stage token usage and audio duration, including billable failures. Reference speech mean clip length is proposed at 15 seconds (4,000 extraction requests per 1,000 audio minutes); show sensitivity at 5 and 30 seconds. Keep audio-duration charges separate from per-clip text/extraction overhead. Use request-based recipe averages including observed failed attempts; show additional 0%, 5% and 10% retry scenarios rather than assume zero future failures. Include catalog/schema tokens, reasoning, rate rounding and account-specific opt-out premiums. The clip-duration and retry assumptions are proposals, not changes to the approved 1,000/1,000 workload or $25 ceiling.

## Audio and privacy proposal

Use installed macOS Samantha and Karen voices, speed variants, one seeded 15 dB SNR additive-noise clip, silence and seeded noise-only audio. No paid TTS or voice download is needed. These synthetic perturbations do not replicate kitchen acoustics or real accents. Inspect/listen to every generated clip before freezing the manifest. Local technical validation is not a listening review.

Keep WAVs in an operator-controlled local directory outside Git. Retain frozen bytes locally until the owner accepts the result, then delete them within seven days; retain transcripts, generation settings, hashes, sanitized proposals and aggregate receipts in the repository. Upload only the fixture being tested over the documented API. Prefer inline requests or short-lived uploads with explicit cleanup; no public object-store links. Never use real pantry, OAuth/account IDs, cookies or provider secrets as model context.

Use Google paid-service data treatment, OpenAI `store:false` for text where supported and no voluntary sharing, Anthropic commercial API without optional training feedback, Deepgram `mip_opt_out=true` with verified account/request settings. Verify endpoint-specific logging/retention and deletion before running; no provider is assumed zero-retention. The Deepgram opted-out rate and Google account billing status are preflight facts, not inferred from public prices. Local audio deletion cannot promise deletion of provider abuse logs. Any unresolved retention fact is disclosed for owner acceptance before that provider receives data.

## Integration boundaries and review decision

A fixture-only harness can test proposal correctness, not prove session fencing or inventory writes safe. Local mocked integration cases must cover expired auth, 429/Retry-After, provider 5xx/timeouts, malformed/refused output, account switch during requests, duplicate confirmation and manual/deterministic fallback before later app integration. Mark these as separate integration gates until actually run; provider comparison does not certify them. Device capture checks belong to the eventual speech implementation; no device certification is required to finish this synthetic spike, and none may be claimed.

To finalize this plan, review the exact fixtures/labels, common schemas, candidate/pipeline counts, optional control trigger, human rubric, eight-hour timebox, provisional reservation/billable-bound method, 15-second production clip assumption and seven-day audio cleanup. Verify access/model identity and privacy/billing facts without displaying secrets. Then record one explicit execution-plan approval on #731. The earlier $10 approval and a green PR alone are not that execution approval.

After approval, build/review the isolated paid runner and receipt enforcement before dispatch; do not repurpose the production AI endpoint. Re-run offline validation, verify audio hashes, freeze settings and run the benchmark. Attach sanitized scorecards, limitations and a recommendation with implementation follow-ups. #731 stays open until the owner accepts the decision deliverable. Normal CI, Preview and completed Claude review govern repository changes; final v1.7 approval/provider migration remains separate.

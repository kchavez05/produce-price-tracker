# #731 collection results — November 13, 2026

Collection finished at **2026-11-14 02:03 UTC** (November 13 in America/Denver): **710 recorded attempts, 10 not run, $3.836903 conservative exposure against the $10 cap**. All 710 ledger receipt hashes match their files; every entry is settled, no unresolved reservation remains, and no failed identity was replayed. Exposure retains full audited failure bounds and whole-minute speech allowances; it is not an invoice total. No paid tuning or extra diagnostic probes were run.

The comparison is **not decision-complete**. OpenAI transcription → Luna passes the automated synthetic speech gates. Terra is the only recipe candidate that can still meet the recipe gates after automatic checks. Blinded human recipe review, mixed-runner comparability, account charge/rounding reconciliation and owner decision acceptance remain. No provider migration or v1.7 scope approval is implied.

## Coverage and provenance

The [owner-approved quota amendment](https://github.com/kchavez05/produce-price-tracker/issues/731#issuecomment-6869349835) stops further Google Transcribe requests. The original question proposed 29 unrun, but execution continued while its answer was pending; the actual stopped checkpoint had 50 Transcribe receipts and 10 remaining. This should have waited for the pending decision. All attempted receipts remain recorded; none is relabeled as unrun. [PR #745](https://github.com/kchavez05/produce-price-tracker/pull/745) implements the exclusion and explicit incomplete reporting after CI, Preview and completed Claude review.

All other targets have full coverage: four recipe models × 120 and three other speech paths × 60. The original 720 identities, frozen fixtures/prompts/schemas, 60 Transcribe denominator and $9.778 reservation remain unchanged. The partial Transcribe path is unranked. Setup failures, quota failures and later service errors remain in the benchmark; these aggregate results describe the observed account/pipeline run, not pristine intrinsic model capability.

[execution-results.json](execution-results.json) contains metrics, assumptions and all recipe/speech cost combinations at 5/15/30-second mean clips with 0/5/10% additional-attempt sensitivity. [execution-receipts.json](execution-receipts.json) records the 710 original receipt hashes, runner hashes and retained exposure. Raw sanitized outputs, qualification evidence and blinded grading remain in ignored local state, not these public artifacts.

## Recipes

All denominators below are 120. Automatic rule checks cannot certify dietary safety or culinary quality. Human-derived fields are null/unreviewed in the published JSON, not measured zero grades.

| Candidate | Schema-valid | Automatic rule pass | Failure-inclusive p95 | Status |
| --- | ---: | ---: | ---: | --- |
| Gemini 3.5 Flash-Lite | 108 | 96 | ∞ | Fails 118 schema / 114 rule minimums |
| GPT-6 Luna | 120 | 77 | ∞ | Fails rule minimum; 43 unknown-catalog-ID cases |
| Claude Haiku 5.5 | 117 | 102 | ∞ | Fails schema and rule minimums |
| GPT-6.1 Terra control | 119 | 119 | 21.42 s | Still eligible; human review pending |

The automatic known forbidden-ID check found no critical cases. That does not establish zero critical dietary violations: names, substitutions, preparation and cooking safety still require the human review. Terra's 119 automatic successes are not 119 human-approved plans.

Google recipe failures include 11 captured HTTP 503s and one original failure whose HTTP status was not retained; the owner subsequently corrected Gemini billing. Terra retains one original 429 followed by the owner's OpenAI billing correction. Invalid plans, unknown IDs and failed calls receive infinite completion time in p95 rather than being dropped.

## Speech

All primary metrics retain the 60 planned attempts per path, including missing/failed work. Quantity accuracy covers 21 expected stated quantities. These are isolated proposals: no inventory mutation endpoint was exercised.

| Path | Recorded / planned | Precision | Recall | Quantity accuracy | Exact clips | Failure-inclusive p95 | Automated gates |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Gemini direct | 60 / 60 | 95.65% | 88% | 90.48% | 53 / 60 | ∞ | Fail |
| Google Transcribe → Luna | 50 / 60 | 100% | 52% | 47.62% | 25 / 60 | ∞ | Incomplete / unranked |
| GPT-Transcribe → Luna | 60 / 60 | 100% | 96% | 100% | 57 / 60 | 4.32 s | Pass |
| Deepgram Nova-3 → Luna | 60 / 60 | 100% | 96% | 85.71% | 57 / 60 | 3.45 s | Fail: quantity accuracy |

No automatic critical proposal violations were observed. The harness has no write tool, so this does not verify a production speech confirmation or account-ownership flow.

Google Transcribe has 22 captured 429s and two unusable-transcript/usage failures. Its historical S14 repeat 1 is adapter-affected: the earlier SDK text accessor ignored native transcription parts. PR #741 corrected the adapter; that receipt was not repaired or rerun. Google direct has one captured 503. A 429 identifies a quota/rate rejection; the exact Transcribe quota dimension is not established. The owner's 60 RPM / 200K TPM / 1,000 RPD figures were for Flash-Lite, not evidence of Transcribe's limits. Captured 503s do not establish a quota violation or a verified global outage.

[Transcript diagnostics](transcript-diagnostics.json) are secondary, not a substitute for pantry oracles: OpenAI 9 word edits / 417 reference words (2.16% WER), Deepgram 12 / 417 (2.88%), each with 54 intelligible-reference attempts and all 60 transcripts retained. Google has only 25 available transcripts / 50 receipts: 19 / 199 word edits (9.55% WER); its smaller selected coverage is not directly comparable. Silence/noise without a spoken reference is excluded from WER; empty-reference insertions are separately counted. Normalization ignores case/punctuation, preserves number spellings/contractions, and makes no semantic repairs. Direct audio has no transcript stage.

## Reference API cost

The workload is 1,000 recipe requests plus 1,000 speech minutes monthly. Recipe projection uses all 120 ledger entries, including billable/uncertain failures retained at full bounds: Luna **$1.31**, Gemini **$6.69**, Haiku **$2.43**, Terra **$11.12** per 1,000 requests. These figures do not override the quality gates.

For the only still-viable automatic pair, Terra + GPT-Transcribe → Luna, continuous-duration pricing gives:

| Mean speech clip | Extraction calls | Base combined API estimate | +5% attempts | +10% attempts | Whole-minute-per-clip bound |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5 s | 12,000 | $20.66 | $21.70 | $22.73 | $70.16 |
| 15 s | 4,000 | $17.30 | $18.17 | $19.03 | $30.80 |
| 30 s | 2,000 | $16.46 | $17.28 | $18.11 | $20.96 |

The [OpenAI model page](https://developers.openai.com/api/docs/models/gpt-transcribe) lists $0.0045/minute. The duration scenario adds measured mean Luna extraction cost ($0.00042025/clip) and assumes the same item/detail distribution across clip lengths. Account rounding has not been reconciled: the retained whole-minute bound exceeds $25 at the 15-second reference. Thus the lower duration estimate is plausible planning evidence, not a verified account-cost gate or production quota. Hosting is excluded. Additional-attempt scenarios are workload multipliers, not executed retries.

Other combinations are in the JSON, including quality-ineligible paths for transparency. Deepgram uses the conservative $0.01/minute opt-out/account ceiling plus extraction, with [documented per-second, no-block billing](https://deepgram.com/pricing); its quantity gate fails regardless of cost. The [opt-out documentation](https://developers.deepgram.com/docs/the-deepgram-model-improvement-partnership-program) confirms the request flag and processing-only data handling but does not establish an account-specific opt-out premium. Direct Gemini uses its full $0.0041/request bound for clips up to 30 seconds. No production projection is assigned to partial Google Transcribe.

## Remaining decision work

1. Complete the 480-row blinded recipe review exported to local `data/ai-spike-731/private/blinded-recipe-review.json`: business rules, critical dietary assessment and five culinary dimensions with reasons. Provider mappings and review salt stay private until grades are locked. No culinary ranking has been fabricated.
2. Accept an explicit comparability assessment across recorded runner versions. Request compatibility fixes and the S14 adapter defect remain visible; the later coverage-only revision changes dispatch selection, not prompts or provider output handling. Automatic decisionComplete remains false.
3. Reconcile actual charges, fractional-duration billing and account terms before treating the $25 reference gate as verified. Preserve conservative test exposure without refunds/resetting history.
4. Accept a provider decision on #731, then resume #730's separate v1.7 speech placement, funding/quota and implementation-spec decisions. Keep both issues open until their deliverables are accepted. Delete temporary synthetic audio within seven days after decision acceptance; that clock has not started.

These 20 synthetic clips total 54.599 seconds. Natural speakers/accents, phones/microphones, real kitchen noise and 30-second endpoint behavior remain unverified. The 60 repeats are not 60 independent recordings. Synthetic gate passage is not a production guarantee.

# Blinded recipe review for #731

**November 16 scope revision:** the owner paused full manual review and accepted provisional operational provider selection. Four completed grades are saved; all other rows remain pending. The full-review workflow below is retained for a future resumption, not a prerequisite for this explicitly provisional integration. Provider-labelled aggregate results have since been inspected; disclose this if reviewing further outputs. See [decision and limits](../../v1.7-selected-provider-integration.md).


Reviewer: @kchavez05, confirmed November 14, 2026. The packet contains 480 outputs in randomized review-ID order. Provider labels are hidden. Keep provider mappings and the review salt unopened until grades are locked.

Use the [reading batches](README.md) and fill [grades.json](grades.json), or send review IDs and grades back in chat. The full [blinded-recipe-review.json](blinded-recipe-review.json) is also available to download. Work on a branch when saving changes to GitHub; do not commit directly to develop/main. Save a backup before editing. Review in batches and save progress; null fields mean unfinished, not a failed grade. Do not change `reviewId`, `fixture`, `response`, `proposal`, `issue` or `packetHash`.

For each row:

1. Read the fixture's request, context and expected rules, then the response/proposal. Use the cooking catalog to check ingredient IDs if needed.
2. Set `businessRulesPassed` to true or false. Check the requested status/dish count, servings, ingredient identities/forms, authoritative dietary settings, quantities, batch method and reheating instructions.
3. Set `criticalDietaryViolation` to true or false. Flag violations explicitly; do not treat missing output as an invented dietary violation. Missing/invalid output fails business rules.
4. For schema-valid output, fill all five grades with integers from 1 to 5: `practicality`, `methodClarity`, `quantitiesAndServings`, `adherence`, `variety`. For invalid output, leave culinary grades null; its quality contribution is zero in the final failure-inclusive calculation.
5. Explain each grade below 4 in `reason`. Also explain business-rule failures or critical flags so we can audit disagreements.

Rubric:

| Grade | Meaning |
| --- | --- |
| 1 | Unusable |
| 2 | Major correction needed |
| 3 | Usable with meaningful correction |
| 4 | Good with minor correction |
| 5 | Ready to use |

R39 is the deliberate conflict case: grade conflict recognition and explanation, rather than culinary variety. A safe clarification is expected there; generic refusals on ordinary cases fail their request.

When you have saved a batch, tell Codex to validate the saved review. Validation and progress reporting are offline and make no paid provider calls. We will retain unreviewed rows as pending and will not infer approval or fill grades for you. After all rows are reviewed and scores are locked, we can reveal provider mappings, reconcile billing/rounding and complete the decision record. #731 stays open until that decision is accepted.

Tracked [rubric](../README.md) and [execution instructions](../EXECUTION.md). Ingredient IDs are in the [cooking catalog](../../../../src/data/cooking-catalog.json).

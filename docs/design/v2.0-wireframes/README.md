# v2.0 Wireframes (Round 1)

Low-fidelity, grayscale wireframes for the v2.0 mobile-first redesign. They support the [v2.0 spec](../../specs/v2.0-ui-redesign.md) and the [flows and navigation draft](../../research/v2.0-flows-and-navigation.md).

## Contents

| File | Board | Size |
|---|---|---|
| `Main.dc.html` | iPhone Shop | 390x844 |
| `Pantry.dc.html` | iPhone Pantry | 390x844 |
| `Plan.dc.html` | iPhone Plan | 390x844 |
| `Settings.dc.html` | iPhone Account and Settings | 390x844 |
| `Onboarding.dc.html` | iPhone First-Run Setup | 390x844 |
| `IpadShop.dc.html` | iPad Shop (landscape) | 1194x834 |
| `IpadPantry.dc.html` | iPad Pantry (landscape) | 1194x834 |
| `IpadPlan.dc.html` | iPad Plan (landscape) | 1194x834 |
| `IpadSettings.dc.html` | iPad Account and Settings (landscape) | 1194x834 |
| `IpadShopPortrait.dc.html` | iPad Shop (portrait) | 834x1194 |
| `ShopTrip.dc.html` | iPhone Shop: Trip | 390x844 |
| `ShopRadar.dc.html` | iPhone Shop: Radar | 390x844 |
| `ShopDetail.dc.html` | iPhone Shop: Deal Detail | 390x844 |
| `ShopLoading.dc.html` | iPhone Shop: Loading (static) | 390x844 |
| `TripEmpty.dc.html` | iPhone Shop: Empty Trip (static) | 390x844 |
| `PantryScan.dc.html` | iPhone Pantry: Scan Barcode | 390x844 |
| `PantryVoice.dc.html` | iPhone Pantry: Add by Voice | 390x844 |
| `PantryDetail.dc.html` | iPhone Pantry: Ingredient Detail | 390x844 |
| `PantryEmpty.dc.html` | iPhone Pantry: First Visit (static) | 390x844 |
| `PlanPrefs.dc.html` | iPhone Plan: Preferences | 390x844 |
| `PlanDish.dc.html` | iPhone Plan: Dish Detail | 390x844 |
| `PlanAiSignedOut.dc.html` | iPhone Plan: AI Chef (Signed Out) | 390x844 |
| `PlanAiError.dc.html` | iPhone Plan: AI Chef (Service Error, static) | 390x844 |
| `OnboardingPrefs.dc.html` | iPhone First-Run Setup: Step 2 | 390x844 |
| `IpadPantryPortrait.dc.html` | iPad Pantry (portrait) | 834x1194 |
| `IpadPlanPortrait.dc.html` | iPad Plan (portrait) | 834x1194 |
| `canvas.json` | Canvas index: board positions and the notes shown under each board | n/a |

## Notes

- These are source files for the design canvas the boards were authored in (`.dc.html`). They are static and use a runtime that is not part of this repository, so a plain browser may not render them exactly. Treat them as the record of the layouts, not as production code.
- Wireframes are not implementation: no component here is meant to be copied into `src/`.
- Conventions applied: Title Case headings, no visible page title on tab screens (a visually hidden `h1` is kept), and controls at least 44px. See spec section 6a.
- **Prototype:** boards marked interactive in `canvas.json` link to each other with plain anchors (tab bars, selectors, avatar, add flows, detail screens, onboarding, iPad sidebar and icon rail). Loading, empty and AI error boards are static. Back and Cancel go to a fixed screen, not the previous one.
- Status: rounds 1 to 3, reviewed by the owner in chat. Tracked in [#683](https://github.com/kchavez05/produce-price-tracker/issues/683). Not yet drawn: Shop error states, Pantry search with no results, signed-in AI Chef results, iPad Trip and Radar, and iPhone Duo postures (deferred).

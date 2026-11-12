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
| `canvas.json` | Canvas index: board positions and the notes shown under each board | n/a |

## Notes

- These are source files for the design canvas the boards were authored in (`.dc.html`). They are static and use a runtime that is not part of this repository, so a plain browser may not render them exactly. Treat them as the record of the layouts, not as production code.
- Wireframes are not implementation: no component here is meant to be copied into `src/`.
- Conventions applied: Title Case headings, no visible page title on tab screens (a visually hidden `h1` is kept), and controls at least 44px. See spec section 6a.
- Status: round 1, reviewed by the owner in chat. Not yet clickable; portrait Pantry and Plan, Shop's Trip and Radar sections, and detail screens are still to do.

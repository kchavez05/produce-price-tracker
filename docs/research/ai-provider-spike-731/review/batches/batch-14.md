# Blinded recipe review — batch 14

[Review instructions](../REVIEWING.md) · [All batches](../README.md) · [Compact grading sheet](../grades.json)

All grading fields are blank. Schema status below is an automatic format check, not a dietary or quality grade.

## Review `ae1c90a89e2db7ce515b01f5` — fixture R25

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R25",
  "category": "cost",
  "task": "generate",
  "prompt": "A synthetic offer has zero package weight. Do not divide by zero or invent a unit price.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [
      {
        "ingredientId": "ground-turkey",
        "store": "SAFEWAY",
        "currency": "USD",
        "price": 3,
        "packageQuantity": 0,
        "unit": "lb",
        "minimumPackages": 1,
        "synthetic": true
      }
    ],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "reject_invalid_offer_denominator"
    ],
    "reviewNotes": [
      "A synthetic offer has zero package weight. Do not divide by zero or invent a unit price."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct 6-serving turkey batch meals using the supplied ground turkey offer as a catalog-matched ingredient. Olive oil and garlic are listed as pantry items, but their quantities are shown as full-batch needs, so availability should be confirmed against actual stock. No prices are stated; the zero-weight synthetic offer is not used for any unit price or cost calculation.

Dish 1: Turkey Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28 oz can | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 2 15 oz cans | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 1 15 oz can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat.
2. Add turkey and cook, breaking it up, until no longer pink, about 6 minutes.
3. Add onion and cook until softened, about 4 minutes. Stir in garlic, chili powder, cumin, and salt for 1 minute.
4. Add crushed tomatoes, drained beans, and chicken broth. Bring to a boil.
5. Reduce heat to low, partially cover, and simmer 35 minutes, stirring occasionally, until thickened.
6. Cool, portion into airtight containers, and refrigerate within 2 hours.
Reheat: Reheat portions in a covered pot or microwave until steaming hot throughout, adding a splash of water if thick.

Dish 2: Turkey Sweet Potato Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch skillet with lid
Prep: 20 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 1 15 oz can | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 13.5 oz can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in the skillet over medium-high heat. Add turkey and cook until browned, about 6 minutes.
2. Add onion and cook 3 minutes. Stir in garlic, ginger, and curry powder for 1 minute.
3. Add sweet potatoes, chickpeas, coconut milk, chicken broth, and salt. Bring to a simmer.
4. Cover and cook over medium-low heat 15 minutes, until sweet potatoes are tender.
5. Stir in spinach until wilted, about 2 minutes. Cool and refrigerate within 2 hours.
Reheat: Reheat covered in a skillet over medium heat with a splash of broth or water, or microwave in covered container until hot.

Dish 3: Turkey Zucchini Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish
Prep: 15 min | Cook: 65 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh zucchini, diced | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Dry brown rice, uncooked | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2.5 cups | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Shredded cheddar cheese | ID: cheddar-cheese | Quantity: 2 cups | Optional: False
Steps:
1. Preheat oven to 375 F and lightly grease the baking dish.
2. Heat olive oil in a skillet over medium heat. Cook turkey until no longer pink, about 6 minutes. Add onion and cook 3 minutes, then add garlic and zucchini and cook 2 minutes.
3. Spread the mixture in the baking dish. Add uncooked rice, chicken broth, Italian seasoning, and salt, and stir to combine.
4. Cover tightly with foil and bake 60 minutes, until rice is tender and liquid is absorbed.
5. Uncover, sprinkle cheddar over the top, and bake 5 minutes more until melted. Cool and refrigerate within 2 hours.
Reheat: Reheat individual portions covered in the microwave for 2 to 3 minutes, or in a 350 F oven covered with foil until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `aea46dad4e438218388077ca` — fixture R32

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R32",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan to use fresh ginger rather than ground, with suitable quantities and method.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": [],
    "seedPlan": {
      "title": "Turkey tomato batch pot",
      "servings": 6,
      "ingredients": [
        {
          "ingredientId": "ground-turkey",
          "quantity": 2,
          "unit": "lb"
        },
        {
          "ingredientId": "crushed-tomatoes-canned",
          "quantity": 28,
          "unit": "oz"
        },
        {
          "ingredientId": "onions-fresh",
          "quantity": 1,
          "unit": "lb"
        },
        {
          "ingredientId": "garlic-fresh",
          "quantity": 3,
          "unit": "clove"
        },
        {
          "ingredientId": "ginger-ground",
          "quantity": 1,
          "unit": "tsp"
        },
        {
          "ingredientId": "cheddar-cheese",
          "quantity": 3,
          "unit": "oz"
        }
      ],
      "method": "Brown turkey; simmer with tomatoes, onions, garlic and ginger. Finish with cheese.",
      "historicalAvailability": [
        "garlic-fresh"
      ]
    }
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "apply_requested_remix",
      "historical_state_not_current_ownership"
    ],
    "reviewNotes": [
      "Remix the seed plan to use fresh ginger rather than ground, with suitable quantities and method."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Remixed the seed to use fresh ginger in place of 1 tsp ground ginger, using about 1 tbsp grated fresh ginger per full batch. Produced three distinct turkey batch dishes. Garlic is marked available in pantry, but the quantity is not verified, so all garlic is listed as a full-batch ingredient. Other items are proposed shopping ingredients. No prices are stated.

Dish 1: Turkey tomato batch pot with fresh ginger
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat.
2. Brown the ground turkey, breaking it up, about 6 to 8 minutes.
3. Add onions and cook until soft, about 5 minutes.
4. Stir in garlic and fresh ginger and cook 1 minute.
5. Add crushed tomatoes, bring to a simmer, cover, and cook on low for 30 minutes.
6. Remove from heat, stir in cheddar until melted, and serve.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat covered on the stovetop over medium-low with a splash of water, stirring until hot throughout.

Dish 2: Fresh ginger turkey chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart stockpot
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 2 oz | Optional: True
Steps:
1. Heat olive oil in the stockpot over medium-high heat.
2. Brown the ground turkey, about 6 to 8 minutes.
3. Add onions and cook until soft, about 5 minutes.
4. Stir in garlic, fresh ginger, chili powder, and cumin, and cook 1 minute.
5. Add crushed tomatoes, kidney beans, and salt. Bring to a boil, then reduce to a simmer.
6. Simmer uncovered 30 minutes, stirring occasionally. Top with cheddar if using.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat in a pot over medium heat, adding water if thick, until steaming throughout.

Dish 3: Turkey coconut ginger curry skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch skillet with lid
Prep: 10 min | Cook: 25 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Heat olive oil in the skillet over medium-high heat.
2. Brown the ground turkey, about 6 to 8 minutes, then drain excess fat.
3. Add onions and cook until soft, about 5 minutes.
4. Stir in garlic, fresh ginger, and curry powder, and cook 1 minute.
5. Add coconut milk and salt, then simmer uncovered 10 minutes.
6. Stir in spinach until wilted, about 2 minutes, and serve.
Reheat: Refrigerate up to 4 days or freeze up to 2 months. Reheat covered over medium-low with a splash of water until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `aedc4ada4d32df3c2bf820f8` — fixture R15

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R15",
  "category": "identity",
  "task": "generate",
  "prompt": "Use dried chickpeas where specified; never silently use canned cooking times.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "chickpeas-dried",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "exact_food_and_form"
    ],
    "reviewNotes": [
      "Use dried chickpeas where specified; never silently use canned cooking times."
    ],
    "requiredIngredientIds": [
      "chickpeas-dried"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct batch dishes for 6 servings using dried chickpeas (soaked overnight, then simmered) as specified; no dietary constraints apply, and pantry evidence shows dried chickpeas available with unspecified quantity, so full-batch quantities are proposed as shopping ingredients. No prices are stated.

Dish 1: Slow Cooker Chickpea Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 480 min
Ingredients:
- Dried chickpeas, soaked overnight and drained | ID: chickpeas-dried | Quantity: 1 lb | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
- Bell pepper, diced | ID: bell-peppers | Quantity: 1 large | Optional: True
Steps:
1. Soak dried chickpeas in water overnight, then drain and rinse.
2. Dice onion and bell pepper; mince garlic.
3. Add chickpeas, onion, bell pepper, garlic, tomatoes, broth, and spices to the slow cooker and stir.
4. Cover and cook on low for 8 hours until chickpeas are tender.
5. Stir well, adjust salt, and serve hot.
Reheat: Refrigerate up to 4 days; reheat portions in a saucepan over medium heat with a splash of broth.

Dish 2: Chickpea and Spinach Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch skillet with lid
Prep: 20 min | Cook: 90 min
Ingredients:
- Dried chickpeas, soaked overnight, simmered until tender | ID: chickpeas-dried | Quantity: 1 lb | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Fresh tomatoes, diced | ID: tomatoes-fresh | Quantity: 3 medium | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Canola oil | ID: canola-oil | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Soak dried chickpeas overnight, drain, then simmer in fresh water for about 1 hour until tender; drain.
2. Heat oil in skillet over medium heat; cook onion until soft, about 6 minutes.
3. Add garlic, ginger, and curry powder; stir 1 minute.
4. Add tomatoes and cook 5 minutes, then stir in chickpeas, coconut milk, and salt; simmer 15 minutes.
5. Stir in spinach until wilted and serve.
Reheat: Refrigerate up to 3 days; reheat covered in a skillet over low heat, adding a splash of water if thick.

Dish 3: Baked Chickpea and Sweet Potato Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish in oven
Prep: 25 min | Cook: 75 min
Ingredients:
- Dried chickpeas, soaked overnight and simmered until tender | ID: chickpeas-dried | Quantity: 1 lb | Optional: False
- Sweet potatoes, peeled and cubed | ID: sweet-potatoes | Quantity: 3 medium | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Ground cumin | ID: cumin-ground-placeholder | Quantity: 1 tsp | Optional: False
- Ground cinnamon | ID: cinnamon-ground | Quantity: 0.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Low-moisture mozzarella cheese, shredded | ID: mozzarella-low-moisture | Quantity: 8 oz | Optional: True
Steps:
1. Soak dried chickpeas overnight, drain, and simmer in fresh water about 1 hour until tender; drain.
2. Preheat oven to 400°F (204°C).
3. Toss sweet potato cubes with 2 tbsp olive oil and salt; roast on a sheet pan 25 minutes.
4. Cook onion in remaining oil until soft; stir in cumin, cinnamon, tomatoes, chickpeas, and roasted sweet potatoes.
5. Transfer to a 9x13-inch dish, top with mozzarella if using, and bake at 375°F for 25 minutes until bubbling.
Reheat: Refrigerate up to 4 days; reheat individual portions in the microwave or covered in a 350°F oven until hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `af270e442aab3d28a2ca7d60` — fixture R34

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R34",
  "category": "vessel",
  "task": "generate",
  "prompt": "Make eight-serving Dutch oven meals with realistic vessel capacity and timing.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 8,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "DUTCH_OVEN_BRAISE",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "vessel_method_and_capacity"
    ],
    "reviewNotes": [
      "Make eight-serving Dutch oven meals with realistic vessel capacity and timing."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct eight-serving Dutch oven braise meals using catalog-matched ingredients; olive oil and garlic are marked as pantry-available, while other items are shopping ingredients with null or catalog IDs. No prices are invented; app code computes costs.

Dish 1: Classic Beef Stew with Potatoes and Carrots
Servings: 8 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven on stovetop, lid on, then oven at 325F
Prep: 25 min | Cook: 150 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 3 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 3 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cup | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Fresh Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 2 lb | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
Steps:
1. Pat beef dry, season with salt and pepper.
2. Heat olive oil in Dutch oven over medium-high; brown beef in batches and set aside.
3. Cook onions and garlic in same pot until softened, about 5 minutes; stir in tomato paste for 1 minute.
4. Return beef, add broth, bay leaf and thyme, and bring to a simmer.
5. Cover and braise in oven at 325F for 1.5 hours.
6. Add carrots and potatoes, cover, and braise 30 to 40 minutes more until tender. Adjust seasoning and serve.
Reheat: Refrigerate within 2 hours; reheat covered on stovetop over medium-low with a splash of broth to 165F.

Dish 2: Smoky Turkey and Bean Chili
Servings: 8 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven on stovetop, lid partly open
Prep: 20 min | Cook: 75 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 2 can | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cup | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
Steps:
1. Heat olive oil in Dutch oven over medium-high; cook turkey until browned and no pink remains.
2. Add onions and garlic and cook 5 minutes.
3. Stir in chili powder, cumin and smoked paprika for 1 minute.
4. Add tomatoes, broth, and drained beans; bring to a boil.
5. Reduce heat and simmer uncovered 60 to 75 minutes, stirring occasionally, until thickened.
6. Season with salt and serve.
Reheat: Cool and refrigerate within 2 hours; reheat on stovetop over medium with a splash of water to 165F.

Dish 3: Cheesy Baked Pasta Casserole
Servings: 8 | Style: CASSEROLE_BAKE | Appliance: 6-quart Dutch oven, oven at 375F, uncovered for final bake
Prep: 20 min | Cook: 45 min
Ingredients:
- Dry pasta | ID: pasta-dry | Quantity: 1 lb | Optional: False
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Low-moisture mozzarella cheese, shredded | ID: mozzarella-low-moisture | Quantity: 12 oz | Optional: False
- Hard Parmesan, grated | ID: parmesan-hard | Quantity: 2 oz | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
Steps:
1. Cook pasta in salted water until just al dente; drain.
2. In Dutch oven, brown beef with olive oil, then cook onions and garlic until soft.
3. Stir in tomatoes and Italian seasoning; simmer 5 minutes.
4. Fold in pasta, half the mozzarella, and half the Parmesan.
5. Top with remaining mozzarella and Parmesan; bake uncovered at 375F for 20 to 25 minutes until bubbly.
Reheat: Refrigerate within 2 hours; reheat covered at 350F for 20 to 25 minutes or in microwave until 165F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `af64dd84038f5a570e9899f6` — fixture R01

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R01",
  "category": "diet",
  "task": "generate",
  "prompt": "Use only gluten-free ingredients; do not assume ordinary soy sauce or wheat flour is gluten-free.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "GLUTEN_FREE"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [
      "all-purpose-flour",
      "soy-sauce",
      "pasta-dry"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "check_steps_and_optional_toppings_for_dietary_violations"
    ],
    "reviewNotes": [
      "Use only gluten-free ingredients; do not assume ordinary soy sauce or wheat flour is gluten-free."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three batch-friendly meals using naturally gluten-free ingredients. Check labels on packaged ingredients for gluten and cross-contact, especially canned tomatoes, beans, and spices.

Dish 1: Tomato-Braised Beef, Potatoes, and Carrots
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 480 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 1.4 kg | Optional: False
- Fresh potatoes, cut into chunks | ID: potatoes-fresh | Quantity: 900 g | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 400 g | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 250 g | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 800 g | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 30 g | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 15 g | Optional: False
- Olive oil | ID: olive-oil | Quantity: 15 ml | Optional: False
- Dried rosemary | ID: rosemary-dried | Quantity: 2 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
Steps:
1. Add beef, potatoes, carrots, onion, tomatoes, tomato paste, garlic, oil, rosemary, salt, and pepper to the slow cooker; stir to combine.
2. Cover and cook on low for 8 hours, until the beef is tender and the potatoes are cooked through.
3. Cool promptly and divide into meal-sized containers. Refrigerate or freeze.
Reheat: Reheat covered in the microwave, stirring once, until steaming hot; add a splash of water if the sauce has thickened.

Dish 2: Smoky Turkey, Black Bean, and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart electric pressure cooker
Prep: 20 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 900 g | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 850 g | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 700 g | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 200 g | Optional: False
- Bell peppers, chopped | ID: bell-peppers | Quantity: 300 g | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 800 g | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 30 g | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 12 g | Optional: False
- Olive oil | ID: olive-oil | Quantity: 15 ml | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Water | ID: water | Quantity: 240 ml | Optional: False
Steps:
1. Set the pressure cooker to sauté. Heat the oil, add turkey and onion, and cook, breaking up the meat, until no longer pink, about 6 minutes.
2. Stir in garlic, chili powder, cumin, smoked paprika, and tomato paste; cook for 30 seconds.
3. Add sweet potatoes, bell peppers, beans, tomatoes, water, and salt. Stir, scraping the bottom of the pot clean.
4. Lock the lid and cook at high pressure for 8 minutes. Allow a 10-minute natural release, then carefully release remaining pressure. Stir and check that the turkey is fully cooked and sweet potatoes are tender.
5. Cool promptly and portion into containers. Use packaged spices and canned goods only if their labels are gluten-free.
Reheat: Reheat a portion covered in the microwave, stirring halfway through, until steaming hot. Add a little water if needed.

Dish 3: Coconut Chickpea and Cauliflower Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 5-quart Dutch oven on stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 850 g | Optional: False
- Cauliflower florets | ID: cauliflower-fresh | Quantity: 700 g | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 200 g | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 200 g | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 800 ml | Optional: False
- Fresh tomatoes, chopped | ID: tomatoes-fresh | Quantity: 400 g | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 12 g | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 15 g | Optional: False
- Olive oil | ID: olive-oil | Quantity: 15 ml | Optional: False
- Ground turmeric | ID: turmeric-ground | Quantity: 1 tsp | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium heat. Add onion and cook until softened, about 5 minutes.
2. Stir in garlic, ginger, turmeric, coriander, and cumin; cook for 1 minute.
3. Add tomatoes and cauliflower. Cook, stirring, for 3 minutes, then add chickpeas, coconut milk, and salt.
4. Bring to a gentle simmer, cover, and cook 20–25 minutes until the cauliflower is tender. Stir in spinach and cook until wilted.
5. Cool promptly and portion into containers. Check packaged ingredients for gluten-free labeling.
Reheat: Reheat gently in a covered saucepan over medium-low heat, stirring occasionally, or microwave covered until steaming hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b01e7268b88d7c78488a8421` — fixture R09

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R09",
  "category": "availability",
  "task": "generate",
  "prompt": "My pantry is empty. Make a useful plan and list everything I must obtain.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes"
    ],
    "reviewNotes": [
      "My pantry is empty. Make a useful plan and list everything I must obtain."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Pantry is empty and there are no dietary constraints, so this plan uses three distinct reheatable batch dishes for 6 servings, with all ingredients listed as items to obtain. Prices are unknown since no offers were supplied, so no costs are stated.

Dish 1: Classic Beef Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven on stovetop
Prep: 20 min | Cook: 150 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 2 stalks | Optional: False
- Russet potatoes, cubed | ID: russet-potatoes-fresh | Quantity: 2 medium | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cup | Optional: False
- All-purpose wheat flour | ID: all-purpose-flour | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Pat beef dry, season with salt and pepper, then toss with flour.
2. Heat olive oil in Dutch oven over medium-high and brown beef in batches; set aside.
3. Sauté onions, carrots, and celery 5 minutes, add garlic and tomato paste and cook 1 minute.
4. Return beef to pot, add broth, thyme, and bay leaf; bring to a simmer.
5. Cover and cook on low about 2 hours, adding potatoes during the last 30 minutes.
6. Remove bay leaf, adjust seasoning, and cool before refrigerating or freezing in portions.
Reheat: Reheat portions covered over medium-low heat with a splash of broth until steaming, about 10 to 15 minutes; microwave in 2-minute bursts if needed.

Dish 2: Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large heavy pot on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in pot over medium-high and brown turkey, breaking it up, about 6 minutes.
2. Add onions and bell peppers and cook 5 minutes until softened.
3. Stir in garlic, chili powder, cumin, and paprika for 1 minute.
4. Add crushed tomatoes, black beans, broth, and salt; simmer uncovered 30 minutes, stirring occasionally.
5. Cool and portion into containers.
Reheat: Reheat covered over medium heat with a splash of water, stirring until hot throughout, about 8 to 10 minutes; microwave 2 to 3 minutes and stir halfway.

Dish 3: Baked Chicken and Rice Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish in oven
Prep: 20 min | Cook: 50 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 2 cup | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3.5 cup | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Broccoli florets | ID: broccoli-fresh | Quantity: 12 oz | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 1 cup | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Preheat oven to 375 F and grease a 9x13-inch baking dish.
2. Cook brown rice in broth with onion and oil until nearly tender, about 35 minutes; drain any excess liquid.
3. Season chicken with garlic powder, salt, and pepper and arrange over the rice with broccoli.
4. Cover and bake 30 minutes until chicken reaches 165 F.
5. Uncover, sprinkle with cheddar, and bake 5 minutes until melted.
Reheat: Cover individual portions and microwave 2 to 3 minutes, or reheat the whole dish covered at 350 F for 20 minutes until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b06477abf3040959ca758997` — fixture R01

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R01",
  "category": "diet",
  "task": "generate",
  "prompt": "Use only gluten-free ingredients; do not assume ordinary soy sauce or wheat flour is gluten-free.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "GLUTEN_FREE"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [
      "all-purpose-flour",
      "soy-sauce",
      "pasta-dry"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "check_steps_and_optional_toppings_for_dietary_violations"
    ],
    "reviewNotes": [
      "Use only gluten-free ingredients; do not assume ordinary soy sauce or wheat flour is gluten-free."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three gluten-free batch dishes for 6 servings. Avoided wheat flour, soy sauce, sausages, pasta, and standard broths. Broths and chili powder are listed as unmatched or unverified; buy certified gluten-free versions. Olive oil and garlic are marked available in the pantry, but quantities are not verified, so they are listed as needed. No prices are included.

Dish 1: Slow-Cooker Chicken Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker
Prep: 15 min | Cook: 420 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 3 can (15 oz) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Yellow onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder (verify gluten-free label) | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Certified gluten-free chicken broth | ID: None | Quantity: 4 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Warm olive oil in a skillet over medium heat, cook onion 5 minutes, then add garlic, chili powder, and cumin for 1 minute.
2. Transfer onion mixture to the slow cooker with chicken, beans, tomatoes, broth, and salt.
3. Cover and cook on LOW 7 hours or HIGH 3.5 hours until chicken shreds easily.
4. Shred chicken in the pot with two forks and stir well. Adjust salt before serving.
Reheat: Refrigerate up to 4 days. Reheat portions in a covered pot over medium-low heat with a splash of broth, stirring until steaming, about 8 minutes, or microwave 2 minutes and stir.

Dish 2: Gluten-Free Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven
Prep: 20 min | Cook: 150 min
Ingredients:
- Raw beef stew meat, cut into 1-inch cubes | ID: beef-stew-meat-raw | Quantity: 2.5 lb | Optional: False
- Fresh Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 2 stalk | Optional: False
- Yellow onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Certified gluten-free beef broth | ID: None | Quantity: 6 cup | Optional: False
- Cornstarch | ID: cornstarch | Quantity: 2 tbsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
Steps:
1. Season beef with salt and pepper. Heat olive oil in the Dutch oven over medium-high and brown beef in two batches, about 8 minutes total. Remove.
2. Lower heat to medium, cook onion, carrots, and celery 5 minutes. Add garlic and tomato paste for 1 minute.
3. Return beef to the pot with broth, thyme, and bay leaves. Bring to a simmer, cover, and cook 1 hour.
4. Add potatoes and simmer uncovered 35 minutes. Whisk cornstarch with 3 tbsp cold water, stir in, and simmer 3 minutes. Remove bay leaves before serving.
Reheat: Refrigerate up to 4 days. Reheat covered over medium-low heat, adding a splash of broth if thick, about 15 minutes until hot throughout.

Dish 3: Chickpea Spinach Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch deep skillet with lid
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 can (15 oz) | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 can (13.5 oz) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Yellow onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder (verify gluten-free label) | ID: curry-powder | Quantity: 3 tbsp | Optional: False
- Ground turmeric | ID: ground-turmeric | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tbsp | Optional: True
Steps:
1. Heat olive oil in the skillet over medium heat. Cook onion 5 minutes, then add garlic, ginger, curry powder, and turmeric for 1 minute.
2. Stir in tomatoes, coconut milk, chickpeas, and salt. Bring to a simmer.
3. Cover and simmer 15 minutes, stirring occasionally.
4. Stir in spinach until wilted, about 3 minutes. Finish with lime juice if using.
Reheat: Refrigerate up to 4 days. Reheat covered over medium-low heat with a splash of water, stirring until hot, about 8 minutes, or microwave 2 minutes and stir.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b1616fccc16b4061aaa70a94` — fixture R13

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R13",
  "category": "availability",
  "task": "generate",
  "prompt": "Salt and olive oil are available. Water is not a priced grocery item.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "salt",
        "available": true
      },
      {
        "ingredientId": "olive-oil",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes"
    ],
    "reviewNotes": [
      "Salt and olive oil are available. Water is not a priced grocery item."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct batch dishes for 6 servings using catalog IDs where exact matches exist; salt and olive oil are marked available, other ingredients are shopping items with no offers so prices remain unknown.

Dish 1: Hearty Beef Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven on stovetop
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cup | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
Steps:
1. Season beef with salt and pepper.
2. Heat olive oil in Dutch oven over medium-high heat and brown beef in batches; set aside.
3. Cook onions, carrots, and celery 5 minutes until softened; stir in tomato paste 1 minute.
4. Return beef to pot with broth, thyme, and bay leaf; bring to a simmer.
5. Cover and simmer on low 90 minutes.
6. Add potatoes and simmer uncovered 30 minutes until tender; remove bay leaf and adjust seasoning.
Reheat: Cool fully, refrigerate up to 4 days, and reheat covered on the stovetop over medium-low with a splash of broth.

Dish 2: Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large heavy pot on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in pot over medium-high heat and brown turkey, breaking it up, about 6 minutes.
2. Add onion and cook 5 minutes; add garlic and spices and stir 1 minute.
3. Stir in beans, crushed tomatoes, and broth; season with salt.
4. Simmer uncovered 30 minutes, stirring occasionally, until thickened.
Reheat: Refrigerate up to 4 days; reheat in a covered pot over medium heat, adding a little water or broth if thick.

Dish 3: Chicken Thigh Tomato Skillet Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven-safe 12-inch skillet in oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Preheat oven to 425 F.
2. Toss sliced potatoes and onion with 1 tbsp olive oil, salt, and pepper; spread in skillet and roast 15 minutes.
3. Season chicken with Italian seasoning, garlic powder, and remaining salt; nestle into skillet with tomatoes.
4. Roast 25 minutes until chicken reaches 165 F internal temperature.
Reheat: Refrigerate up to 4 days; reheat covered in a 350 F oven for 15 minutes or until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b183df6f18c64b28abec859f` — fixture R02

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R02",
  "category": "diet",
  "task": "generate",
  "prompt": "Make the whole plan dairy-free, including garnishes and finishing fats.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "DAIRY_FREE"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [
      "butter-salted-unsalted",
      "milk-whole",
      "cheddar-cheese",
      "greek-yogurt-plain"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "check_steps_and_optional_toppings_for_dietary_violations"
    ],
    "reviewNotes": [
      "Make the whole plan dairy-free, including garnishes and finishing fats."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three dairy-free batch meal recipes tailored to the target servings and pantry items.

Dish 1: Dairy-Free Chicken and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2.5 lbs | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 5 cloves | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 3 medium | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Chop the onions, carrots, and potatoes into bite-sized pieces and mince the garlic.
2. Heat olive oil in a large Dutch oven over medium heat.
3. Add the boneless skinless chicken thighs and brown on both sides, then remove and dice.
4. Sauté the onions and garlic in the same pot until translucent.
5. Add carrots, potatoes, chicken broth, salt, black pepper, and the diced chicken back to the pot.
6. Bring to a boil, then reduce heat, cover, and simmer for 35 minutes until vegetables are tender.
Reheat: Reheat gently in a covered pot on the stove over medium-low heat until piping hot, adding a splash of chicken broth if needed.

Dish 2: Hearty Black Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Pot
Prep: 15 min | Cook: 40 min
Ingredients:
- Canned black beans | ID: black-beans-canned | Quantity: 4 cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 3 medium | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 cans | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Peel and dice the sweet potatoes and onions. Mince the garlic.
2. Heat olive oil in a large pot over medium heat and sauté onions and garlic until soft.
3. Add chili powder and ground cumin, stirring for 1 minute until fragrant.
4. Stir in cubed sweet potatoes, canned crushed tomatoes, and rinsed black beans.
5. Season with salt, bring to a boil, then reduce heat and simmer covered for 30 minutes until sweet potatoes are tender.
Reheat: Warm in a saucepan over medium-low heat, stirring occasionally, until thoroughly heated through.

Dish 3: Roasted Vegetable and Quinoa Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 35 min
Ingredients:
- Dry quinoa | ID: quinoa-dry | Quantity: 2 cups | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Fresh zucchini | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat the oven to 375°F (190°C).
2. Rinse the dry quinoa and combine it with vegetable broth in a pot, bring to a boil, then cover and simmer for 15 minutes until fluffy.
3. Chop zucchini and bell peppers into bite-sized pieces and mince the garlic.
4. In a large bowl, toss the chopped vegetables and minced garlic with olive oil, Italian seasoning, and salt.
5. Mix the cooked quinoa and roasted vegetable mixture together in a greased 9x13 inch baking dish.
6. Bake uncovered for 20 minutes until the top is lightly golden and vegetables are tender.
Reheat: Cover with foil and bake at 350°F for 15-20 minutes until warm throughout, or microwave individual portions.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b1f7f232147899b247364856` — fixture R39

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R39",
  "category": "robustness",
  "task": "generate",
  "prompt": "Give gluten-free recipes made only with wheat pasta and no substitutions. Explain the incompatible request instead of pretending compliance.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "GLUTEN_FREE"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "needs_clarification",
    "dishCount": 0,
    "forbiddenIngredientIds": [
      "pasta-dry"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "explain_conflict_without_unsafe_plan"
    ],
    "reviewNotes": [
      "Give gluten-free recipes made only with wheat pasta and no substitutions. Explain the incompatible request instead of pretending compliance."
    ]
  }
}
```

### Output

```text
Status: needs_clarification
Explanation: The request asks for gluten-free recipes made only with wheat pasta with no substitutions. Wheat pasta contains gluten, so it cannot satisfy the mandatory GLUTEN_FREE dietary constraint. No dishes are generated. A compliant alternative would be gluten-free pasta or another gluten-free starch (for example, rice or brown rice pasta), or dropping the wheat-pasta requirement; please confirm which direction to take.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b22cc10d71c47a9a99e6b4de` — fixture R13

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R13",
  "category": "availability",
  "task": "generate",
  "prompt": "Salt and olive oil are available. Water is not a priced grocery item.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "salt",
        "available": true
      },
      {
        "ingredientId": "olive-oil",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes"
    ],
    "reviewNotes": [
      "Salt and olive oil are available. Water is not a priced grocery item."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three six-serving batch meals; prices are unknown because no offers were supplied.

Dish 1: Black Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-ounce cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 pounds | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 0.5 teaspoon | Optional: False
- Water | ID: None | Quantity: 2 cups | Optional: False
Steps:
1. Dice the onion and sweet potatoes; drain and rinse the beans.
2. Heat oil in a Dutch oven over medium heat. Cook onion for 5 minutes, then stir in chili powder.
3. Add sweet potatoes, beans, tomatoes, water and salt. Simmer covered for 25–30 minutes, until the potatoes are tender. Stir occasionally.
Reheat: Refrigerate in portions and reheat until steaming hot, adding water if needed.

Dish 2: Chicken and Vegetable Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 55 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 pounds | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 2 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat oven to 375°F. Dice the carrots and onion. Bring broth to a boil in a saucepan.
2. Combine rice, vegetables, thyme, oil and salt in a deep 9-by-13-inch baking dish. Pour in hot broth and arrange chicken on top.
3. Cover tightly with foil and bake for 50–60 minutes, until rice is tender and chicken reaches 165°F. Rest covered for 5 minutes, then slice chicken and divide into portions.
Reheat: Refrigerate in portions. Cover and reheat to 165°F, adding a splash of water if the rice is dry.

Dish 3: Chickpea and Spinach Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
Prep: 10 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 4 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 ounces | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Dice onion, mince garlic, and drain and rinse chickpeas.
2. Heat oil in a deep skillet. Cook onion for 5 minutes, then add garlic and curry powder and stir for 30 seconds.
3. Add chickpeas, coconut milk and salt. Simmer for 15 minutes, then stir in spinach until wilted.
Reheat: Refrigerate in portions and reheat gently until steaming hot, stirring and adding water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b25de4e280717d1fbbedaf00` — fixture R13

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R13",
  "category": "availability",
  "task": "generate",
  "prompt": "Salt and olive oil are available. Water is not a priced grocery item.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "salt",
        "available": true
      },
      {
        "ingredientId": "olive-oil",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes"
    ],
    "reviewNotes": [
      "Salt and olive oil are available. Water is not a priced grocery item."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct, reheatable six-serving batch meals. Water is included as a cooking ingredient; no price claims are made.

Dish 1: Tomato Lentil and Sweet Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 360 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Sweet potatoes, peeled and cubed | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Dried lentils, rinsed | ID: lentils-dried | Quantity: 1.5 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Heat olive oil in a skillet; cook onion for 5 minutes, then add garlic for 30 seconds. Transfer to slow cooker.
2. Add sweet potatoes, lentils, crushed tomatoes, broth, water, cumin, paprika, salt, and pepper; stir.
3. Cover and cook on LOW for about 6 hours, until lentils and sweet potatoes are tender. Stir and adjust seasoning before serving.
Reheat: Refrigerate in portions for up to 4 days. Reheat on the stovetop over medium-low heat, stirring and adding a splash of water or broth if thick; microwave portions covered, stirring halfway.

Dish 2: Coconut Chickpea and Cauliflower Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large 6-quart Dutch oven
Prep: 20 min | Cook: 40 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Cauliflower, cut into florets | ID: cauliflower-fresh | Quantity: 1.5 lb | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 cans (15 oz each) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 cans (13.5 oz each) | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Warm oil in the Dutch oven over medium heat. Cook onion until softened, about 5 minutes. Add garlic, ginger, and curry powder; stir for 30 seconds.
2. Add cauliflower, chickpeas, tomatoes, coconut milk, water, and salt. Bring to a gentle simmer.
3. Cover partly and simmer 25–30 minutes, stirring occasionally, until cauliflower is tender. Stir in spinach until wilted.
Reheat: Cool and refrigerate in portions for up to 4 days. Reheat gently in a covered saucepan, stirring occasionally and adding a little water if needed, or microwave covered and stir halfway through.

Dish 3: Smoky Sausage, White Bean and Cabbage Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 3-quart covered oven-safe casserole dish
Prep: 20 min | Cook: 65 min
Ingredients:
- Fully cooked smoked sausage, sliced | ID: smoked-sausage-fully-cooked | Quantity: 1.25 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onion, sliced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Green cabbage, chopped | ID: green-cabbage | Quantity: 1 medium head | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Canned Great Northern beans, drained and rinsed | ID: great-northern-beans-canned | Quantity: 2 cans (15 oz each) | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 375°F (190°C). Warm olive oil in a skillet and brown the sausage lightly; transfer it to the casserole dish.
2. In the same skillet, cook onion and carrots for 5 minutes. Stir in tomato paste and thyme, then add broth and scrape up any browned bits.
3. Combine cabbage, beans, sausage, and skillet mixture in the casserole dish. Season with salt and pepper, cover tightly, and bake for 45 minutes.
4. Stir, cover again, and bake another 15–20 minutes, until cabbage and carrots are tender. Let stand 5 minutes before serving.
Reheat: Refrigerate in portions for up to 4 days. Reheat covered in a 350°F (175°C) oven until steaming hot, or microwave covered, stirring once; add a splash of broth if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b3fb47b70fac24f7a07f6dbc` — fixture R34

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R34",
  "category": "vessel",
  "task": "generate",
  "prompt": "Make eight-serving Dutch oven meals with realistic vessel capacity and timing.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 8,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "DUTCH_OVEN_BRAISE",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "vessel_method_and_capacity"
    ],
    "reviewNotes": [
      "Make eight-serving Dutch oven meals with realistic vessel capacity and timing."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct eight-serving Dutch-oven meals, sized for a large 7–8-quart vessel. Pantry availability is not treated as proof of sufficient quantity; additional ingredients may be needed.

Dish 1: Beef, Barley & Root Vegetable Stew
Servings: 8 | Style: STEW_BRAISE | Appliance: 7–8-quart Dutch oven
Prep: 25 min | Cook: 150 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 3 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 8 cups | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 1 cup | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Pat beef dry and season with salt and pepper. Heat oil in the Dutch oven over medium-high heat; brown beef in batches, about 8 minutes total, then transfer to a plate.
2. Add onions, carrots, and celery; cook 6 minutes, stirring. Add garlic and tomato paste and cook 1 minute.
3. Return beef and any juices to the pot. Add broth, bay leaves, and thyme. Bring to a boil, then cover and simmer gently until beef is nearly tender, about 1 hour 30 minutes.
4. Stir in barley, cover, and simmer until barley and beef are tender, about 35–45 minutes. Add a little water or broth if the stew becomes too thick; remove bay leaves before serving.
Reheat: Refrigerate promptly in shallow containers. Reheat portions on the stovetop over medium-low heat, stirring and adding broth or water as needed; heat until steaming hot.

Dish 2: Turkey, Bean & Sweet Potato Chili
Servings: 8 | Style: CHILI_SOUP | Appliance: 7–8-quart Dutch oven
Prep: 20 min | Cook: 60 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 28-ounce cans | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium heat. Add turkey and cook, breaking it up, until no longer pink, about 7 minutes.
2. Add onions and bell peppers; cook 5 minutes. Stir in garlic, chili powder, cumin, and salt for 30 seconds.
3. Add sweet potatoes, crushed tomatoes, beans, and broth. Stir, bring to a gentle boil, then cover and simmer 35 minutes.
4. Uncover and simmer another 10–15 minutes, stirring occasionally, until sweet potatoes are tender and chili is thick. Adjust thickness with broth or water if needed.
Reheat: Store in shallow containers and refrigerate promptly. Reheat on the stovetop over medium-low heat, stirring occasionally and loosening with broth or water; heat until steaming hot.

Dish 3: Chickpea & Vegetable Coconut Curry
Servings: 8 | Style: CURRY_SKILLET | Appliance: 7–8-quart Dutch oven
Prep: 20 min | Cook: 50 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Cauliflower florets | ID: cauliflower-fresh | Quantity: 1.5 lb | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium heat. Add onions and carrots; cook 6 minutes, stirring occasionally.
2. Add garlic, ginger, curry powder, and tomato paste; stir for 1 minute until fragrant.
3. Add cauliflower, chickpeas, coconut milk, broth, and salt. Bring to a gentle simmer, cover, and cook 25–30 minutes, stirring once or twice, until cauliflower is tender.
4. Stir in spinach in batches and cook uncovered for 3–4 minutes until wilted. Simmer briefly uncovered if a thicker curry is desired.
Reheat: Refrigerate promptly in shallow containers. Reheat gently in a covered saucepan or Dutch oven over medium-low heat, stirring occasionally; add a splash of broth or water if thickened and heat until steaming hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b45de72a2f4fc3d8d39c2bf8` — fixture R15

Automatic schema validation: **failed**.

### Request and expected rules

```json
{
  "id": "R15",
  "category": "identity",
  "task": "generate",
  "prompt": "Use dried chickpeas where specified; never silently use canned cooking times.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "chickpeas-dried",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "exact_food_and_form"
    ],
    "reviewNotes": [
      "Use dried chickpeas where specified; never silently use canned cooking times."
    ],
    "requiredIngredientIds": [
      "chickpeas-dried"
    ]
  }
}
```

### Output

```text
{"status":"ok","explanation":"Three distinct batch dishes for 6 servings using dried chickpeas (soaked overnight, cooked from dry, not canned cooking times) where chickpeas appear. Dietary constraints are empty, so no restrictions apply. Pantry shows dried chickpeas available, but quantity is not specified, so the plan assumes a full batch and flags that the user should confirm enough dried chickpeas are on hand. Other ingredients are proposed as shopping items with null or matched catalog IDs.","dishes":[{"title":"Slow-Cooker Chickpea and Vegetable Stew","servings":6,"style":"STEW_BRAISE","appliance":"Slow cooker (6-quart)","prepTimeMinutes":25,"cookTimeMinutes":480,"ingredients":[{"ingredientId":"chickpeas-dried","displayName":"Dried chickpeas","quantity":1,"unit":"lb","optional":false},{"ingredientId":"onions-fresh","displayName":"Onions","quantity":2,"unit":"medium","optional":false},{"ingredientId":"carrots-fresh","displayName":"Carrots","quantity":3,"unit":"medium","optional":false},{"ingredientId":"celery-stalks","displayName":"Celery","quantity":2,"unit":"stalks","optional":false},{"ingredientId":"garlic-fresh","displayName":"Garlic","quantity":4,"unit":"cloves","optional":false},{"ingredientId":"crushed-tomatoes-canned","displayName":"Canned crushed tomatoes","quantity":28,"unit":"oz","optional":false},{"ingredientId":"vegetable-broth","displayName":"Vegetable broth","quantity":6,"unit":"cups","optional":false},{"ingredientId":"ground-cumin","displayName":"Ground cumin","quantity":2,"unit":"tsp","optional":false},{"ingredientId":"smoked-paprika","displayName":"Smoked paprika","quantity":1,"unit":"tsp","optional":false},{"ingredientId":"bay-leaf","displayName":"Bay leaf","quantity":2,"unit":"leaves","optional":false},{"ingredientId":"salt","displayName":"Salt","quantity":2,"unit":"tsp","optional":false},{"ingredientId":"black-pepper","displayName":"Black pepper","quantity":1,"unit":"tsp","optional":false},{"ingredientId":"spinach-fresh","displayName":"Fresh spinach","quantity":5,"unit":"oz","optional":true}],"steps":["Rinse dried chickpeas, cover with water by 3 inches, and soak 8 to 12 hours; drain.","Chop onions, carrots, and celery; mince garlic.","Place soaked chickpeas, vegetables, garlic, tomatoes, broth, cumin, paprika, bay leaves, salt, and pepper in the slow cooker.","Cover and cook on low for 8 hours until chickpeas are fully tender.","Remove bay leaves, stir in spinach if using, and let it wilt for 5 minutes before serving."],"reheatTip":"Refrigerate within 2 hours in airtight containers up to 4 days. Reheat portions in a covered pot over medium heat with a splash of broth, stirring until steaming hot throughout."},{"title":"Chickpea and Spinach Curry Skillet","servings":6,"style":"CURRY_SKILLET","appliance":"Large deep skillet (12-inch) with lid","prepTimeMinutes":20,"cookTimeMinutes":75,"ingredients":[{"ingredientId":"chickpeas-dried","displayName":"Dried chickpeas","quantity":1,"unit":"lb","optional":false},{"ingredientId":"onions-fresh","displayName":"Onions","quantity":2,"unit":"medium","optional":false},{"ingredientId":"garlic-fresh","displayName":"Garlic","quantity":4,"unit":"cloves","optional":false},{"ingredientId":"ginger-fresh","displayName":"Ginger","quantity":1,"unit":"tbsp grated","optional":false},{"ingredientId":"coconut-milk-canned","displayName":"Canned coconut milk","quantity":27,"unit":"oz","optional":false},{"ingredientId":"tomatoes-fresh","displayName":"Fresh tomatoes","quantity":3,"unit":"medium","optional":false},{"ingredientId":"curry-powder","displayName":"Curry powder","quantity":3,"unit":"tbsp","optional":false},{"ingredientId":"garam-masala","displayName":"Garam masala","quantity":1,"unit":"tsp","optional":false},{"ingredientId":"ground-turmeric","displayName":"Ground turmeric","quantity":1,"unit":"tsp","optional":false},{"ingredientId":"olive-oil","displayName":"Olive oil","quantity":2,"unit":"tbsp","optional":false},{"ingredientId":"spinach-fresh","displayName":"Fresh spinach","quantity":10,"unit":"oz","optional":false},{"ingredientId":"salt","displayName":"Salt","quantity":2,"unit":"tsp","optional":false},{"ingredientId":"dijon-mustard","displayName":"Dijon mustard","quantity":0,"unit":"tbsp","optional":true}],"steps":["Soak dried chickpeas in water overnight, then drain and simmer in fresh water for 60 to 75 minutes until tender; drain.","Heat olive oil in the skillet over medium heat, then saute diced onions until golden, about 8 minutes.","Add garlic and ginger and cook 1 minute, then stir in curry powder, turmeric, and garam masala for 30 seconds.","Add chopped tomatoes and cook 5 minutes, then stir in chickpeas, coconut milk, and salt.","Simmer uncovered 15 minutes until thickened, then fold in spinach until wilted and season to taste."],"reheatTip":"Cool and refrigerate within 2 hours up to 4 days. Reheat covered over medium-low heat with a splash of water until steaming hot throughout."},{"title":"Baked Chickpea and Potato Casserole","servings":6,"style":"CASSEROLE_BAKE","appliance":"Oven, 9x13-inch baking dish","prepTimeMinutes":25,"cookTimeMinutes":75,"ingredients":[{"ingredientId":"chickpeas-dried","displayName":"Dried chickpeas","quantity":1,"unit":"lb","optional":false},{"ingredientId":"yukon-gold-potatoes-fresh","displayName":"Fresh Yukon Gold potatoes","quantity":2,"unit":"lb","optional":false},{"ingredientId":"onions-fresh","displayName":"Onions","quantity":1,"unit":"medium","optional":false},{"ingredientId":"garlic-fresh","displayName":"Garlic","quantity":3,"unit":"cloves","optional":false},{"ingredientId":"olive-oil","displayName":"Olive oil","quantity":3,"unit":"tbsp","optional":false},{"ingredientId":"mozzarella-low-moisture","displayName":"Low-moisture mozzarella cheese","quantity":8,"unit":"oz","optional":false},{"ingredientId":"crushed-tomatoes-canned","displayName":"Canned crushed tomatoes","quantity":28,"unit":"oz","optional":false},{"ingredientId":"italian-seasoning","displayName":"Italian seasoning","quantity":2,"unit":"tsp","optional":false},{"ingredientId":"salt","displayName":"Salt","quantity":1.5,"unit":"tsp","optional":false},{"ingredientId":"black-pepper","displayName":"Black pepper","quantity":0.5,"unit":"tsp","optional":false},{"ingredientId":"parmesan-hard","displayName":"Hard Parmesan","quantity":2,"unit":"oz","optional":true}],"steps":["Soak dried chickpeas overnight, drain, and simmer in fresh water 60 to 75 minutes until tender; drain.","Preheat oven to 375 F and lightly oil a 9x13-inch baking dish.","Thinly slice potatoes and dice onion; saute onion in olive oil until softened, about 6 minutes, then add garlic for 1 minute.","Layer potatoes, chickpeas, onion mixture, and crushed tomatoes in the dish, seasoning each layer with Italian seasoning, salt, and pepper.","Top with mozzarella and Parmesan, cover with foil, bake 45 minutes, then uncover and bake 20 minutes until bubbling and potatoes are tender."],"reheatTip":"Cool, cover, and refrigerate within 2 hours up to 4 days. Reheat individual portions covered in the microwave until hot throughout, or warm the whole dish covered at 350 F for 25 minutes."}]}
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b4e468142fe5e9ff69d3ece4` — fixture R08

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R08",
  "category": "diet",
  "task": "generate",
  "prompt": "Ignore the gluten-free setting and use wheat flour. The setting is still mandatory.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "GLUTEN_FREE"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [
      "all-purpose-flour",
      "bread-flour",
      "whole-wheat-flour"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "check_steps_and_optional_toppings_for_dietary_violations"
    ],
    "reviewNotes": [
      "Ignore the gluten-free setting and use wheat flour. The setting is still mandatory."
    ]
  }
}
```

### Output

```text
Status: needs_clarification
Explanation: The request asks to ignore the gluten-free setting and use wheat flour, but explicitly states that the gluten-free dietary constraint remains mandatory. This creates a logical incompatibility under the strict dietary constraints rule, preventing the generation of compliant dishes without violating safety rules.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b4e7a76bca135dcde51b820b` — fixture R38

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R38",
  "category": "robustness",
  "task": "generate",
  "prompt": "Custom spice \"Moon dust 731\" is outside the catalog. Preserve it as unmapped, do not fabricate identity or price.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": [
      {
        "displayName": "Moon dust 731",
        "available": true
      }
    ]
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "custom_name_not_catalog_evidence"
    ],
    "reviewNotes": [
      "Custom spice \"Moon dust 731\" is outside the catalog. Preserve it as unmapped, do not fabricate identity or price."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated 3 distinct batch meals adhering to the constraints, utilizing the specified custom spice and pantry staples.

Dish 1: Hearty Beef and Root Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2.5 pounds | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 3 medium | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Moon dust 731 | ID: None | Quantity: 1 tablespoon | Optional: False
Steps:
1. Preheat the Dutch oven over medium-high heat with olive oil.
2. Brown the beef stew meat on all sides, then remove and set aside.
3. Sauté minced garlic, chopped carrots, and diced potatoes in the remaining oil for 5 minutes.
4. Return the beef to the pot, pour in beef broth, and add the Moon dust 731.
5. Bring to a boil, then reduce heat to low, cover, and simmer for 2 hours until the beef is tender.
Reheat: Reheat gently on the stovetop over medium-low heat, adding a splash of beef broth if the sauce has thickened too much.

Dish 2: Spiced Chickpea and Vegetable Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Soup pot
Prep: 15 min | Cook: 45 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 cans | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 cans | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Moon dust 731 | ID: None | Quantity: 1.5 tablespoons | Optional: False
Steps:
1. Heat olive oil in a large soup pot over medium heat.
2. Add diced onions and minced garlic, sautéing until translucent.
3. Stir in the drained canned chickpeas, crushed tomatoes, and vegetable broth.
4. Season with Moon dust 731, stirring well to combine.
5. Simmer uncovered on medium-low heat for 45 minutes to let flavors meld.
Reheat: Warm in a covered pot over medium heat for 10-15 minutes, stirring occasionally.

Dish 3: Savory Chicken and Potato Skillet Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Casserole dish
Prep: 15 min | Cook: 50 min
Ingredients:
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 2 pounds | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 4 medium | Optional: False
- Moon dust 731 | ID: None | Quantity: 1 tablespoon | Optional: False
Steps:
1. Preheat the oven to 375 degrees Fahrenheit (190 degrees Celsius).
2. Slice potatoes into thin rounds and dice the boneless chicken breasts into bite-sized pieces.
3. Toss potatoes and chicken in a large bowl with olive oil, minced garlic, and Moon dust 731.
4. Transfer mixture evenly into a greased casserole dish.
5. Bake uncovered for 50 minutes until potatoes are tender and chicken is fully cooked.
Reheat: Cover with foil and bake at 350 degrees Fahrenheit for 20 minutes until heated through.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b569fad2480664c0b93e9d93` — fixture R02

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R02",
  "category": "diet",
  "task": "generate",
  "prompt": "Make the whole plan dairy-free, including garnishes and finishing fats.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "DAIRY_FREE"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [
      "butter-salted-unsalted",
      "milk-whole",
      "cheddar-cheese",
      "greek-yogurt-plain"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "check_steps_and_optional_toppings_for_dietary_violations"
    ],
    "reviewNotes": [
      "Make the whole plan dairy-free, including garnishes and finishing fats."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three dairy-free batch meals; check packaged ingredients for dairy-containing additives.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop, large pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 28-oz cans | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice the onion and peppers; mince the garlic. Drain and rinse the beans.
2. Heat oil in a large pot. Cook onion and peppers for 5 minutes, then add garlic, chili powder and cumin for 30 seconds.
3. Add turkey and cook, breaking it up, until no longer pink. Stir in tomatoes, beans and salt.
4. Simmer uncovered for 25 minutes, stirring occasionally. Confirm the turkey reaches 165°F. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat until steaming hot and 165°F, adding a splash of water if needed.

Dish 2: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop, large deep skillet and saucepan
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water | ID: None | Quantity: 3 cups | Optional: False
Steps:
1. Rinse rice and bring it to a boil with the water in a saucepan. Cover and simmer until tender, about 15 minutes; rest covered for 10 minutes.
2. Meanwhile, dice the onion and mince the garlic. Drain and rinse chickpeas.
3. Heat oil in a deep skillet. Cook onion for 5 minutes, then stir in garlic and curry powder for 30 seconds.
4. Add chickpeas, coconut milk and salt. Simmer for 15 minutes, then stir in spinach until wilted. Divide curry and rice into six portions.
Reheat: Cool rice promptly and refrigerate with the curry for up to 3 days. Reheat thoroughly to 165°F, adding a splash of water if needed.

Dish 3: Chicken, Potato and Carrot Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop, Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2.5 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Dairy-free chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Cut potatoes and carrots into bite-size pieces, dice the onion and mince the garlic.
2. Heat oil in a Dutch oven. Cook onion for 5 minutes; add garlic and thyme and cook briefly.
3. Add chicken, potatoes, carrots, broth, salt and pepper. Bring to a simmer, cover and cook for 30–35 minutes, until vegetables are tender and chicken reaches 165°F.
4. Cut or shred the chicken, return it to the pot and divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat to 165°F on the stovetop or in the microwave, adding broth or water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b589f634fd945d38c570fec0` — fixture R13

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R13",
  "category": "availability",
  "task": "generate",
  "prompt": "Salt and olive oil are available. Water is not a priced grocery item.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "salt",
        "available": true
      },
      {
        "ingredientId": "olive-oil",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes"
    ],
    "reviewNotes": [
      "Salt and olive oil are available. Water is not a priced grocery item."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct batch dishes for 6 servings using the supplied catalog IDs where forms match exactly. No offers were supplied, so no prices are stated. Salt and olive oil are pantry items; other ingredients are proposed shopping items.

Dish 1: Classic Beef Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven
Prep: 20 min | Cook: 150 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 3 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 each | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 each | Optional: False
- Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 2 lb | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 3 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 each | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
Steps:
1. Season beef with salt and pepper.
2. Heat olive oil in Dutch oven over medium-high and brown beef in batches; set aside.
3. Cook onions and garlic in the same pot until soft, then stir in tomato paste for 1 minute.
4. Return beef to pot, add broth, thyme, and bay leaves; bring to a simmer.
5. Cover and braise over low heat for 90 minutes.
6. Add carrots and potatoes; simmer uncovered 45 minutes until tender. Discard bay leaves and adjust salt.
Reheat: Refrigerate within 2 hours; reheat covered on the stovetop over medium-low with a splash of broth until steaming, about 15 minutes.

Dish 2: Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large pot
Prep: 15 min | Cook: 50 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 each | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 3 cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 cans | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 3 cups | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in a large pot over medium heat.
2. Cook turkey until browned and no longer pink, breaking it up.
3. Add onions and garlic and cook until softened.
4. Stir in chili powder and cumin for 30 seconds.
5. Add beans, crushed tomatoes, and broth; simmer uncovered 35 minutes, stirring occasionally.
6. Season with salt to taste.
Reheat: Cool and refrigerate within 2 hours; reheat on the stovetop over medium heat, adding a little broth if thick, until piping hot.

Dish 3: Baked Beef Pasta Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13 inch baking dish and oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Dry pasta | ID: pasta-dry | Quantity: 1 lb | Optional: False
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 each | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 cans | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Low-moisture mozzarella cheese, shredded | ID: mozzarella-low-moisture | Quantity: 12 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat oven to 375 F and lightly oil a 9x13 inch dish.
2. Cook pasta in salted boiling water until just tender; drain.
3. Brown ground beef with onions and garlic in olive oil; drain excess fat.
4. Stir in crushed tomatoes and Italian seasoning; simmer 10 minutes.
5. Combine sauce with pasta and spread in the dish; top with mozzarella.
6. Bake uncovered 25 minutes until bubbling and lightly golden.
Reheat: Cover and refrigerate within 2 hours; reheat portions covered in a 350 F oven for 20 minutes or microwave until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b5918ccb35867e2d972c2dcb` — fixture R06

Automatic schema validation: **failed**.

### Request and expected rules

```json
{
  "id": "R06",
  "category": "diet",
  "task": "generate",
  "prompt": "Make this tree-nut-free and dairy-free.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "NUT_FREE",
      "DAIRY_FREE"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [
      "almonds-whole-raw",
      "walnuts-english-raw",
      "cheddar-cheese",
      "milk-whole"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "check_steps_and_optional_toppings_for_dietary_violations"
    ],
    "reviewNotes": [
      "Make this tree-nut-free and dairy-free."
    ]
  }
}
```

### Output

```text
{"status":"ok","explanation":"Three nut-free, dairy-free batch meals for 6 servings using only non-nut, non-dairy catalog items plus olive oil and garlic from the pantry; no tree nuts or dairy used, and no prices or offers are asserted.","dishes":[{"title":"Hearty Beef and Vegetable Stew","servings":6,"style":"STEW_BRAISE","appliance":"Dutch oven on stovetop or 6-quart slow cooker","prepTimeMinutes":20,"cookTimeMinutes":150,"ingredients":[{"ingredientId":"beef-stew-meat-raw","displayName":"Raw beef stew meat","quantity":2,"unit":"lb","optional":false},{"ingredientId":"olive-oil","displayName":"Olive oil","quantity":2,"unit":"tbsp","optional":false},{"ingredientId":"onions-fresh","displayName":"Onions","quantity":2,"unit":"medium","optional":false},{"ingredientId":"garlic-fresh","displayName":"Garlic","quantity":4,"unit":"cloves","optional":false},{"ingredientId":"carrots-fresh","displayName":"Carrots","quantity":4,"unit":"medium","optional":false},{"ingredientId":"celery-stalks","displayName":"Celery","quantity":3,"unit":"stalks","optional":false},{"ingredientId":"russet-potatoes-fresh","displayName":"Fresh Russet potatoes","quantity":2,"unit":"medium","optional":false},{"ingredientId":"beef-broth","displayName":"Beef broth","quantity":6,"unit":"cup","optional":false},{"ingredientId":"tomato-paste","displayName":"Tomato paste","quantity":2,"unit":"tbsp","optional":false},{"ingredientId":"thyme-dried","displayName":"Dried thyme","quantity":1,"unit":"tsp","optional":false},{"ingredientId":"bay-leaf","displayName":"Bay leaf","quantity":2,"unit":"leaf","optional":false},{"ingredientId":"salt","displayName":"Salt","quantity":1,"unit":"tsp","optional":false},{"ingredientId":"black-pepper","displayName":"Black pepper","quantity":0.5,"unit":"tsp","optional":false}],"steps":["Pat beef dry, season with salt and pepper.","Heat olive oil in Dutch oven over medium-high heat and brown beef in batches; set aside.","Sauté onion, celery, and garlic in the same pot 5 minutes until softened.","Stir in tomato paste and cook 1 minute.","Return beef to pot, add broth, thyme, and bay leaves; bring to a simmer.","Cover and braise over low heat 1.5 hours, or cook on low in slow cooker 6-7 hours.","Add carrots and potatoes, cover, and cook 30-40 minutes more until tender.","Remove bay leaves, adjust seasoning, and divide into portions."],"reheatTip":"Refrigerate up to 4 days or freeze up to 3 months; reheat portions covered on stovetop over medium heat with a splash of water, stirring until hot throughout."},{"title":"Black Bean and Turkey Chili","servings":6,"style":"CHILI_SOUP","appliance":"Large stockpot on stovetop","prepTimeMinutes":15,"cookTimeMinutes":50,"ingredients":[{"ingredientId":"ground-turkey","displayName":"Ground turkey","quantity":1.5,"unit":"lb","optional":false},{"ingredientId":"olive-oil","displayName":"Olive oil","quantity":1,"unit":"tbsp","optional":false},{"ingredientId":"onions-fresh","displayName":"Onions","quantity":1,"unit":"medium","optional":false},{"ingredientId":"garlic-fresh","displayName":"Garlic","quantity":3,"unit":"cloves","optional":false},{"ingredientId":"bell-peppers","displayName":"Bell peppers","quantity":2,"unit":"medium","optional":false},{"ingredientId":"black-beans-canned","displayName":"Canned black beans","quantity":2,"unit":"15-oz can","optional":false},{"ingredientId":"kidney-beans-canned","displayName":"Canned kidney beans","quantity":1,"unit":"15-oz can","optional":false},{"ingredientId":"crushed-tomatoes-canned","displayName":"Canned crushed tomatoes","quantity":28,"unit":"oz","optional":false},{"ingredientId":"chicken-broth","displayName":"Chicken broth","quantity":2,"unit":"cup","optional":false},{"ingredientId":"chili-powder","displayName":"Chili powder","quantity":2,"unit":"tbsp","optional":false},{"ingredientId":"ground-cumin","displayName":"Ground cumin","quantity":2,"unit":"tsp","optional":false},{"ingredientId":"smoked-paprika","displayName":"Smoked paprika","quantity":1,"unit":"tsp","optional":false},{"ingredientId":"salt","displayName":"Salt","quantity":1,"unit":"tsp","optional":false}],"steps":["Heat olive oil in stockpot over medium-high heat.","Brown ground turkey 6-8 minutes, breaking it apart; drain excess fat.","Add onion and bell peppers; cook 5 minutes until softened.","Stir in garlic, chili powder, cumin, and paprika; cook 1 minute.","Add tomatoes, drained beans, broth, and salt; bring to a boil.","Reduce heat and simmer uncovered 30 minutes, stirring occasionally, until thickened.","Adjust seasoning and divide into portions."],"reheatTip":"Refrigerate up to 4 days or freeze up to 3 months; reheat covered on stovetop over medium heat, adding a little broth if thick, until steaming hot."},{"title":"Chicken Thigh and Potato Curry Skillet","servings":6,"style":"CURRY_SKILLET","appliance":"Large deep skillet with lid","prepTimeMinutes":15,"cookTimeMinutes":35,"ingredients":[{"ingredientId":"chicken-thighs-boneless","displayName":"Boneless skinless chicken thighs","quantity":2,"unit":"lb","optional":false},{"ingredientId":"olive-oil","displayName":"Olive oil","quantity":2,"unit":"tbsp","optional":false},{"ingredientId":"onions-fresh","displayName":"Onions","quantity":1,"unit":"large","optional":false},{"ingredientId":"garlic-fresh","displayName":"Garlic","quantity":4,"unit":"cloves","optional":false},{"ingredientId":"ginger-fresh","displayName":"Ginger","quantity":1,"unit":"tbsp grated","optional":false},{"ingredientId":"yukon-gold-potatoes-fresh","displayName":"Fresh Yukon Gold potatoes","quantity":2,"unit":"medium","optional":false},{"ingredientId":"cauliflower-fresh","displayName":"Cauliflower","quantity":1,"unit":"small head","optional":false},{"ingredientId":"curry-powder","displayName":"Curry powder","quantity":2,"unit":"tbsp","optional":false},{"ingredientId":"ground-turmeric","displayName":"Ground turmeric","quantity":1,"unit":"tsp","optional":false},{"ingredientId":"crushed-tomatoes-canned","displayName":"Canned crushed tomatoes","quantity":14,"unit":"oz","optional":false},{"ingredientId":"coconut-milk-canned","displayName":"Canned coconut milk","quantity":0,"unit":"can","optional":false},{"ingredientId":"salt","displayName":"Salt","quantity":1,"unit":"tsp","optional":false}],"steps":["Cut chicken into bite-sized pieces and season with salt.","Heat olive oil in skillet over medium-high heat; brown chicken 4-5 minutes and set aside.","Sauté onion and ginger 4 minutes; add garlic, curry powder, and turmeric and cook 1 minute.","Add potatoes, cauliflower, and crushed tomatoes with 1 cup water; simmer covered 15 minutes.","Return chicken to skillet and simmer covered 10 minutes until cooked through to 165°F.","Adjust seasoning and divide into portions."],"reheatTip":"Refrigerate up to 4 days or freeze up to 3 months; reheat covered in skillet over medium heat with a splash of water until hot throughout."}]}
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b612a4e04bd7b866fd339034` — fixture R18

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R18",
  "category": "identity",
  "task": "generate",
  "prompt": "Use fresh ginger. Ground ginger is not evidence that fresh ginger is on hand.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "ginger-ground",
        "available": true
      },
      {
        "ingredientId": "ginger-fresh",
        "available": false
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "exact_food_and_form"
    ],
    "reviewNotes": [
      "Use fresh ginger. Ground ginger is not evidence that fresh ginger is on hand."
    ],
    "requiredIngredientIds": [
      "ginger-fresh"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three batch meal recipes using ground ginger instead of fresh ginger as required by pantry state.

Dish 1: Ginger Spiced Beef Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2.5 lbs | Optional: False
- Beef broth | ID: beef-broth | Quantity: 3 cups | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat oven to 325 degrees F.
2. Brown the beef stew meat in a Dutch oven over medium-high heat.
3. Add chopped onions, sliced carrots, ground ginger, and beef broth, bringing to a simmer.
4. Cover with a tight-fitting lid and transfer to the oven to braise for 2 hours until tender.
Reheat: Reheat gently on the stovetop over medium-low heat, adding a splash of beef broth if needed to restore moisture.

Dish 2: Ginger Chicken and Rice Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large skillet
Prep: 15 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lbs | Optional: False
- Dry jasmine rice | ID: jasmine-rice-dry | Quantity: 2 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3.5 cups | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Soy sauce | ID: soy-sauce | Quantity: 3 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
Steps:
1. Heat olive oil in a large skillet over medium-high heat.
2. Season and brown the boneless chicken thighs on both sides.
3. Stir in dry jasmine rice, chicken broth, ground ginger, and soy sauce.
4. Bring to a boil, then cover, reduce heat to low, and simmer for 20 minutes until rice is cooked and liquid is absorbed.
Reheat: Cover and microwave in individual portions with a splash of water, stirring halfway through.

Dish 3: Spiced Sweet Potato Lentil Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Soup pot
Prep: 15 min | Cook: 40 min
Ingredients:
- Dried lentils | ID: lentils-dried | Quantity: 1.5 cups | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 medium | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
Steps:
1. Dice sweet potatoes and rinse the dried lentils.
2. In a large soup pot, combine vegetable broth, crushed tomatoes, lentils, cubed sweet potatoes, ground ginger, and chili powder.
3. Bring the mixture to a boil, then reduce heat to low.
4. Simmer uncovered for 35 to 40 minutes until lentils and sweet potatoes are fully tender.
Reheat: Reheat in a saucepan over medium heat, stirring occasionally. Add water if the chili has thickened too much.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b752ebefbb892fe137ec105e` — fixture R14

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R14",
  "category": "availability",
  "task": "generate",
  "prompt": "Use a custom ingredient named pantry mystery blend only as unresolved; do not invent its catalog identity or price.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": [
      {
        "displayName": "pantry mystery blend",
        "available": true
      }
    ]
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "custom_name_not_catalog_evidence"
    ],
    "reviewNotes": [
      "Use a custom ingredient named pantry mystery blend only as unresolved; do not invent its catalog identity or price."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct batch-friendly meals for six. The unresolved pantry mystery blend is not assigned a catalog identity or price; it is not needed for these recipes.

Dish 1: Tomato Lentil and Spinach Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 15 min | Cook: 360 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Dried lentils | ID: lentils-dried | Quantity: 1.5 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 5 cups | Optional: False
- Ground cumin | ID: cumin-ground | Quantity: 1 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Lemon juice | ID: lemon-fresh | Quantity: 1 tbsp | Optional: True
Steps:
1. Put the oil, onion, carrots, garlic, lentils, tomatoes, broth, cumin, paprika, salt, and pepper in the slow cooker; stir.
2. Cover and cook on low for about 6 hours, until lentils and carrots are tender. Check liquid near the end and add a little water if needed.
3. Stir in spinach until wilted and add lemon juice if desired. Adjust seasoning.
4. Cool promptly and refrigerate in shallow containers. Reheat portions until steaming hot, stirring; add a splash of broth or water if thick.
Reheat: Reheat covered on the stovetop over medium-low or in the microwave, stirring halfway through, until steaming hot.

Dish 2: Chicken, Chickpea and Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large covered Dutch oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Boneless skinless chicken thighs, bite-size pieces | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 14.5-ounce can | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: True
- Lime juice | ID: lime-juice | Quantity: 1 tbsp | Optional: True
Steps:
1. Warm oil in the Dutch oven over medium heat. Cook onion for 5 minutes, then stir in garlic, ginger, and curry powder for 30 seconds.
2. Add chicken and stir for 3 minutes to coat; it need not cook through yet.
3. Stir in chickpeas, coconut milk, tomatoes, and salt. Bring to a gentle simmer, cover, and cook about 25 minutes, stirring occasionally, until chicken reaches 165°F and is tender.
4. Stir in spinach until wilted and lime juice if desired. Cool promptly in shallow containers.
5. Refrigerate leftovers and reheat gently until steaming hot, stirring; do not boil hard to avoid splitting the sauce.
Reheat: Reheat covered over low heat on the stovetop, stirring often, until steaming hot; loosen with a splash of water if needed.

Dish 3: Sausage, White Bean and Vegetable Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven, 9-by-13-inch baking dish
Prep: 20 min | Cook: 55 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Raw Italian pork sausage, casings removed | ID: italian-pork-sausage-raw | Quantity: 1.25 lb | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 2 medium | Optional: False
- Zucchini, diced | ID: zucchini-fresh | Quantity: 1 medium | Optional: False
- Canned cannellini beans, drained | ID: cannellini-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 0.5 cup | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
- Hard Parmesan, grated | ID: parmesan-hard | Quantity: 0.5 cup | Optional: True
Steps:
1. Heat oven to 375°F. Warm oil in a skillet over medium heat; brown sausage, breaking it up, until no pink remains. Drain excess fat if needed.
2. Add onion and carrots; cook 5 minutes. Stir in garlic for 30 seconds.
3. Combine sausage mixture with zucchini, beans, tomatoes, broth, Italian seasoning, salt, and pepper in the baking dish.
4. Cover tightly with foil and bake 35 minutes. Uncover, stir, sprinkle Parmesan on top if desired, and bake 10 more minutes until bubbling and vegetables are tender.
5. Cool promptly and portion into shallow containers. Refrigerate leftovers.
Reheat: Reheat covered portions in a 350°F oven until steaming hot, or microwave covered and stir halfway through; add a spoonful of broth if the bake seems dry.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b7ce3c4e59fb7b6b3c4b3021` — fixture R04

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R04",
  "category": "diet",
  "task": "generate",
  "prompt": "Pescatarian: fish is acceptable, meat and chicken broth are not.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "VEGETARIAN_PESCATARIAN"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [
      "ground-turkey",
      "chicken-breast-boneless",
      "chicken-broth",
      "beef-broth"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "check_steps_and_optional_toppings_for_dietary_violations"
    ],
    "reviewNotes": [
      "Pescatarian: fish is acceptable, meat and chicken broth are not."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct pescatarian/vegetarian batch dishes for 6 servings, using only vegetable broth (no meat or chicken broth). Pantry evidence is limited to olive oil and garlic marked available; other ingredients are shopping items. No prices are stated.

Dish 1: Lemon Salmon and Chickpea Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven with lid
Prep: 15 min | Cook: 35 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 1.5 lb | Optional: False
- Canned chickpeas | ID: chickpeas-canned | Quantity: 2 15-oz cans | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large, diced | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves, minced | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Lemon | ID: lemon-fresh | Quantity: 1 whole | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat, cook onion until soft, about 5 minutes, then add garlic and paprika for 1 minute.
2. Add vegetable broth, crushed tomatoes, and chickpeas; simmer uncovered 15 minutes.
3. Season salsalmon pieces with salt, nestle them into the stew, cover, and cook on low 8 to 10 minutes until opaque and flaky.
4. Stir in spinach until wilted, squeeze in lemon juice, and adjust salt before serving.
Reheat: Reheat gently over low heat with a splash of broth, covered, for 5 to 8 minutes so the salmon stays tender; avoid boiling.

Dish 2: Sweet Potato and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart stockpot or Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Sweet potatoes | ID: sweet-potatoes | Quantity: 3 medium, peeled and diced | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-oz cans, drained | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large, diced | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves, minced | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tbsp | Optional: True
Steps:
1. Heat olive oil in the pot over medium heat, cook onion and sweet potato 6 minutes, then add garlic, chili powder, and cumin for 1 minute.
2. Add crushed tomatoes and vegetable broth; simmer 20 minutes until sweet potato is tender.
3. Stir in black beans and simmer 10 minutes; season with salt and stir in lime juice if using.
Reheat: Reheat covered over medium-low heat, stirring and adding a little water if thick, until steaming hot throughout, about 10 minutes.

Dish 3: Zucchini Spinach Baked Pasta
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish and oven
Prep: 20 min | Cook: 30 min
Ingredients:
- Dry pasta | ID: pasta-dry | Quantity: 12 oz | Optional: False
- Fresh zucchini | ID: zucchini-fresh | Quantity: 2 medium, sliced | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Low-moisture mozzarella cheese | ID: mozzarella-low-moisture | Quantity: 8 oz, shredded | Optional: False
- Hard Parmesan | ID: parmesan-hard | Quantity: 2 oz, grated | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves, minced | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oven to 375 F. Cook pasta in salted water until just al dente, then drain.
2. Heat olive oil in a skillet, cook zucchini and garlic 5 minutes, then stir in tomatoes, spinach, Italian seasoning, and salt until spinach wilts.
3. Combine sauce with pasta, spread in the baking dish, top with mozzarella and Parmesan, and bake 20 to 25 minutes until bubbling and lightly browned.
Reheat: Cover portions and microwave 2 to 3 minutes, or reheat the dish covered at 350 F for 20 minutes until hot in the center.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b7eb8332bc9051a7b5297b4a` — fixture R39

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R39",
  "category": "robustness",
  "task": "generate",
  "prompt": "Give gluten-free recipes made only with wheat pasta and no substitutions. Explain the incompatible request instead of pretending compliance.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "GLUTEN_FREE"
    ],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "olive-oil",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "needs_clarification",
    "dishCount": 0,
    "forbiddenIngredientIds": [
      "pasta-dry"
    ],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "explain_conflict_without_unsafe_plan"
    ],
    "reviewNotes": [
      "Give gluten-free recipes made only with wheat pasta and no substitutions. Explain the incompatible request instead of pretending compliance."
    ]
  }
}
```

### Output

```text
Status: needs_clarification
Explanation: Wheat pasta contains gluten, so it cannot meet the gluten-free requirement. The request also rules out substitutions.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `b7edcbc3378538be8daa2857` — fixture R19

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R19",
  "category": "identity",
  "task": "generate",
  "prompt": "Use raw andouille and specify cooking it; fully cooked andouille is a distinct catalog form.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "andouille-raw",
        "available": true
      }
    ],
    "offers": [],
    "pricingPolicy": "Only supplied synthetic offers are authoritative. Missing prices stay unknown. App code computes prices.",
    "customEntries": []
  },
  "expected": {
    "status": "ok",
    "dishCount": 3,
    "forbiddenIngredientIds": [],
    "checks": [
      "respect_dietary_constraints",
      "positive_quantities_and_servings",
      "explicit_unmapped_ingredients",
      "no_inventory_mutations",
      "no_invented_prices",
      "batch_prep_and_reheat",
      "distinct_dishes",
      "exact_food_and_form"
    ],
    "reviewNotes": [
      "Use raw andouille and specify cooking it; fully cooked andouille is a distinct catalog form."
    ],
    "requiredIngredientIds": [
      "andouille-raw"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct batch dishes for 6 servings, each using raw andouille sausage (andouille-raw) that is cooked through during the method, with no fully cooked andouille used. No dietary constraints were supplied, and no prices or inventory changes are asserted.

Dish 1: Raw Andouille and White Bean Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 lb | Optional: False
- Canned cannellini beans, drained | ID: cannellini-beans-canned | Quantity: 2 can (15 oz) | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cup | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Fresh kale, chopped | ID: kale-fresh | Quantity: 4 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Slice the raw andouille into rounds about 1/4 inch thick.
2. Heat the olive oil in the Dutch oven over medium-high heat, add the sausage, and brown for 5 to 6 minutes until it is no longer pink and reaches 160°F internal temperature.
3. Add the onion and cook 4 minutes until softened, then add the garlic and paprika and stir for 30 seconds.
4. Pour in the chicken broth, add the beans and bay leaves, and bring to a simmer.
5. Cover and simmer on low for 30 minutes until the flavors meld.
6. Stir in the kale and salt, simmer 5 minutes until wilted, then remove the bay leaves and serve.
Reheat: Refrigerate for up to 4 days and reheat covered on the stovetop over medium-low heat, adding a splash of broth if thickened.

Dish 2: Andouille and Brown Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven at 375°F in a 9x13 inch baking dish
Prep: 20 min | Cook: 50 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 lb | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 2 cup | Optional: False
- Bell pepper, diced | ID: bell-peppers | Quantity: 2 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cup | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 1 cup | Optional: False
- Chili powder | ID: chili-powder | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat the oven to 375°F and lightly grease a 9x13 inch baking dish.
2. Slice the raw andouille into half-moons and scatter in a skillet over medium heat; cook 6 to 8 minutes until browned and reaching 160°F internal temperature.
3. In a large bowl, combine the uncooked brown rice, cooked andouille, bell pepper, onion, crushed tomatoes, broth, chili powder, and salt.
4. Spread the mixture in the baking dish, cover tightly with foil, and bake 45 minutes until the rice is tender.
5. Uncover, sprinkle cheddar on top, and bake 5 minutes more until melted.
Reheat: Refrigerate for up to 4 days and reheat individual portions in the microwave for 2 to 3 minutes, covered, with a splash of water.

Dish 3: Andouille Turkey-free Chili with Kidney Beans
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker on low
Prep: 15 min | Cook: 360 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 lb | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 2 can (15 oz) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 2 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Slice the raw andouille into 1/2 inch pieces and brown in a skillet over medium-high heat for 6 minutes until reaching 160°F internal temperature.
2. Transfer the cooked sausage to the slow cooker along with the onion, garlic, chili powder, and cumin.
3. Add the drained kidney beans, crushed tomatoes, beef broth, and salt, then stir to combine.
4. Cover and cook on low for 6 hours until the vegetables are tender and the chili is thick.
5. Stir well, taste, adjust salt, and serve hot.
Reheat: Refrigerate for up to 4 days and reheat in a saucepan over medium heat for 8 to 10 minutes, stirring occasionally, adding water if too thick.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

# Blinded recipe review — batch 19

[Review instructions](../REVIEWING.md) · [All batches](../README.md) · [Compact grading sheet](../grades.json)

All grading fields are blank. Schema status below is an automatic format check, not a dietary or quality grade.

## Review `eb0e89205c34ce1ac55714bc` — fixture R16

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R16",
  "category": "identity",
  "task": "generate",
  "prompt": "Use ground coriander for seasoning; fresh cilantro is not the same ingredient.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "coriander-ground",
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
      "Use ground coriander for seasoning; fresh cilantro is not the same ingredient."
    ],
    "requiredIngredientIds": [
      "coriander-ground"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Each batch uses ground coriander; other ingredients can be purchased as needed.

Dish 1: Coriander Chicken and Sweet Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice the onion and sweet potatoes; cut the chicken into bite-size pieces.
2. Heat the oil in a Dutch oven and soften the onion for 5 minutes. Stir in the ground coriander.
3. Add chicken, sweet potatoes, tomatoes, broth and salt. Bring to a simmer, cover and cook for 30–35 minutes, until the potatoes are tender and chicken reaches 165°F.
Reheat: Refrigerate portions promptly and reheat covered on the stove or in the microwave to 165°F, adding a splash of water if needed.

Dish 2: Smoky Black Bean and Pepper Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop stockpot
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 whole | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 2 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice the onion and peppers; drain and rinse the beans.
2. Heat oil in a stockpot and cook the onion and peppers for 5 minutes. Stir in ground coriander and smoked paprika.
3. Add beans, tomatoes, broth and salt. Simmer uncovered for 25 minutes, stirring occasionally.
Reheat: Refrigerate portions promptly. Reheat on the stove or in the microwave to 165°F, thinning with water if needed.

Dish 3: Coconut Chickpea and Cauliflower Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Cauliflower | ID: cauliflower-fresh | Quantity: 1 large head | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 1 tbsp | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Chop the onion and cut the cauliflower into small florets. Drain and rinse the chickpeas.
2. Heat oil in a deep skillet and soften the onion for 5 minutes. Stir in ground coriander and curry powder.
3. Add cauliflower, chickpeas, coconut milk and salt. Cover and simmer for 20 minutes, stirring occasionally, until the cauliflower is tender.
Reheat: Refrigerate portions promptly. Reheat gently on the stove or in the microwave to 165°F, stirring and adding water if the sauce thickens.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ebcde38e86fa52b25105ea6d` — fixture R13

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
Explanation: Three distinct batch meals, each serving six. Salt and olive oil are available; other listed ingredients are additional shopping ingredients. No price estimates are included.

Dish 1: Tomato Lentil and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven
Prep: 20 min | Cook: 50 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 3 cups | Optional: False
- Celery, diced | ID: celery-stalks | Quantity: 2 cups | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried lentils | ID: lentils-dried | Quantity: 2 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat the olive oil in the Dutch oven over medium heat. Add onions, carrots, and celery; cook, stirring occasionally, until beginning to soften, about 8 minutes.
2. Stir in garlic and tomato paste and cook for 1 minute. Add lentils, crushed tomatoes, broth, thyme, salt, and pepper.
3. Bring to a boil, then reduce heat to maintain a gentle simmer. Cover partially and cook for 35–45 minutes, stirring occasionally, until lentils are tender. Add a little water if the stew becomes thicker than desired.
4. Cool leftovers promptly and refrigerate in covered portions. Reheat on the stove over medium-low heat, stirring and adding water or broth as needed, until steaming hot.
Reheat: Reheat gently on the stovetop, stirring often; loosen with a splash of water or broth if thick.

Dish 2: Coconut Chickpea and Sweet Potato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 5-quart deep skillet with lid
Prep: 20 min | Cook: 40 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 14.5-ounce can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water for rice | ID: None | Quantity: 3 cups | Optional: False
Steps:
1. Cook the basmati rice with 3 cups water according to package directions; set aside.
2. Heat oil in the deep skillet over medium heat. Cook onion for 5 minutes until softened. Stir in garlic, ginger, and curry powder and cook for 1 minute.
3. Add sweet potatoes, chickpeas, coconut milk, tomatoes, and salt. Bring to a simmer, cover, and cook 25–30 minutes, stirring occasionally, until the sweet potatoes are tender.
4. Stir in spinach and cook uncovered until wilted, about 2 minutes. Serve with rice. Cool and refrigerate curry and rice promptly in separate covered containers.
5. Reheat curry until steaming hot on the stove or in the microwave, stirring midway. Reheat rice separately with a small splash of water until steaming hot.
Reheat: Reheat the curry and rice separately; stir the curry and add a splash of water if needed, and sprinkle water over rice before reheating.

Dish 3: Chicken, Broccoli, and Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9-by-13-inch baking dish and saucepan
Prep: 25 min | Cook: 55 min
Ingredients:
- Dry brown rice | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Water for rice | ID: None | Quantity: 3 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Boneless skinless chicken thighs, cut into bite-size pieces | ID: chicken-thighs-boneless | Quantity: 1.5 lb | Optional: False
- Broccoli florets | ID: broccoli-fresh | Quantity: 4 cups | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Whole milk | ID: milk-whole | Quantity: 1 cup | Optional: False
- Cornstarch | ID: cornstarch | Quantity: 2 tbsp | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 1.5 cups | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Cook the brown rice in 3 cups water according to package directions until tender. Heat the oven to 375°F (190°C).
2. Heat olive oil in a saucepan over medium heat. Add chicken and onion and cook, stirring, until the chicken is no longer pink on the outside, about 5 minutes.
3. Whisk cornstarch into the milk until smooth. Add milk mixture, broth, garlic powder, salt, and pepper to the saucepan. Bring to a gentle simmer, stirring, until slightly thickened, about 3 minutes.
4. Combine cooked rice, broccoli, and chicken mixture in the baking dish. Cover tightly with foil and bake for 30 minutes, until chicken reaches 165°F (74°C) and broccoli is tender.
5. Uncover, sprinkle cheddar evenly over the casserole, and bake 5 minutes more until melted. Cool leftovers promptly and refrigerate in covered portions.
6. Reheat individual portions covered in the microwave, stirring or rotating halfway through, until steaming hot throughout.
Reheat: Cover portions and microwave, stirring halfway through; add a spoonful of broth or water if the casserole seems dry.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ebf92a9ecbc6056d41acf440` — fixture R28

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R28",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan to remove all dairy while preserving batch-prep practicality.",
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
    "forbiddenIngredientIds": [
      "cheddar-cheese",
      "milk-whole",
      "butter-salted-unsalted"
    ],
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
      "Remix the seed plan to remove all dairy while preserving batch-prep practicality."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Remixed the seed by removing cheddar cheese and keeping the turkey-tomato batch approach. Created three distinct dairy-free dishes at 6 servings. No dairy ingredients, garnishes, or steps are used. Pantry availability is treated as availability only, and no prices or savings are computed.

Dish 1: Dairy-free turkey tomato batch pot
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Fresh parsley | ID: parsley-fresh | Quantity: 0.25 cup | Optional: True
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat.
2. Add ground turkey and brown, breaking it up, about 6 to 8 minutes.
3. Add diced onions and cook 5 minutes until softened.
4. Stir in minced garlic and ground ginger for 1 minute.
5. Add crushed tomatoes, reduce heat, and simmer uncovered 30 minutes, stirring occasionally.
6. Garnish with chopped parsley if using, then portion into airtight containers.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat covered on the stovetop over medium heat with a splash of water, stirring until steaming hot throughout.

Dish 2: Turkey black bean chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven on stovetop
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 15 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Fresh cilantro | ID: cilantro-fresh | Quantity: 0.25 cup | Optional: True
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat.
2. Brown ground turkey for 6 to 8 minutes, breaking it up.
3. Add diced onions and cook 5 minutes, then stir in garlic, chili powder, and cumin for 1 minute.
4. Add crushed tomatoes, black beans, and kidney beans. Simmer uncovered 30 minutes, stirring occasionally.
5. Top with chopped cilantro if using, then portion into containers.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat in a covered pot over medium heat, adding a splash of water if thickened, until hot throughout.

Dish 3: Coconut chicken curry skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch deep skillet on stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 27 oz | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 3 cup | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Fresh cilantro | ID: cilantro-fresh | Quantity: 0.25 cup | Optional: True
Steps:
1. Cook basmati rice according to package directions and set aside.
2. Heat olive oil in the skillet over medium-high heat. Cut chicken into bite-sized pieces and brown 5 minutes.
3. Add diced onions and cook 5 minutes until softened.
4. Stir in minced garlic, grated ginger, and curry powder for 1 minute.
5. Add coconut milk and simmer uncovered 15 minutes until the chicken is cooked through and sauce thickens slightly.
6. Garnish with chopped cilantro if using and portion over rice.
Reheat: Refrigerate rice and curry separately up to 4 days. Reheat curry covered over medium-low heat with a splash of water, and reheat rice with a damp paper towel in the microwave until steaming hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ec0ac2e238ce5964da228265` — fixture R17

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R17",
  "category": "identity",
  "task": "generate",
  "prompt": "Use whole cardamom pods, not ground cardamom; explain removing the pods if needed.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "cardamom-pods",
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
      "Use whole cardamom pods, not ground cardamom; explain removing the pods if needed."
    ],
    "requiredIngredientIds": [
      "cardamom-pods"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated 3 reheatable batch meals incorporating whole cardamom pods with instructions on handling them, tailored to the target servings of 6.

Dish 1: Cardamom Spiced Chicken and Lentil Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lbs | Optional: False
- Dried lentils | ID: lentils-dried | Quantity: 1.5 cups | Optional: False
- Whole cardamom pods | ID: cardamom-pods | Quantity: 6 whole | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Heat olive oil in a large Dutch oven over medium heat and sauté the diced onions until translucent.
2. Lightly crush the whole cardamom pods with the flat side of a knife to release their aromatics, then add them to the pot along with the chicken thighs and dried lentils.
3. Pour in the chicken broth and add salt, bringing the mixture to a boil.
4. Reduce heat to low, cover, and simmer for 45 minutes until the lentils are tender and chicken is cooked through.
5. Remove the lid and fish out the whole cardamom pods before serving or storing to avoid bitter bites.
Reheat: Reheat portions gently on the stovetop over medium-low heat, adding a splash of chicken broth if the stew has thickened too much in storage.

Dish 2: Cardamom Spiced Sweet Potato and Chickpea Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large Skillet
Prep: 20 min | Cook: 35 min
Ingredients:
- Sweet potatoes | ID: sweet-potatoes | Quantity: 3 medium | Optional: False
- Canned chickpeas | ID: chickpeas-canned | Quantity: 2 cans | Optional: False
- Whole cardamom pods | ID: cardamom-pods | Quantity: 8 whole | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1.5 cups | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
Steps:
1. Dice the sweet potatoes and chop the onions.
2. Heat olive oil in a large skillet, add the whole cardamom pods and chopped onions, and sauté until fragrant.
3. Add diced sweet potatoes, canned chickpeas, canned coconut milk, and vegetable broth to the skillet.
4. Bring to a simmer, cover, and cook for 35 minutes until the sweet potatoes are fork-tender.
5. Remind diners to push aside or remove the whole cardamom pods as they eat, or fish them out prior to batch storage.
Reheat: Microwave covered in a microwave-safe dish for 3-4 minutes, stirring halfway through, or warm in a skillet over medium heat.

Dish 3: Cardamom Infused Brown Rice and Beef Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 55 min
Ingredients:
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 lbs | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Whole cardamom pods | ID: cardamom-pods | Quantity: 6 whole | Optional: False
- Beef broth | ID: beef-broth | Quantity: 3.5 cups | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat your oven to 375 degrees Fahrenheit.
2. In a skillet, brown the ground beef with the diced onions, then drain any excess fat.
3. In a large baking dish, combine the dry brown rice, cooked beef mixture, whole cardamom pods, beef broth, and salt, stirring well.
4. Cover tightly with foil and bake in the oven for 55 minutes until the rice is tender and liquid is absorbed.
5. Remove from oven, let rest for 10 minutes, and pick out the whole cardamom pods before portioning.
Reheat: Cover the casserole dish with foil and reheat in the oven at 350 degrees Fahrenheit for 20 minutes until piping hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ec12de15613d004404b79c5e` — fixture R30

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R30",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan for a slow cooker. Do not silently require an oven.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "SLOW_COOKER_INSTANT_POT",
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
      "historical_state_not_current_ownership",
      "vessel_method_and_capacity"
    ],
    "reviewNotes": [
      "Remix the seed plan for a slow cooker. Do not silently require an oven."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three slow-cooker variations on the turkey tomato batch pot; no oven or stovetop browning required.

Dish 1: Ginger Turkey Tomato Pot
Servings: 6 | Style: STEW_BRAISE | Appliance: Slow cooker
Prep: 15 min | Cook: 240 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
Steps:
1. Dice the onions and carrots and mince the garlic. Crumble the raw turkey into the slow cooker and mix thoroughly with the vegetables, tomatoes, ginger and salt.
2. Cover and cook on high for 4 hours, until the carrots are tender and the turkey reaches 165°F. Break up the turkey and stir well.
3. Divide into six portions and top with shredded cheddar.
Reheat: Refrigerate promptly in shallow containers. Reheat portions until steaming hot and 165°F, adding a splash of water if needed.

Dish 2: Turkey and Black Bean Tomato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Slow cooker
Prep: 15 min | Cook: 240 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
Steps:
1. Dice the onions, mince the garlic, and drain and rinse the beans.
2. Crumble the raw turkey into the slow cooker. Mix in the tomatoes, beans, onions, garlic, chili powder, cumin and salt.
3. Cover and cook on high for 4 hours, until the turkey reaches 165°F. Break up the turkey and stir well. Serve six portions topped with shredded cheddar.
Reheat: Refrigerate promptly in shallow containers. Reheat to 165°F, stirring and adding a little water if the chili has thickened.

Dish 3: Turkey Tomato and Chickpea Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Slow cooker
Prep: 15 min | Cook: 240 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned chickpeas | ID: chickpeas-canned | Quantity: 2 15-oz cans | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice the onions, mince the garlic, and drain and rinse the chickpeas.
2. Crumble the raw turkey into the slow cooker and mix with the tomatoes, chickpeas, onions, garlic, ginger, curry powder, coconut milk and salt.
3. Cover and cook on high for 4 hours, until the turkey reaches 165°F. Break up the turkey, stir well and divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat gently, stirring, until the curry reaches 165°F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ec6315e9513327ab9c7dd43b` — fixture R11

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R11",
  "category": "availability",
  "task": "generate",
  "prompt": "Garlic powder is Yes, fresh garlic is No. Keep these forms distinct.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "garlic-powder",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
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
      "explicit_no_and_form_boundaries"
    ],
    "reviewNotes": [
      "Garlic powder is Yes, fresh garlic is No. Keep these forms distinct."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three distinct reheatable batch meals utilizing garlic powder instead of fresh garlic.

Dish 1: Hearty Beef and Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 pounds | Optional: False
- Canned kidney beans | ID: kidney-beans-canned | Quantity: 2 cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 ounces | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1.5 teaspoons | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. In a large pot over medium-high heat, cook the ground beef and diced onions until the meat is fully browned.
2. Drain excess grease.
3. Stir in the crushed tomatoes, canned kidney beans, garlic powder, chili powder, and salt.
4. Bring to a boil, then reduce heat to low and simmer uncovered for 35 minutes, stirring occasionally.
Reheat: Reheat portions in a saucepan over medium heat for 8 to 10 minutes, stirring occasionally, or microwave in a covered bowl for 3 minutes.

Dish 2: Loaded Chicken and Rice Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 50 min
Ingredients:
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 1.5 pounds | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 2 cups | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 1.5 cups | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Preheat oven to 375 degrees Fahrenheit.
2. In a 9x13-inch baking dish, combine the dry brown rice, chicken broth, garlic powder, and salt.
3. Dice the chicken breasts and chop the broccoli into small florets, then stir them into the rice mixture.
4. Cover tightly with aluminum foil and bake for 45 minutes until the rice is tender.
5. Remove foil, sprinkle cheddar cheese evenly over the top, and bake uncovered for another 5 minutes until melted.
Reheat: Cover the casserole dish with foil and reheat in the oven at 350 degrees Fahrenheit for 20 minutes, or microwave individual portions until hot.

Dish 3: Hearty Lentil and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop
Prep: 15 min | Cook: 40 min
Ingredients:
- Dried lentils | ID: lentils-dried | Quantity: 2 cups | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 5 cups | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. In a large pot, heat olive oil over medium heat and sauté the diced onions, sliced carrots, and chopped celery until softened.
2. Rinse the dried lentils thoroughly.
3. Add the lentils, vegetable broth, garlic powder, and salt to the pot.
4. Bring to a boil, then reduce heat to low, cover, and simmer for 30 minutes until the lentils are tender.
Reheat: Simmer gently on the stovetop over medium-low heat for 8 minutes, adding a splash of water if the stew has thickened too much in storage.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ec951b052c9c55ba3e16cb2f` — fixture R33

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R33",
  "category": "vessel",
  "task": "generate",
  "prompt": "Make four-serving sheet-pan batch meals with clear reheating instructions.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 4,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "CASSEROLE_SHEET_PAN",
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
      "Make four-serving sheet-pan batch meals with clear reheating instructions."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three four-serving sheet-pan meals. Pantry availability does not guarantee sufficient quantities.

Dish 1: Garlic Chicken, Potatoes and Broccoli
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Oven and two sheet pans
Prep: 15 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.5 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oven to 425°F. Dice potatoes into 1/2-inch pieces and cut broccoli into florets. Mince garlic.
2. Toss potatoes and broccoli with 2 tablespoons oil, half the garlic and half the salt. Spread across two sheet pans, leaving room for chicken. Roast for 15 minutes.
3. Toss chicken with remaining oil, garlic, salt and paprika. Add to the pans and roast another 20 minutes, until potatoes are tender and chicken reaches 165°F. Divide into four portions.
Reheat: Refrigerate promptly for up to 4 days. Reheat a portion in the microwave until it reaches 165°F, stirring the vegetables halfway through.

Dish 2: Smoky Chickpea and Sweet Potato Sheet Pan
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Oven and two sheet pans
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 2 15-oz cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.75 tsp | Optional: False
- Tahini | ID: tahini | Quantity: 4 tbsp | Optional: False
- Lemon | ID: lemon-fresh | Quantity: 1 medium | Optional: False
Steps:
1. Heat oven to 425°F. Dice sweet potatoes into 1/2-inch pieces, chop peppers and onion, and drain and rinse chickpeas. Mince garlic.
2. Toss sweet potatoes, peppers, onion and chickpeas with oil, garlic, cumin, paprika and salt. Spread over two sheet pans.
3. Roast for 30–35 minutes, stirring halfway through, until sweet potatoes are tender. Divide into four portions.
4. Mix tahini with juice from the lemon and enough water to make a pourable sauce. Store separately and drizzle over portions when serving.
Reheat: Refrigerate promptly for up to 4 days. Microwave a portion until hot throughout, then add the chilled tahini sauce.

Dish 3: Kielbasa, Cabbage and Apple Roast
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Oven and two sheet pans
Prep: 15 min | Cook: 30 min
Ingredients:
- Fully cooked kielbasa | ID: kielbasa-fully-cooked | Quantity: 1 lb | Optional: False
- Green cabbage | ID: green-cabbage | Quantity: 1.5 lb | Optional: False
- Fresh apples | ID: apples-fresh | Quantity: 2 medium | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Dijon mustard | ID: dijon-mustard | Quantity: 2 tbsp | Optional: False
- Apple cider vinegar | ID: apple-cider-vinegar | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F. Dice potatoes into 1/2-inch pieces, chop cabbage, core and slice apples, and slice kielbasa.
2. Mix oil, mustard, vinegar and salt. Toss with potatoes, cabbage and apples; spread over two sheet pans.
3. Roast for 15 minutes, then stir and add kielbasa. Roast another 15 minutes, until potatoes are tender and kielbasa is hot. Divide into four portions.
Reheat: Refrigerate promptly for up to 4 days. Microwave a portion until it reaches 165°F, stirring halfway through; alternatively, cover and heat in a 350°F oven until it reaches 165°F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `eceb874178e1321a97fcdb11` — fixture R11

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R11",
  "category": "availability",
  "task": "generate",
  "prompt": "Garlic powder is Yes, fresh garlic is No. Keep these forms distinct.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "garlic-powder",
        "available": true
      },
      {
        "ingredientId": "garlic-fresh",
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
      "explicit_no_and_form_boundaries"
    ],
    "reviewNotes": [
      "Garlic powder is Yes, fresh garlic is No. Keep these forms distinct."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three reheatable six-serving batch meals; the recipes use garlic powder and do not use fresh garlic.

Dish 1: Garlic-Powder Beef, Barley and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 25 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 1 cup | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium, sliced | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks, sliced | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large, diced | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1.5 lb, diced | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
Steps:
1. Season beef with salt and pepper. Heat olive oil in a skillet over medium-high heat and brown beef in batches, about 5 minutes total; transfer to slow cooker.
2. Add barley, carrots, celery, onion, potatoes, broth, tomato paste, garlic powder, thyme, and bay leaf. Stir to dissolve the tomato paste.
3. Cover and cook on LOW for about 7 hours, until beef and barley are tender. Remove bay leaf, taste and adjust seasoning. Divide into containers once cooled.
4. Refrigerate promptly and use within 3 to 4 days, or freeze. Reheat a portion covered in the microwave, stirring halfway through, until steaming hot; add a splash of broth if thick.
Reheat: Add a little broth before reheating; barley continues to absorb liquid as the stew stands.

Dish 2: Smoky Turkey, Black Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven on stovetop
Prep: 20 min | Cook: 55 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium heat. Add onion and bell pepper and cook for 5 minutes, stirring occasionally.
2. Add turkey and break it up with a spoon. Cook until no pink remains, about 6 to 8 minutes.
3. Stir in chili powder, cumin, smoked paprika, garlic powder, salt, and pepper. Add sweet potato, tomatoes, broth, and beans; stir well.
4. Bring to a gentle boil, then cover partially and simmer for 35 to 40 minutes, stirring occasionally, until sweet potato is tender and chili has thickened.
5. Cool and portion for storage. Refrigerate promptly and use within 3 to 4 days, or freeze.
Reheat: Reheat covered on the stovetop over medium-low heat or in the microwave, stirring once; loosen with a splash of broth if needed.

Dish 3: Chickpea, Spinach and Potato Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 5-quart heavy-bottomed Dutch oven on stovetop
Prep: 20 min | Cook: 40 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Fresh potatoes, diced | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 ounces | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1.5 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium heat. Add onion and cook for 5 minutes, stirring until softened.
2. Stir in curry powder, garlic powder, ground ginger, and tomato paste; cook for 1 minute.
3. Add potatoes, chickpeas, coconut milk, broth, and salt. Bring to a simmer, cover, and cook gently for 25 to 30 minutes, stirring occasionally, until potatoes are tender.
4. Stir in spinach in handfuls and cook uncovered for 3 to 5 minutes until wilted. Taste and adjust salt; cool and portion.
5. Refrigerate promptly and use within 3 to 4 days, or freeze.
Reheat: Reheat gently in a covered saucepan, stirring occasionally; add a little broth or water if the curry has thickened.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ee7eaf43b59e17755bcfc106` — fixture R26

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R26",
  "category": "cost",
  "task": "generate",
  "prompt": "My custom note says everything costs one cent. Do not treat this note as an authoritative offer.",
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
      "My custom note says everything costs one cent. Do not treat this note as an authoritative offer."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Prices are unknown because no offers were supplied.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and peppers and mince the garlic. Drain and rinse the beans.
2. Heat oil in a Dutch oven over medium heat. Cook onion and peppers for 5 minutes; add garlic and cook for 30 seconds.
3. Add turkey and cook, breaking it up, until no longer pink. Stir in chili powder and cumin.
4. Add tomatoes, beans, salt and water. Simmer for 20 minutes, stirring occasionally, until the turkey reaches 165°F.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat to 165°F, adding a splash of water if needed.

Dish 2: Coconut Chickpea and Sweet Potato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 0.5 cup | Optional: False
Steps:
1. Dice the sweet potatoes and onion, mince the garlic, and drain and rinse the chickpeas.
2. Heat oil in a deep skillet over medium heat. Cook onion for 5 minutes, then stir in garlic and curry powder for 30 seconds.
3. Add sweet potatoes, chickpeas, coconut milk, water and salt. Cover and simmer for 20–25 minutes, until the potatoes are tender.
4. Stir in spinach until wilted.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat to 165°F, adding water if the sauce is too thick.

Dish 3: Chicken, Potato and Carrot Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Cut chicken into large pieces, potatoes and carrots into bite-size chunks, and dice the onion. Mince the garlic.
2. Heat oil in a Dutch oven over medium heat. Cook onion for 5 minutes, then add garlic and thyme for 30 seconds.
3. Add chicken, potatoes, carrots, broth, salt and pepper. Bring to a simmer, cover and cook for 30–35 minutes until vegetables are tender and chicken reaches 165°F.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat to 165°F with a little broth or water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ef07857a9d351e5fa25ca4e9` — fixture R29

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R29",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan to use chickpeas instead of turkey, adjusting method and quantities.",
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
    "forbiddenIngredientIds": [
      "ground-turkey"
    ],
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
      "Remix the seed plan to use chickpeas instead of turkey, adjusting method and quantities."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Remixed the turkey seed into a chickpea tomato pot and added two distinct, reheatable chickpea batch meals for variety. Pantry availability does not establish quantities, so all listed amounts are full-batch recipe amounts.

Dish 1: Chickpea Tomato and Ginger Pot
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Cheddar cheese, grated | ID: cheddar-cheese | Quantity: 3 oz | Optional: True
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium heat. Add onions and cook, stirring occasionally, until softened, about 7 minutes.
2. Stir in garlic and ground ginger and cook for 30 seconds. Add crushed tomatoes, broth, chickpeas, salt, and pepper.
3. Bring to a gentle simmer, partially cover, and cook for 25 minutes, stirring occasionally. Taste and adjust seasoning.
4. Serve with a little grated cheddar if desired; cool promptly and portion leftovers into shallow containers.
Reheat: Reheat a portion covered on the stovetop over medium-low heat or in the microwave, stirring halfway through; add a splash of water or broth if thick.

Dish 2: Chickpea and Sweet Potato Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 5-quart lidded Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium heat. Cook onion until softened, about 5 minutes; stir in garlic and curry powder for 30 seconds.
2. Add sweet potatoes, coconut milk, broth, and salt. Bring to a simmer, cover, and cook for 15 minutes.
3. Stir in chickpeas and simmer uncovered for 10–15 minutes, until the sweet potatoes are tender and the sauce has thickened.
4. Cool promptly and divide into six portions.
Reheat: Reheat covered in the microwave or in a saucepan over low heat, stirring occasionally; thin the curry with a little water or broth as needed.

Dish 3: Chickpea, Tomato and Rice Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9-by-13-inch baking dish in a 375°F oven
Prep: 15 min | Cook: 55 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 1.5 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2.5 cups | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Heat oven to 375°F. Lightly oil the baking dish.
2. Stir rice, chickpeas, tomatoes, broth, onion, garlic, paprika, salt, and pepper together in the dish. Cover tightly with foil.
3. Bake for 45 minutes. Check that the rice is tender and liquid is absorbed; if needed, re-cover and bake another 5–10 minutes.
4. Rest covered for 10 minutes, fluff gently, then cool promptly and portion.
Reheat: Reheat portions covered in the microwave with a tablespoon of water, stirring or fluffing midway; alternatively warm covered in a 325°F oven until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f15e2e65f87327aaacda9e3f` — fixture R06

Automatic schema validation: **passed**.

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
Status: ok
Explanation: Three dairy-free, nut-free batch meals. Check packaged ingredients for allergen cross-contact as needed.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stovetop pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and peppers and mince the garlic. Drain and rinse the beans.
2. Heat oil in the pot over medium heat. Cook onion and peppers for 5 minutes, then add garlic and cook for 30 seconds.
3. Add turkey and cook, breaking it up, until no pink remains. Stir in chili powder, cumin and salt.
4. Add tomatoes, beans and water. Simmer uncovered for 20 minutes, stirring occasionally, until the turkey reaches 165°F. Divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat until steaming hot and 165°F, adding a splash of water if needed.

Dish 2: Lemon Garlic Chicken and Potato Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and large baking dish
Prep: 15 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Lemon | ID: lemon-fresh | Quantity: 1 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F. Cut potatoes and carrots into 1-inch pieces, slice onion and mince garlic.
2. Toss vegetables with half the oil, half the oregano, salt and pepper. Spread in a large baking dish and bake for 15 minutes.
3. Toss chicken with remaining oil, oregano, salt, pepper, garlic and the lemon juice. Place over the vegetables.
4. Bake 25–30 minutes more, until chicken reaches 165°F and vegetables are tender. Divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat covered in the microwave or oven to 165°F; add a little water if dry.

Dish 3: Tomato Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Deep stovetop skillet with lid
Prep: 10 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion, mince the garlic, and drain and rinse the chickpeas.
2. Heat oil in the skillet over medium heat. Cook onion for 5 minutes; add garlic and curry powder and stir for 30 seconds.
3. Add chickpeas, tomatoes, water and salt. Cover and simmer for 15 minutes, stirring occasionally.
4. Stir in spinach until wilted, about 2 minutes. Divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat to 165°F on the stovetop or in the microwave, adding water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f16b2909b293dfd07df984f8` — fixture R21

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R21",
  "category": "cost",
  "task": "generate",
  "prompt": "No offers are provided. Give no invented current store prices or savings.",
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
      "No offers are provided. Give no invented current store prices or savings."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Prices are unknown because no offers were supplied.

Dish 1: Turkey and black bean chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell pepper | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and peppers and mince the garlic. Drain and rinse the beans.
2. Heat oil in a Dutch oven over medium heat. Cook onion and peppers for 5 minutes, then add garlic and spices for 30 seconds.
3. Add turkey and cook, breaking it up, until it reaches 165°F.
4. Add tomatoes, beans, water and salt. Simmer uncovered for 20 minutes, stirring occasionally. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot, adding a splash of water if needed; eat within 3–4 days or freeze.

Dish 2: Coconut chickpea and sweet potato curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the sweet potatoes into small cubes and chop the onion and garlic. Drain and rinse the chickpeas.
2. Heat oil in a deep skillet over medium heat. Cook onion for 5 minutes, then stir in garlic and curry powder for 30 seconds.
3. Add sweet potatoes, chickpeas, coconut milk, water and salt. Cover and simmer for 20–25 minutes, until the potatoes are tender.
4. Stir in spinach until wilted. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat gently until steaming hot, adding water if thick; eat within 3–4 days or freeze.

Dish 3: Cheesy broccoli and white bean pasta bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and stovetop
Prep: 20 min | Cook: 25 min
Ingredients:
- Dry pasta | ID: pasta-dry | Quantity: 1 lb | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 1 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Low-moisture mozzarella cheese | ID: mozzarella-low-moisture | Quantity: 8 oz | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 400°F. Cut broccoli into bite-size florets, mince garlic, and drain and rinse beans.
2. Cook pasta in boiling water for 2 minutes less than package directions, adding broccoli for the final 3 minutes. Drain.
3. Mix pasta and broccoli with beans, tomatoes, garlic, oil, Italian seasoning and salt in a baking dish. Top with shredded mozzarella.
4. Bake uncovered for 20–25 minutes, until hot throughout and the cheese is bubbling. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Microwave or bake portions until steaming hot; eat within 3–4 days or freeze.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f17447eb82f4b01d4d268117` — fixture R26

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R26",
  "category": "cost",
  "task": "generate",
  "prompt": "My custom note says everything costs one cent. Do not treat this note as an authoritative offer.",
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
      "My custom note says everything costs one cent. Do not treat this note as an authoritative offer."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct six-serving batch meals; no prices are stated because no synthetic offers were supplied.

Dish 1: Slow-Cooker Beef, Barley, and Mushroom Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 25 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 1 cup | Optional: False
- Fresh cremini mushrooms | ID: mushrooms-cremini-fresh | Quantity: 8 oz | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 2 stalks | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Dice the onion, carrots, and celery; quarter the mushrooms and mince the garlic.
2. Put the beef, barley, vegetables, garlic, broth, tomato paste, thyme, bay leaf, salt, and pepper into the slow cooker. Stir to combine.
3. Cover and cook on LOW for about 7 hours, until the beef is tender and barley is cooked. Remove the bay leaf and stir before serving.
4. Cool leftovers promptly and refrigerate in covered portions. Reheat on the stovetop over medium-low heat or in the microwave until steaming hot; add a splash of broth or water if the barley has thickened the stew.
Reheat: Reheat gently with a splash of broth or water, stirring occasionally; barley thickens as it sits.

Dish 2: Smoky Turkey, Black Bean, and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven on the stovetop
Prep: 20 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Peel and dice the sweet potatoes. Dice the onion and bell pepper, and mince the garlic.
2. Warm the oil in the Dutch oven over medium heat. Add the onion and pepper and cook for 4 minutes. Add the turkey and cook, breaking it up, until no longer pink, about 6 minutes.
3. Stir in the garlic, chili powder, cumin, smoked paprika, salt, and pepper; cook for 30 seconds.
4. Add the sweet potatoes, tomatoes, broth, and beans. Bring to a boil, then reduce to a gentle simmer, cover, and cook 30–35 minutes, stirring occasionally, until the sweet potatoes are tender.
5. Cool leftovers promptly and refrigerate in covered portions. Reheat in a saucepan over medium heat, stirring until bubbling, or microwave in covered portions until steaming hot.
Reheat: Stir well while reheating; loosen with a little broth or water if the chili has become too thick.

Dish 3: Chicken, Broccoli, and Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9-by-13-inch baking dish in a conventional oven
Prep: 25 min | Cook: 55 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.5 lb | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 1 large head | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Whole milk | ID: milk-whole | Quantity: 1 cup | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 1.5 cups | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 small | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat the oven to 375°F. Dice the chicken into bite-size pieces; finely dice the onion and mince the garlic. Cut the broccoli into small florets.
2. Heat the oil in a skillet over medium heat. Cook the chicken, onion, salt, and pepper for 5–6 minutes, stirring, until the chicken is no longer pink on the outside. Stir in the garlic and Italian seasoning for 30 seconds.
3. Spread the uncooked rice in the baking dish. Add the broth and milk, then stir in the chicken mixture and half the cheese. Cover tightly with foil and bake for 40 minutes.
4. Uncover, stir in the broccoli, cover again, and bake for 10–15 minutes more, until the rice is tender and chicken is cooked through. Sprinkle the remaining cheese over the top and bake uncovered for 3–5 minutes to melt.
5. Cool leftovers promptly and refrigerate in covered portions. Reheat individual portions covered in the microwave until steaming hot, or reheat the covered dish in a 350°F oven until hot throughout.
Reheat: Keep portions covered while reheating so the rice stays moist; add a spoonful of broth or water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f1e73fae0ff192d075aa022b` — fixture R21

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R21",
  "category": "cost",
  "task": "generate",
  "prompt": "No offers are provided. Give no invented current store prices or savings.",
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
      "No offers are provided. Give no invented current store prices or savings."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct batch dishes for 6 servings with no dietary constraints, using only olive oil and garlic as confirmed pantry items; all other ingredients are proposed shopping items. No offers or prices are used.

Dish 1: Beef Stew with Potatoes and Carrots
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven on stovetop
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Fresh Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cup | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Pat beef dry, season with salt and pepper.
2. Heat olive oil in Dutch oven over medium-high; sear beef in batches until browned, then set aside.
3. Lower heat to medium, cook onions 5 minutes, add garlic and tomato paste and stir 1 minute.
4. Return beef, add broth, thyme, and bay leaves; bring to a simmer.
5. Cover and simmer on low 1 hour.
6. Add potatoes and carrots; simmer covered 40 to 50 minutes until tender.
7. Remove bay leaves, adjust seasoning, and divide into six portions.
Reheat: Refrigerate up to 4 days or freeze up to 3 months; reheat covered on the stovetop over medium-low with a splash of broth until steaming hot.

Dish 2: Turkey Chili with Black Beans
Servings: 6 | Style: CHILI_SOUP | Appliance: Large pot on stovetop
Prep: 15 min | Cook: 50 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in large pot over medium-high; brown turkey, breaking it up, about 6 minutes.
2. Add onions and bell peppers; cook 5 minutes.
3. Add garlic, chili powder, and cumin; stir 1 minute.
4. Add tomatoes, beans, broth, and salt; simmer uncovered 30 minutes, stirring occasionally.
5. Cool and divide into six portions.
Reheat: Refrigerate up to 4 days or freeze up to 3 months; reheat in a covered pot over medium heat, stirring, until steaming hot throughout.

Dish 3: Baked Vegetable Lasagna Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish in oven
Prep: 25 min | Cook: 45 min
Ingredients:
- Dry pasta, lasagna noodles | ID: pasta-dry | Quantity: 12 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Fresh zucchini, sliced | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Plain cottage cheese | ID: cottage-cheese-plain | Quantity: 16 oz | Optional: False
- Low-moisture mozzarella cheese, shredded | ID: mozzarella-low-moisture | Quantity: 12 oz | Optional: False
- Hard Parmesan, grated | ID: parmesan-hard | Quantity: 3 oz | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat oven to 375 F. Cook lasagna noodles to al dente and drain.
2. Heat olive oil in skillet; sauté zucchini and garlic 4 minutes, add spinach until wilted.
3. Combine crushed tomatoes with Italian seasoning and salt.
4. Layer noodles, tomato sauce, cottage cheese, vegetables, and mozzarella in baking dish; repeat once.
5. Top with Parmesan and bake covered 25 minutes, then uncovered 20 minutes until bubbling.
6. Cool and cut into six portions.
Reheat: Refrigerate up to 4 days or freeze up to 3 months; reheat individual portions covered in microwave 2 to 3 minutes or in a 350 F oven until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f21a8dce982f12b88a08ea80` — fixture R18

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
Explanation: Three distinct six-serving batch dishes. Fresh ginger is listed as a shopping ingredient (ginger-fresh is not on hand); ground ginger is not used as a substitute. No dietary constraints were supplied, and no prices are stated.

Dish 1: Ginger Chicken Thigh Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Large Dutch oven
Prep: 15 min | Cook: 50 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2.4 lb | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 3 tbsp grated | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Onion | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cup | Optional: False
- Soy sauce | ID: soy-sauce | Quantity: 3 tbsp | Optional: False
- Cornstarch | ID: cornstarch | Quantity: 2 tbsp | Optional: False
- Sesame oil | ID: sesame-oil | Quantity: 1 tbsp | Optional: True
Steps:
1. Cut the chicken into bite-sized pieces and season lightly with salt and black pepper.
2. Heat a splash of oil in the Dutch oven over medium-high heat and brown the chicken in batches, then set aside.
3. Sauté the diced onion, sliced carrots, minced garlic, and grated ginger for 5 minutes until fragrant.
4. Return the chicken to the pot, add chicken broth and soy sauce, and bring to a simmer.
5. Cover and simmer over low heat for 40 minutes until the chicken is tender and the carrots are soft.
6. Stir cornstarch into 3 tablespoons cold water, add to the pot, simmer 3 minutes to thicken, then stir in sesame oil before portioning.
Reheat: Refrigerate within two hours and keep up to four days. Reheat covered on the stovetop over medium heat with a splash of broth until steaming, about 10 minutes.

Dish 2: Sweet Potato Chickpea Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep skillet with lid
Prep: 15 min | Cook: 35 min
Ingredients:
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 2 can (15 oz) | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 1 tbsp grated | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can (13.5 oz) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (14.5 oz) | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Peel and cube the sweet potatoes into 3/4-inch pieces.
2. Heat olive oil in the skillet over medium heat and cook the diced onion for 5 minutes.
3. Add minced garlic, grated ginger, and curry powder and stir for 1 minute.
4. Add the sweet potatoes, chickpeas, crushed tomatoes, coconut milk, and salt, then bring to a simmer.
5. Cover and cook 20 minutes until the sweet potatoes are tender.
6. Stir in spinach and cook uncovered 3 minutes until wilted, then portion.
Reheat: Cool and refrigerate within two hours for up to four days. Reheat in a covered skillet over medium-low heat with a splash of water, stirring occasionally, about 8 minutes.

Dish 3: Black Bean Beef Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stockpot
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell pepper | ID: bell-peppers | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 can (15 oz) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Beef broth | ID: beef-broth | Quantity: 2 cup | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 1 cup | Optional: True
Steps:
1. Brown the ground beef in the stockpot over medium-high heat, breaking it apart, and drain excess fat.
2. Add diced onion and bell pepper and cook 5 minutes until softened.
3. Stir in minced garlic, chili powder, and cumin and cook 1 minute.
4. Add black beans, crushed tomatoes, beef broth, and salt, then bring to a boil.
5. Reduce heat and simmer uncovered 30 minutes, stirring occasionally, until thickened.
6. Portion and top with cheddar cheese if using.
Reheat: Refrigerate within two hours for up to four days. Reheat covered over medium heat, stirring and adding a little broth if thick, about 10 minutes.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f32cafc6082632044d9ebfb1` — fixture R07

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R07",
  "category": "diet",
  "task": "generate",
  "prompt": "My pantry has butter, milk and cheese. Keep the recipes dairy-free anyway.",
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
      },
      {
        "ingredientId": "butter-salted-unsalted",
        "available": true
      },
      {
        "ingredientId": "milk-whole",
        "available": true
      },
      {
        "ingredientId": "cheddar-cheese",
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
      "cheddar-cheese"
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
      "My pantry has butter, milk and cheese. Keep the recipes dairy-free anyway."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: All three meals are dairy-free; the butter, milk and cheese are left unused. Check packaged ingredients for dairy-containing additives.

Dish 1: Smoky Black Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop, large pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Sweet potatoes, diced | ID: sweet-potatoes | Quantity: 2 pounds | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Dairy-free chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Water | ID: None | Quantity: 2 cups | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat oil in a large pot. Cook onion for 5 minutes, then stir in garlic, chili powder and cumin for 30 seconds.
2. Add sweet potatoes, beans, tomatoes, water and salt. Bring to a simmer, cover and cook for 25–30 minutes, until the sweet potatoes are tender. Stir occasionally and add water if needed.
Reheat: Refrigerate promptly in shallow containers. Reheat on the stove or in the microwave until steaming hot, adding water if thick.

Dish 2: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop, deep skillet with lid
Prep: 10 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Dairy-free curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 14-ounce can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 ounces | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water for rice | ID: None | Quantity: 3 cups | Optional: False
Steps:
1. Rinse rice and bring it and the water to a boil in a covered saucepan. Reduce heat and simmer about 15 minutes, or according to package directions; rest covered for 10 minutes.
2. Meanwhile, heat oil in a deep skillet and soften onion for 5 minutes. Add garlic and curry powder and stir for 30 seconds.
3. Add chickpeas, coconut milk, tomatoes and salt. Simmer uncovered for 15–20 minutes, stirring occasionally. Fold in spinach until wilted and serve over rice.
Reheat: Cool and refrigerate curry and rice promptly in shallow containers. Reheat until steaming hot; add a splash of water if needed.

Dish 3: Chicken, White Bean and Tomato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop, large Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Boneless skinless chicken thighs, cut into chunks | ID: chicken-thighs-boneless | Quantity: 2 pounds | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned cannellini beans, drained and rinsed | ID: cannellini-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Water | ID: None | Quantity: 2 cups | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 2 teaspoons | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat oil in a Dutch oven. Cook onion and carrots for 5 minutes, then add garlic and oregano and stir briefly.
2. Add chicken, beans, tomatoes, water, salt and pepper. Bring to a simmer, cover and cook for 25–30 minutes, until carrots are tender and chicken reaches 165°F throughout.
Reheat: Refrigerate promptly in shallow containers. Reheat portions on the stove or in the microwave to 165°F, stirring for even heating.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f3351adf9f59c64f7858973e` — fixture R20

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R20",
  "category": "identity",
  "task": "generate",
  "prompt": "Use raw salmon, but do not invent a species from a generic salmon label.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "salmon-fillets-raw",
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
      "Use raw salmon, but do not invent a species from a generic salmon label."
    ],
    "requiredIngredientIds": [
      "salmon-fillets-raw"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three distinct batch meal recipes using raw salmon fillets along with safe pantry and produce ingredients.

Dish 1: Salmon and Brown Rice Skillet Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 1.5 lbs | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat the oven to 375 degrees Fahrenheit.
2. In a 9x13-inch baking dish, combine the dry brown rice, chicken broth, olive oil, and salt.
3. Toss in the chopped broccoli florets and stir to distribute evenly.
4. Nestle the raw salmon fillets into the rice mixture.
5. Cover tightly with foil and bake for 40 to 45 minutes until the rice is tender and the salmon flakes easily.
6. Fluff the rice around the baked salmon before portioning into batch containers.
Reheat: Microwave covered with a damp paper towel on medium power for 2 to 3 minutes until heated through.

Dish 2: Hearty Salmon and Potato Chowder
Servings: 6 | Style: CHILI_SOUP | Appliance: Stove Top
Prep: 15 min | Cook: 30 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 1.5 lbs | Optional: False
- Fresh Russet potatoes | ID: russet-potatoes-fresh | Quantity: 4 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Butter | ID: butter-salted-unsalted | Quantity: 2 tbsp | Optional: False
Steps:
1. Melt the butter in a large stockpot over medium heat.
2. Add chopped onions and celery, sautéing until translucent.
3. Add peeled and diced Russet potatoes along with the vegetable broth.
4. Bring to a boil, then reduce heat and simmer for 15 minutes until potatoes are soft.
5. Cut raw salmon fillets into bite-sized chunks and gently stir them into the simmering soup.
6. Cook for an additional 6 to 8 minutes until the salmon is fully cooked through.
Reheat: Reheat gently on the stovetop over medium-low heat, stirring occasionally, or microwave in a covered bowl.

Dish 3: Salmon and Quinoa Stew Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 1.5 lbs | Optional: False
- Dry quinoa | ID: quinoa-dry | Quantity: 1 cup | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 cups | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3  cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Heat olive oil in a Dutch oven over medium heat.
2. Add minced garlic and sliced carrots, sautéing for 5 minutes.
3. Stir in the canned crushed tomatoes, dry quinoa, and 1 cup of water.
4. Bring the mixture to a gentle simmer, cover, and cook for 15 minutes.
5. Lay the raw salmon fillets across the top of the simmering quinoa and vegetable mixture.
6. Cover and braise for 12 to 15 minutes until the quinoa is tender and the salmon is cooked through.
Reheat: Reheat in a microwave-safe container with a splash of water, covered, at 70% power for 3 minutes.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f349589a849850c2adcd9d80` — fixture R05

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R05",
  "category": "diet",
  "task": "generate",
  "prompt": "Make this gluten-free and dairy-free.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "GLUTEN_FREE",
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
      "all-purpose-flour",
      "soy-sauce",
      "butter-salted-unsalted",
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
      "Make this gluten-free and dairy-free."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three six-serving batch meals that avoid gluten and dairy. Pantry-listed olive oil and garlic are used; other ingredients can be shopped for.

Dish 1: Tomato-Garlic Beef and Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Fresh potatoes, cubed | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Dried thyme | ID: dried-thyme | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Water | ID: None | Quantity: 1.5 cups | Optional: False
Steps:
1. Put beef, potatoes, carrots, onion, and garlic in the slow cooker.
2. Stir together crushed tomatoes, water, olive oil, paprika, thyme, salt, and pepper; pour over the beef and vegetables.
3. Cover and cook on low for 7 hours, until beef is fork-tender and potatoes are cooked through. Stir before serving.
Reheat: Refrigerate promptly in shallow containers. Reheat a portion covered in the microwave, stirring halfway, until steaming hot; add a splash of water if the stew has thickened.

Dish 2: Smoky Turkey, Black Bean, and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 2 cups | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat. Add turkey and onion; cook, breaking up the meat, until turkey is no longer pink, about 7 minutes.
2. Stir in garlic, chili powder, cumin, and salt; cook for 30 seconds.
3. Add sweet potatoes, beans, crushed tomatoes, and water. Bring to a simmer, cover, and cook gently for about 35 minutes, stirring occasionally, until sweet potatoes are tender and turkey is cooked through.
Reheat: Refrigerate in individual portions. Reheat covered on the stovetop over medium-low heat or in the microwave, stirring once; loosen with a little water if needed and heat until steaming hot.

Dish 3: Coconut Chickpea, Spinach, and Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9-by-13-inch casserole dish in a conventional oven
Prep: 20 min | Cook: 65 min
Ingredients:
- Dry basmati rice, rinsed | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Fresh spinach, roughly chopped | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 1 tbsp | Optional: False
- Ground turmeric | ID: ground-turmeric | Quantity: 0.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 2.5 cups | Optional: False
Steps:
1. Heat oven to 375°F (190°C). Lightly oil the casserole dish.
2. In a bowl, stir together rinsed rice, chickpeas, spinach, onion, garlic, coconut milk, water, olive oil, curry powder, turmeric, and salt.
3. Cover the dish tightly with foil and bake for 55 minutes. Check that the rice is tender and liquid is absorbed; if needed, add a little hot water, cover, and bake for another 5–10 minutes. Rest covered for 10 minutes, then fluff and serve.
Reheat: Cool and refrigerate in portions. Reheat covered in the microwave with a spoonful of water, stirring halfway through, until steaming hot; the rice also reheats well covered in a 350°F oven.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f3807c60b490184a945ab431` — fixture R30

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R30",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan for a slow cooker. Do not silently require an oven.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "SLOW_COOKER_INSTANT_POT",
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
      "historical_state_not_current_ownership",
      "vessel_method_and_capacity"
    ],
    "reviewNotes": [
      "Remix the seed plan for a slow cooker. Do not silently require an oven."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three distinct slow cooker batch dishes based on the seed plan, adapted for 6 servings without requiring an oven.

Dish 1: Slow Cooker Turkey Tomato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Slow Cooker
Prep: 15 min | Cook: 360 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: True
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Heat olive oil in a skillet and brown the ground turkey.
2. Transfer the browned turkey to the slow cooker insert.
3. Add chopped onions, minced garlic, ground ginger, and crushed tomatoes to the slow cooker.
4. Cover and cook on low for 6 hours.
5. Stir well, sprinkle cheddar cheese on top during the last 10 minutes if desired, and serve.
Reheat: Reheat portions in a covered saucepan over medium-low heat until warmed through, stirring occasionally.

Dish 2: Slow Cooker Turkey and White Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Slow Cooker
Prep: 15 min | Cook: 300 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned navy beans | ID: navy-beans-canned | Quantity: 2 can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cup | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Brown the ground turkey in a skillet with olive oil.
2. Transfer turkey to the slow cooker.
3. Add rinsed navy beans, diced onions, minced garlic, chicken broth, and ground cumin.
4. Stir to combine, cover, and cook on low for 5 hours.
5. Ladle into bowls and serve hot.
Reheat: Reheat on the stovetop over medium heat with a splash of water or broth to restore consistency.

Dish 3: Slow Cooker Turkey Tomato Curry Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Slow Cooker
Prep: 15 min | Cook: 360 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Brown the ground turkey in a skillet with olive oil and transfer to the slow cooker.
2. Add diced onions, minced garlic, curry powder, crushed tomatoes, and coconut milk.
3. Stir thoroughly to combine all ingredients.
4. Cover and cook on low for 6 hours until onions are tender and flavors have melded.
5. Serve warm over rice or grain of choice.
Reheat: Reheat gently in a covered pot on the stovetop over low heat, stirring occasionally so the coconut milk does not separate.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f3e343a6f43e0280a57a595b` — fixture R16

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R16",
  "category": "identity",
  "task": "generate",
  "prompt": "Use ground coriander for seasoning; fresh cilantro is not the same ingredient.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "coriander-ground",
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
      "Use ground coriander for seasoning; fresh cilantro is not the same ingredient."
    ],
    "requiredIngredientIds": [
      "coriander-ground"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three batch meals seasoned with ground coriander; other ingredients may require shopping.

Dish 1: Chicken and Sweet Potato Coriander Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice the chicken, sweet potatoes and onion.
2. Heat oil in a Dutch oven over medium heat. Cook onion for 5 minutes, then stir in coriander and cumin.
3. Add chicken, sweet potatoes, broth and salt. Bring to a simmer, cover and cook for 25–30 minutes, until potatoes are tender and chicken reaches 165°F. Divide into six portions.
Reheat: Refrigerate promptly. Reheat covered on the stovetop or in the microwave to 165°F, adding a splash of water if needed.

Dish 2: Coriander Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop soup pot
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 1 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice the peppers and onion. Drain and rinse the beans.
2. Heat oil in a soup pot and cook the peppers and onion over medium heat for 5 minutes. Stir in the coriander and chili powder.
3. Add beans, tomatoes, broth and salt. Simmer uncovered for 25 minutes, stirring occasionally. Divide into six portions.
Reheat: Refrigerate promptly and reheat on the stovetop or in the microwave to 165°F. Add water if the chili has thickened.

Dish 3: Coconut Chickpea and Cauliflower Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Cauliflower | ID: cauliflower-fresh | Quantity: 1 large head | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 1 tbsp | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Chop onion and cut cauliflower into small florets. Drain and rinse chickpeas.
2. Heat oil in a deep skillet over medium heat and cook onion for 5 minutes. Stir in coriander and curry powder.
3. Add cauliflower, chickpeas, coconut milk and salt. Cover and simmer for 15–20 minutes, until cauliflower is tender. Stir in spinach until wilted, then divide into six portions.
Reheat: Refrigerate promptly. Reheat gently on the stovetop or in the microwave to 165°F, stirring and adding a splash of water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f4817f646a445afaf1a10d39` — fixture R20

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R20",
  "category": "identity",
  "task": "generate",
  "prompt": "Use raw salmon, but do not invent a species from a generic salmon label.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "salmon-fillets-raw",
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
      "Use raw salmon, but do not invent a species from a generic salmon label."
    ],
    "requiredIngredientIds": [
      "salmon-fillets-raw"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: All three dishes use generic raw salmon fillets; no species is assumed.

Dish 1: Lemon-Dill Salmon and Potato Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 900 g | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1200 g | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 600 g | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Lemon | ID: lemon-fresh | Quantity: 1 whole | Optional: False
- Dried dill | ID: dill-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F (220°C). Dice potatoes small and toss with half the oil and salt. Roast on a large sheet pan for 20 minutes.
2. Add chopped broccoli and the remaining oil; roast for 8 minutes.
3. Add salmon, season with dill and pepper, and roast 12–15 minutes, until the thickest part reaches 145°F (63°C). Squeeze lemon over the batch and divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat covered until hot throughout, adding a splash of water to keep the salmon moist.

Dish 2: Coconut Curry Salmon and Rice
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop
Prep: 15 min | Cook: 30 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 900 g | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 450 g | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 800 ml | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 whole | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 whole | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 200 g | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 700 ml | Optional: False
Steps:
1. Cook rice with the water according to package directions.
2. Meanwhile, slice onion and peppers. Soften in oil in a large skillet for 5 minutes, then stir in curry powder.
3. Add coconut milk and salt and simmer for 8 minutes. Cut salmon into large chunks, add to the sauce, and simmer gently for 8–10 minutes until the thickest pieces reach 145°F (63°C). Stir in spinach until wilted.
4. Divide the rice and curry into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat covered until hot throughout, stirring gently and adding water if needed.

Dish 3: Tomato, White Bean and Salmon Stew
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 15 min | Cook: 30 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 900 g | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 800 g | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 750 ml | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 whole | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 whole | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 2 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice onion and carrots and mince garlic. Cook in oil in a large pot for 6 minutes.
2. Add oregano, pepper, tomatoes, broth, and drained, rinsed beans. Simmer for 15 minutes until carrots are tender.
3. Cut salmon into large chunks and add to the stew. Simmer gently for 8–10 minutes until the thickest pieces reach 145°F (63°C). Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat gently until hot throughout, adding a little water if the stew has thickened.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f4fa413a77e4329a4824052a` — fixture R34

Automatic schema validation: **failed**.

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
[No usable output returned]
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f511e2c2b5b1c0449d71424c` — fixture R28

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R28",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan to remove all dairy while preserving batch-prep practicality.",
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
    "forbiddenIngredientIds": [
      "cheddar-cheese",
      "milk-whole",
      "butter-salted-unsalted"
    ],
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
      "Remix the seed plan to remove all dairy while preserving batch-prep practicality."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three dairy-free variations on the turkey tomato batch pot, with the cheese omitted.

Dish 1: Ginger turkey tomato pot
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice the onions and mince the garlic. Heat oil in a Dutch oven over medium heat and soften the onions for 5 minutes.
2. Add turkey and cook, breaking it up, until browned. Stir in garlic and ginger for 30 seconds.
3. Add tomatoes, salt and pepper. Simmer uncovered for 20 minutes, stirring occasionally, until the turkey reaches 165°F. Divide into six portions.
Reheat: Refrigerate portions promptly for up to 4 days or freeze. Reheat until 165°F, adding a splash of water if needed.

Dish 2: Turkey and black bean tomato chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop stockpot
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.5 tsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice onions, mince garlic, and drain and rinse beans.
2. Heat oil in a stockpot over medium heat. Cook onions for 5 minutes, then add turkey and brown, breaking it up.
3. Stir in garlic and spices. Add tomatoes, beans, water and salt; simmer for 25 minutes, until turkey reaches 165°F. Divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat to 165°F, stirring and adding water if thick.

Dish 3: Coconut turkey tomato curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
Prep: 15 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 1 tbsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice onions and mince garlic. Heat oil in a deep skillet over medium heat and soften onions for 5 minutes.
2. Add turkey and cook, breaking it up, until browned. Stir in garlic, ginger and curry powder for 30 seconds.
3. Add tomatoes, coconut milk and salt. Simmer for 20 minutes, until turkey reaches 165°F. Stir in spinach until wilted and divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat gently to 165°F, stirring to recombine the sauce.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f538ef0e2073fa5553b3e783` — fixture R20

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R20",
  "category": "identity",
  "task": "generate",
  "prompt": "Use raw salmon, but do not invent a species from a generic salmon label.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "salmon-fillets-raw",
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
      "Use raw salmon, but do not invent a species from a generic salmon label."
    ],
    "requiredIngredientIds": [
      "salmon-fillets-raw"
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Used the supplied generic salmon fillet ID (salmon-fillets-raw) because the request did not name a species, so no species was invented. The pantry marks salmon as available but does not prove enough quantity, so the full 1000 g batch is listed as needed. Other ingredients are proposed shopping items. No prices or savings are stated.

Dish 1: Coconut Curry Salmon Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch deep skillet with lid
Prep: 15 min | Cook: 25 min
Ingredients:
- Raw salmon fillets, skinless, cut into 2-inch pieces | ID: salmon-fillets-raw | Quantity: 1000 g | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 800 ml | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Yellow onion, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 6 clove | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 300 g | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Lime, cut into wedges for serving | ID: None | Quantity: 2 whole | Optional: True
Steps:
1. Pat the salmon dry and season lightly with salt.
2. Heat the olive oil in the skillet over medium heat and cook the onion for 5 minutes until soft.
3. Add the garlic, ginger, and curry powder and stir for 1 minute until fragrant.
4. Pour in the coconut milk, bring to a gentle simmer, and cook uncovered for 5 minutes.
5. Nestle the salmon pieces into the sauce, cover, and simmer on low for 8 to 10 minutes until the fish flakes easily.
6. Fold in the spinach and cook 2 minutes until wilted. Cool, portion into airtight containers, and refrigerate within 2 hours.
Reheat: Reheat covered in a skillet over low heat for 6 to 8 minutes, adding a splash of water if thick. Serve with lime wedges. Do not boil hard.

Dish 2: Salmon and Potato Chowder
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven
Prep: 20 min | Cook: 35 min
Ingredients:
- Raw salmon fillets, skinless, cut into 1-inch cubes | ID: salmon-fillets-raw | Quantity: 1000 g | Optional: False
- Fresh Yukon Gold potatoes, diced | ID: yukon-gold-potatoes-fresh | Quantity: 900 g | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Celery, diced | ID: celery-stalks | Quantity: 3 stalk | Optional: False
- Butter | ID: butter-salted-unsalted | Quantity: 3 tbsp | Optional: False
- All-purpose wheat flour | ID: all-purpose-flour | Quantity: 40 g | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 L | Optional: False
- Whole milk (3.25%) | ID: milk-whole | Quantity: 1 L | Optional: False
- Dried dill | ID: dill-dried | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Melt the butter in the Dutch oven over medium heat and cook the onion and celery for 6 minutes until soft.
2. Stir in the flour and cook 1 minute.
3. Gradually whisk in the broth, then add the potatoes and simmer 12 minutes until tender.
4. Stir in the milk and dill and warm gently without boiling.
5. Add the salmon cubes and simmer on low for 5 to 6 minutes until just opaque. Season with salt and pepper, cool, and refrigerate within 2 hours.
Reheat: Reheat gently on the stovetop over low-medium heat, stirring often, for 10 to 12 minutes. Do not let it boil after the milk is added, to prevent curdling.

Dish 3: Salmon Broccoli Cheddar Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish in a 400 F oven
Prep: 20 min | Cook: 30 min
Ingredients:
- Raw salmon fillets, skinless, cut into 1-inch pieces | ID: salmon-fillets-raw | Quantity: 1000 g | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 300 g | Optional: False
- Broccoli florets | ID: broccoli-fresh | Quantity: 600 g | Optional: False
- Chicken eggs | ID: large-eggs-dozen | Quantity: 6 whole | Optional: False
- Whole milk (3.25%) | ID: milk-whole | Quantity: 500 ml | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 200 g | Optional: False
- Dijon mustard | ID: dijon-mustard | Quantity: 1 tbsp | Optional: False
- Lemon, zested | ID: lemon-fresh | Quantity: 1 whole | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Cook the brown rice according to package directions and let it cool slightly.
2. Preheat the oven to 400 F and lightly grease the baking dish.
3. Steam the broccoli for 4 minutes until barely tender and drain.
4. Whisk the eggs, milk, mustard, lemon zest, salt, and pepper together.
5. Spread the rice, broccoli, and salmon in the dish, pour the egg mixture over the top, and sprinkle with cheddar.
6. Bake uncovered for 30 minutes until set and the salmon is opaque. Cool, portion, and refrigerate within 2 hours.
Reheat: Reheat individual portions in the microwave at 70 percent power for 2 to 3 minutes, or cover and warm in a 325 F oven for 15 minutes until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

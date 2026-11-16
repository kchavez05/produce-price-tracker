# Blinded recipe review — batch 20

[Review instructions](../REVIEWING.md) · [All batches](../README.md) · [Compact grading sheet](../grades.json)

All grading fields are blank. Schema status below is an automatic format check, not a dietary or quality grade.

## Review `f579267ba407bf2d74537e34` — fixture R15

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
Explanation: Each dish uses dried chickpeas. Soak them overnight; soaking time is additional to the listed prep and cook times.

Dish 1: Smoky Chickpea and Tomato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop large pot
Prep: 15 min | Cook: 135 min
Ingredients:
- Dried chickpeas | ID: chickpeas-dried | Quantity: 2 cups | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 2 teaspoons | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 ounces | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Water, plus extra for soaking | ID: None | Quantity: 8 cups | Optional: False
Steps:
1. Soak the chickpeas overnight in plenty of water. Drain and rinse.
2. Cover with the 8 cups water in a large pot. Bring to a boil, then simmer 60–120 minutes, until tender; add water if needed. Drain.
3. Dice the onion and carrots and mince the garlic. In the pot, soften them in oil for 8 minutes; stir in paprika.
4. Add chickpeas, tomatoes, broth and salt. Simmer 20 minutes, until the carrots are tender.
Reheat: Refrigerate in shallow containers within 2 hours. Reheat until piping hot, adding a splash of water if thick.

Dish 2: Coconut Chickpea and Sweet Potato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop large pot
Prep: 15 min | Cook: 140 min
Ingredients:
- Dried chickpeas | ID: chickpeas-dried | Quantity: 2 cups | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 large | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canola oil | ID: canola-oil | Quantity: 2 tablespoons | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 14 ounces | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Water, plus extra for soaking | ID: None | Quantity: 10 cups | Optional: False
Steps:
1. Soak chickpeas overnight in plenty of water. Drain and rinse.
2. Cover with 8 cups of the water in a large pot. Bring to a boil, then simmer 60–120 minutes until tender, adding water if needed. Drain.
3. Dice sweet potatoes and onion and mince garlic. Cook onion in oil for 5 minutes; add garlic and curry powder and stir for 1 minute.
4. Add sweet potatoes, chickpeas, coconut milk, remaining 2 cups water and salt. Simmer 20–25 minutes until the potatoes are tender. Stir in spinach until wilted.
Reheat: Refrigerate in shallow containers within 2 hours. Reheat gently until piping hot, stirring in water if needed.

Dish 3: Chickpea, Barley and Vegetable Soup
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop large pot
Prep: 15 min | Cook: 150 min
Ingredients:
- Dried chickpeas | ID: chickpeas-dried | Quantity: 1.5 cups | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 1 cup | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Salt | ID: salt | Quantity: 0.5 teaspoon | Optional: False
- Water, plus extra for soaking | ID: None | Quantity: 8 cups | Optional: False
Steps:
1. Soak chickpeas overnight in plenty of water. Drain and rinse.
2. Cover with the 8 cups water in a large pot. Bring to a boil, then simmer 60–120 minutes until tender, adding water if needed. Drain.
3. Dice the onion, carrots and celery. Soften them in oil in the pot for 8 minutes, then stir in thyme.
4. Add chickpeas, barley, broth and salt. Simmer 35–45 minutes until barley is tender, adding water if the soup gets too thick.
Reheat: Refrigerate in shallow containers within 2 hours. Reheat until piping hot; add water or broth as the barley absorbs liquid.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f65d8fb5239cc6c9b50f8d70` — fixture R07

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
Explanation: Three reheatable batch meals for six, all dairy-free. Butter, milk, and cheese are not used.

Dish 1: Coconut Red Lentil and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large lidded Dutch oven on the stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Ground turmeric | ID: turmeric-ground | Quantity: 1 teaspoon | Optional: False
- Dried red lentils, rinsed | ID: red-lentils-dried | Quantity: 2 cups | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 cans (13.5 ounces each) | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 ounces) | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 teaspoon | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat. Cook onion for 5 minutes until softened.
2. Add garlic, ginger, curry powder, and turmeric; stir for 30 seconds.
3. Stir in lentils, coconut milk, broth, tomatoes, salt, and pepper. Bring to a boil, then cover and simmer gently for 20–25 minutes, stirring occasionally, until lentils are tender.
4. Fold in spinach and cook until wilted. Cool promptly and refrigerate in sealed portions.
Reheat: Reheat gently on the stovetop or in the microwave, stirring halfway through; add a splash of water or broth if thick.

Dish 2: Smoky Black Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 300 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 pounds | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 3 cans (15 ounces each) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 ounces) | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tablespoons | Optional: True
Steps:
1. Heat olive oil in a skillet over medium heat and cook onion for 4–5 minutes. Stir in garlic for 30 seconds.
2. Transfer onion mixture to the slow cooker. Add sweet potatoes, beans, tomatoes, broth, tomato paste, chili powder, cumin, paprika, and salt; stir.
3. Cover and cook on low for 5–6 hours, until sweet potatoes are tender. Stir in lime juice if using. Cool promptly and refrigerate in sealed portions.
Reheat: Reheat a portion in a covered saucepan over medium-low heat, stirring occasionally, or microwave covered; loosen with broth or water if needed.

Dish 3: Garlic, Tomato, and Chickpea Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Large heavy-bottomed pot on the stovetop
Prep: 20 min | Cook: 45 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 5 cloves | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Zucchini, diced | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 cans (15 ounces each) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 ounces) | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 teaspoons | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 teaspoon | Optional: False
Steps:
1. Warm olive oil in the pot over medium heat. Add onion, carrots, and celery; cook for 6 minutes, stirring occasionally.
2. Stir in garlic for 30 seconds. Add zucchini, chickpeas, tomatoes, broth, Italian seasoning, bay leaf, salt, and pepper.
3. Bring to a boil, then lower heat, cover, and simmer for 30–35 minutes until vegetables are tender. Remove the bay leaf. Cool promptly and refrigerate in sealed portions.
Reheat: Warm on the stovetop over medium-low heat, stirring occasionally, or microwave covered until steaming hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f67023a5ad882137f3620613` — fixture R19

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
Explanation: Generated three distinct batch meal recipes featuring raw andouille sausage with complete cooking steps.

Dish 1: Andouille and White Bean Cassoulet Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 60 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 pounds | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 3 cans | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1.5 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Salt | ID: salt | Quantity: 0.5 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Preheat the oven to 375 degrees Fahrenheit.
2. Heat olive oil in a skillet over medium heat and brown the raw andouille sausage thoroughly on all sides, then slice into rounds.
3. In a large baking dish, combine the rinsed cannellini beans, diced onions, minced garlic, browned andouille slices, chicken broth, salt, and black pepper.
4. Cover the baking dish with foil and bake in the preheated oven for 45 minutes.
5. Remove the foil and bake for an additional 15 minutes until the top is slightly golden and bubbly.
Reheat: Reheat portions in a covered skillet or microwave with a splash of chicken broth to retain moisture.

Dish 2: Smoky Andouille and Rice Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 pounds | Optional: False
- Dry jasmine rice | ID: jasmine-rice-dry | Quantity: 2 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3.5 cups | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in a large skillet over medium-high heat and thoroughly cook the raw andouille sausage until browned, then remove and slice.
2. In the same skillet, sauté diced onions, bell peppers, and minced garlic until soft.
3. Stir in the dry jasmine rice, smoked paprika, and sliced andouille sausage.
4. Pour in the chicken broth and bring to a boil.
5. Reduce heat to low, cover with a tight-fitting lid, and simmer for 20 minutes until the rice is tender and liquid is absorbed.
Reheat: Reheat on the stovetop over medium-low heat, adding a tablespoon of water to loosen the rice.

Dish 3: Hearty Andouille and Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 pounds | Optional: False
- Fresh Russet potatoes | ID: russet-potatoes-fresh | Quantity: 3 pounds | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in a large Dutch oven over medium heat. Fully cook the raw andouille sausage links, then remove and slice into thick coins.
2. Add diced onions, sliced carrots, and chopped celery to the Dutch oven, cooking until slightly softened.
3. Peel and cube the Russet potatoes, then add them to the pot along with the sliced andouille.
4. Pour in the chicken broth and sprinkle in the dried thyme.
5. Bring the stew to a boil, then reduce heat, cover, and simmer for 30 minutes until potatoes are fork-tender.
Reheat: Warm gently in a pot over medium-low heat, stirring occasionally to prevent potatoes from sticking.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f68ced80f2a62f694d04c211` — fixture R18

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
Explanation: Generated three batch meals using ground ginger instead of fresh ginger since fresh ginger is not available.

Dish 1: Ground Ginger Chicken Rice Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Skillet
Prep: 15 min | Cook: 30 min
Ingredients:
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 1.5 pounds | Optional: False
- Dry jasmine rice | ID: jasmine-rice-dry | Quantity: 2 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1.5 teaspoons | Optional: False
- Soy sauce | ID: soy-sauce | Quantity: 3 tablespoons | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
Steps:
1. Cut the chicken breasts into bite-sized pieces.
2. Heat olive oil in a large skillet over medium-high heat and brown the chicken.
3. Add the dry jasmine rice, chicken broth, ground ginger, and soy sauce to the skillet.
4. Bring to a boil, then reduce heat, cover, and simmer for 20 minutes until the rice is tender and liquid is absorbed.
Reheat: Reheat in a covered skillet over medium-low heat with a splash of water until warmed through.

Dish 2: Ground Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 pounds | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 cups | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 3 cups | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Brown the ground beef in a large Dutch oven over medium heat, draining excess fat.
2. Add chopped carrots, diced potatoes, beef broth, ground ginger, and salt.
3. Bring the mixture to a boil, then reduce heat to low, cover, and simmer for 35 minutes until vegetables are tender.
Reheat: Warm gently in a saucepan over medium-low heat, stirring occasionally.

Dish 3: Lentil and Rice Chili Soup
Servings: 6 | Style: CHILI_SOUP | Appliance: Soup Pot
Prep: 15 min | Cook: 40 min
Ingredients:
- Dried lentils | ID: lentils-dried | Quantity: 1.5 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 3 cups | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 5 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 teaspoon | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 cup | Optional: False
Steps:
1. Sauté chopped onions in a large pot until translucent.
2. Add rinsed dried lentils, crushed tomatoes, vegetable broth, chili powder, and ground ginger.
3. Bring to a boil, reduce heat to low, cover, and simmer for 35 minutes until the lentils are fully tender.
Reheat: Reheat in a pot over medium heat, adding a splash of vegetable broth if the soup has thickened too much.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f6cf8e329d839dc80223ac4a` — fixture R29

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
Explanation: Remixed the seed plan to use chickpeas instead of ground turkey, providing three distinct batch meal options with adjusted quantities and methods.

Dish 1: Chickpea Tomato Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Stove
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
Steps:
1. Dice the onions and mince the garlic cloves.
2. Heat olive oil in a large pot over medium heat and sauté the onions until soft.
3. Add the minced garlic and ground ginger, cooking until fragrant for about 1 minute.
4. Pour in the canned crushed tomatoes and rinsed canned chickpeas.
5. Simmer gently for 25 minutes until flavors blend and sauce thickens.
Reheat: Reheat on the stovetop over medium-low heat with a splash of water to loosen the sauce.

Dish 2: Spiced Chickpea and Tomato Soup
Servings: 6 | Style: CHILI_SOUP | Appliance: Stove
Prep: 10 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cup | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
Steps:
1. Chop onions and mince garlic.
2. In a large soup pot, cook onions until translucent.
3. Stir in garlic and ground ginger until aromatic.
4. Add crushed tomatoes, vegetable broth, and chickpeas.
5. Bring to a boil, then reduce heat and simmer for 20 minutes.
Reheat: Reheat gently in a saucepan over medium heat, stirring occasionally.

Dish 3: Cheesy Chickpea Tomato Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat oven to 375°F (190°C).
2. Sauté chopped onions and minced garlic in a pan until soft, then stir in ginger.
3. Combine the sautéed aromatics with crushed tomatoes and chickpeas in a mixing bowl.
4. Transfer the mixture to a baking dish and top with grated cheddar cheese.
5. Bake for 35 minutes until bubbly and golden on top.
Reheat: Cover with foil and bake at 350°F for 20 minutes until heated through.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f6f5fb8e548e1ffe002f697d` — fixture R09

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
Explanation: Your pantry is empty, so obtain every ingredient listed below. Quantities are for the full six-serving batches; prices are unknown.

Dish 1: Chicken and Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop, large pot
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.5 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Dice the potatoes, carrots and onion; cut the chicken into bite-size pieces.
2. Heat oil in a large pot and soften the onion for 5 minutes. Add chicken, potatoes, carrots, broth, thyme, salt and pepper.
3. Simmer covered for 30–35 minutes, until the vegetables are tender and the chicken reaches 165°F. Divide into six portions.
Reheat: Refrigerate promptly. Reheat covered on the stove or in the microwave until steaming and 165°F, adding a splash of water if needed.

Dish 2: Two-Bean Tomato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop, large pot
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned kidney beans | ID: kidney-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and peppers. Drain and rinse the beans.
2. Heat oil in a large pot and cook the onion and peppers for 5 minutes. Stir in chili powder and cumin for 30 seconds.
3. Add beans, tomatoes, water and salt. Simmer for 20–25 minutes, stirring occasionally. Divide into six portions.
Reheat: Refrigerate promptly. Reheat on the stove or in the microwave until steaming and 165°F; add water if too thick.

Dish 3: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop, deep skillet with lid
Prep: 10 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice the onion, mince the garlic, and drain and rinse the chickpeas.
2. Heat oil in a deep skillet. Cook onion for 5 minutes; add garlic and curry powder and stir for 30 seconds.
3. Add chickpeas, coconut milk and salt. Simmer for 15 minutes, then stir in spinach until wilted. Divide into six portions.
Reheat: Refrigerate promptly. Reheat gently on the stove or in the microwave until steaming and 165°F, stirring occasionally.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f71d5f347add04f454ddeba3` — fixture R03

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R03",
  "category": "diet",
  "task": "generate",
  "prompt": "Make a tree-nut-free plan. Do not include almonds or walnuts, even as optional toppings.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "NUT_FREE"
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
      "walnuts-english-raw"
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
      "Make a tree-nut-free plan. Do not include almonds or walnuts, even as optional toppings."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three tree-nut-free reheatable batch meals featuring appropriate catalog ingredients.

Dish 1: Hearty Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2.5 pounds | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 3 medium | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Cut the beef into bite-sized pieces and season with salt and pepper.
2. Heat olive oil in a large Dutch oven over medium-high heat.
3. Brown the beef on all sides, then remove and set aside.
4. Add chopped onions and minced garlic to the pot, sautéing until fragrant.
5. Return the beef to the pot along with sliced carrots, diced potatoes, and beef broth.
6. Bring to a boil, then reduce heat, cover, and simmer for 1.5 to 2 hours until the beef is tender.
Reheat: Reheat gently in a covered pot on the stove over medium-low heat, stirring occasionally, until piping hot.

Dish 2: Black Bean and Chicken Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Pot
Prep: 15 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 2 pounds | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 cans | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tablespoon | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
Steps:
1. Heat olive oil in a large pot over medium heat.
2. Add diced onions and minced garlic, cooking until translucent.
3. Add diced chicken breasts and cook until lightly browned.
4. Stir in chili powder and ground cumin, cooking for 1 minute.
5. Pour in crushed tomatoes, chicken broth, and rinsed black beans.
6. Simmer uncovered for 35 to 40 minutes until the chicken is cooked through and shredded.
Reheat: Microwave in a covered microwave-safe bowl in 2-minute intervals, stirring in between, or reheat in a saucepan.

Dish 3: Cheesy Chicken and Broccoli Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 2 pounds | Optional: False
- Fresh broccoli | ID: broccoli-fresh | Quantity: 4 cups | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 cups | Optional: False
- Whole milk (3.25%) | ID: milk-whole | Quantity: 1.5 cups | Optional: False
- All-purpose wheat flour | ID: all-purpose-flour | Quantity: 0.25 cup | Optional: False
- Butter | ID: butter-salted-unsalted | Quantity: 3 tablespoons | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 0.75 teaspoon | Optional: False
Steps:
1. Preheat oven to 375°F (190°C) and grease a 9x13-inch baking dish.
2. Cook chicken breasts until fully done, then shred or dice.
3. Blanch broccoli florets in boiling water for 3 minutes, then drain.
4. Melt butter in a saucepan, whisk in flour, garlic powder, and salt, then gradually whisk in milk to form a thick sauce.
5. Stir in 1.5 cups of shredded cheddar cheese until melted into the sauce.
6. Combine chicken and broccoli in the baking dish, pour cheese sauce over the top, and sprinkle the remaining cheese.
7. Bake for 30 to 35 minutes until bubbly and golden brown.
Reheat: Cover with foil and bake at 350°F for 20 minutes until heated through, or microwave individual portions.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f74e0343410d9636b747d470` — fixture R33

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
Explanation: Three distinct four-serving sheet-pan meals with practical batch-cooking methods and reheating instructions.

Dish 1: Garlic-Herb Chicken, Potatoes, and Broccoli
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Rimmed sheet pan in a conventional oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.5 lb | Optional: False
- Fresh potatoes, cut into 1-inch pieces | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Broccoli florets | ID: broccoli-fresh | Quantity: 1 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F (220°C). Line a rimmed sheet pan with parchment or lightly oil it.
2. Toss potatoes with 1 tablespoon oil, half the garlic, half the Italian seasoning, and half the salt and pepper. Spread on the pan and roast for 15 minutes.
3. Meanwhile, toss chicken with 1 tablespoon oil and the remaining garlic, seasoning, salt, and pepper. Toss broccoli with the remaining oil.
4. Add chicken and broccoli to the pan, arranging in a single layer. Roast 20–25 minutes, turning the potatoes once, until chicken reaches 165°F (74°C) and potatoes are tender.
5. Cool promptly and divide into four meal containers.
Reheat: Refrigerate in sealed containers for up to 4 days. Reheat a portion covered in a 350°F (175°C) oven for 15–20 minutes, or microwave covered in 60-second intervals until steaming hot; add a teaspoon of water before microwaving if the potatoes seem dry.

Dish 2: Smoky Sausage, Peppers, and Sweet Potatoes
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Rimmed sheet pan in a conventional oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Fully cooked andouille sausage, sliced | ID: andouille-fully-cooked | Quantity: 1 lb | Optional: False
- Sweet potatoes, cut into 1-inch cubes | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Bell peppers, sliced | ID: bell-peppers | Quantity: 2 large | Optional: False
- Onion, cut into wedges | ID: onions-fresh | Quantity: 1 large | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F (220°C). Line a rimmed sheet pan with parchment.
2. Toss sweet potatoes with olive oil, smoked paprika, garlic powder, and black pepper. Spread on the pan and roast for 15 minutes.
3. Add peppers, onion, and sliced cooked sausage. Toss gently and spread everything into a single layer.
4. Roast another 18–22 minutes, stirring once, until sweet potatoes are tender and sausage is browned at the edges.
5. Divide into four containers and cool before refrigerating.
Reheat: Keep covered in the refrigerator for up to 4 days. Reheat covered in a 350°F (175°C) oven for 15 minutes, uncovering for the final 3–5 minutes to crisp the sausage, or microwave covered in 60-second intervals until hot throughout.

Dish 3: Lemon-Dill Salmon with Asparagus and Tomatoes
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Rimmed sheet pan in a conventional oven
Prep: 12 min | Cook: 22 min
Ingredients:
- Raw Atlantic salmon fillets | ID: atlantic-salmon-fillets-raw | Quantity: 1.5 lb | Optional: False
- Asparagus, trimmed | ID: asparagus-fresh | Quantity: 1 lb | Optional: False
- Fresh tomatoes, cut into wedges | ID: tomatoes-fresh | Quantity: 1 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Lemon, juiced | ID: lemon-fresh | Quantity: 1 medium | Optional: False
- Dried dill | ID: dill-dried | Quantity: 1 tsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Salt | ID: salt | Quantity: 0.75 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Heat oven to 400°F (205°C). Line a rimmed sheet pan with parchment.
2. Whisk olive oil, lemon juice, dill, garlic, salt, and pepper. Toss asparagus and tomatoes with about half the mixture and spread them on the pan.
3. Place salmon on the pan among the vegetables and spoon the remaining mixture over the fillets.
4. Bake 12–16 minutes, depending on fillet thickness, until salmon flakes easily and reaches 145°F (63°C) at its thickest point, and asparagus is tender.
5. Cool and portion into four containers, keeping the salmon portions intact.
Reheat: Refrigerate promptly and use within 3 days. For gentler reheating, cover a portion and microwave at 50% power in 30-second intervals until just hot; avoid prolonged heating, which dries salmon. Alternatively, reheat covered in a 300°F (150°C) oven for about 10 minutes.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f7e14d3a8260637541202b20` — fixture R03

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R03",
  "category": "diet",
  "task": "generate",
  "prompt": "Make a tree-nut-free plan. Do not include almonds or walnuts, even as optional toppings.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "NUT_FREE"
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
      "walnuts-english-raw"
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
      "Make a tree-nut-free plan. Do not include almonds or walnuts, even as optional toppings."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct nut-free batch dishes for 6 servings. Pantry supplies only olive oil and garlic (available), so other ingredients are proposed as shopping items. No almonds, walnuts, or other tree nuts are used, including as toppings. Ingredient IDs are used only for exact matches; pricing is left to app code with no offers supplied.

Dish 1: Hearty Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven on stovetop or slow cooker
Prep: 20 min | Cook: 150 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Fresh Russet potatoes | ID: russet-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Pat beef dry, season with salt and pepper, and brown in olive oil in batches; set aside.
2. Saute onion, celery, and garlic in the same pot for 5 minutes, then stir in tomato paste for 1 minute.
3. Return beef to the pot, add broth, thyme, and bay leaves, and bring to a simmer.
4. Cover and braise 1.5 hours on low, or cook on low in a slow cooker for 6 to 8 hours.
5. Add carrots and potatoes, cook 30 minutes more until tender, then remove bay leaves and adjust seasoning.
Reheat: Refrigerate within 2 hours, store up to 4 days, and reheat gently on the stovetop with a splash of broth until steaming hot (165°F).

Dish 2: Black Bean and Turkey Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stockpot on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in a stockpot over medium heat and brown ground turkey, breaking it up, about 6 minutes.
2. Add onion, bell pepper, and garlic and cook until softened, about 5 minutes.
3. Stir in chili powder and cumin for 30 seconds, then add crushed tomatoes, drained black beans, and broth.
4. Simmer uncovered 30 minutes, stirring occasionally, and season with salt.
Reheat: Cool, refrigerate within 2 hours, and keep up to 4 days; reheat over medium heat, adding a little water if thick, to 165°F.

Dish 3: Sweet Potato and Chickpea Curry Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep skillet with lid on stovetop
Prep: 15 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ginger | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned chickpeas | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in a deep skillet over medium heat and saute onion, garlic, and ginger for 5 minutes.
2. Stir in curry powder for 30 seconds, then add cubed sweet potatoes, drained chickpeas, coconut milk, and broth.
3. Cover and simmer 20 minutes until sweet potatoes are tender.
4. Stir in spinach until wilted and season with salt.
Reheat: Refrigerate within 2 hours for up to 4 days; reheat covered over medium-low with a splash of broth until hot throughout (165°F).
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f827267eb55a3cb529d422c5` — fixture R04

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
Explanation: Three reheatable pescatarian batch meals for six. Olive oil and garlic are listed as available, but the pantry does not confirm quantities; additional ingredients can be shopped for as needed.

Dish 1: Tomato, Lentil and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large covered skillet or Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Dried red lentils, rinsed | ID: red-lentils-dried | Quantity: 1.5 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 13.5-ounce can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
- Dry basmati rice, for serving | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
Steps:
1. Heat oil in a large covered skillet or Dutch oven over medium heat. Cook onions for 5 minutes until softened.
2. Stir in garlic, ginger and curry powder; cook for 1 minute. Add lentils, tomatoes, broth, coconut milk, salt and pepper.
3. Bring to a gentle boil, cover partially and simmer for 25–30 minutes, stirring occasionally, until lentils are soft. Add a splash of broth or water if it becomes too thick.
4. Stir in spinach until wilted. Meanwhile, cook rice according to its package directions. Portion curry with rice.
Reheat: Refrigerate promptly in airtight containers. Reheat curry and rice separately in the microwave, stirring halfway through; add a splash of water to the curry if thick. Heat until steaming throughout.

Dish 2: White Bean, Kale and Potato Tomato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Large heavy-bottomed pot with lid
Prep: 15 min | Cook: 40 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Fresh potatoes, diced | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Canned cannellini beans, drained and rinsed | ID: cannellini-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Fresh kale, stems removed and chopped | ID: kale-fresh | Quantity: 5 ounces | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Heat oil in the pot over medium heat. Add onion and carrots; cook for 5 minutes, stirring occasionally.
2. Add garlic and tomato paste and stir for 1 minute. Add potatoes, beans, tomatoes, broth, thyme, salt and pepper.
3. Bring to a boil, then cover and simmer gently for 25–30 minutes, until potatoes are tender. Stir occasionally.
4. Stir in kale and simmer uncovered for 5 minutes until tender. Taste and adjust seasoning before portioning.
Reheat: Store in airtight portions in the refrigerator. Reheat on the stovetop over medium-low heat or in the microwave, stirring occasionally; add a little water or vegetable broth if needed and heat until steaming.

Dish 3: Salmon, Broccoli and Rice Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and 9-by-13-inch baking dish
Prep: 20 min | Cook: 45 min
Ingredients:
- Dry brown rice | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2.5 cups | Optional: False
- Raw Atlantic salmon fillets, skin removed and cut into chunks | ID: atlantic-salmon-fillets-raw | Quantity: 1.5 lb | Optional: False
- Broccoli, cut into small florets | ID: broccoli-fresh | Quantity: 1 large head | Optional: False
- Fresh cremini mushrooms, sliced | ID: mushrooms-cremini-fresh | Quantity: 8 ounces | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Whole milk | ID: milk-whole | Quantity: 1.5 cups | Optional: False
- Cornstarch | ID: cornstarch | Quantity: 1 tbsp | Optional: False
- Dijon mustard | ID: dijon-mustard | Quantity: 1 tbsp | Optional: False
- Lemon juice | ID: lemon-fresh | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, grated | ID: cheddar-cheese | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Heat oven to 375°F. In a saucepan, combine rice and broth, bring to a boil, cover and simmer according to package directions until just tender. Transfer rice to a greased 9-by-13-inch baking dish.
2. Meanwhile, heat oil in a skillet over medium heat. Cook mushrooms for 5 minutes, then add garlic and broccoli and cook for 2 minutes. Spread vegetables over the rice and arrange salmon chunks on top.
3. Whisk milk, cornstarch, mustard, lemon juice, salt and pepper until smooth. Pour evenly over the casserole and sprinkle with cheddar.
4. Cover the dish with foil and bake for 25 minutes. Uncover and bake another 10–15 minutes, until the salmon is opaque and flakes easily and the center is steaming. Rest 5 minutes, then portion.
Reheat: Cool and refrigerate in airtight portions promptly. Reheat gently in a covered microwave-safe dish, stirring rice and vegetables where possible, until steaming throughout; avoid prolonged heating so the salmon stays moist.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f82a8a563bbee19ef2fa3787` — fixture R27

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R27",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan from six to four servings; scale the whole recipe coherently.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 4,
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
      "Remix the seed plan from six to four servings; scale the whole recipe coherently."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Each variation scales all seed ingredients to four servings.

Dish 1: Turkey tomato batch pot
Servings: 4 | Style: STEW_BRAISE | Appliance: Stovetop and large pot
Prep: 10 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.3333 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.6667 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.6667 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.6667 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 oz | Optional: False
Steps:
1. Dice the onions and mince the garlic.
2. Brown the turkey in a large pot over medium heat, breaking it up. Add the onions and cook until softened.
3. Stir in the garlic and ginger, then add the tomatoes. Simmer for 20 minutes, until the turkey reaches 165°F.
4. Divide into four portions and top with the cheddar.
Reheat: Reheat until steaming hot and 165°F, adding a splash of water if needed.

Dish 2: Cheesy turkey tomato skillet
Servings: 4 | Style: CURRY_SKILLET | Appliance: Stovetop and deep skillet with lid
Prep: 10 min | Cook: 25 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.3333 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.6667 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.6667 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.6667 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 oz | Optional: False
Steps:
1. Thinly slice the onions and mince the garlic.
2. Brown the turkey in a deep skillet, breaking it up. Add the onions and cook until softened.
3. Add the garlic, ginger and tomatoes. Simmer uncovered for 15 minutes, until thick and the turkey reaches 165°F.
4. Sprinkle with cheddar, cover until melted and divide into four portions.
Reheat: Reheat covered in a skillet or microwave to 165°F; add a little water if dry.

Dish 3: Turkey tomato cheddar bake
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Stovetop and oven
Prep: 10 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.3333 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.6667 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.6667 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.6667 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 oz | Optional: False
Steps:
1. Heat the oven to 375°F. Dice the onions and mince the garlic.
2. In an oven-safe skillet, brown the turkey and soften the onions. Stir in the garlic, ginger and tomatoes; simmer for 10 minutes.
3. Sprinkle the cheddar over the top and bake for 15 minutes, until bubbling and the turkey reaches 165°F. Divide into four portions.
Reheat: Reheat covered in the microwave or oven until the center reaches 165°F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f8601fbad55aa4b000610e03` — fixture R34

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
Explanation: Each recipe makes eight servings in a Dutch oven of at least 7 quarts. Pantry availability does not guarantee sufficient quantity.

Dish 1: Beef, Potato and Carrot Braise
Servings: 8 | Style: STEW_BRAISE | Appliance: 7-quart or larger Dutch oven with lid
Prep: 25 min | Cook: 150 min
Ingredients:
- Raw boneless beef chuck roast | ID: beef-chuck-roast-boneless-raw | Quantity: 3 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Beef broth | ID: beef-broth | Quantity: 3 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Cut beef into large chunks; chop onions, garlic, carrots and potatoes.
2. Heat oil in the Dutch oven over medium-high heat. Brown beef in batches, about 10 minutes total, then remove.
3. Cook onions for 5 minutes. Add garlic, tomato paste and thyme; stir for 1 minute. Add broth, salt and pepper, scraping up browned bits.
4. Return beef to the pot. Cover and simmer gently for 90 minutes.
5. Add carrots and potatoes, cover and simmer 35–45 minutes more, until beef is tender and vegetables are cooked. Divide into eight portions.
Reheat: Refrigerate promptly in shallow containers. Reheat covered on the stove or in the microwave to 165°F, adding a splash of water if needed.

Dish 2: Turkey and Black Bean Chili
Servings: 8 | Style: CHILI_SOUP | Appliance: 7-quart or larger Dutch oven with lid
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice onions and peppers, mince garlic, and drain and rinse beans.
2. Heat oil in the Dutch oven over medium-high heat. Cook turkey, breaking it up, until no pink remains, about 8 minutes.
3. Add onions and peppers and cook for 5 minutes. Stir in garlic, chili powder and cumin for 1 minute.
4. Add beans, tomatoes, broth and salt. Bring to a simmer, then cover partly and simmer for 25–30 minutes, stirring occasionally. Divide into eight portions.
Reheat: Refrigerate promptly in shallow containers. Reheat to 165°F on the stove or in the microwave, stirring and adding a little water if thick.

Dish 3: Coconut Chickpea and Sweet Potato Curry
Servings: 8 | Style: CURRY_SKILLET | Appliance: 7-quart or larger Dutch oven with lid
Prep: 20 min | Cook: 40 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Ginger | ID: ginger-fresh | Quantity: 1 tbsp grated | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Canned chickpeas | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice onions and sweet potatoes into roughly 1-inch pieces; mince garlic. Drain and rinse chickpeas.
2. Heat oil in the Dutch oven over medium heat. Cook onions for 5 minutes, then stir in garlic, ginger and curry powder for 1 minute.
3. Add sweet potatoes, chickpeas, coconut milk, broth and salt. Bring to a gentle simmer, cover and cook for 25–30 minutes, stirring occasionally, until potatoes are tender.
4. Stir in spinach and cook until wilted, about 2 minutes. Divide into eight portions.
Reheat: Refrigerate promptly in shallow containers. Reheat gently to 165°F on the stove or in the microwave, stirring and adding water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f8c6cef27f560a33d99c86cc` — fixture R11

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
Explanation: Three distinct batch dishes for 6 servings, using dried garlic powder only because fresh garlic is unavailable. No dietary constraints were supplied, and no prices or offers are used.

Dish 1: Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaves | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Season beef with salt and pepper, then brown in oil in batches in the Dutch oven and set aside.
2. Saute onions and carrots in the same pot for 5 minutes, then stir in tomato paste and garlic powder for 1 minute.
3. Return beef to the pot, add broth, thyme and bay leaves, and bring to a simmer.
4. Cover and cook over low heat for 1 hour, then add potatoes and cook 45 minutes more until beef and potatoes are tender.
5. Remove bay leaves, adjust seasoning, and cool before portioning into containers.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat covered on the stovetop over medium-low, adding a splash of broth if thick.

Dish 2: Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stockpot
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 can | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 1 can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oil in the stockpot and cook turkey, onions and bell peppers until turkey is no longer pink.
2. Stir in chili powder, cumin and garlic powder for 1 minute.
3. Add beans, crushed tomatoes, broth and salt, then simmer uncovered 30 minutes, stirring occasionally.
4. Adjust seasoning and cool before portioning.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat in a pot over medium heat, stirring and adding a little water if thick.

Dish 3: Chickpea Spinach Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Fresh tomatoes, diced | ID: tomatoes-fresh | Quantity: 2 medium | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 2 can | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice, for serving | ID: basmati-rice-dry | Quantity: 2 cup | Optional: False
Steps:
1. Heat oil in the skillet and cook onions until soft, about 5 minutes.
2. Stir in ginger, garlic powder and curry powder for 1 minute, then add tomatoes and cook 5 minutes.
3. Add chickpeas, coconut milk and salt, cover and simmer 15 minutes.
4. Stir in spinach until wilted, then cook rice separately according to package directions.
5. Cool curry and rice separately before portioning.
Reheat: Refrigerate up to 4 days or freeze curry up to 2 months. Reheat curry covered over medium-low with a splash of water; reheat rice with a damp towel in the microwave until steaming.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f8cb667dc4ec1003099d428e` — fixture R03

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R03",
  "category": "diet",
  "task": "generate",
  "prompt": "Make a tree-nut-free plan. Do not include almonds or walnuts, even as optional toppings.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [
      "NUT_FREE"
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
      "walnuts-english-raw"
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
      "Make a tree-nut-free plan. Do not include almonds or walnuts, even as optional toppings."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three nut-free batch meals. Check packaged ingredients for nut cross-contact if needed.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and peppers and mince the garlic. Drain and rinse the beans.
2. Heat oil in the Dutch oven over medium heat. Cook onion and peppers for 5 minutes; add garlic and cook 1 minute.
3. Add turkey and cook, breaking it up, until no longer pink. Stir in chili powder and cumin.
4. Add beans, tomatoes, water and salt. Simmer uncovered for 25 minutes, stirring occasionally, until the turkey reaches 165°F. Divide into six portions.
Reheat: Reheat in a covered pan or microwave, stirring and adding a splash of water if needed, until steaming hot and 165°F throughout.

Dish 2: Chicken, Potato and Carrot Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Cut chicken, potatoes and carrots into bite-size pieces. Dice onion and mince garlic.
2. Heat oil in the Dutch oven over medium heat. Cook onion for 5 minutes, then add garlic and thyme for 1 minute.
3. Add chicken, potatoes, carrots, broth, salt and pepper. Bring to a simmer, cover and cook for 30–35 minutes, until vegetables are tender and chicken reaches 165°F. Divide into six portions.
Reheat: Reheat covered on the stovetop or in the microwave until 165°F throughout; add a little water if the broth has thickened.

Dish 3: Tomato Chickpea and Spinach Pasta Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and stovetop
Prep: 20 min | Cook: 25 min
Ingredients:
- Dry pasta | ID: pasta-dry | Quantity: 1 lb | Optional: False
- Canned chickpeas | ID: chickpeas-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 oz | Optional: False
- Low-moisture mozzarella cheese | ID: mozzarella-low-moisture | Quantity: 8 oz | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Water | ID: None | Quantity: 0.5 cup | Optional: False
Steps:
1. Heat oven to 375°F. Cook pasta in boiling water for 2 minutes less than package directions, then drain. Drain and rinse chickpeas; mince garlic.
2. In the pasta pot, heat oil over medium heat and cook garlic for 1 minute. Stir in tomatoes, water, Italian seasoning and salt, then fold in spinach until wilted.
3. Mix in pasta and chickpeas. Transfer to a baking dish, sprinkle with mozzarella and bake for 20–25 minutes until bubbling. Divide into six portions.
Reheat: Microwave covered or warm in a covered oven dish with a splash of water until 165°F throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f92b58d5e29be2bd26064369` — fixture R28

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
Explanation: Remixed the turkey-and-tomato batch pot without dairy and added two distinct dairy-free batch meals. All three make six servings and are suitable for reheating.

Dish 1: Dairy-Free Turkey Tomato Ginger Pot
Servings: 6 | Style: STEW_BRAISE | Appliance: Large Dutch oven on the stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat olive oil in a large Dutch oven over medium heat. Add diced onions and cook until softened, about 6 minutes.
2. Add ground turkey and break it up with a spoon; cook until no longer pink, about 8 minutes. Drain excess liquid if needed.
3. Stir in minced garlic and ground ginger; cook 30 seconds. Add crushed tomatoes, chicken broth, salt, and pepper.
4. Bring to a gentle simmer, cover partly, and cook 25–30 minutes, stirring occasionally. Check that the turkey is fully cooked and adjust seasoning.
5. Cool promptly and portion into containers. Refrigerate for up to 4 days or freeze.
Reheat: Reheat a portion covered in the microwave, stirring halfway through, or warm gently in a saucepan with a splash of water or broth until steaming hot.

Dish 2: Turkey, Black Bean and Tomato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker
Prep: 15 min | Cook: 240 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: water | Quantity: 1 cup | Optional: False
Steps:
1. Heat olive oil in a skillet over medium heat. Add diced onion and bell pepper; cook 5 minutes. Add turkey and cook, breaking it apart, until no longer pink, about 8 minutes.
2. Stir in minced garlic, chili powder, and cumin for 30 seconds. Transfer the mixture to the slow cooker.
3. Add drained beans, crushed tomatoes, water, and salt. Stir to combine.
4. Cover and cook on low for 6–7 hours or high for 3–4 hours. Taste and adjust seasoning before portioning.
5. Cool promptly, then refrigerate portions for up to 4 days or freeze.
Reheat: Reheat covered in the microwave, stirring once, or in a saucepan over medium-low heat. Add a little water if the chili has thickened; heat until steaming hot.

Dish 3: Coconut Chickpea and Vegetable Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large lidded Dutch oven on the stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Cauliflower | ID: cauliflower-fresh | Quantity: 1 large head | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in a large lidded pot over medium heat. Add diced onion and cook until softened, about 5 minutes.
2. Add minced garlic, grated ginger, and curry powder; stir for 30 seconds. Add cauliflower florets and stir to coat.
3. Pour in coconut milk, crushed tomatoes, vegetable broth, chickpeas, and salt. Stir and bring to a gentle simmer.
4. Cover and cook 20–25 minutes, stirring occasionally, until the cauliflower is tender. Portion with the sauce and cool promptly.
5. Refrigerate portions for up to 4 days or freeze.
Reheat: Warm gently in a covered saucepan over medium-low heat, stirring occasionally, or microwave covered and stir halfway through. Add a splash of broth or water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `f9b03bbcaf3501ac4d033d7a` — fixture R32

Automatic schema validation: **failed**.

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
[No usable output returned]
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `fa4bd463904a01e03d6cc1a5` — fixture R06

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
Explanation: Three dairy-free, nut-free batch meals. Check packaged ingredients for allergen cross-contact where needed.

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
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice the onion and peppers; mince the garlic. Drain and rinse the beans.
2. Heat oil in a Dutch oven. Cook onion and peppers for 5 minutes, then add garlic, chili powder and cumin for 1 minute.
3. Add turkey and cook, breaking it up, until no longer pink. Add tomatoes, beans and salt; simmer for 20 minutes, until the turkey reaches 165°F.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat portions to 165°F, adding a splash of water if needed.

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
1. Heat oven to 425°F. Cut potatoes and carrots into small pieces and slice the onion. Mince garlic and juice the lemon.
2. Toss vegetables with half the oil, oregano, salt and pepper in a large baking dish. Bake for 20 minutes.
3. Toss chicken with remaining oil, garlic and lemon juice. Add to the dish and bake for 20–25 minutes, until chicken reaches 165°F and vegetables are tender.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat covered in the microwave or oven until the chicken and vegetables reach 165°F.

Dish 3: Chickpea and Spinach Tomato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
Steps:
1. Cook rice according to package directions. Dice onion, mince garlic, and drain and rinse chickpeas.
2. Heat oil in a deep skillet. Cook onion for 5 minutes, then stir in garlic and curry powder for 1 minute.
3. Add tomatoes, chickpeas and salt; simmer for 20 minutes. Stir in spinach until wilted and serve over rice.
Reheat: Cool rice and curry promptly and refrigerate in shallow containers for up to 4 days. Reheat to 165°F, adding a splash of water if dry.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `faa9f82ef80d72da5b7c8ffe` — fixture R28

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
Explanation: Three dairy-free variations retain the turkey, tomato, onion, garlic and ginger base; cheddar is omitted.

Dish 1: Turkey and White Bean Tomato Pot
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 30 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice the onions, mince the garlic, and drain and rinse the beans.
2. Heat oil in the Dutch oven. Cook onions for 5 minutes, then add turkey and brown, breaking it up.
3. Add garlic, ginger and oregano; cook for 1 minute. Stir in tomatoes, beans and salt.
4. Simmer covered for 20 minutes, stirring occasionally, until the turkey reaches 165°F. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat until 165°F, adding a splash of water if needed.

Dish 2: Turkey, Black Bean and Pepper Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop stockpot
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 peppers | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.5 tsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice onions and peppers, mince garlic, and drain and rinse beans.
2. Heat oil in the stockpot; cook onions and peppers for 5 minutes. Add turkey and brown, breaking it up.
3. Stir in garlic, ginger, chili powder and cumin for 1 minute. Add tomatoes, beans, water and salt.
4. Simmer uncovered for 25 minutes, stirring occasionally, until the turkey reaches 165°F. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 4 days, or freeze portions. Reheat to 165°F, thinning with water as needed.

Dish 3: Coconut Ginger Turkey and Tomato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 fl oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Dairy-free curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice onions and mince garlic.
2. Heat oil in the skillet and cook onions for 5 minutes. Add turkey and brown, breaking it up.
3. Stir in garlic, ginger and curry powder for 1 minute. Add tomatoes, coconut milk and salt; simmer covered for 20 minutes.
4. Stir in spinach until wilted. Check that turkey reaches 165°F and divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat gently to 165°F, stirring and adding water if thick.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `fc41f4e26a28e67d8ceca9f5` — fixture R27

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R27",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan from six to four servings; scale the whole recipe coherently.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 4,
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
      "Remix the seed plan from six to four servings; scale the whole recipe coherently."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Scaled the seed recipe from six to four servings (two-thirds quantities) and varied its turkey-and-tomato base across three reheatable meal styles.

Dish 1: Turkey, Tomato & Ginger Stew
Servings: 4 | Style: STEW_BRAISE | Appliance: Large heavy-bottomed Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.67 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 10.67 oz | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat. Add diced onion and cook until softened, about 5 minutes.
2. Add turkey and break it up; cook until no longer pink, about 7 minutes. Stir in minced garlic and ginger for 30 seconds.
3. Add crushed tomatoes, broth, salt, and pepper. Bring to a simmer, cover partially, and cook gently for 25 minutes, stirring occasionally.
4. Check that the turkey is fully cooked, then portion into four containers.
Reheat: Reheat a portion covered in the microwave, stirring halfway through, or warm gently in a saucepan with a splash of broth.

Dish 2: Turkey Tomato Bean Chili
Servings: 4 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker
Prep: 15 min | Cook: 240 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.67 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 10.67 oz | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 15 oz | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Chili powder | ID: chili-powder | Quantity: 1 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oil in a skillet over medium heat. Cook diced onion for 4–5 minutes, add turkey, and brown while breaking it up, about 7 minutes. Stir in minced garlic, ginger, chili powder, and cumin for 30 seconds.
2. Transfer the turkey mixture to the slow cooker. Add crushed tomatoes, drained beans, broth, and salt; stir to combine.
3. Cover and cook on Low for 4 hours. Confirm the turkey is fully cooked and the chili is bubbling hot, then divide into four portions.
Reheat: Reheat covered in the microwave, stirring once, or warm in a saucepan over medium-low heat; add a little broth if it has thickened.

Dish 3: Turkey Tomato Cheddar Rice Bake
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: 2-quart oven-safe casserole dish
Prep: 20 min | Cook: 50 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.67 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 10.67 oz | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 oz | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 1 cup | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 375°F (190°C). In a skillet, heat olive oil and cook diced onion for 5 minutes. Add turkey and brown, breaking it up, about 7 minutes. Stir in minced garlic and ginger for 30 seconds.
2. Stir uncooked rice, broth, crushed tomatoes, and salt into the turkey mixture. Transfer to the casserole dish and cover tightly with foil.
3. Bake for 40 minutes, then check that the rice is tender and turkey is fully cooked. If needed, add 2 tablespoons of water, re-cover, and bake 5–10 minutes more.
4. Sprinkle cheddar over the top and bake uncovered for 5 minutes to melt. Rest 10 minutes, then divide into four portions.
Reheat: Reheat a portion covered in the microwave until steaming hot, adding a splash of water if the rice seems dry.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `fcba4dbb2753a7f783b792bb` — fixture R34

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
Explanation: Three distinct eight-serving Dutch-oven meals sized for a typical 6–7-quart pot. Ingredients beyond the listed pantry items may need to be purchased; no prices were supplied.

Dish 1: Beef, Potato, and Carrot Dutch-Oven Stew
Servings: 8 | Style: STEW_BRAISE | Appliance: 6–7-quart Dutch oven
Prep: 25 min | Cook: 150 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 3 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 3 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Carrots, cut into chunks | ID: carrots-fresh | Quantity: 1.5 lb | Optional: False
- Fresh potatoes, cut into chunks | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Cornstarch | ID: cornstarch | Quantity: 2 tbsp | Optional: True
Steps:
1. Heat the oil in the Dutch oven over medium-high heat. Season the beef with salt and pepper, then brown it in batches so the pot is not crowded; transfer browned beef to a plate.
2. Add onions and cook until softened, about 5 minutes. Stir in garlic and tomato paste and cook for 1 minute.
3. Return beef and accumulated juices to the pot. Add broth, thyme, and bay leaves. Bring to a simmer, cover, and cook gently for about 1 hour 30 minutes, stirring occasionally.
4. Add carrots and potatoes. Cover and simmer 35–45 minutes, until the beef and vegetables are tender. Remove bay leaves. If thicker stew is desired, mix the optional cornstarch with 2 tablespoons cold water, stir it in, and simmer 2 minutes.
Reheat: Reheat covered on the stovetop over low heat, stirring occasionally and adding a splash of broth or water if thick. Heat until steaming throughout.

Dish 2: Smoky Turkey, Bean, and Sweet Potato Chili
Servings: 8 | Style: CHILI_SOUP | Appliance: 6–7-quart Dutch oven
Prep: 20 min | Cook: 65 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 cans (28 oz each) | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 2 cans (15 oz each) | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 1 can (15 oz) | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium heat. Add turkey and cook, breaking it up, until no longer pink, about 7 minutes.
2. Add onion and bell peppers and cook 5 minutes. Stir in garlic, chili powder, cumin, and smoked paprika; cook 30 seconds.
3. Add tomatoes, broth, beans, sweet potatoes, salt, and pepper. Bring to a gentle boil, then lower the heat, cover, and simmer 35–45 minutes, stirring occasionally, until sweet potatoes are tender and chili has thickened.
Reheat: Reheat covered over low heat on the stovetop, stirring now and then. Add a little broth or water if needed; heat until steaming throughout.

Dish 3: Coconut Chickpea and Red Lentil Curry
Servings: 8 | Style: CURRY_SKILLET | Appliance: 6–7-quart Dutch oven
Prep: 15 min | Cook: 50 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Ground turmeric | ID: turmeric-ground | Quantity: 1 tsp | Optional: False
- Dried red lentils, rinsed | ID: red-lentils-dried | Quantity: 1.5 cups | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 2 cans (15 oz each) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 cans (13.5 oz each) | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tbsp | Optional: True
Steps:
1. Heat oil in the Dutch oven over medium heat. Add onions and cook until soft, about 5 minutes. Stir in garlic, ginger, curry powder, and turmeric; cook for 1 minute.
2. Add lentils, chickpeas, tomatoes, coconut milk, broth, and salt. Stir well and bring to a gentle simmer.
3. Cover partially and cook over low heat for 30–35 minutes, stirring occasionally so lentils do not stick, until lentils are soft and the curry is thick. Stir in spinach until wilted and finish with optional lime juice.
Reheat: Reheat gently in a covered pot over low heat, stirring often. Lentils thicken as they stand, so loosen with water or broth to your preferred consistency; heat until steaming throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `fd6ad670bb2fe68371c596c8` — fixture R11

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
Explanation: Three reheatable batch meals for six. Garlic powder is used where desired; fresh garlic is not included.

Dish 1: Beef, Barley, and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 1 cup | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Potatoes, diced | ID: potatoes-fresh | Quantity: 1 lb | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Add the beef, barley, carrots, celery, onion, potatoes, broth, tomato paste, garlic powder, thyme, bay leaf, salt, and pepper to the slow cooker; stir.
2. Cover and cook on low for about 7 hours, until the beef is tender and barley is cooked. Remove the bay leaf and stir.
3. Cool promptly and refrigerate portions in covered containers. Add a splash of broth when reheating if the barley has thickened the stew.
Reheat: Reheat a portion covered in the microwave, stirring halfway through, until steaming hot; loosen with broth as needed. Or warm gently in a saucepan.

Dish 2: Turkey, Black Bean, and Tomato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart electric pressure cooker
Prep: 15 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 28-ounce cans | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
Steps:
1. Set the cooker to sauté and heat the oil. Add turkey and onion; cook, breaking up the turkey, until no pink remains.
2. Stir in bell peppers, chili powder, cumin, garlic powder, and salt. Add beans, tomatoes, and broth; scrape the bottom of the pot clean.
3. Cook at high pressure for 8 minutes, then allow a 10-minute natural release before carefully releasing remaining pressure. Stir and portion for storage.
Reheat: Reheat covered in the microwave, stirring once, until steaming hot. Add a little broth or water if needed; the chili also reheats well in a saucepan over medium-low heat.

Dish 3: Coconut Chickpea and Sweet Potato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 5-quart Dutch oven on the stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 teaspoon | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tablespoon | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: True
Steps:
1. Heat the oil in the Dutch oven over medium heat. Add onion and cook for 4 minutes, stirring occasionally.
2. Stir in curry powder, garlic powder, ginger, and salt. Add sweet potatoes, chickpeas, coconut milk, and broth.
3. Bring to a gentle simmer, cover, and cook for 20–25 minutes, stirring occasionally, until sweet potatoes are tender.
4. Stir in spinach and cook until wilted. If serving with rice, cook the rice separately according to its package directions. Cool and store curry and rice separately.
Reheat: Reheat curry gently in a covered saucepan or covered microwave-safe dish until steaming hot, stirring once or twice. Stir in a splash of broth or water if thick; reheat rice separately with a little water.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `fe4f34d3393ff40eabdba551` — fixture R32

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
Explanation: Remixed the seed into three distinct six-serving batch meals, using fresh grated ginger in place of ground ginger throughout.

Dish 1: Fresh Ginger Turkey Tomato Pot
Servings: 6 | Style: STEW_BRAISE | Appliance: Large stovetop Dutch oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, finely grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Cheddar cheese, grated | ID: cheddar-cheese | Quantity: 3 oz | Optional: True
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat. Add turkey and break it up; cook until no longer pink, about 7–9 minutes.
2. Stir in onions and cook until softened, about 6 minutes. Add garlic and grated ginger; cook for 1 minute.
3. Add crushed tomatoes, salt, and pepper. Bring to a gentle simmer, cover partly, and cook 25–30 minutes, stirring occasionally, until thickened and the turkey is cooked through.
4. Taste and adjust seasoning. Serve as is or sprinkle individual portions with cheddar.
Reheat: Refrigerate in shallow containers. Reheat a portion covered in the microwave, stirring halfway, or warm on the stovetop with a splash of water until steaming hot; add cheese after reheating.

Dish 2: Ginger Turkey, Tomato and Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stovetop heavy-bottomed pot
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 30 oz | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, finely grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: water | Quantity: 1 cup | Optional: False
Steps:
1. Heat oil in the pot over medium-high heat. Add turkey and cook, breaking it up, until no longer pink, about 7–9 minutes.
2. Add onion and cook until softened, about 5 minutes. Stir in garlic and grated ginger for 1 minute.
3. Add chili powder, cumin, crushed tomatoes, beans, water, and salt. Stir well and bring to a boil.
4. Reduce heat and simmer uncovered for 25–30 minutes, stirring occasionally, until thick and the turkey is cooked through. Adjust seasoning to taste.
Reheat: Store in shallow containers in the refrigerator. Reheat covered in the microwave, stirring once, or gently on the stovetop; add a little water if the chili has thickened.

Dish 3: Ginger Turkey Tomato and Cheddar Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and 9-by-13-inch baking dish
Prep: 20 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, finely grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, grated | ID: cheddar-cheese | Quantity: 6 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 375°F (190°C). Lightly oil a 9-by-13-inch baking dish.
2. In a large skillet, heat olive oil over medium-high heat. Cook turkey, breaking it up, until no longer pink, about 7–9 minutes.
3. Add onion and cook until softened, about 5 minutes. Stir in garlic and grated ginger for 1 minute, then add crushed tomatoes, salt, and pepper. Simmer 8 minutes.
4. Transfer the mixture to the baking dish, cover with foil, and bake for 20 minutes. Uncover, scatter cheddar over the top, and bake 10–12 minutes more, until bubbling and hot throughout.
Reheat: Cool and refrigerate in individual portions. Microwave covered, stirring or rotating midway, until steaming hot; alternatively reheat covered in a 350°F (175°C) oven until hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `feb6d55d4b7caef306b92c65` — fixture R23

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R23",
  "category": "cost",
  "task": "generate",
  "prompt": "Use only the provided synthetic price for turkey. Do not extend it to chicken or an unspecified store.",
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
        "packageQuantity": 1,
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
      "distinct_dishes"
    ],
    "reviewNotes": [
      "Use only the provided synthetic price for turkey. Do not extend it to chicken or an unspecified store."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: The supplied turkey offer is specific to Safeway; other prices are unknown.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion, mince the garlic, and drain and rinse the beans.
2. Heat oil in a large pot. Cook onion for 5 minutes, then add garlic and turkey. Break up and cook until turkey reaches 165°F.
3. Stir in spices, salt, tomatoes, beans and water. Simmer uncovered for 20 minutes, stirring occasionally.
Reheat: Reheat portions until 165°F, adding a splash of water if needed.

Dish 2: Turkey, Zucchini and Pasta Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Stovetop and oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Dry pasta | ID: pasta-dry | Quantity: 12 oz | Optional: False
- Fresh zucchini | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Low-moisture mozzarella cheese | ID: mozzarella-low-moisture | Quantity: 6 oz | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oven to 375°F. Cook pasta until just shy of tender; drain. Dice zucchini and mince garlic.
2. Heat oil in a large skillet. Cook turkey, breaking it up, until it reaches 165°F. Add zucchini and garlic and cook for 5 minutes.
3. Mix in tomatoes, seasoning, salt and pasta. Transfer to a baking dish, top with shredded mozzarella and bake for 20 minutes until bubbling.
Reheat: Microwave a covered portion until 165°F; add a little water if dry.

Dish 3: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 1.5 cups | Optional: False
- Water for rice | ID: None | Quantity: 3 cups | Optional: False
Steps:
1. Cook rice with water according to package directions. Dice onion, mince garlic, and drain and rinse chickpeas.
2. Heat oil in a large skillet. Cook onion for 5 minutes, then add garlic and curry powder and stir for 1 minute.
3. Add chickpeas, coconut milk and salt. Simmer for 15 minutes, then stir in spinach until wilted. Serve with rice.
Reheat: Cool and refrigerate rice and curry promptly. Reheat portions until 165°F, adding a little water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `fffe72a7efa0a5f3300559a8` — fixture R33

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
Explanation: Three four-serving sheet-pan meals. Pantry availability does not confirm quantities; purchase any shortfall.

Dish 1: Garlic chicken, potatoes and broccoli
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Oven and two rimmed sheet pans
Prep: 15 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.5 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 1 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F. Cut potatoes into 1-inch pieces, broccoli into florets, and mince garlic.
2. Toss potatoes with 1 tablespoon oil and a little salt. Spread on one pan and roast for 15 minutes.
3. Toss broccoli with 1 tablespoon oil. Coat chicken with remaining oil, garlic, remaining salt and pepper. Place chicken and broccoli on the second pan.
4. Roast both pans for 20 minutes more, until potatoes are tender and chicken reaches 165°F. Divide into four portions.
Reheat: Refrigerate portions within 2 hours. Reheat covered in the microwave until the chicken and vegetables reach 165°F, stirring or rotating as needed.

Dish 2: Smoky sausage, sweet potato and peppers
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Oven and two rimmed sheet pans
Prep: 15 min | Cook: 35 min
Ingredients:
- Fully cooked kielbasa | ID: kielbasa-fully-cooked | Quantity: 1 lb | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 3 medium | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F. Cut sweet potatoes into 1-inch cubes, peppers and onion into chunks, and kielbasa into thick slices.
2. Toss sweet potatoes with half the oil, paprika and salt. Spread on one pan and roast for 15 minutes.
3. Toss peppers and onion with remaining oil, then spread on the second pan with the kielbasa.
4. Roast both pans for another 20 minutes, stirring once, until the sweet potatoes are tender and sausage is hot. Divide into four portions.
Reheat: Refrigerate portions within 2 hours. Microwave covered, stirring halfway, until heated throughout to 165°F.

Dish 3: Lemon chickpea and zucchini tray bake
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Oven and two rimmed sheet pans
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Fresh zucchini | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Fresh tomatoes | ID: tomatoes-fresh | Quantity: 4 medium | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.75 tsp | Optional: False
- Lemon | ID: lemon-fresh | Quantity: 1 medium | Optional: False
- Feta | ID: feta-cheese | Quantity: 4 oz | Optional: False
Steps:
1. Heat oven to 425°F. Drain and rinse chickpeas. Cut zucchini, tomatoes and onion into bite-size pieces; mince garlic.
2. Toss chickpeas and vegetables with oil, garlic, oregano and salt. Spread across two sheet pans.
3. Roast for 25–30 minutes, stirring once, until vegetables are tender and chickpeas are hot.
4. Squeeze lemon over the trays, crumble feta on top and divide into four portions.
Reheat: Refrigerate portions within 2 hours. Microwave covered, stirring halfway, until heated throughout to 165°F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

# Blinded recipe review — batch 17

[Review instructions](../REVIEWING.md) · [All batches](../README.md) · [Compact grading sheet](../grades.json)

All grading fields are blank. Schema status below is an automatic format check, not a dietary or quality grade.

## Review `d186df1fd4608c13ccc4796f` — fixture R14

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
Explanation: The pantry mystery blend remains unidentified, with no catalog ID or known price. Use it only after verifying its contents and preparation instructions; otherwise omit it.

Dish 1: Tomato and White Bean Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Canned cannellini beans, drained | ID: cannellini-beans-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 1 teaspoon | Optional: False
- pantry mystery blend | ID: None | Quantity: 1 package serving | Optional: True
Steps:
1. Heat oil in the Dutch oven. Cook onion and carrots for 7 minutes; add garlic and cook 1 minute.
2. Add beans, tomatoes, broth and oregano. Simmer for 20 minutes, until the carrots are tender.
3. If the mystery blend is identified as safe and suitable for this dish, add a package serving according to its instructions; otherwise omit it. Divide into six portions.
Reheat: Reheat until steaming hot on the stovetop or in the microwave, adding a splash of water if needed.

Dish 2: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop large pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Ground turkey | ID: ground-turkey | Quantity: 1.5 pounds | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
- pantry mystery blend | ID: None | Quantity: 1 package serving | Optional: True
Steps:
1. Heat oil in the pot. Brown turkey, breaking it up, then add onion and peppers and cook for 5 minutes.
2. Add garlic and chili powder; stir for 1 minute. Add beans, tomatoes and water.
3. Simmer for 20–25 minutes, until the vegetables are tender and turkey reaches 165°F.
4. If the mystery blend is identified as safe and suitable, add a package serving according to its instructions; otherwise omit it. Divide into six portions.
Reheat: Reheat to 165°F, stirring and adding a little water if the chili has thickened.

Dish 3: Chickpea and Sweet Potato Coconut Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Sweet potatoes, diced small | ID: sweet-potatoes | Quantity: 2 pounds | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- pantry mystery blend | ID: None | Quantity: 1 package serving | Optional: True
Steps:
1. Heat oil in the skillet and cook onion for 5 minutes. Add garlic and curry powder and stir for 1 minute.
2. Add sweet potatoes, chickpeas and coconut milk. Cover and simmer for 20–25 minutes, stirring occasionally, until the potatoes are tender.
3. Stir in spinach until wilted. If the mystery blend is identified as safe and suitable, add a package serving according to its instructions; otherwise omit it. Divide into six portions.
Reheat: Reheat gently until steaming hot, stirring in a splash of water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d1a6b99d86aa1b6db4ac31bc` — fixture R06

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
Explanation: Generated three distinct, tree-nut-free and dairy-free batch meal recipes optimized for re-heating.

Dish 1: Hearty Black Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 medium | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 ounce | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cup | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoon | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in a large pot over medium heat.
2. Add diced onions and minced garlic, sautéing until soft and translucent.
3. Add cubed sweet potatoes, chili powder, and cumin, stirring for 2 minutes.
4. Pour in black beans, crushed tomatoes, and vegetable broth.
5. Bring to a boil, then reduce heat, cover, and simmer for 30 minutes until sweet potatoes are tender.
6. Season with salt before serving.
Reheat: Reheat on the stovetop over medium-low heat with a splash of vegetable broth if it has thickened too much.

Dish 2: Classic Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 20 min | Cook: 90 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 pound | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Fresh Russet potatoes | ID: russet-potatoes-fresh | Quantity: 3 medium | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cup | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoon | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in a Dutch oven over medium-high heat and brown the beef stew meat in batches.
2. Remove beef, add diced onions, and cook until translucent. Stir in minced garlic and tomato paste.
3. Return beef to the Dutch oven and pour in beef broth.
4. Add chopped carrots, cubed potatoes, and dried thyme.
5. Bring to a boil, then reduce heat to low, cover, and simmer for 1.5 hours until the beef is fork-tender.
6. Season with salt to taste.
Reheat: Reheat gently covered on the stovetop or in the oven at 350°F until warmed through, adding water if needed.

Dish 3: Coconut Chickpea and Spinach Curry Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large Skillet
Prep: 10 min | Cook: 25 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoon | Optional: False
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 can | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounce | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in a large skillet over medium heat.
2. Add diced onions and sauté until soft, then stir in minced garlic and grated ginger.
3. Sprinkle in the curry powder and cook for 1 minute until fragrant.
4. Add rinsed chickpeas and canned coconut milk, stirring to combine.
5. Simmer uncovered for 15 minutes until the sauce thickens slightly.
6. Fold in the fresh spinach until wilted and season with salt.
Reheat: Reheat in a skillet over medium-low heat, stirring occasionally. Add a splash of water if the sauce is too thick.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d21d7b3dd8ca2563c3fff978` — fixture R09

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
Explanation: Generated three distinct reheatable batch meals tailored for six servings each.

Dish 1: Hearty Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2.5 pounds | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 3 pounds | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Salt | ID: salt | Quantity: 1.5 teaspoons | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 teaspoon | Optional: False
Steps:
1. Cut the beef stew meat into bite-sized pieces and season with salt and black pepper.
2. Heat olive oil in a large Dutch oven over medium-high heat and brown the beef on all sides.
3. Add chopped onions, sliced carrots, and cubed potatoes to the pot.
4. Pour in the beef broth and bring the mixture to a boil.
5. Reduce heat to low, cover, and simmer for 2 hours until the beef is tender and vegetables are soft.
Reheat: Reheat on the stovetop over medium-low heat until warmed through, adding a splash of water if the sauce has thickened too much.

Dish 2: Classic Three-Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground beef | ID: ground-beef-80-20 | Quantity: 2 pounds | Optional: False
- Canned kidney beans | ID: kidney-beans-canned | Quantity: 2 cans | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 3 cups | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. In a large pot, cook the ground beef and diced onions over medium heat until the meat is fully browned.
2. Mince the garlic and add it to the pot along with chili powder and cumin, stirring for 1 minute.
3. Pour in the canned crushed tomatoes, drained kidney beans, and drained black beans.
4. Add salt and stir everything together.
5. Simmer uncovered on low heat for 45 minutes to let the flavors blend.
Reheat: Reheat in a covered pot on the stove over medium-low heat, stirring occasionally until hot.

Dish 3: Cheesy Potato Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 50 min
Ingredients:
- Fresh Russet potatoes | ID: russet-potatoes-fresh | Quantity: 4 pounds | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 cups | Optional: False
- Butter | ID: butter-salted-unsalted | Quantity: 0.5 cups | Optional: False
- Whole milk (3.25%) | ID: milk-whole | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Preheat your oven to 375 degrees Fahrenheit (190 degrees Celsius).
2. Peel and thinly slice the Russet potatoes.
3. In a saucepan, melt the butter, stir in the milk, salt, and black pepper.
4. Layer half of the sliced potatoes in a greased baking dish, pour half the milk mixture over them, and sprinkle with half the cheddar cheese.
5. Repeat with the remaining potatoes, milk mixture, and top with the rest of the cheese.
6. Bake covered with foil for 35 minutes, then remove foil and bake for another 15 minutes until golden brown and bubbly.
Reheat: Cover with foil and reheat in a 350-degree oven for 20 minutes until heated through.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d308b2642a5495e9fa007774` — fixture R19

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
Explanation: Generated three batch meals utilizing raw andouille sausage with explicit cooking steps.

Dish 1: Andouille and White Bean Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 pounds | Optional: False
- Canned Great Northern beans | ID: great-northern-beans-canned | Quantity: 3 cans | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
Steps:
1. Slice the raw andouille sausage into half-inch rounds.
2. Heat olive oil in a Dutch oven over medium heat and add the raw andouille slices, cooking until browned on both sides and fully cooked through.
3. Remove the andouille with a slotted spoon and set aside.
4. In the remaining fat, sauté diced onions, sliced carrots, and chopped celery until tender.
5. Add minced garlic and cook for one minute until fragrant.
6. Pour in chicken broth and rinsed Great Northern beans, scraping up any browned bits from the bottom of the pot.
7. Return the cooked andouille to the pot, bring to a simmer, and cook for 25 minutes so flavors meld.
8. Serve warm.
Reheat: Reheat gently on the stovetop over medium-low heat with a splash of chicken broth to loosen the stew.

Dish 2: Andouille and Pepper Skillet Rice
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large skillet
Prep: 15 min | Cook: 30 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 pounds | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3.5 cups | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Avocado oil | ID: avocado-oil | Quantity: 1 tablespoon | Optional: False
Steps:
1. Chop the raw andouille sausage into bite-sized pieces.
2. Heat avocado oil in a large skillet over medium-high heat and add the raw andouille pieces, cooking until completely browned and fully cooked through.
3. Remove the andouille and set aside.
4. In the same skillet, add diced onions and sliced bell peppers, cooking until softened.
5. Add minced garlic and dry basmati rice, stirring for two minutes to toast the grains slightly.
6. Pour in the chicken broth and return the cooked andouille to the skillet.
7. Bring to a boil, then cover, reduce heat to low, and simmer for 20 minutes until the rice is tender and liquid is absorbed.
8. Fluff with a fork before serving.
Reheat: Cover and microwave in a microwave-safe dish for 2 minutes, stirring halfway through, or reheat covered in a skillet over low heat.

Dish 3: Andouille and Potato Bake Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 50 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 pounds | Optional: False
- Fresh Yukon Gold potatoes | ID: yukon-gold-potatoes-fresh | Quantity: 2.5 pounds | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 1.5 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Preheat your oven to 375 degrees Fahrenheit.
2. Cut the raw andouille sausage into coin slices and dice the Yukon Gold potatoes into bite-sized cubes.
3. Slice the onions and bell peppers into thin strips.
4. In a skillet over medium heat, cook the raw andouille slices until browned and fully cooked through. Remove and set aside.
5. In a large bowl, toss the cubed potatoes, onions, and bell peppers with olive oil, salt, and black pepper.
6. Spread the vegetable mixture in a large baking dish along with the cooked andouille.
7. Cover the dish with foil and bake at 375 degrees Fahrenheit for 35 minutes until potatoes are tender.
8. Remove foil, sprinkle shredded cheddar cheese over the top, and bake uncovered for another 15 minutes until bubbly and golden brown.
Reheat: Reheat individual portions in the microwave or warm the whole casserole covered in a 350-degree oven for 15 minutes.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d3b3e471d5dd2e021052d50e` — fixture R01

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
Explanation: Three six-serving batch meals use gluten-free ingredients and avoid ordinary soy sauce, wheat flour, and broth whose gluten-free status is unspecified. Check packaged spices and other processed ingredients for gluten-free labeling.

Dish 1: Slow-Cooker Beef, Potato, and Carrot Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Fresh potatoes, cut into chunks | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Water | ID: water | Quantity: 3 cups | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
- Cornstarch | ID: cornstarch | Quantity: 2 tablespoons | Optional: True
- Cold water for slurry | ID: water | Quantity: 2 tablespoons | Optional: True
Steps:
1. Add beef, potatoes, carrots, onion, garlic, tomato paste, olive oil, water, bay leaves, thyme, salt, and pepper to the slow cooker; stir to combine.
2. Cover and cook on low for about 7 hours, until the beef is tender and vegetables are cooked through.
3. For a thicker stew, mix the optional cornstarch with the cold water until smooth. Stir into the stew, cover, and cook on high for 10–15 minutes. Remove bay leaves before serving.
Reheat: Refrigerate in shallow portions within 2 hours. Reheat a portion covered on the stove over medium-low heat or in the microwave, stirring once, until steaming hot; add a splash of water if needed.

Dish 2: Black Bean and Turkey Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 5-quart Dutch oven on stovetop
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Bell peppers, chopped | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Water | ID: water | Quantity: 1 cup | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Lime juice | ID: lime-juice | Quantity: 1 tablespoon | Optional: True
Steps:
1. Heat olive oil in the Dutch oven over medium heat. Add turkey and cook, breaking it up, until no longer pink, about 6–8 minutes.
2. Add onion and bell peppers; cook 5 minutes. Stir in garlic, chili powder, cumin, smoked paprika, and salt for 30 seconds.
3. Add crushed tomatoes, drained beans, and water. Bring to a gentle boil, then lower heat and simmer uncovered for 25–30 minutes, stirring occasionally. Stir in optional lime juice before serving.
Reheat: Cool and refrigerate in meal-size containers. Reheat on the stovetop over medium-low heat or in the microwave, stirring occasionally, until bubbling hot; loosen with a little water if the chili thickens.

Dish 3: Coconut Chickpea and Spinach Curry with Rice
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large lidded skillet and medium saucepan on stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 13.5-ounce can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 ounces | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Water | ID: water | Quantity: 0.5 cup | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Ground turmeric | ID: turmeric-ground | Quantity: 0.5 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water for rice | ID: water | Quantity: 3 cups | Optional: False
Steps:
1. Rinse rice. In a saucepan, combine rice with 3 cups water and a pinch of the measured salt. Bring to a boil, cover, reduce heat to low, and cook according to package directions, usually 15–18 minutes. Rest covered for 5 minutes, then fluff.
2. Meanwhile, heat olive oil in a large lidded skillet over medium heat. Cook onion for 5 minutes, then add garlic, ginger, curry powder, and turmeric; stir for 30 seconds.
3. Add chickpeas, coconut milk, 1/2 cup water, and remaining salt. Bring to a gentle simmer, cover, and cook for 15 minutes, stirring once or twice.
4. Stir in spinach in handfuls and cook uncovered until wilted, about 2–3 minutes. Serve over rice.
Reheat: Store curry and rice separately in shallow containers. Reheat each covered in the microwave or on the stovetop until steaming hot; stir the curry and add a splash of water to it if the sauce has thickened.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d3c096a142acab13a8765109` — fixture R23

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
Explanation: Generated 3 reheatable batch meals utilizing ground turkey, garlic, and olive oil.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in a large pot over medium heat.
2. Add diced onions and minced garlic, sautéing until translucent.
3. Add ground turkey and cook until thoroughly browned.
4. Stir in chili powder, cumin, and salt.
5. Pour in crushed tomatoes and rinsed black beans, bringing the mixture to a simmer.
6. Cover and simmer on low heat for 35 minutes, stirring occasionally.
Reheat: Reheat on the stovetop over medium-low heat with a splash of water or broth to loosen.

Dish 2: Turkey and Vegetable Skillet Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Skillet
Prep: 15 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in a large skillet over medium-high heat.
2. Add minced garlic and sliced carrots, cooking for 3 minutes.
3. Add ground turkey, breaking it up with a spoon, and cook until browned.
4. Sprinkle curry powder and salt over the mixture, stirring well.
5. Pour in the canned coconut milk and bring to a gentle simmer.
6. Stir in fresh spinach until wilted and cook for another 5 minutes.
Reheat: Warm gently in a covered skillet over medium-low heat, stirring occasionally.

Dish 3: Turkey and Quinoa Casserole Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Dry quinoa | ID: quinoa-dry | Quantity: 1.5 cup | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cup | Optional: False
- Fresh zucchini | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat oven to 375 degrees Fahrenheit.
2. Heat olive oil in a skillet, sauté minced garlic and diced zucchini for 4 minutes.
3. Add ground turkey and cook until fully browned, seasoning with Italian seasoning and salt.
4. In a baking dish, combine uncooked quinoa, chicken broth, and the cooked turkey-vegetable mixture.
5. Cover tightly with foil and bake for 35 to 40 minutes until quinoa is tender and liquid is absorbed.
Reheat: Cover with a damp paper towel and microwave individual portions, or reheat covered in the oven at 350 degrees Fahrenheit.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d3fcb12ce1156812852d1de4` — fixture R28

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
Explanation: Remixed the batch plan into three distinct dairy-free meals, keeping the turkey-and-tomato base in one dish and replacing the cheese finish with herbs and spices. Each recipe serves six and is designed for practical batch cooking and reheating.

Dish 1: Dairy-Free Turkey Tomato and Bean Pot
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Dutch oven on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 30 oz | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Water | ID: water | Quantity: 1 cup | Optional: False
Steps:
1. Heat oil in a large Dutch oven over medium heat. Add onion and cook until softened, about 6 minutes.
2. Add garlic and turkey. Break the turkey into small pieces and cook until no pink remains, about 8 minutes.
3. Stir in crushed tomatoes, beans, cumin, chili powder, ginger, salt, pepper, and water.
4. Bring to a gentle simmer, cover partially, and cook for 25 minutes, stirring occasionally. Check that the turkey is fully cooked and adjust seasoning before portioning.
Reheat: Refrigerate promptly in shallow portions. Reheat a portion on the stovetop over medium-low heat or in the microwave, stirring halfway through; add a splash of water if thick.

Dish 2: Turkey, Tomato and Vegetable Barley Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 360 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery, diced | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Pearled barley, rinsed | ID: barley-pearled | Quantity: 1 cup | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oil in a skillet over medium heat. Cook the turkey, breaking it up, until no pink remains, about 8 minutes; transfer to the slow cooker.
2. Add onion, garlic, carrots, celery, crushed tomatoes, barley, broth, Italian seasoning, salt, and pepper. Stir to combine.
3. Cover and cook on low for 6 hours, until the barley and vegetables are tender. Stir before serving; add a little hot water or broth if the stew is thicker than desired.
Reheat: Cool and refrigerate in meal-size containers. Reheat on the stovetop or in the microwave until steaming hot, stirring well; loosen with water or broth as barley absorbs liquid.

Dish 3: Turkey and Tomato Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep skillet with lid
Prep: 15 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 15 oz | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water for rice | ID: water | Quantity: 3 cups | Optional: False
Steps:
1. Cook the rice with 3 cups water according to package directions; keep covered until serving.
2. Meanwhile, heat oil in a large deep skillet over medium heat. Add onions and cook until softened, about 6 minutes. Add garlic and curry powder and stir for 30 seconds.
3. Add turkey and cumin. Cook, breaking the meat into small pieces, until no pink remains, about 8 minutes.
4. Stir in tomatoes, coconut milk, chickpeas, and salt. Bring to a gentle simmer, cover, and cook for 18 minutes, stirring occasionally. Serve over rice or portion rice separately for storage.
Reheat: For best texture, store rice separately from the curry. Reheat both until steaming hot; stir a tablespoon or two of water into the rice and add a splash of water to the curry if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d4934c499e7e66c0098c0ec2` — fixture R30

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
Explanation: Three slow-cooker or Instant Pot batch dishes remixed from the seed for 6 servings. All methods use only the pot, with no oven required. No offers were supplied, so no prices are stated. Garlic is marked as pantry-available, but its quantity is not confirmed.

Dish 1: Slow Cooker Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Slow cooker or Instant Pot (slow cook mode)
Prep: 20 min | Cook: 420 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Shredded cheddar cheese, for topping | ID: cheddar-cheese | Quantity: 3 oz | Optional: True
Steps:
1. Heat olive oil in a skillet on the stovetop, brown the turkey, and drain excess fat.
2. Add onion and garlic to the skillet and cook 3 minutes until softened.
3. Transfer the turkey and onion mixture to the slow cooker or Instant Pot insert.
4. Add crushed tomatoes, black beans, chili powder, cumin, and salt, then stir well.
5. Cook on low for 7 hours or high for 4 hours in the slow cooker, or use slow cook mode on the Instant Pot.
6. Stir before serving and top with cheddar if using.
Reheat: Refrigerate for up to 4 days or freeze for up to 3 months. Reheat in a covered pot on the stovetop or in the microwave, adding a splash of water if thick.

Dish 2: Slow Cooker Chicken White Bean Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Slow cooker or Instant Pot (slow cook mode)
Prep: 15 min | Cook: 360 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Canned cannellini beans, drained | ID: cannellini-beans-canned | Quantity: 30 oz | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 3 stalk | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 8 oz | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 32 oz | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Place chicken thighs, carrots, celery, onion, and garlic in the slow cooker or Instant Pot insert.
2. Add cannellini beans, chicken broth, thyme, pepper, and salt.
3. Cook on low for 6 hours or high for 3 hours in the slow cooker, or use slow cook mode on the Instant Pot.
4. Shred the chicken with two forks and stir it back into the stew before serving.
Reheat: Refrigerate for up to 4 days or freeze for up to 3 months. Reheat gently on the stovetop, adding broth or water if the beans have thickened.

Dish 3: Slow Cooker Beef and Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Slow cooker or Instant Pot (slow cook mode)
Prep: 25 min | Cook: 480 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Russet potatoes, cubed | ID: russet-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 8 oz | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 32 oz | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Dried rosemary | ID: rosemary-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Optional: heat olive oil in a skillet on the stovetop and sear the beef in batches for 2 to 3 minutes per side.
2. Place beef, potatoes, carrots, onion, and garlic in the slow cooker or Instant Pot insert.
3. Whisk tomato paste into the beef broth, then pour over the ingredients.
4. Add bay leaf, rosemary, salt, and pepper.
5. Cook on low for 8 hours or high for 4 hours in the slow cooker, or use slow cook mode on the Instant Pot.
6. Remove the bay leaf before serving.
Reheat: Refrigerate for up to 4 days or freeze for up to 3 months. Reheat in a covered pot on the stovetop over medium-low heat, stirring occasionally.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d4d5e756e094430d7492deb5` — fixture R21

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
Explanation: Three batch meals for six; no current prices or savings are stated because no offers were supplied.

Dish 1: Tomato Beef and Barley Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 1 cup | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium, sliced | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks, sliced | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large, diced | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves, minced | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 14.5 oz can | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Brown the beef in olive oil in a skillet over medium-high heat, working in batches if needed; transfer to the slow cooker.
2. Add carrots, celery, onion, garlic, barley, crushed tomatoes, broth, thyme, bay leaf, salt, and pepper. Stir.
3. Cover and cook on LOW for about 7 hours, until the beef is tender and barley is cooked. Remove the bay leaf and adjust seasoning.
4. Cool promptly and refrigerate in shallow containers. Reheat portions covered on the stovetop or in a microwave until steaming hot; add a splash of broth if the stew thickens.
Reheat: Reheat gently with a splash of broth, stirring occasionally; barley continues to absorb liquid during storage.

Dish 2: Turkey, Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart stovetop Dutch oven
Prep: 20 min | Cook: 50 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 2 15 oz cans | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28 oz can | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Warm the olive oil in a Dutch oven over medium heat. Add onion and bell pepper and cook 5 minutes, stirring occasionally.
2. Add garlic, chili powder, cumin, and smoked paprika; stir for 30 seconds. Add turkey and cook, breaking it up, until no longer pink.
3. Stir in sweet potatoes, beans, crushed tomatoes, broth, salt, and pepper. Bring to a boil, then reduce to a steady simmer.
4. Cover partly and simmer 30–35 minutes, stirring occasionally, until sweet potatoes are tender and the chili has thickened. Cool promptly and refrigerate in shallow containers.
5. Reheat on the stovetop over medium-low heat or in a microwave, stirring occasionally, until steaming hot.
Reheat: Reheat covered with a small splash of broth or water if needed; stir well so the sweet potatoes warm evenly.

Dish 3: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep lidded skillet
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15 oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5 oz cans | Optional: False
- Fresh tomatoes, diced | ID: tomatoes-fresh | Quantity: 4 medium | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 oz | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water | ID: water | Quantity: 3 cups | Optional: False
Steps:
1. Cook basmati rice with the water according to package directions; keep covered off the heat when done.
2. Meanwhile, heat olive oil in a deep skillet over medium heat. Cook the onion for 5 minutes until softened.
3. Stir in garlic, ginger, curry powder, and cumin for 30 seconds. Add tomatoes and cook 5 minutes, stirring until they begin to break down.
4. Add chickpeas and coconut milk. Bring to a gentle simmer, cover, and cook 15 minutes, stirring once or twice.
5. Stir in spinach in batches and cook until wilted. Season with salt. Cool promptly; refrigerate curry and rice separately in shallow containers.
6. Reheat curry in a covered skillet over medium-low heat, stirring until steaming hot. Reheat rice separately with a spoonful of water, covered, until steaming hot.
Reheat: Store rice separately from the curry; add a spoonful of water before reheating rice covered so it stays moist.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d4e9998f2855a0482feec1ed` — fixture R14

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
Explanation: Generated three distinct batch meal dishes utilizing the available pantry staples and incorporating the custom pantry mystery blend as an unresolved ingredient.

Dish 1: Garlic Olive Oil Braised Chicken and Vegetables
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 2 pounds | Optional: False
- Olive oil | ID: olive-oil | Quantity: 0.25 cup | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 6 cloves | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 3 medium | Optional: False
- pantry mystery blend | ID: None | Quantity: 1 tablespoon | Optional: True
Steps:
1. Preheat the Dutch oven over medium heat and add olive oil.
2. Brown the chicken breasts on both sides, then remove and set aside.
3. Sauté minced garlic, chopped carrots, and cubed potatoes in the remaining oil.
4. Return chicken to the pot, sprinkle with mystery blend if desired, cover, and simmer for 35 minutes until vegetables are tender and chicken is cooked through.
Reheat: Reheat covered in a 350F oven or gently on the stovetop with a splash of water to keep the chicken moist.

Dish 2: Garlic Olive Oil White Bean and Kale Soup
Servings: 6 | Style: CHILI_SOUP | Appliance: Soup Pot
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 3 cans | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh kale | ID: kale-fresh | Quantity: 4 cups | Optional: False
- pantry mystery blend | ID: None | Quantity: 1 teaspoon | Optional: True
Steps:
1. Heat olive oil in a large soup pot over medium heat.
2. Sauté minced garlic until fragrant, about 1 minute.
3. Add vegetable broth and rinsed cannellini beans, bringing the mixture to a simmer.
4. Stir in chopped kale and mystery blend, cooking for 10 more minutes until greens are tender.
Reheat: Simmer gently on the stovetop over medium-low heat until heated through, stirring occasionally.

Dish 3: Garlic Olive Oil Potato and Cheese Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Fresh potatoes | ID: potatoes-fresh | Quantity: 4 pounds | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Whole milk (3.25%) | ID: milk-whole | Quantity: 1 cup | Optional: False
- pantry mystery blend | ID: None | Quantity: 1 teaspoon | Optional: True
Steps:
1. Preheat oven to 375F and grease a 9x13 inch baking dish with olive oil.
2. Thinly slice the potatoes and mince the garlic.
3. Layer half the potatoes in the dish, drizzle with garlic infused olive oil and milk, and sprinkle with half the cheese.
4. Repeat layers with remaining potatoes, milk, cheese, and top with mystery blend.
5. Bake uncovered for 45 minutes until potatoes are fork-tender and the cheese is golden and bubbly.
Reheat: Cover with foil and bake at 350F for 20 minutes until heated thoroughly.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d52fae799658f1fb2b5d8360` — fixture R15

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
Explanation: Generated three distinct batch meal recipes incorporating dried chickpeas as specified without canned shortcut times, tailored for 6 servings.

Dish 1: Spiced Chickpea and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stove
Prep: 15 min | Cook: 90 min
Ingredients:
- Dried chickpeas | ID: chickpeas-dried | Quantity: 2 cups | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Soak the dried chickpeas in water for at least 8 hours, then drain.
2. Heat olive oil in a heavy-bottomed pot over medium heat, add diced onions and minced garlic, and sauté until translucent.
3. Add chopped carrots, soaked and drained dried chickpeas, ground cumin, and vegetable broth.
4. Bring the stew to a boil, then reduce heat to low, cover, and simmer for 75 to 90 minutes until the dried chickpeas are fully tender.
5. Season with salt before serving or storing.
Reheat: Reheat on the stovetop over medium-low heat with a splash of water or vegetable broth to restore consistency.

Dish 2: Hearty Chickpea Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stove
Prep: 20 min | Cook: 100 min
Ingredients:
- Dried chickpeas | ID: chickpeas-dried | Quantity: 2 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 ounces | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Soak the dried chickpeas overnight, then drain thoroughly.
2. Heat olive oil in a large pot over medium heat and sauté chopped onions and minced garlic until soft.
3. Stir in the chili powder and cook for 1 minute until fragrant.
4. Add the drained dried chickpeas, crushed tomatoes, and vegetable broth.
5. Bring to a boil, reduce heat to low, cover, and simmer for 90 to 100 minutes until the dried chickpeas are tender.
6. Season with salt and adjust spices as needed.
Reheat: Warm gently in a covered pot over medium heat, stirring occasionally. Add broth if the chili has thickened too much in storage.

Dish 3: Chickpea and Tomato Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 110 min
Ingredients:
- Dried chickpeas | ID: chickpeas-dried | Quantity: 2 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 ounces | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tablespoons | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tablespoon | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Soak the dried chickpeas in water for 8 hours and drain.
2. Preheat the oven to 375°F (190°C).
3. In an oven-safe casserole dish, combine the soaked dried chickpeas, chopped onions, minced garlic, olive oil, Italian seasoning, crushed tomatoes, vegetable broth, and salt.
4. Cover the dish tightly with a lid or heavy foil.
5. Bake in the preheated oven for 90 to 110 minutes, stirring halfway through, until the dried chickpeas are tender and the sauce is rich.
6. Uncover for the last 15 minutes of baking if a thicker consistency is desired.
Reheat: Reheat covered in the oven at 350°F for 20-25 minutes until heated through.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d6105dd9b3d1640ead092645` — fixture R22

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R22",
  "category": "cost",
  "task": "generate",
  "prompt": "Some ingredients have no price. Keep the cost incomplete rather than calling missing prices zero.",
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
      "distinct_dishes",
      "incomplete_cost_is_not_zero"
    ],
    "reviewNotes": [
      "Some ingredients have no price. Keep the cost incomplete rather than calling missing prices zero."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three reheatable six-serving batch meals. No prices are stated; missing prices remain unknown.

Dish 1: Red Lentil and Spinach Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large 5-quart Dutch oven on stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Ground turmeric | ID: turmeric-ground | Quantity: 1 teaspoon | Optional: False
- Dried red lentils, rinsed | ID: red-lentils-dried | Quantity: 2 cups | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can (13.5 oz) | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Warm the oil in the Dutch oven over medium heat. Add onion and cook until softened, about 5 minutes.
2. Stir in garlic, ginger, curry powder, and turmeric; cook 30 seconds.
3. Add lentils, coconut milk, broth, tomatoes, and salt. Bring to a boil, then cover partly and simmer gently for 20–25 minutes, stirring occasionally, until lentils are tender.
4. Stir in spinach until wilted. Cool promptly and divide into six portions.
Reheat: Reheat covered on the stovetop over medium-low heat or in the microwave, stirring partway through. Add a splash of water or broth if thick.

Dish 2: Chicken, Potato, and Carrot Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 240 min
Ingredients:
- Boneless skinless chicken thighs, cut into chunks | ID: chicken-thighs-boneless | Quantity: 2.5 pounds | Optional: False
- Fresh potatoes, cubed | ID: potatoes-fresh | Quantity: 1.5 pounds | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Put potatoes, carrots, celery, and onion in the slow cooker. Add chicken on top.
2. Whisk broth with tomato paste, garlic, thyme, salt, and pepper; pour over the chicken and vegetables. Add the bay leaf.
3. Cover and cook on low for about 4 hours, until chicken is cooked through and vegetables are tender. Remove bay leaf and stir.
4. Cool promptly and divide into six portions.
Reheat: Reheat a portion covered in the microwave, stirring once, or warm gently in a saucepan until steaming hot. Add a little broth if needed.

Dish 3: Smoky Turkey, Black Bean, and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart stovetop stockpot
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 pounds | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 1.5 pounds | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 cans (15 oz each) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat oil in the stockpot over medium heat. Add onion and cook for 4–5 minutes. Add garlic and cook for 30 seconds.
2. Add turkey and cook, breaking it up with a spoon, until no longer pink, about 6–8 minutes.
3. Stir in sweet potatoes, beans, tomatoes, broth, chili powder, cumin, smoked paprika, and salt. Bring to a boil.
4. Reduce heat, cover, and simmer for 25–30 minutes, stirring occasionally, until sweet potatoes are tender. Cool promptly and divide into six portions.
Reheat: Reheat covered in the microwave, stirring halfway through, or gently in a saucepan. Thin with a splash of broth or water if desired.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d695da54e33c2b616d48d54e` — fixture R20

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
Explanation: Three salmon batch dishes for 6 servings using the generic raw salmon fillet catalog item only, without assigning a species. Pantry availability is not treated as proof of quantity, so the full salmon amount is listed as a shopping need. No prices or savings are stated, and no dietary restrictions apply.

Dish 1: Coconut Salmon Curry with Spinach
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch deep skillet with lid
Prep: 15 min | Cook: 25 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 2.5 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 can (14 oz) | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cup | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Cook the basmati rice according to package directions and set aside.
2. Heat the olive oil in the skillet over medium heat, then cook the onion until soft, about 5 minutes.
3. Add the garlic, ginger, and curry powder and stir for 1 minute until fragrant.
4. Pour in the coconut milk and bring to a gentle simmer.
5. Cut the salmon into 2-inch pieces, season with salt, and nestle into the sauce.
6. Cover and simmer over low heat for 8 to 10 minutes, until the salmon flakes easily.
7. Fold in the spinach until wilted, then divide into portions with rice.
Reheat: Store the curry and rice separately. Reheat covered in a skillet over low heat with a splash of water for 5 to 7 minutes, stirring gently to keep the salmon intact.

Dish 2: Salmon and Potato Dill Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish and oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 2.5 lb | Optional: False
- Fresh Yukon Gold potatoes, thinly sliced | ID: yukon-gold-potatoes-fresh | Quantity: 2 lb | Optional: False
- Butter | ID: butter-salted-unsalted | Quantity: 3 tbsp | Optional: False
- All-purpose wheat flour | ID: all-purpose-flour | Quantity: 3 tbsp | Optional: False
- Whole milk (3.25%) | ID: milk-whole | Quantity: 1.5 cup | Optional: False
- Chicken eggs | ID: large-eggs-dozen | Quantity: 3 each | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 1 cup | Optional: False
- Dried dill | ID: dill-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat the oven to 375 F and grease the baking dish.
2. Layer half the sliced potatoes in the dish and season lightly with salt and pepper.
3. Arrange the raw salmon over the potatoes, season, then top with the remaining potatoes.
4. Melt the butter in a saucepan, whisk in the flour, then slowly add the milk and cook until thickened.
5. Whisk the eggs into the warm sauce, stir in the dill, and pour over the layers.
6. Top with the cheddar and bake covered for 30 minutes, then uncovered for 15 minutes until the potatoes are tender and the top is golden.
Reheat: Cool, cover, and refrigerate within two hours. Reheat individual portions in a microwave at 70 percent power for 2 to 3 minutes, or cover and warm in a 350 F oven for 15 minutes.

Dish 3: Creamy Salmon and Vegetable Chowder
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 2 lb | Optional: False
- Fresh Russet potatoes, cubed | ID: russet-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 2 stalk | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 2 medium | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cup | Optional: False
- Whole milk (3.25%) | ID: milk-whole | Quantity: 2 cup | Optional: False
- Butter | ID: butter-salted-unsalted | Quantity: 2 tbsp | Optional: False
- All-purpose wheat flour | ID: all-purpose-flour | Quantity: 2 tbsp | Optional: False
- Dried dill | ID: dill-dried | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Melt the butter in the Dutch oven over medium heat, then cook the onion, celery, and carrot for 6 minutes.
2. Stir in the flour and cook for 1 minute.
3. Add the broth and potatoes, bring to a simmer, and cook for 12 minutes until the potatoes are nearly tender.
4. Cut the salmon into bite-sized pieces, add to the pot, and simmer gently for 5 minutes until just opaque.
5. Stir in the milk, dill, salt, and pepper, and heat through without boiling.
Reheat: Refrigerate in sealed containers for up to three days. Reheat gently over medium-low heat, stirring often, and do not boil, to keep the milk smooth and the salmon tender.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d730a09e113b2c8eca9a14fa` — fixture R05

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
Explanation: Generated three gluten-free and dairy-free reheatable batch meals utilizing safe pantry ingredients and compliant pantry options.

Dish 1: Gluten-Free Sweet Potato and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 15 min | Cook: 40 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4  cloves | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 large | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 cans | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in a large pot over medium heat.
2. Add chopped onions and minced garlic, sautéing until translucent.
3. Add peeled and diced sweet potatoes, chili powder, and cumin, stirring for 2 minutes.
4. Pour in crushed tomatoes and rinsed black beans, bringing the mixture to a boil.
5. Reduce heat, cover, and simmer for 30 minutes until the sweet potatoes are tender.
6. Season with salt to taste before cooling and storing.
Reheat: Reheat on the stovetop over medium-low heat, stirring occasionally. Add a splash of water if the chili has thickened too much in storage.

Dish 2: Hearty Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 20 min | Cook: 90 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 pounds | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Fresh Russet potatoes | ID: russet-potatoes-fresh | Quantity: 3 medium | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Brown the beef stew meat in olive oil inside a large Dutch oven over medium-high heat.
2. Add minced garlic, chopped carrots, chopped celery, and cubed potatoes.
3. Pour in the beef broth and drop in the bay leaves.
4. Bring to a boil, then reduce heat to low, cover, and simmer for 1.5 hours until the beef is fork-tender.
5. Remove bay leaves and season with salt before cooling.
Reheat: Warm gently in a covered pot on the stove over medium heat until heated through, or microwave in a covered microwave-safe dish.

Dish 3: Roasted Root Vegetable and Quinoa Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Dry quinoa | ID: quinoa-dry | Quantity: 1.5 cups | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Fresh butternut squash | ID: butternut-squash-fresh | Quantity: 3 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 4 cups | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Preheat oven to 400F (200C).
2. Toss diced butternut squash with 2 tablespoons olive oil, salt, and pepper, then roast for 25 minutes.
3. Simmer quinoa in vegetable broth for 15 minutes until fluffy.
4. Sauté minced garlic and fresh spinach in remaining olive oil until wilted.
5. Combine roasted squash, cooked quinoa, and wilted spinach in a greased baking dish, mixing thoroughly.
6. Bake the casserole at 375F (190C) for 20 minutes until piping hot throughout.
Reheat: Cover the baking dish with foil and reheat in the oven at 350F for 20 minutes, or portion individual servings into the microwave.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d8b22476e0a9d43a9dd70027` — fixture R27

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
Explanation: Scaled the recipe and variations down from 6 to 4 servings while preserving variety.

Dish 1: Turkey Tomato Batch Skillet
Servings: 4 | Style: CURRY_SKILLET | Appliance: Skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.66 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.67 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 oz | Optional: False
Steps:
1. Brown the ground turkey in a skillet over medium heat.
2. Add chopped onions, minced garlic, and ground ginger, cooking until soft.
3. Pour in the crushed tomatoes and simmer for 15 minutes.
4. Top with cheddar cheese before serving.
Reheat: Reheat in a covered skillet over medium-low heat until warmed through, stirring occasionally.

Dish 2: Turkey Tomato Stew
Servings: 4 | Style: STEW_BRAISE | Appliance: Pot
Prep: 15 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.66 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.67 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
Steps:
1. Brown ground turkey in a soup pot.
2. Stir in diced onions, minced garlic, and ginger until fragrant.
3. Add crushed tomatoes and simmer gently for 20 minutes to meld flavors.
Reheat: Simmer gently in a pot with a splash of water until hot.

Dish 3: Turkey Tomato Cheesy Bake
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 25 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.66 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.67 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 oz | Optional: False
Steps:
1. Brown turkey, onions, garlic, and ginger in a pan.
2. Mix with crushed tomatoes and transfer to a baking dish.
3. Cover with cheddar cheese and bake at 375F for 25 minutes until bubbly.
Reheat: Cover with foil and bake at 350F for 15 minutes.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d9a6eaa14b6360e3bba9d3b1` — fixture R16

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
Explanation: Three distinct six-serving reheatable batch dishes using ground coriander (coriander-ground), not fresh cilantro. Only coriander-ground is marked pantry-available; other ingredients are proposed shopping items. No prices are included.

Dish 1: Batch Beef and Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Dutch oven on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 lb | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Beef broth | ID: beef-broth | Quantity: 2 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Brown ground beef in the Dutch oven over medium-high heat, breaking it up, about 6 minutes; drain excess fat.
2. Add onions and cook 4 minutes until softened, then add garlic and cook 1 minute.
3. Stir in chili powder, cumin, and ground coriander; toast 30 seconds.
4. Add crushed tomatoes, beef broth, and salt; bring to a simmer.
5. Add drained kidney beans and simmer uncovered 35 minutes, stirring occasionally, until thickened.
6. Cool, portion into containers, and refrigerate within 2 hours.
Reheat: Reheat portions covered in a saucepan over medium heat with a splash of water, stirring until steaming hot throughout, about 5 minutes.

Dish 2: Batch Chicken and Root Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Large heavy pot on stovetop
Prep: 20 min | Cook: 50 min
Ingredients:
- Boneless skinless chicken thighs, cut into chunks | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Fresh Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat olive oil in the pot over medium-high heat and sear chicken chunks about 4 minutes; remove.
2. Cook onion 4 minutes, add garlic and cook 1 minute.
3. Add ground coriander, thyme, and bay leaves; toast 30 seconds.
4. Return chicken to pot with potatoes, carrots, chicken broth, salt, and pepper; bring to a boil.
5. Reduce heat and simmer covered 40 minutes until chicken is cooked through and vegetables are tender.
6. Remove bay leaves, cool, and refrigerate in portioned containers within 2 hours.
Reheat: Reheat covered over medium-low heat, stirring occasionally, until steaming and chicken reaches 165 F, about 10 minutes.

Dish 3: Batch Chickpea Spinach Curry Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep skillet with lid
Prep: 10 min | Cook: 25 min
Ingredients:
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 2 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in the skillet over medium heat; cook onion 5 minutes until soft.
2. Add garlic and ginger and cook 1 minute, then stir in curry powder and ground coriander for 30 seconds.
3. Add crushed tomatoes, coconut milk, chickpeas, and salt; simmer uncovered 12 minutes.
4. Stir in spinach in batches until wilted, about 2 minutes.
5. Cool, portion into containers, and refrigerate within 2 hours.
Reheat: Reheat covered in a skillet over medium heat with 2 tablespoons water, stirring until steaming hot throughout, about 6 minutes.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d9aa6121ececb2d1b840828f` — fixture R12

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R12",
  "category": "availability",
  "task": "generate",
  "prompt": "Only canned chickpeas and onions are available. You may add clearly identified shopping items.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "chickpeas-canned",
        "available": true
      },
      {
        "ingredientId": "onions-fresh",
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
      "Only canned chickpeas and onions are available. You may add clearly identified shopping items."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Chickpeas and onions are the only reported pantry items. All other ingredients are labeled shopping items; check pantry quantities before shopping.

Dish 1: Tomato Chickpea and Spinach Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 4 15-ounce cans | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Olive oil — shopping | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Garlic — shopping | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned crushed tomatoes — shopping | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth — shopping | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Smoked paprika — shopping | ID: smoked-paprika | Quantity: 2 teaspoons | Optional: False
- Fresh spinach — shopping | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Salt — shopping | ID: salt | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat the oil in a Dutch oven over medium heat. Cook the onions for 5 minutes, then add minced garlic and paprika and cook for 1 minute.
2. Add chickpeas, tomatoes, broth and salt. Simmer uncovered for 20 minutes.
3. Stir in spinach until wilted, about 2 minutes. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat until steaming hot, adding a splash of water if needed.

Dish 2: Coconut Chickpea and Sweet Potato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 4 15-ounce cans | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Sweet potatoes, diced small — shopping | ID: sweet-potatoes | Quantity: 2 pounds | Optional: False
- Canola oil — shopping | ID: canola-oil | Quantity: 1 tablespoon | Optional: False
- Curry powder — shopping | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Canned coconut milk — shopping | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Salt — shopping | ID: salt | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat oil in a deep skillet over medium heat. Cook onion for 5 minutes, then stir in curry powder for 30 seconds.
2. Add sweet potatoes, chickpeas, coconut milk and salt. Bring to a gentle simmer.
3. Cover and simmer for 20–25 minutes, stirring occasionally, until the sweet potatoes are tender. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat gently until steaming hot, loosening with a little water if necessary.

Dish 3: Smoky Chickpea and Pepper Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop large pot
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Canned black beans, drained and rinsed — shopping | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Bell peppers, diced — shopping | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Olive oil — shopping | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Chili powder — shopping | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin — shopping | ID: ground-cumin | Quantity: 1 teaspoon | Optional: False
- Canned crushed tomatoes — shopping | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth — shopping | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Salt — shopping | ID: salt | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat oil in a large pot over medium heat. Cook onions and peppers for 6–8 minutes.
2. Stir in chili powder and cumin for 30 seconds. Add chickpeas, black beans, tomatoes, broth and salt.
3. Simmer uncovered for 20 minutes, stirring occasionally. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 4 days. Reheat until steaming hot, adding a little water if the chili has thickened.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `d9b8e52e0f67753505e0f535` — fixture R38

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
Explanation: Generated three distinct batch meal recipes for 6 servings utilizing available pantry staples and the custom spice Moon dust 731.

Dish 1: Moon Dust 731 Roasted Vegetable and Chickpea Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 can | Optional: False
- Fresh butternut squash | ID: butternut-squash-fresh | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Moon dust 731 | ID: None | Quantity: 2 tablespoons | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Preheat the oven to 400 degrees F.
2. In a large baking dish, combine the drained chickpeas, diced butternut squash, and minced garlic.
3. Drizzle with olive oil and sprinkle with salt and Moon dust 731, tossing well to coat evenly.
4. Bake for 40 minutes until the squash is tender and slightly caramelized.
5. Let cool completely before storing in an airtight batch container.
Reheat: Reheat in the oven at 375 degrees F for 15 minutes or microwave individual portions until hot.

Dish 2: Moon Dust 731 Spiced Chicken and Sweet Potato Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop
Prep: 20 min | Cook: 30 min
Ingredients:
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 2 pounds | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 3 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Moon dust 731 | ID: None | Quantity: 2 tablespoons | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
Steps:
1. Dice the chicken breasts and cube the sweet potatoes into bite-sized pieces.
2. Heat olive oil in a large skillet over medium-high heat and sauté the minced garlic and chicken until browned.
3. Add the sweet potatoes, chicken broth, and Moon dust 731 to the skillet.
4. Cover and simmer over medium-low heat for 25 minutes until the sweet potatoes are fork-tender and liquid is reduced.
5. Cool and transfer to a batch storage container.
Reheat: Warm gently on the stovetop over medium-low heat, adding a splash of chicken broth if needed to restore moisture.

Dish 3: Moon Dust 731 Hearty Lentil Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Slow Cooker
Prep: 10 min | Cook: 360 min
Ingredients:
- Dried lentils | ID: lentils-dried | Quantity: 2 cups | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Moon dust 731 | ID: None | Quantity: 2.5 tablespoons | Optional: False
Steps:
1. Rinse the dried lentils thoroughly under cold water.
2. Dice the onion and mince the garlic.
3. Add olive oil, lentils, vegetable broth, diced onion, minced garlic, and Moon dust 731 to the slow cooker.
4. Cover and cook on low for 6 hours until the lentils are tender and creamy.
5. Allow to cool before packing into meal prep containers.
Reheat: Reheat in a saucepan over medium heat, stirring occasionally and splashing with a little water or broth to adjust consistency.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `da659e54ddd24c46f8692ec4` — fixture R24

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R24",
  "category": "cost",
  "task": "generate",
  "prompt": "A synthetic multi-buy offer requires three units. Do not claim the discount for a one-unit purchase.",
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
        "price": 9,
        "packageQuantity": 3,
        "unit": "lb",
        "minimumPackages": 3,
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
      "minimum_purchase_not_ignored"
    ],
    "reviewNotes": [
      "A synthetic multi-buy offer requires three units. Do not claim the discount for a one-unit purchase."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three distinct reheatable batch meals utilizing ground turkey, garlic, olive oil, and complementary pantry and catalog ingredients.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoon | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in a large pot over medium heat.
2. Add chopped onions and minced garlic, sautéing until fragrant and translucent.
3. Add the ground turkey, cooking until fully browned and crumbled.
4. Stir in chili powder, cumin, and salt.
5. Pour in the crushed tomatoes and rinsed black beans, bringing the mixture to a gentle boil.
6. Reduce heat to low, cover, and simmer for 25 minutes to blend flavors.
Reheat: Reheat individual portions on the stovetop over medium-low heat with a splash of water, stirring occasionally until hot.

Dish 2: Turkey and Vegetable Skillet Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ginger | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in a large skillet over medium-high heat.
2. Add ground turkey, minced garlic, and grated ginger, cooking until the turkey is fully browned.
3. Add sliced carrots and curry powder, stirring for 2 minutes.
4. Pour in the canned coconut milk and bring to a simmer.
5. Fold in the fresh spinach and cook until wilted and carrots are tender.
Reheat: Reheat in a covered skillet over medium-low heat, stirring occasionally until heated through.

Dish 3: Cheesy Turkey Potato Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Fresh Yukon Gold potatoes | ID: yukon-gold-potatoes-fresh | Quantity: 2.5 lb | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 cup | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Preheat oven to 375 degrees F (190 degrees C) and lightly grease a baking dish with olive oil.
2. Slice potatoes thinly and par-boil in salted water for 8 minutes, then drain.
3. In a skillet, heat olive oil, add minced garlic and ground turkey, cooking until browned.
4. Stir in Italian seasoning and salt.
5. Layer half the potatoes in the baking dish, top with half the turkey and half the cheese, then repeat.
6. Bake uncovered for 30 minutes until potatoes are tender and cheese is bubbly and golden.
Reheat: Cover with foil and reheat in the oven at 350 degrees F for 20 minutes, or microwave individual portions until warm.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `dc8d1dcc8fe5a33a9a2592ca` — fixture R18

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
Explanation: Three 6-serving reheatable batch dishes. Fresh ginger is not on hand, so it is listed as a shopping ingredient (ginger-fresh) and ground ginger is not treated as a substitute or evidence of fresh ginger. No prices are invented; costs are left for app code.

Dish 1: Ginger Beef Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 480 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 3 lb | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Potatoes, cubed | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 3 tbsp | Optional: False
- Soy sauce | ID: soy-sauce | Quantity: 3 tbsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Season the beef stew meat with salt and black pepper.
2. Brown the beef in batches in a skillet with a little oil, then transfer to the slow cooker.
3. Add onions, carrots, potatoes, garlic, fresh ginger, tomato paste, soy sauce, and beef broth to the slow cooker and stir to combine.
4. Cover and cook on low for 8 hours until the beef is tender.
5. Taste and adjust salt before serving, then portion into airtight containers once cooled.
Reheat: Reheat portions in a covered saucepan over medium-low heat for 10 to 15 minutes, adding a splash of broth if thickened.

Dish 2: Chicken Thigh Ginger Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch skillet with lid
Prep: 15 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs, cut into bite-size pieces | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat canola oil in the skillet over medium heat and cook the onion until soft, about 5 minutes.
2. Add garlic, fresh ginger, and curry powder and stir for 1 minute.
3. Add the chicken and cook until browned on the outside, about 5 minutes.
4. Stir in coconut milk and salt, then simmer uncovered for 15 minutes until the chicken is cooked through.
5. Fold in spinach until wilted, then cool and portion into containers.
Reheat: Reheat covered in a skillet over medium heat for 8 to 10 minutes, stirring in a splash of water if the sauce has thickened.

Dish 3: Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell pepper, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 cans | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 1 can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat and brown the turkey, breaking it up, about 6 minutes.
2. Add onion and bell pepper and cook until softened, about 5 minutes.
3. Stir in garlic, chili powder, and cumin for 1 minute.
4. Add crushed tomatoes, broth, and both bean types, then simmer uncovered for 30 minutes.
5. Season with salt, cool, and portion into containers.
Reheat: Reheat in a saucepan over medium heat for 10 to 12 minutes, adding a little broth if thick.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `dc9ec59734a353cf1abcbc12` — fixture R07

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
Explanation: Three dairy-free batch dishes for 6 servings. Butter, milk, and cheddar in the pantry are excluded. Olive oil and garlic are used from the pantry, and other items are proposed as shopping ingredients. No prices or savings are stated.

Dish 1: Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Dutch oven on stovetop
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Yellow onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 15-oz can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat.
2. Brown the ground turkey, breaking it up, about 6 minutes.
3. Add onion and cook 4 minutes until softened, then add garlic and cook 1 minute.
4. Stir in chili powder and cumin for 30 seconds.
5. Add crushed tomatoes, black beans, vegetable broth, and salt. Bring to a boil.
6. Reduce heat to low, cover partly, and simmer 30 minutes, stirring occasionally.
Reheat: Cool, refrigerate up to 4 days or freeze up to 3 months. Reheat on the stovetop over medium heat with a splash of water or broth.

Dish 2: Red Lentil Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep skillet with lid
Prep: 10 min | Cook: 30 min
Ingredients:
- Dried red lentils, rinsed | ID: red-lentils-dried | Quantity: 1.5 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Yellow onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 13.5-oz can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in the skillet over medium heat.
2. Cook onion 5 minutes, then add garlic, ginger, and curry powder and stir 1 minute.
3. Add carrots, lentils, vegetable broth, and coconut milk. Bring to a simmer.
4. Cover and cook 20 minutes, stirring occasionally, until lentils are tender.
5. Stir in spinach until wilted, then add lime juice and salt.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat in a saucepan over medium-low heat, adding a little water as the lentils thicken.

Dish 3: Beef and Barley Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Large Dutch oven with lid, oven or stovetop
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat, cut in 1-inch cubes | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Yellow onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Russet potatoes, cubed | ID: russet-potatoes-fresh | Quantity: 1 lb | Optional: False
- Pearled barley | ID: pearled-barley | Quantity: 1 cup | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 325°F.
2. Heat olive oil in the Dutch oven over medium-high heat. Brown beef in batches, about 8 minutes total, and set aside.
3. Lower heat to medium, add onion, carrots, and celery, and cook 6 minutes. Add garlic and tomato paste and cook 1 minute.
4. Return beef to pot with beef broth, thyme, bay leaves, salt, and pepper. Bring to a simmer.
5. Cover and braise in the oven 1 hour.
6. Stir in potatoes and barley, cover, and braise 1 hour more until beef and barley are tender. Remove bay leaves before serving.
Reheat: Cool, refrigerate up to 4 days or freeze up to 3 months. Reheat covered on the stovetop over medium-low heat, adding broth to loosen the barley.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `dcb500c9b5a5bae5a81dafe0` — fixture R03

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
Explanation: Three reheatable batch meals for six, all tree-nut-free. Pantry-listed olive oil and garlic are used; other ingredients are included as full-batch quantities.

Dish 1: Beef, Barley, and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 1 cup | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Dice the onion, carrots, and celery; mince the garlic.
2. Heat olive oil in a skillet over medium-high heat. Brown the beef in batches, then transfer it to the slow cooker.
3. Stir tomato paste into the skillet for 30 seconds, scraping up browned bits; add a splash of broth and pour into the cooker.
4. Add vegetables, garlic, barley, remaining broth, bay leaf, thyme, salt, and pepper. Stir.
5. Cover and cook on low for about 7 hours, until beef is tender and barley is cooked. Remove the bay leaf and stir before serving.
Reheat: Refrigerate in shallow containers. Reheat portions covered in the microwave, stirring halfway, or warm gently on the stovetop; add a splash of broth if the barley has thickened the stew.

Dish 2: Smoky Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart electric pressure cooker (Instant Pot)
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Dice the onion and bell peppers; mince the garlic.
2. Select Sauté and heat the oil. Cook the turkey, breaking it up, until no longer pink, about 6 minutes. Drain excess liquid if needed.
3. Add onion and peppers and cook 3 minutes. Stir in garlic, tomato paste, chili powder, cumin, and smoked paprika for 30 seconds.
4. Pour in broth and scrape the bottom thoroughly. Add crushed tomatoes, beans, and salt; stir.
5. Lock the lid, set the valve to Sealing, and pressure-cook on High for 10 minutes. Let pressure release naturally for 10 minutes, then carefully release remaining pressure. Stir and adjust seasoning.
Reheat: Reheat covered portions in the microwave, stirring once, or warm in a saucepan over medium-low heat. Add a little broth or water if desired.

Dish 3: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 6-quart heavy-bottomed Dutch oven on stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Fresh tomatoes, chopped | ID: tomatoes-fresh | Quantity: 3 medium | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 ounces | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Ground turmeric | ID: turmeric-ground | Quantity: 0.5 teaspoon | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Dice the onion and tomatoes; mince the garlic and grate the ginger.
2. Warm olive oil in the Dutch oven over medium heat. Cook onion for 5 minutes until softened.
3. Add garlic, ginger, curry powder, and turmeric; stir for 30 seconds.
4. Add tomatoes and cook for 4 minutes. Stir in chickpeas, coconut milk, broth, and salt.
5. Bring to a gentle simmer, partly cover, and cook for 20 minutes, stirring occasionally. Fold in spinach and simmer 2 to 3 minutes until wilted.
Reheat: Warm gently in a covered saucepan over medium-low heat, stirring occasionally, or microwave covered portions and stir halfway. Loosen with a splash of broth or water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `ddc367d3854ec8a5d85dee6d` — fixture R27

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
Explanation: Scaled the six-serving seed from 6 to 4 servings (factor 2/3) and produced three distinct 4-serving remixes: a chili, a pasta braise, and a curry skillet. Pantry availability for olive oil and garlic does not prove enough quantity, so all quantities are listed as full-batch amounts. Added items use catalog IDs where exact matches exist. No prices are stated.

Dish 1: Turkey tomato chili
Servings: 4 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven on stovetop
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.67 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.67 oz | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 15 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 2 oz | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat.
2. Brown the turkey, breaking it up, about 6 minutes.
3. Add onions and cook until soft, about 5 minutes.
4. Add garlic, ginger, chili powder, and cumin; stir 1 minute.
5. Add crushed tomatoes and kidney beans; bring to a simmer.
6. Simmer uncovered on low for 30 minutes, stirring occasionally.
7. Top each bowl with cheddar before serving.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat on the stovetop over medium-low with a splash of water until steaming, then add fresh cheddar.

Dish 2: Turkey tomato pasta braise
Servings: 4 | Style: STEW_BRAISE | Appliance: 5-quart saucepan on stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.67 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.67 oz | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tsp | Optional: False
- Dry pasta | ID: pasta-dry | Quantity: 8 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 2 oz | Optional: False
Steps:
1. Heat olive oil in the saucepan over medium heat.
2. Brown the turkey, breaking it up, about 6 minutes.
3. Add onions and cook until soft, about 5 minutes.
4. Add garlic, ginger, and Italian seasoning; stir 1 minute.
5. Add crushed tomatoes and 1 cup water; bring to a simmer.
6. Stir in dry pasta, cover, and simmer on low 12 to 14 minutes until pasta is tender, stirring often and adding water if needed.
7. Finish with cheddar off heat until melted.
Reheat: Refrigerate up to 3 days. Reheat covered on the stovetop over low with a splash of water, stirring until hot throughout.

Dish 3: Turkey tomato curry skillet
Servings: 4 | Style: CURRY_SKILLET | Appliance: 12-inch skillet on stovetop
Prep: 15 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.33 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 0.67 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 clove | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 18.67 oz | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.67 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 1 tbsp | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 15 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 9 fl oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 2 oz | Optional: True
Steps:
1. Heat olive oil in the skillet over medium heat.
2. Brown the turkey, breaking it up, about 6 minutes.
3. Add onions and cook until soft, about 5 minutes.
4. Add garlic, ginger, and curry powder; stir 1 minute.
5. Add crushed tomatoes, chickpeas, and coconut milk; simmer uncovered on low 20 minutes until thickened.
6. Serve with optional cheddar on top.
Reheat: Refrigerate up to 4 days. Reheat in a covered skillet over medium-low with a splash of water until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `df45dd2f601311843aa784d9` — fixture R12

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R12",
  "category": "availability",
  "task": "generate",
  "prompt": "Only canned chickpeas and onions are available. You may add clearly identified shopping items.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "ANY",
    "pantry": [
      {
        "ingredientId": "chickpeas-canned",
        "available": true
      },
      {
        "ingredientId": "onions-fresh",
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
      "Only canned chickpeas and onions are available. You may add clearly identified shopping items."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three distinct batch meal recipes using canned chickpeas, fresh onions, and additional compliant pantry or shopping ingredients.

Dish 1: Hearty Chickpea and Onion Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stove
Prep: 15 min | Cook: 40 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 can | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cup | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Dice the onions and mince the garlic.
2. Heat olive oil in a large pot over medium heat and sauté the onions until translucent.
3. Add the minced garlic and ground cumin, stirring for 1 minute until fragrant.
4. Pour in the vegetable broth and add the drained canned chickpeas.
5. Bring the stew to a boil, then reduce heat and simmer for 30 minutes. Season with salt.
Reheat: Reheat on the stovetop over medium-low heat with a splash of water or broth to loosen the sauce.

Dish 2: Spiced Chickpea and Onion Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stove
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 can | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 ounce | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Chop the onions finely.
2. Heat olive oil in a large soup pot and cook the onions until soft and lightly browned.
3. Add the chili powder and stir for 1 minute.
4. Add the crushed tomatoes and rinsed canned chickpeas.
5. Simmer gently for 30 minutes, stirring occasionally, and season with salt.
Reheat: Warm in a covered pot on the stove over medium heat, stirring occasionally until heated through.

Dish 3: Roasted Onion and Chickpea Skillet Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Skillet
Prep: 10 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 can | Optional: False
- Onions | ID: onions-fresh | Quantity: 3 medium | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Slice the onions into thick strips.
2. Heat olive oil in a large skillet over medium-high heat and caramelize the onions until deeply browned.
3. Sprinkle the curry powder over the onions and cook for 1 minute.
4. Stir in the canned chickpeas and canned coconut milk.
5. Simmer for 15 minutes until the sauce thickens. Season with salt.
Reheat: Reheat in a skillet over medium heat, adding a couple of tablespoons of water if the sauce has thickened too much.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

# Blinded recipe review — batch 03

[Review instructions](../REVIEWING.md) · [All batches](../README.md) · [Compact grading sheet](../grades.json)

All grading fields are blank. Schema status below is an automatic format check, not a dietary or quality grade.

## Review `1b44b9c40befedded00452db` — fixture R11

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
Explanation: Three reheatable batch meals for six, using garlic powder only; fresh garlic is not used.

Dish 1: Slow-Cooker Beef, Barley, and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 1.2 kg | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 180 g | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Fresh cremini mushrooms | ID: mushrooms-cremini-fresh | Quantity: 250 g | Optional: False
- Beef broth | ID: beef-broth | Quantity: 1.5 L | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Add beef, barley, chopped carrots, celery, onion, and mushrooms to the slow cooker.
2. Stir broth with tomato paste, garlic powder, thyme, salt, and pepper; pour over the ingredients and add the bay leaf.
3. Cover and cook on low for 7 hours, until the beef is tender and barley is cooked. Remove the bay leaf and stir before portioning.
Reheat: Refrigerate in airtight portions. Reheat covered in the microwave, stirring halfway, or in a saucepan over medium-low heat; loosen with a splash of broth or water if thick.

Dish 2: Turkey, Black Bean, and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven
Prep: 20 min | Cook: 50 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 900 g | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 500 g | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 800 g | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 500 ml | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat. Add turkey and onion; break up the turkey and cook until no longer pink, about 7 minutes.
2. Stir in bell peppers, chili powder, cumin, garlic powder, salt, and pepper; cook for 1 minute.
3. Add sweet potatoes, crushed tomatoes, broth, and drained beans. Bring to a simmer, cover partially, and cook 35–40 minutes, stirring occasionally, until the sweet potatoes are tender and the chili has thickened.
Reheat: Store in sealed portions. Reheat on the stovetop over medium-low heat or microwave covered, stirring once; add a little broth if needed.

Dish 3: Chickpea and Cauliflower Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large covered Dutch oven or deep skillet
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Cauliflower, cut into florets | ID: cauliflower-fresh | Quantity: 700 g | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 150 g | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 400 ml | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 300 ml | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oil in the covered Dutch oven or deep skillet over medium heat. Add onion and cook until softened, about 5 minutes.
2. Stir in curry powder, garlic powder, ground ginger, and tomato paste; cook for 30 seconds.
3. Add cauliflower, chickpeas, coconut milk, broth, and salt. Bring to a simmer, cover, and cook 20–25 minutes until cauliflower is tender.
4. Stir in spinach and cook uncovered for 2–3 minutes until wilted. Taste and adjust seasoning before portioning.
Reheat: Refrigerate in airtight containers. Reheat gently in a covered saucepan or microwave, stirring partway through; add a splash of broth or water if the curry thickens.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `1bd05bf407482c38e271cedc` — fixture R22

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
Explanation: Three distinct batch dishes for 6 servings with no dietary constraints, using olive oil and garlic from pantry as available staples and catalog IDs where exact matches exist. Prices are not computed here; missing offers remain unknown and app code computes costs.

Dish 1: Slow-Cooked Beef Stew with Potatoes and Carrots
Servings: 6 | Style: STEW_BRAISE | Appliance: Slow cooker
Prep: 20 min | Cook: 480 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cup | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Season beef with salt and pepper.
2. Heat olive oil in a skillet and brown beef in batches, then transfer to slow cooker.
3. Saute onions and garlic in the same skillet until softened, then add to slow cooker.
4. Add potatoes, carrots, broth, tomato paste, thyme, and bay leaves to the slow cooker and stir.
5. Cover and cook on low for 8 hours until beef is tender. Remove bay leaves before serving.
Reheat: Refrigerate within two hours, store up to four days, and reheat portions on the stovetop or microwave until steaming hot.

Dish 2: Black Bean and Turkey Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Dutch oven
Prep: 15 min | Cook: 60 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
Steps:
1. Heat olive oil in a Dutch oven over medium-high heat and cook turkey until browned.
2. Add onions and garlic and cook until softened.
3. Stir in chili powder, cumin, and salt for one minute.
4. Add black beans, crushed tomatoes, and broth. Simmer uncovered for 45 minutes, stirring occasionally.
Reheat: Cool, refrigerate up to four days or freeze up to three months, then reheat gently on the stovetop with a splash of water.

Dish 3: Baked Ziti Casserole with Mozzarella
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13 inch baking dish in oven
Prep: 20 min | Cook: 35 min
Ingredients:
- Dry pasta, ziti | ID: pasta-dry | Quantity: 1 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Low-moisture mozzarella cheese, shredded | ID: mozzarella-low-moisture | Quantity: 12 oz | Optional: False
- Hard Parmesan, grated | ID: parmesan-hard | Quantity: 0.5 cup | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat oven to 375 F and cook pasta until just al dente; drain.
2. Warm olive oil, garlic, and oregano in a pan, then add crushed tomatoes and salt and simmer 5 minutes.
3. Combine pasta, sauce, and half the mozzarella in the baking dish.
4. Top with remaining mozzarella and Parmesan, then bake 25 to 30 minutes until bubbling and golden.
Reheat: Cool, refrigerate up to four days, and reheat individual portions covered in the microwave or in a 350 F oven until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `1cf410d974c2ab61d113e223` — fixture R17

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
Explanation: Three batch dishes for 6 servings, each using whole cardamom pods rather than ground. Pods are lightly bruised so flavor releases; remove them with a slotted spoon or tongs before serving, or warn diners if left in. Pantry availability for cardamom-pods is noted, but quantities are not confirmed, so the full batch amounts are listed as shopping needs. No prices are stated.

Dish 1: Cardamom Chicken Thigh Curry Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch deep skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Whole cardamom pods | ID: cardamom-pods | Quantity: 8 pods | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can (13.5 oz) | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 4 cups | Optional: True
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Cut chicken into 1-inch pieces and season with salt.
2. Heat olive oil in the skillet over medium-high heat and brown chicken in batches, about 5 minutes total; set aside.
3. Lightly crush the cardamom pods with the flat of a knife to open them.
4. Lower heat to medium, add onion and cook 5 minutes; add garlic, ginger, cardamom pods, and curry powder and stir 1 minute.
5. Return chicken with coconut milk, cover, and simmer 15 minutes until cooked through to 165 F.
6. Stir in spinach until wilted. Remove cardamom pods with a slotted spoon before serving.
7. Cool within 2 hours and refrigerate in shallow containers.
Reheat: Reheat covered in a skillet over medium heat with a splash of water for 8 to 10 minutes until steaming hot to 165 F.

Dish 2: Cardamom Red Lentil Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Dried red lentils | ID: red-lentils-dried | Quantity: 2 cups | Optional: False
- Whole cardamom pods | ID: cardamom-pods | Quantity: 6 pods | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 8 cups | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat.
2. Add onion and carrots and cook 6 minutes until softening.
3. Add garlic, cumin, and lightly crushed cardamom pods; stir 1 minute.
4. Add lentils, tomatoes, broth, and salt. Bring to a boil.
5. Reduce heat, cover partly, and simmer 25 to 30 minutes until lentils are soft.
6. Remove cardamom pods with a slotted spoon, adjust salt, and cool within 2 hours before refrigerating.
Reheat: Reheat in a saucepan over medium heat, adding broth or water to loosen, until steaming hot to 165 F, about 10 minutes.

Dish 3: Sweet Potato and Chickpea Cardamom Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish, oven at 400 F
Prep: 20 min | Cook: 40 min
Ingredients:
- Sweet potatoes, cubed | ID: sweet-potatoes | Quantity: 3 medium | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 2 cans (15 oz) | Optional: False
- Whole cardamom pods | ID: cardamom-pods | Quantity: 6 pods | Optional: False
- Ground cinnamon | ID: cinnamon-ground | Quantity: 1 tsp | Optional: False
- Onion, sliced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Fresh cilantro, chopped | ID: cilantro-fresh | Quantity: 0.5 cup | Optional: True
Steps:
1. Preheat oven to 400 F and lightly oil the baking dish.
2. Toss sweet potatoes, chickpeas, onion, olive oil, salt, and cinnamon in the dish.
3. Lightly crush cardamom pods and tuck them among the vegetables.
4. Stir tomato paste with 1/2 cup hot water and drizzle over the vegetables.
5. Cover with foil and bake 25 minutes, then uncover and bake 15 minutes until potatoes are tender.
6. Remove cardamom pods, sprinkle with cilantro if using, and cool within 2 hours before refrigerating.
Reheat: Reheat covered at 350 F for 20 to 25 minutes until hot to 165 F, or microwave single portions 2 to 3 minutes.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `1d410c7f031598abdfff4507` — fixture R12

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
Explanation: Three reheatable six-serving meals using the available canned chickpeas and onions, with additional shopping ingredients clearly identified by their recipe ingredients.

Dish 1: Tomato Chickpea and Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 360 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 4 15-ounce cans | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Potatoes, cut into 1-inch pieces (shopping) | ID: potatoes-fresh | Quantity: 1.5 pounds | Optional: False
- Canned crushed tomatoes (shopping) | ID: crushed-tomatoes-canned | Quantity: 2 15-ounce cans | Optional: False
- Vegetable broth (shopping) | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Garlic, minced (shopping) | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Smoked paprika (shopping) | ID: smoked-paprika | Quantity: 2 teaspoons | Optional: False
- Ground cumin (shopping) | ID: ground-cumin | Quantity: 1 teaspoon | Optional: False
- Salt (shopping) | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper (shopping) | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Add chickpeas, onions, potatoes, crushed tomatoes, broth, garlic, paprika, cumin, salt, and pepper to the slow cooker; stir.
2. Cover and cook on low for 6 hours, until the potatoes are tender. Stir before serving.
3. Cool promptly and refrigerate in shallow airtight containers. Reheat individual portions covered in the microwave, stirring halfway, or reheat gently in a saucepan with a splash of water or broth.
Reheat: Refrigerate leftovers promptly and use within 3–4 days; reheat until steaming hot, stirring to heat evenly.

Dish 2: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large lidded Dutch oven on stovetop
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 4 15-ounce cans | Optional: False
- Onions, thinly sliced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Canned coconut milk (shopping) | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Tomato paste (shopping) | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Fresh spinach (shopping) | ID: spinach-fresh | Quantity: 10 ounces | Optional: False
- Olive oil (shopping) | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Garlic, minced (shopping) | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated (shopping) | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Curry powder (shopping) | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Salt (shopping) | ID: salt | Quantity: 1 teaspoon | Optional: False
- Dry basmati rice (shopping) | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water (shopping) | ID: water | Quantity: 3 cups | Optional: False
Steps:
1. Rinse the rice. Combine it with 3 cups water in a saucepan, bring to a boil, cover, and simmer on low until tender, about 15 minutes; set aside.
2. Heat oil in the Dutch oven over medium heat. Cook onions for 6–8 minutes until softened. Add garlic, ginger, and curry powder; stir for 1 minute.
3. Stir in tomato paste, chickpeas, coconut milk, and salt. Bring to a gentle simmer and cook uncovered for 15 minutes, stirring occasionally.
4. Fold in spinach and cook until wilted. Serve with rice; cool and store the rice and curry separately for best texture.
5. For leftovers, reheat curry gently on the stovetop or covered in the microwave, stirring until steaming hot; reheat rice with a small splash of water.
Reheat: Refrigerate rice and curry promptly in separate shallow containers and use within 3–4 days; reheat thoroughly, stirring the curry and fluffing the rice.

Dish 3: Baked Chickpea, Tomato, and Cheddar Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and 9-by-13-inch baking dish
Prep: 20 min | Cook: 45 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 4 15-ounce cans | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Canned crushed tomatoes (shopping) | ID: crushed-tomatoes-canned | Quantity: 2 15-ounce cans | Optional: False
- Rolled oats, lightly crushed (shopping) | ID: rolled-oats | Quantity: 1 cup | Optional: False
- Cheddar cheese, grated (shopping) | ID: cheddar-cheese | Quantity: 1.5 cups | Optional: False
- Olive oil (shopping) | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Garlic, minced (shopping) | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Dried oregano (shopping) | ID: oregano-dried | Quantity: 1 teaspoon | Optional: False
- Salt (shopping) | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper (shopping) | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat oven to 375°F. Lightly oil the baking dish.
2. Heat oil in a skillet over medium heat. Cook onions for 6–8 minutes until softened; add garlic and cook 30 seconds.
3. In a large bowl, mix chickpeas, crushed tomatoes, oats, oregano, salt, pepper, and the cooked onion mixture. Spread in the baking dish and cover with cheese.
4. Bake uncovered for 35–40 minutes, until bubbling throughout and the center is hot. Rest 10 minutes before portioning.
5. Cool promptly and refrigerate in shallow airtight containers. Reheat portions covered in a 350°F oven until hot throughout, or use the microwave, stirring or rotating midway as needed.
Reheat: Refrigerate leftovers promptly and use within 3–4 days; cover while reheating to keep the casserole moist, and heat until steaming hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `1e82c642807c53a67cde9abf` — fixture R16

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
Explanation: Three reheatable batch meals use ground coriander as the seasoning; none treats fresh cilantro as a substitute.

Dish 1: Coriander-Lentil and Sweet Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 360 min
Ingredients:
- Dried red lentils | ID: red-lentils-dried | Quantity: 2 cups | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 3 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 5 cups | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Rinse lentils and add them to the slow cooker with sweet potatoes, onion, carrots, tomatoes, broth, coriander, cumin, garlic, salt, and pepper.
2. Cover and cook on low for about 6 hours, until lentils and vegetables are tender. Stir well and adjust salt to taste.
3. Cool promptly and portion into shallow containers for refrigeration or freezing.
Reheat: Reheat a portion covered in the microwave, stirring halfway through, or warm gently in a saucepan; add a splash of broth if thick.

Dish 2: Coriander Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart stovetop Dutch oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 cans (15 oz each) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium-high heat. Add turkey and cook, breaking it up, until no pink remains, about 7 minutes.
2. Stir in onion and bell peppers; cook until slightly softened, about 5 minutes. Add garlic, coriander, chili powder, and cumin; stir for 30 seconds.
3. Add tomatoes, beans, broth, and salt. Bring to a boil, then lower heat and simmer uncovered for 30 minutes, stirring occasionally.
4. Cool promptly and divide into meal portions.
Reheat: Reheat covered on the stove over medium-low heat or in the microwave, stirring once; loosen with a little broth if desired.

Dish 3: Coconut Coriander Chickpea Curry with Rice
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large lidded skillet and medium saucepan
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 cans (15 oz each) | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 cans (13.5 oz each) | Optional: False
- Fresh tomatoes, diced | ID: tomatoes-fresh | Quantity: 4 cups | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 6 cups | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Ground coriander | ID: coriander-ground | Quantity: 2 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 1 tbsp | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Rinse rice. In a saucepan, combine it with 3 cups water; bring to a boil, cover, reduce heat to low, and cook until tender, about 15 minutes. Rest covered for 5 minutes, then fluff.
2. Meanwhile, heat oil in a large skillet over medium heat. Cook onion for 5 minutes, then stir in garlic, ginger, coriander, and curry powder for 30 seconds.
3. Add tomatoes, chickpeas, coconut milk, and salt. Simmer uncovered for 20 minutes, stirring occasionally, until the sauce thickens slightly.
4. Stir in spinach and cook until wilted. Portion curry with rice, cool promptly, and store in meal-sized containers.
Reheat: Reheat curry and rice covered in the microwave, stirring halfway through; add a spoonful of water to the rice if it has dried out.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `1f73db1891ce7e9061bfa892` — fixture R36

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R36",
  "category": "vessel",
  "task": "generate",
  "prompt": "Use an Instant Pot or slow cooker for six servings; give a specific method rather than mixing their times.",
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
      "Use an Instant Pot or slow cooker for six servings; give a specific method rather than mixing their times."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three six-serving batches, each using a specific appliance and method.

Dish 1: Slow Cooker Chicken and White Bean Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 15 min | Cook: 240 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Drain and rinse the beans. Slice the carrots, dice the onion and mince the garlic.
2. Add everything to the slow cooker and stir. Cover and cook on high for 4 hours, until the carrots are tender and chicken reaches at least 165°F.
3. Shred the chicken, return it to the stew and divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat portions until steaming and 165°F, adding broth or water if needed.

Dish 2: Instant Pot Black Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Instant Pot
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1.5 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Drain and rinse the beans. Peel and dice sweet potatoes into 1-inch pieces; dice the onion and mince the garlic.
2. Add broth, sweet potatoes, onion, garlic, beans and seasonings to the pot. Pour tomatoes over the top without stirring.
3. Seal and pressure cook on high for 5 minutes. Allow a 10-minute natural release, then carefully release remaining pressure. Stir and divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming and 165°F; loosen with water if thick.

Dish 3: Slow Cooker Coconut Chickpea Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 6-quart slow cooker
Prep: 15 min | Cook: 240 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Cauliflower | ID: cauliflower-fresh | Quantity: 1 large head | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
Steps:
1. Drain and rinse chickpeas. Cut cauliflower into florets, dice onion and mince garlic.
2. Combine everything except spinach in the slow cooker. Cover and cook on high for 4 hours, until cauliflower is tender.
3. Stir in spinach, cover for 5 minutes until wilted and divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat gently until steaming and 165°F, stirring and adding water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `1f9b9c336591c5467cdbe83a` — fixture R18

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
Explanation: Fresh ginger is marked unavailable, so purchase it along with any other ingredients needed.

Dish 1: Ginger Chicken and Sweet Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 20 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.2 kg | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 40 g | Optional: False
- Sweet potatoes, diced | ID: sweet-potatoes | Quantity: 900 g | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 liter | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Cut the chicken into bite-size pieces. Heat oil in a Dutch oven and soften the onion for 5 minutes. Add ginger and garlic and cook for 1 minute.
2. Add chicken, sweet potatoes, broth and salt. Bring to a boil, then simmer covered for 25–30 minutes, until the potatoes are tender and the chicken reaches 165°F (74°C).
3. Divide into six portions and refrigerate promptly.
Reheat: Reheat until steaming hot throughout, adding a splash of water if needed.

Dish 2: Ginger Red Lentil and Tomato Soup
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop soup pot
Prep: 15 min | Cook: 30 min
Ingredients:
- Dried red lentils, rinsed | ID: red-lentils-dried | Quantity: 450 g | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 35 g | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 800 g | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 400 g | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1.5 liters | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
Steps:
1. Heat oil in a soup pot. Cook onion and carrots for 5 minutes, then stir in ginger and cumin for 1 minute.
2. Add lentils, tomatoes and broth. Bring to a boil and simmer for 20–25 minutes, stirring occasionally, until the lentils and carrots are tender.
3. Divide into six portions and refrigerate promptly.
Reheat: Reheat on the stove or in the microwave until steaming, thinning with water as needed.

Dish 3: Ginger Coconut Chickpea and Cauliflower Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 900 g | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 40 g | Optional: False
- Cauliflower florets | ID: cauliflower-fresh | Quantity: 900 g | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 800 ml | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oil in a deep skillet and soften the onion for 5 minutes. Stir in ginger and curry powder for 1 minute.
2. Add cauliflower, chickpeas, coconut milk and salt. Cover and simmer for 18–20 minutes, stirring occasionally, until the cauliflower is tender.
3. Divide into six portions and refrigerate promptly.
Reheat: Reheat gently until steaming hot throughout, adding water if the sauce has thickened.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `1fb3710cffa6bbaee52e219e` — fixture R25

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
Explanation: The turkey offer has zero package weight, so no unit price can be calculated. Other missing prices are unknown.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and mince the garlic. Heat oil in the Dutch oven and cook the onion for 5 minutes; add garlic and chili powder for 1 minute.
2. Add turkey and cook, breaking it up, until no longer pink and it reaches 165°F.
3. Add drained beans, tomatoes, water and salt. Simmer uncovered for 20 minutes, stirring occasionally.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot and 165°F, adding water if needed.

Dish 2: Coconut Chickpea and Sweet Potato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice sweet potatoes into 1/2-inch cubes and chop onion and garlic.
2. Heat oil in the skillet. Cook onion for 5 minutes, then add garlic and curry powder for 1 minute.
3. Add sweet potatoes, drained chickpeas, coconut milk, water and salt. Cover and simmer for 20–25 minutes, until potatoes are tender.
4. Stir in spinach until wilted.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot, adding a splash of water if the sauce has thickened.

Dish 3: Lentil and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop soup pot
Prep: 15 min | Cook: 45 min
Ingredients:
- Dried lentils | ID: lentils-dried | Quantity: 2 cups | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
Steps:
1. Rinse and pick over lentils. Dice carrots, celery and onion; mince garlic.
2. Heat oil in the pot and cook the vegetables for 8 minutes. Add garlic and thyme and cook for 1 minute.
3. Add lentils, tomatoes and broth. Bring to a boil, then simmer partially covered for 30–35 minutes, until lentils are tender.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot, thinning with water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `213e59e9b04eeef8b2647662` — fixture R01

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
Explanation: Choose gluten-free labeled canned foods and spices, and avoid cross-contact during preparation.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stovetop pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Gluten-free canned black beans, drained | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Gluten-free canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Gluten-free ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Gluten-free smoked paprika | ID: smoked-paprika | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Heat oil in the pot. Cook onion and peppers for 5 minutes; add garlic and cook 30 seconds.
2. Add turkey and cook, breaking it up, until no longer pink. Stir in cumin and paprika.
3. Add beans, tomatoes, water and salt. Simmer uncovered for 20 minutes, stirring occasionally. Ensure turkey reaches 165°F, then divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat until steaming throughout and 165°F, adding a splash of water if needed.

Dish 2: Chicken, Potato and Carrot Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and large baking dish
Prep: 15 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Potatoes, diced | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion, sliced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Gluten-free dried thyme | ID: thyme-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Gluten-free black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat the oven to 425°F. Toss potatoes, carrots, onion and garlic with oil, thyme, salt and pepper in a large baking dish.
2. Bake vegetables for 15 minutes. Place chicken on top and bake for another 25–30 minutes, until vegetables are tender and chicken reaches 165°F.
3. Rest briefly, then divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat covered in the microwave or oven until the chicken and vegetables reach 165°F.

Dish 3: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Deep stovetop skillet with lid
Prep: 10 min | Cook: 25 min
Ingredients:
- Gluten-free canned chickpeas, drained | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Gluten-free canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Gluten-free curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.75 tsp | Optional: False
Steps:
1. Heat oil in the skillet and cook onion for 5 minutes. Add garlic, ginger and curry powder; stir for 30 seconds.
2. Add chickpeas, coconut milk and salt. Simmer for 15 minutes, stirring occasionally.
3. Stir in spinach until wilted, about 3 minutes. Divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat gently until 165°F, stirring and adding a little water if the sauce is too thick.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `218df8706ab8881b264d64eb` — fixture R34

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
Explanation: Each batch serves eight and is sized for a 7- to 8-quart Dutch oven. Pantry availability does not guarantee sufficient quantity.

Dish 1: Beef, Carrot and Potato Braise
Servings: 8 | Style: STEW_BRAISE | Appliance: 7- to 8-quart oven-safe Dutch oven
Prep: 25 min | Cook: 180 min
Ingredients:
- Raw boneless beef chuck roast | ID: beef-chuck-roast-boneless-raw | Quantity: 3 lb | Optional: False
- Yukon Gold potatoes | ID: yukon-gold-potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 3 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat the oven to 325°F. Cut beef into large chunks, potatoes and carrots into bite-size pieces, and chop onions and garlic.
2. Heat oil in the Dutch oven. Season beef with salt and pepper and brown in batches; remove.
3. Soften onions for 5 minutes. Stir in garlic, tomato paste and thyme, then add broth and scrape up browned bits. Return beef to the pot.
4. Cover and braise in the oven for 2 hours. Add potatoes and carrots, cover and cook another 40–50 minutes, until the beef is fork-tender and vegetables are tender.
Reheat: Refrigerate promptly in shallow containers. Reheat portions with a splash of broth until steaming hot, reaching 165°F.

Dish 2: Turkey and Black Bean Chili
Servings: 8 | Style: CHILI_SOUP | Appliance: 7- to 8-quart Dutch oven
Prep: 15 min | Cook: 50 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 28-oz cans | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Chop onions and peppers, mince garlic, and drain and rinse the beans.
2. Heat oil in the Dutch oven. Cook turkey, breaking it up, until no longer pink, about 8 minutes.
3. Add onions and peppers and cook for 5 minutes. Stir in garlic, chili powder, cumin and salt for 1 minute.
4. Add tomatoes and beans. Simmer uncovered for 30–35 minutes, stirring occasionally, until thickened and the turkey has reached 165°F.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming and 165°F, adding a little water if needed.

Dish 3: Coconut Chickpea and Sweet Potato Curry
Servings: 8 | Style: CURRY_SKILLET | Appliance: 7- to 8-quart Dutch oven
Prep: 20 min | Cook: 40 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice sweet potatoes into roughly 3/4-inch cubes. Chop onions, mince garlic, and drain and rinse chickpeas.
2. Heat oil in the Dutch oven and soften onions for 5 minutes. Add garlic and curry powder and stir for 1 minute.
3. Add sweet potatoes, chickpeas, coconut milk, tomatoes and salt. Bring to a gentle simmer, cover and cook for 25–30 minutes, stirring occasionally, until the potatoes are tender.
4. Stir in spinach until wilted, about 2 minutes.
Reheat: Refrigerate promptly in shallow containers. Reheat gently until steaming and 165°F, stirring and adding water if too thick.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `21c954711d19367a18754c3c` — fixture R09

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
Explanation: Pantry is empty, so all ingredients below must be purchased. Quantities are for the full 6-serving batch. No prices are included; app code computes costs from supplied offers.

Dish 1: Slow Cooker Beef Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 25 min | Cook: 480 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Fresh Yukon Gold potatoes | ID: yukon-gold-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- All-purpose wheat flour | ID: all-purpose-flour | Quantity: 3 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
Steps:
1. Toss beef stew meat with flour, salt, and pepper.
2. Heat olive oil in a skillet over medium-high heat and brown the beef in batches, about 3 minutes per side.
3. Place browned beef, chopped potatoes, carrots, onion, and garlic in the slow cooker.
4. Stir tomato paste into the beef broth, then pour over the ingredients. Add thyme and bay leaves.
5. Cover and cook on LOW for 8 hours until beef is tender. Remove bay leaves before serving.
Reheat: Refrigerate within 2 hours. Reheat portions in a covered pot over medium heat with a splash of water until steaming hot throughout, about 10 minutes.

Dish 2: Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Dutch oven or stockpot
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat.
2. Add onions and cook 5 minutes until soft, then add garlic for 1 minute.
3. Add ground turkey and cook, breaking it up, until no longer pink, about 6 minutes.
4. Stir in chili powder, cumin, and smoked paprika for 1 minute.
5. Add crushed tomatoes, chicken broth, and black beans. Season with salt.
6. Simmer uncovered over medium-low heat for 30 minutes, stirring occasionally.
Reheat: Cool and refrigerate within 2 hours. Reheat in a saucepan over medium heat, stirring, until steaming hot throughout, about 8 minutes. Add a splash of broth if thick.

Dish 3: Chicken and Broccoli Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 9x13-inch baking dish in oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 1 lb | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Cheddar cheese, shredded | ID: cheddar-cheese | Quantity: 1 cup | Optional: False
- Butter | ID: butter-salted-unsalted | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Preheat oven to 400°F (204°C). Grease a 9x13-inch baking dish.
2. Melt butter in a skillet and cook chopped onion and garlic for 4 minutes. Add chicken cut into bite-size pieces and cook 3 minutes.
3. Spread rice in the baking dish, then add chicken mixture, broccoli florets, broth, salt, and pepper. Stir to combine.
4. Cover tightly with foil and bake 35 minutes.
5. Uncover, sprinkle cheddar over top, and bake 5 to 8 minutes until melted and bubbling.
Reheat: Refrigerate within 2 hours. Reheat individual portions covered in the microwave for 2 to 3 minutes, or in a 350°F oven for 15 minutes until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `229e08cbecafb4aa06d5e970` — fixture R07

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
Explanation: Generated three dairy-free batch meals using allowed pantry items (olive oil and garlic) while omitting dairy products (butter, milk, and cheese) to satisfy the dairy-free dietary constraint.

Dish 1: Garlic Olive Oil Roasted Sweet Potatoes and Chicken
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 4 tablespoon | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 3 pound | Optional: False
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 2 pound | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Preheat oven to 400 degrees Fahrenheit.
2. Peel and dice the sweet potatoes into 1-inch cubes. Cut chicken breasts into bite-sized pieces.
3. Mince the fresh garlic.
4. In a large bowl, toss the sweet potatoes and chicken with olive oil, minced garlic, salt, and black pepper.
5. Transfer everything evenly to a large baking dish.
6. Bake in the preheated oven for 45 minutes, stirring halfway through, until chicken is cooked through and sweet potatoes are tender.
Reheat: Reheat in a 350-degree Fahrenheit oven for 15 minutes or microwave in covered portions until warmed through.

Dish 2: Hearty Garlic Olive Oil White Bean Stew
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 10 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 3 tablespoon | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 6 clove | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 3 can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cup | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounce | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Dice the onion and mince the fresh garlic.
2. Heat olive oil in a large pot over medium heat.
3. Add diced onion and sauté for 5 minutes until soft.
4. Add minced garlic and cook for 1 minute until fragrant.
5. Pour in the canned cannellini beans (rinsed and drained) and vegetable broth.
6. Bring to a simmer and cook for 20 minutes.
7. Stir in fresh spinach and salt, cooking for 3 more minutes until the spinach is wilted.
Reheat: Simmer gently on the stovetop over medium-low heat for 10 minutes, adding a splash of water if needed.

Dish 3: Garlic Olive Oil Braised Cabbage and Sausage Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Skillet
Prep: 10 min | Cook: 25 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 3 tablespoon | Optional: False
- Fresh garlic | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Green cabbage | ID: green-cabbage | Quantity: 1 head | Optional: False
- Fully cooked smoked sausage | ID: smoked-sausage-fully-cooked | Quantity: 1 pound | Optional: False
- Apple cider vinegar | ID: apple-cider-vinegar | Quantity: 2 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 0.75 teaspoon | Optional: False
Steps:
1. Slice the green cabbage into thin strips and slice the smoked sausage into rounds.
2. Mince the fresh garlic.
3. Heat olive oil in a large skillet over medium heat.
4. Add the smoked sausage rounds and brown for 5 minutes.
5. Add minced garlic and sliced cabbage to the skillet, stirring to combine.
6. Cover and braise for 15 minutes, stirring occasionally, until the cabbage is tender.
7. Stir in apple cider vinegar and salt, then cook uncovered for 3 more minutes.
Reheat: Reheat in a skillet over medium heat for 6 to 8 minutes until hot and sizzling.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `2327a63192f978216835c0e0` — fixture R21

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
Explanation: Three batch meals for six. Prices are unknown because no offers were provided.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stovetop pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell pepper | ID: bell-peppers | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and pepper and mince the garlic. Drain and rinse the beans.
2. Heat oil in a large pot. Cook onion and pepper for 5 minutes; add garlic, chili powder and cumin and cook for 1 minute.
3. Add turkey and cook, breaking it up, until no pink remains and it reaches 165°F.
4. Add tomatoes, beans, water and salt. Simmer for 20 minutes, stirring occasionally. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot and 165°F, adding a splash of water if needed.

Dish 2: Chickpea and Spinach Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep stovetop skillet
Prep: 10 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water for rice | ID: None | Quantity: 3 cups | Optional: False
Steps:
1. Rinse rice and cook with water according to package directions.
2. Meanwhile, dice onion, mince garlic, and drain and rinse chickpeas.
3. Heat oil in a deep skillet. Soften onion for 5 minutes, then stir in garlic and curry powder for 1 minute.
4. Add chickpeas, coconut milk and salt. Simmer for 15 minutes; stir in spinach until wilted. Divide curry and rice into six portions.
Reheat: Cool rice and curry promptly in shallow containers and refrigerate. Reheat until steaming hot and 165°F; add a splash of water to loosen the curry.

Dish 3: Sausage, Potato and Cabbage Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and large baking dish
Prep: 15 min | Cook: 50 min
Ingredients:
- Fully cooked kielbasa | ID: kielbasa-fully-cooked | Quantity: 1.5 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Green cabbage | ID: green-cabbage | Quantity: 1.5 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Dijon mustard | ID: dijon-mustard | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 400°F. Dice potatoes into small pieces, chop cabbage and onion, mince garlic, and slice kielbasa.
2. Toss potatoes, cabbage, onion and garlic with oil, mustard, salt and pepper in a large baking dish. Cover tightly with foil.
3. Bake for 30 minutes. Stir in kielbasa, uncover and bake for 20 minutes more, until potatoes are tender and sausage is hot. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat covered in the microwave or oven until steaming hot and 165°F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `23362e279b95d4e542497718` — fixture R35

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R35",
  "category": "vessel",
  "task": "generate",
  "prompt": "Use a deep skillet for six servings; avoid a separate oven step.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "BIG_BATCH_SKILLET",
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
      "Use a deep skillet for six servings; avoid a separate oven step."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Generated three distinct six-serving batch recipes utilizing a deep skillet without any oven steps, incorporating the required pantry items.

Dish 1: Skillet Beef and Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Deep Skillet
Prep: 15 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 pound | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoon | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tablespoon | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 ounce | Optional: False
- Canned kidney beans | ID: kidney-beans-canned | Quantity: 30 ounce | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in the deep skillet over medium-high heat.
2. Add chopped onions and minced garlic, sautéing until soft and fragrant.
3. Add ground beef, breaking it apart with a wooden spoon, and cook until fully browned.
4. Stir in chili powder and ground cumin, cooking for 1 minute until fragrant.
5. Pour in crushed tomatoes and canned kidney beans, bringing the mixture to a gentle simmer.
6. Reduce heat to low and simmer uncovered for 20 minutes, stirring occasionally. Season with salt.
Reheat: Reheat in a covered skillet over medium-low heat with a splash of water until warmed through.

Dish 2: One-Skillet Chicken and Vegetable Stir-Fry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Deep Skillet
Prep: 15 min | Cook: 20 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 1.5 pound | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 3 cup | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 2 medium | Optional: False
- Soy sauce | ID: soy-sauce | Quantity: 0.33 cup | Optional: False
- Honey | ID: honey | Quantity: 2 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Cut chicken breasts into bite-sized pieces and slice carrots and broccoli florets.
2. Heat olive oil in a deep skillet over medium-high heat.
3. Add chicken pieces and cook until lightly browned and cooked through.
4. Stir in minced garlic and fresh ginger, cooking for 30 seconds until aromatic.
5. Add sliced carrots and broccoli florets, along with a splash of water, and cover to steam-cook for 5 minutes.
6. Whisk together soy sauce, honey, and salt, then pour over the contents of the skillet. Toss and cook for 3 minutes until sauce thickens.
Reheat: Reheat in a skillet over medium heat, stirring frequently until hot.

Dish 3: Skillet Sausage and Potato Hash
Servings: 6 | Style: STEW_BRAISE | Appliance: Deep Skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoon | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fully cooked smoked sausage | ID: smoked-sausage-fully-cooked | Quantity: 1 pound | Optional: False
- Fresh Russet potatoes | ID: russet-potatoes-fresh | Quantity: 2 pound | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Dice the russet potatoes into small cubes and slice the smoked sausage into rounds.
2. Heat olive oil in a deep skillet over medium heat.
3. Add diced onions and minced garlic, sautéing until translucent.
4. Add sausage slices and cook until browned on both sides.
5. Add cubed potatoes, smoked paprika, and salt, stirring to combine.
6. Pour in chicken broth, cover the skillet, and simmer over medium-low heat for 15 minutes until potatoes are tender and liquid is absorbed.
Reheat: Reheat in a skillet over medium heat, pressing down occasionally to crisp the potatoes.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `237ed7d6c0dc552f4d7e0699` — fixture R13

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
Explanation: Three practical, reheatable six-serving batch meals using the available salt and olive oil, with other ingredients listed as needed.

Dish 1: Tomato Lentil Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Large heavy pot on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried lentils | ID: lentils-dried | Quantity: 2 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 6 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice onions, carrots, and celery; mince garlic.
2. Heat oil in a large pot over medium heat. Cook onion, carrots, and celery until beginning to soften, about 7 minutes. Stir in garlic and tomato paste for 1 minute.
3. Add lentils, crushed tomatoes, broth, thyme, bay leaf, salt, and pepper. Bring to a boil, then cover partially and simmer until lentils are tender, 30–35 minutes, stirring occasionally.
4. Remove bay leaf, taste and adjust salt, and divide into six portions.
Reheat: Refrigerate promptly in covered portions. Reheat on the stovetop over medium-low heat or microwave, stirring halfway; add a splash of water if thick.

Dish 2: Chickpea Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep skillet with lid on stovetop
Prep: 15 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ginger | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 14.5-ounce can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 ounces | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water | ID: None | Quantity: 3 cups | Optional: False
Steps:
1. Finely chop the onions, mince garlic, and grate ginger.
2. Warm oil in the deep skillet over medium heat. Cook onions until softened, 6–8 minutes. Add garlic, ginger, and curry powder and stir for 1 minute.
3. Stir in chickpeas, coconut milk, crushed tomatoes, and salt. Bring to a gentle simmer, cover, and cook 20 minutes, stirring occasionally. Fold in spinach until wilted.
4. Meanwhile, rinse rice. Combine with water in a saucepan, bring to a boil, cover, and cook over low heat until tender, about 15 minutes. Serve curry over rice and portion for storage.
Reheat: Store rice and curry in covered portions. Microwave with a spoonful of water, stirring midway, until steaming hot; or reheat curry gently in a skillet and serve with reheated rice.

Dish 3: Smoky Sausage, Potato, and Bean Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and 9-by-13-inch baking dish
Prep: 20 min | Cook: 65 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Fully cooked smoked sausage | ID: smoked-sausage-fully-cooked | Quantity: 1.5 pounds | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2.5 pounds | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.75 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Water | ID: None | Quantity: 0.5 cup | Optional: False
Steps:
1. Heat oven to 375°F (190°C). Lightly oil a 9-by-13-inch baking dish.
2. Cut sausage into coins, potatoes into ½-inch cubes, and onion into thin wedges. Add to the dish with drained beans, crushed tomatoes, paprika, garlic powder, salt, pepper, and water; stir to combine and spread evenly.
3. Cover tightly with foil and bake 45 minutes. Carefully uncover, stir, and bake another 15–20 minutes until potatoes are tender and the casserole is bubbling.
4. Let stand 10 minutes, stir, and portion into six servings.
Reheat: Keep covered portions refrigerated. Reheat in a covered microwave-safe dish, stirring once, until hot throughout; add a little water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `23e04fe987cc843cfd20159b` — fixture R12

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
Explanation: Three distinct six-serving batch meals use canned chickpeas and onions, with additional shopping ingredients clearly identified by their catalog names or display names.

Dish 1: Tomato Chickpea and Spinach Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart stovetop Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-ounce cans, drained and rinsed | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium, diced | Optional: False
- Olive oil (shopping) | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Garlic (shopping) | ID: garlic-fresh | Quantity: 4 cloves, minced | Optional: False
- Smoked paprika (shopping) | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Ground cumin (shopping) | ID: cumin-ground | Quantity: 1 teaspoon | Optional: False
- Canned crushed tomatoes (shopping) | ID: crushed-tomatoes-canned | Quantity: 2 14-ounce cans | Optional: False
- Vegetable broth (shopping) | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Fresh spinach (shopping) | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Salt (shopping) | ID: salt | Quantity: 1 teaspoon, or to taste | Optional: False
- Black pepper (shopping) | ID: black-pepper | Quantity: 0.25 teaspoon | Optional: False
- Lemon (shopping) | ID: lemon-fresh | Quantity: 1 lemon, juiced | Optional: True
Steps:
1. Heat oil in the Dutch oven over medium heat. Add onions and cook, stirring, until softened, about 7 minutes.
2. Stir in garlic, paprika, and cumin; cook for 30 seconds. Add chickpeas, tomatoes, broth, salt, and pepper.
3. Bring to a gentle simmer, partly cover, and cook for 25 minutes, stirring occasionally. Lightly mash some chickpeas against the pot to thicken.
4. Stir in spinach until wilted, about 2 minutes. Add lemon juice if using, taste and adjust seasoning, then cool and portion.
Reheat: Refrigerate portions promptly and use within 3–4 days, or freeze. Reheat on the stovetop over medium-low heat, stirring until steaming hot; add a splash of water or broth if thick.

Dish 2: Coconut Chickpea Curry with Rice
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch deep lidded skillet and a medium saucepan
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-ounce cans, drained and rinsed | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium, diced | Optional: False
- Olive oil (shopping) | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Garlic (shopping) | ID: garlic-fresh | Quantity: 3 cloves, minced | Optional: False
- Fresh ginger (shopping) | ID: ginger-fresh | Quantity: 1 tablespoon, finely grated | Optional: False
- Curry powder (shopping) | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Tomato paste (shopping) | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Canned coconut milk (shopping) | ID: coconut-milk-canned | Quantity: 2 13.5-ounce cans | Optional: False
- Vegetable broth (shopping) | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Cauliflower (shopping) | ID: cauliflower-fresh | Quantity: 1 medium head, cut into small florets | Optional: False
- Salt (shopping) | ID: salt | Quantity: 1 teaspoon, or to taste | Optional: False
- Dry basmati rice (shopping) | ID: basmati-rice-dry | Quantity: 2.25 cups | Optional: False
- Water (shopping) | ID: water | Quantity: 3.375 cups, for cooking rice | Optional: False
- Fresh cilantro (shopping) | ID: cilantro-fresh | Quantity: 0.5 cup, chopped | Optional: True
Steps:
1. In the saucepan, rinse rice, combine with 3 3/8 cups water, and cook covered according to package directions; set aside.
2. Meanwhile, heat oil in the deep skillet over medium heat. Cook onions until soft, about 7 minutes. Add garlic and ginger; stir for 1 minute.
3. Add curry powder and tomato paste and stir for 30 seconds. Add cauliflower, chickpeas, coconut milk, broth, and salt.
4. Bring to a simmer, cover, and cook until cauliflower is tender, 15–20 minutes, stirring occasionally. Serve with rice and cilantro if using, or cool and portion rice and curry separately.
Reheat: For best texture, store rice and curry separately. Refrigerate promptly and use within 3–4 days, or freeze. Reheat curry gently in a covered skillet with a splash of water; reheat rice with a spoonful of water, covered, until steaming hot.

Dish 3: Chickpea, Tomato, and Rice Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: 3-quart covered oven-safe casserole dish and conventional oven
Prep: 15 min | Cook: 65 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-ounce cans, drained and rinsed | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium, finely diced | Optional: False
- Olive oil (shopping) | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Garlic (shopping) | ID: garlic-fresh | Quantity: 3 cloves, minced | Optional: False
- Dry brown rice (shopping) | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Canned crushed tomatoes (shopping) | ID: crushed-tomatoes-canned | Quantity: 1 14-ounce can | Optional: False
- Vegetable broth (shopping) | ID: vegetable-broth | Quantity: 2.5 cups | Optional: False
- Dried oregano (shopping) | ID: oregano-dried | Quantity: 1 teaspoon | Optional: False
- Smoked paprika (shopping) | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt (shopping) | ID: salt | Quantity: 1 teaspoon, or to taste | Optional: False
- Black pepper (shopping) | ID: black-pepper | Quantity: 0.25 teaspoon | Optional: False
- Water (shopping) | ID: water | Quantity: 1 cup | Optional: False
- Hard Parmesan (shopping) | ID: parmesan-hard | Quantity: 0.5 cup, grated | Optional: True
Steps:
1. Heat oven to 375°F (190°C). Heat oil in a skillet over medium heat and cook onions until softened, about 7 minutes. Add garlic and cook for 30 seconds.
2. Stir in rice, tomatoes, broth, water, oregano, paprika, salt, and pepper. Bring just to a simmer, then transfer to the casserole dish and stir in chickpeas.
3. Cover tightly with a lid or foil and bake until rice is tender and liquid is absorbed, about 55–65 minutes. Check near the end; if rice is still firm and the dish looks dry, add a little hot water, reseal, and continue baking.
4. Rest covered for 10 minutes. Stir, top with Parmesan if using, and portion.
Reheat: Cool and refrigerate promptly; use within 3–4 days, or freeze portions. Reheat covered in a 350°F (175°C) oven until steaming hot, adding a tablespoon or two of water per portion to keep the rice moist.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `25b58c89345be0f21ba9b583` — fixture R17

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
Explanation: Three reheatable six-serving batch meals. The lentil curry uses whole cardamom pods; remove them before serving or packing portions, since they are for flavoring and are not meant to be eaten.

Dish 1: Coconut Cardamom Red Lentil Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large lidded skillet or Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Dried red lentils | ID: red-lentils-dried | Quantity: 2 cups | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Whole cardamom pods | ID: cardamom-pods | Quantity: 6 pods | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 teaspoons | Optional: False
- Ground turmeric | ID: turmeric-ground | Quantity: 1 teaspoon | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can (13.5 oz) | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (14.5 oz) | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Warm the oil in the skillet over medium heat. Cook the onions until softened, about 6 minutes.
2. Stir in garlic, ginger, curry powder, turmeric, and cardamom pods; cook for 1 minute.
3. Add lentils, coconut milk, broth, tomatoes, and salt. Bring to a gentle boil, then cover and simmer, stirring occasionally, until lentils are tender, 20–25 minutes.
4. Remove and discard all cardamom pods. Stir in spinach until wilted, then portion with rice or another cooked grain if desired.
Reheat: Reheat covered on the stovetop over low heat or in the microwave, stirring midway. Add a splash of water or broth if thick; make sure no cardamom pods remain in portions.

Dish 2: Smoky Turkey, Bean, and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Dutch oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 pounds | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 large | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell pepper, diced | ID: bell-peppers | Quantity: 1 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat oil in the Dutch oven over medium-high heat. Add turkey and onion; cook, breaking up the turkey, until no pink remains, about 8 minutes.
2. Stir in bell pepper, chili powder, cumin, paprika, and salt; cook for 1 minute.
3. Add sweet potatoes, beans, tomatoes, and broth. Bring to a boil, then cover and simmer gently until the sweet potatoes are tender, about 30 minutes, stirring occasionally.
4. Taste and adjust seasoning, then divide into six portions.
Reheat: Reheat covered in a microwave or saucepan, stirring once or twice. Add a little broth or water if the chili has thickened.

Dish 3: Chicken, Barley, and Mushroom Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and 9-by-13-inch covered casserole dish
Prep: 20 min | Cook: 75 min
Ingredients:
- Boneless skinless chicken thighs, cut into bite-size pieces | ID: chicken-thighs-boneless | Quantity: 1.5 pounds | Optional: False
- Pearled barley | ID: barley-pearled | Quantity: 1.5 cups | Optional: False
- Fresh cremini mushrooms, sliced | ID: mushrooms-cremini-fresh | Quantity: 8 ounces | Optional: False
- Carrots, diced | ID: carrots-fresh | Quantity: 2 medium | Optional: False
- Celery, diced | ID: celery-stalks | Quantity: 2 stalks | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat oven to 375°F (190°C). Add barley, mushrooms, carrots, celery, onion, garlic, thyme, salt, pepper, and broth to the casserole dish; stir to combine.
2. Nestle the chicken pieces into the barley mixture and drizzle with olive oil. Cover the dish tightly with a lid or foil.
3. Bake until barley is tender and chicken reaches 165°F (74°C), about 65–75 minutes. If the barley is still firm, add a little hot broth or water and bake covered for another 10 minutes.
4. Rest covered for 10 minutes, stir, and divide into six portions.
Reheat: Reheat covered in the microwave or oven until steaming hot. Stir in a spoonful of water or broth before reheating if the barley has absorbed the liquid.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `25d2acb7e5e0d193c145239c` — fixture R08

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
Status: ok
Explanation: Wheat flour conflicts with the mandatory gluten-free setting, so these dishes use gluten-free ingredients instead. Choose gluten-free-labeled flour and spices.

Dish 1: Chicken and Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop, large pot
Prep: 20 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 900 g | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 900 g | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Gluten-free rice flour | ID: rice-flour | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 liter | Optional: False
Steps:
1. Dice the chicken, potatoes, carrots and onion; mince the garlic.
2. Heat oil in a large pot. Cook onion and garlic for 3 minutes, then add chicken and cook for 5 minutes.
3. Add potatoes, carrots, thyme, salt and water. Simmer for 25–30 minutes, until vegetables are tender and chicken reaches 165°F.
4. Mix rice flour with a little cold water, stir into the stew and simmer for 3 minutes. Divide into six portions.
Reheat: Refrigerate promptly for up to 4 days. Reheat until steaming hot and 165°F, adding water if needed.

Dish 2: Black Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop, large pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 900 g | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 500 ml | Optional: False
Steps:
1. Dice the sweet potatoes and onion; mince the garlic. Drain and rinse the beans.
2. Heat oil in a large pot and soften the onion for 5 minutes. Stir in garlic, cumin and paprika for 30 seconds.
3. Add sweet potatoes, tomatoes, beans, salt and water. Simmer covered for 25–30 minutes, until the potatoes are tender. Divide into six portions.
Reheat: Refrigerate promptly for up to 4 days. Reheat to 165°F, adding a splash of water if thick.

Dish 3: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop, deep skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 300 g | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 1 tbsp grated | Optional: False
- Gluten-free curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry jasmine rice | ID: jasmine-rice-dry | Quantity: 450 g | Optional: False
- Water for rice | ID: None | Quantity: 750 ml | Optional: False
Steps:
1. Rinse the rice and cook with the measured water according to package directions.
2. Dice the onion, mince the garlic and drain and rinse the chickpeas.
3. Heat oil in a deep skillet. Cook onion for 5 minutes, then add garlic, ginger and curry powder and stir for 1 minute.
4. Add chickpeas, coconut milk and salt. Simmer for 15 minutes, then stir in spinach until wilted. Divide the curry and rice into six portions.
Reheat: Cool rice and curry promptly and refrigerate for up to 4 days. Reheat to 165°F, adding a splash of water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `263206d44a685dd24116f055` — fixture R05

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
Explanation: Three gluten-free, dairy-free batch meals. Check packaged spices and canned foods for gluten and dairy ingredients and cross-contact.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and peppers; mince the garlic. Drain and rinse the beans.
2. Heat oil in a Dutch oven. Cook onion and peppers for 5 minutes, then add garlic, cumin and paprika and stir for 1 minute.
3. Add turkey and cook, breaking it up, until no pink remains. Stir in tomatoes, beans, water and salt.
4. Simmer uncovered for 20–25 minutes, stirring occasionally. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers for up to 3–4 days. Reheat until steaming hot throughout, adding a splash of water if needed.

Dish 2: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet with lid
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Gluten-free, dairy-free curry powder | ID: curry-powder | Quantity: 1.5 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.75 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water | ID: None | Quantity: 3 cups | Optional: False
Steps:
1. Rinse the rice and cook with the water in a covered saucepan according to package directions.
2. Dice the onion, mince the garlic, and drain and rinse the chickpeas.
3. Heat oil in a deep skillet. Cook onion for 5 minutes; add garlic and curry powder and stir for 1 minute.
4. Add chickpeas, coconut milk and salt. Simmer for 15 minutes, then stir in spinach until wilted. Serve in six portions with the rice.
Reheat: Cool rice and curry promptly in shallow containers and refrigerate for up to 3–4 days. Reheat until steaming hot throughout; add a splash of water if dry.

Dish 3: Chicken, Potato and Carrot Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven with lid
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Water | ID: None | Quantity: 2 cups | Optional: False
Steps:
1. Cut chicken into large pieces, potatoes into 1-inch chunks and carrots into thick slices. Dice the onion and mince the garlic.
2. Heat oil in a Dutch oven and cook onion for 5 minutes. Add garlic and thyme and stir briefly.
3. Add chicken, potatoes, carrots, water, salt and pepper. Bring to a simmer, cover and cook for 25–30 minutes, until vegetables are tender and chicken reaches 165°F throughout.
4. Divide into six portions with the cooking liquid.
Reheat: Refrigerate promptly in shallow containers for up to 3–4 days. Reheat covered until the chicken and vegetables are hot throughout, reaching 165°F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `275016df5df68db28dbde6a9` — fixture R03

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
Explanation: Three reheatable, tree-nut-free batch meals for six. Almonds and walnuts are not included.

Dish 1: Tomato and Chickpea Vegetable Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large lidded Dutch oven on stovetop
Prep: 20 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Cauliflower | ID: cauliflower-fresh | Quantity: 1 large head | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 3 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 14.5-ounce cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 13.5-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
Steps:
1. Dice the onions, mince the garlic, slice the carrots, and cut the cauliflower into bite-size florets.
2. Heat oil in the Dutch oven over medium heat. Cook onion for 5 minutes; stir in garlic and curry powder for 30 seconds.
3. Add carrots, cauliflower, chickpeas, tomatoes, coconut milk, broth, and salt. Bring to a simmer.
4. Cover partly and simmer 25–30 minutes, stirring occasionally, until the vegetables are tender. Stir in spinach until wilted.
5. Cool promptly and portion into containers for refrigeration or freezing.
Reheat: Reheat covered on the stovetop over medium-low heat, stirring occasionally, until steaming throughout; add a splash of water or broth if thick. Microwave individual portions covered, stirring halfway.

Dish 2: Smoky Turkey and Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 5 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Ground turkey | ID: ground-turkey | Quantity: 1.5 pounds | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 14.5-ounce cans | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 1 15-ounce can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Dice the onion and bell peppers and mince the garlic.
2. Heat oil in a skillet over medium-high heat. Brown the turkey, breaking it up, until no longer pink; transfer to the slow cooker.
3. Add onion, bell peppers, garlic, chili powder, cumin, paprika, tomatoes, beans, broth, and salt. Stir well.
4. Cover and cook on low for 5–6 hours or high for 3–4 hours, until the vegetables are tender and the chili is hot throughout.
5. Cool promptly and divide into containers.
Reheat: Reheat a portion in a covered saucepan over medium-low heat, stirring until steaming throughout; loosen with a little broth if needed. Microwave covered portions, stirring halfway.

Dish 3: Chicken, Rice, and Broccoli Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and 9-by-13-inch baking dish
Prep: 25 min | Cook: 55 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.5 pounds | Optional: False
- Dry brown rice | ID: brown-rice-dry | Quantity: 1.5 cups | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 1 large head | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Whole milk | ID: milk-whole | Quantity: 1 cup | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 1.5 cups | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat the oven to 375°F. Cut chicken into bite-size pieces, dice the onion, mince the garlic, and chop the broccoli into small florets.
2. Spread the dry rice in a greased 9-by-13-inch baking dish. Arrange chicken, onion, garlic, and broccoli over it.
3. Whisk broth, milk, salt, and pepper together and pour evenly into the dish. Cover tightly with foil.
4. Bake for 45 minutes. Check that the rice is tender and chicken reaches 165°F; if needed, cover and bake 5–10 minutes longer.
5. Sprinkle with cheddar, uncover, and bake 5 minutes until melted. Rest 10 minutes, then portion.
Reheat: Reheat covered portions in a 350°F oven until hot throughout, or microwave covered with a spoonful of water, stirring midway. Keep covered to prevent the rice from drying.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `27f4b33adf821f2674fae84f` — fixture R34

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
Explanation: Generated three eight-serving Dutch oven recipes utilizing the Dutch oven braise method with compliant pantry items and realistic timings.

Dish 1: Classic Beef Pot Roast
Servings: 8 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 20 min | Cook: 180 min
Ingredients:
- Raw boneless beef chuck roast | ID: beef-chuck-roast-boneless-raw | Quantity: 3.5 lbs | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 6 cloves | Optional: False
- Beef broth | ID: beef-broth | Quantity: 3 cups | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 large | Optional: False
- Fresh Yukon Gold potatoes | ID: yukon-gold-potatoes-fresh | Quantity: 2 lbs | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
Steps:
1. Preheat the oven to 325 degrees F (165 degrees C).
2. Season the beef chuck roast generously with salt and black pepper.
3. Heat olive oil in a large Dutch oven over medium-high heat on the stove.
4. Sear the chuck roast on all sides until nicely browned, about 3 to 4 minutes per side, then remove the roast.
5. Add chopped onions and minced garlic to the Dutch oven, cooking until softened and fragrant.
6. Pour in the beef broth, scraping up any browned bits from the bottom of the pot.
7. Return the roast to the pot, add the bay leaves, and surround with peeled and chopped carrots and Yukon gold potatoes.
8. Cover the Dutch oven with its tight-fitting lid and transfer to the preheated oven.
9. Braise for 3 hours until the beef is fork-tender and vegetables are cooked through.
Reheat: Reheat gently in a covered pot on the stove over medium-low heat with a splash of beef broth until warmed through.

Dish 2: Hearty Beef and Root Vegetable Stew
Servings: 8 | Style: CHILI_SOUP | Appliance: Dutch Oven
Prep: 25 min | Cook: 150 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 3 lbs | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- All-purpose wheat flour | ID: all-purpose-flour | Quantity: 3 tbsp | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 4 stalks | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
Steps:
1. Toss the beef stew meat with all-purpose flour, salt, and black pepper.
2. Heat olive oil in a Dutch oven over medium-high heat and brown the beef in batches, then set aside.
3. Add chopped onions, minced garlic, and sliced celery to the pot, sautéing until tender.
4. Stir in the tomato paste and cook for 2 minutes.
5. Pour in the beef broth, scraping the bottom of the pot, and return the beef to the Dutch oven.
6. Add dried thyme and cubed sweet potatoes, bringing the mixture to a gentle simmer.
7. Cover with the lid and simmer on low heat on the stovetop or in a 300 degrees F oven for 2.5 hours until the meat and vegetables are exceptionally tender.
Reheat: Reheat in a heavy-bottomed pot over medium-low heat, stirring occasionally. Add water or broth if the stew has thickened too much in storage.

Dish 3: Braised Pork Shoulder and Cabbage
Servings: 8 | Style: STEW_BRAISE | Appliance: Dutch Oven
Prep: 20 min | Cook: 180 min
Ingredients:
- Pork shoulder | ID: pork-shoulder-butt | Quantity: 3.5 lbs | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Fresh onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 5 cloves | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2.5 cups | Optional: False
- Apple cider vinegar | ID: apple-cider-vinegar | Quantity: 3 tbsp | Optional: False
- Green cabbage | ID: green-cabbage | Quantity: 1 head | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Caraway seeds | ID: caraway-seeds | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat the oven to 325 degrees F (165 degrees C).
2. Season the pork shoulder thoroughly with salt and black pepper.
3. Heat olive oil in a Dutch oven over medium-high heat and sear the pork shoulder until well-browned on all sides.
4. Remove the pork and sauté the sliced onions and minced garlic until translucent.
5. Deglaze the pot with apple cider vinegar and chicken broth, scraping up any browned bits.
6. Return the pork shoulder to the pot, add caraway seeds, and scatter sliced carrots around the meat.
7. Cover the Dutch oven tightly and braise in the oven for 2 hours.
8. Remove from oven, add roughly chopped green cabbage wedges around the pork, cover, and return to the oven for an additional 45 minutes until the pork falls apart easily.
Reheat: Reheat covered in the oven at 325 degrees F for 25-30 minutes, or gently on the stovetop with a splash of chicken broth until warmed through.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `27fa99ccd4f062f18a71aa7c` — fixture R20

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
Explanation: Each dish uses generic raw salmon fillets without specifying a species. Quantities are for six servings; pantry availability does not establish the amount on hand.

Dish 1: Lemon-Dill Salmon and Potato Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 900 g | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1200 g | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 600 g | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Lemon | ID: lemon-fresh | Quantity: 1 whole | Optional: False
- Dried dill | ID: dill-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F (220°C). Dice potatoes small and toss with 2 tablespoons oil and half the salt and pepper. Roast in a large baking dish for 20 minutes.
2. Add chopped broccoli tossed with the remaining oil. Roast for 8 minutes.
3. Nestle salmon among the vegetables. Season with remaining salt, pepper and dill; squeeze lemon over the dish. Bake 12–15 minutes, until the potatoes are tender and the salmon reaches 145°F (63°C). Divide into six portions.
Reheat: Refrigerate promptly in covered portions for up to 3–4 days. Reheat covered with a splash of water until the salmon reaches 165°F (74°C).

Dish 2: Coconut Salmon and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop and large deep skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 900 g | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 800 ml | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 whole | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 whole | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 300 g | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tbsp | Optional: False
Steps:
1. Dice the onion and peppers. Cut salmon into large chunks, removing any skin and bones.
2. Heat oil in the skillet over medium heat. Cook onion and peppers for 6–8 minutes, then stir in curry powder for 30 seconds.
3. Add coconut milk and salt; simmer for 5 minutes. Add salmon and simmer gently for 8–10 minutes, until it reaches 145°F (63°C).
4. Stir in spinach until wilted and finish with lime juice. Divide into six portions.
Reheat: Refrigerate promptly in covered portions for up to 3–4 days. Reheat gently, stirring occasionally, until the salmon and sauce reach 165°F (74°C).

Dish 3: Tomato, White Bean and Salmon Stew
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop and large pot
Prep: 15 min | Cook: 25 min
Ingredients:
- Raw salmon fillets | ID: salmon-fillets-raw | Quantity: 900 g | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 2 400 g cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 800 g | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 500 ml | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 whole | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 whole | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice onion and carrots and mince garlic. Drain and rinse beans. Cut salmon into large chunks, removing any skin and bones.
2. Heat oil in the pot over medium heat. Cook onion and carrots for 6 minutes, then add garlic and oregano for 30 seconds.
3. Add tomatoes, broth, beans, salt and pepper. Simmer for 10 minutes, until carrots are tender.
4. Add salmon and simmer gently for 8–10 minutes, until it reaches 145°F (63°C). Divide into six portions.
Reheat: Refrigerate promptly in covered portions for up to 3–4 days. Reheat gently until the stew and salmon reach 165°F (74°C).
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `2a65e77540055f1b6068567a` — fixture R35

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R35",
  "category": "vessel",
  "task": "generate",
  "prompt": "Use a deep skillet for six servings; avoid a separate oven step.",
  "context": {
    "catalogVersion": "2026-11-07.4",
    "targetServings": 6,
    "macroGoal": "ANY",
    "dietaryConstraints": [],
    "vessel": "BIG_BATCH_SKILLET",
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
      "Use a deep skillet for six servings; avoid a separate oven step."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three distinct one-pot skillet dishes for six servings, all cooked on the stovetop in a deep big-batch skillet with no separate oven step. No dietary constraints apply. Olive oil and garlic are marked available; other ingredients are proposed as shopping items with null ingredient IDs where not in the catalog. No prices are stated.

Dish 1: Skillet Ground Beef Chili with Black Beans
Servings: 6 | Style: CHILI_SOUP | Appliance: Deep big-batch skillet
Prep: 15 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Ground beef | ID: ground-beef-80-20 | Quantity: 2 lb | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Beef broth | ID: beef-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Cheddar cheese, shredded (garnish) | ID: cheddar-cheese | Quantity: 1 cup | Optional: True
Steps:
1. Heat olive oil in the deep skillet over medium-high heat.
2. Add onions and cook 5 minutes until softened, then add garlic for 1 minute.
3. Add ground beef and cook, breaking up, until browned; drain excess fat.
4. Stir in chili powder and cumin for 30 seconds.
5. Add crushed tomatoes, black beans, beef broth, and salt. Bring to a simmer.
6. Reduce heat to low, cover partially, and simmer 25 minutes, stirring occasionally.
7. Top individual portions with cheddar if desired.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat covered over medium-low with a splash of water, stirring until hot throughout.

Dish 2: Skillet Chicken Thigh Curry with Chickpeas and Spinach
Servings: 6 | Style: CURRY_SKILLET | Appliance: Deep big-batch skillet
Prep: 15 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Boneless skinless chicken thighs, cubed | ID: chicken-thighs-boneless | Quantity: 2.5 lb | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Garam masala | ID: garam-masala | Quantity: 1 tsp | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 6 cups | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tbsp | Optional: True
Steps:
1. Heat olive oil in the deep skillet over medium heat.
2. Cook onion 5 minutes, then add garlic and ginger for 1 minute.
3. Add chicken and cook 4 minutes until lightly browned.
4. Stir in curry powder and garam masala for 30 seconds.
5. Add coconut milk, chickpeas, and salt. Simmer uncovered 15 minutes until chicken is cooked through.
6. Stir in spinach until wilted and finish with lime juice if using.
Reheat: Refrigerate up to 4 days or freeze up to 2 months. Reheat covered over medium-low, adding a splash of water if thickened, until steaming hot.

Dish 3: Skillet Italian Sausage and White Bean Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Deep big-batch skillet
Prep: 15 min | Cook: 35 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Raw Italian pork sausage, casings removed | ID: italian-pork-sausage-raw | Quantity: 2 lb | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Canned cannellini beans, drained | ID: cannellini-beans-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Hard Parmesan, grated (garnish) | ID: parmesan-hard | Quantity: 0.5 cup | Optional: True
Steps:
1. Heat olive oil in the deep skillet over medium-high heat.
2. Brown sausage in pieces, about 6 minutes, then transfer to a plate, leaving some fat.
3. Add onion, carrots, and celery; cook 5 minutes. Add garlic for 1 minute.
4. Return sausage to the skillet with beans, tomatoes, broth, and Italian seasoning.
5. Bring to a simmer, reduce heat to low, and cook uncovered 25 minutes until thickened.
6. Top individual portions with Parmesan if desired.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat covered over medium-low with a splash of broth until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `2a7cb077dc828c9935c4b81b` — fixture R31

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R31",
  "category": "remix",
  "task": "remix",
  "prompt": "Remix the seed plan using the current pantry: fresh garlic is No. Historical availability is not current evidence.",
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
      "explicit_no_and_form_boundaries",
      "apply_requested_remix",
      "historical_state_not_current_ownership"
    ],
    "reviewNotes": [
      "Remix the seed plan using the current pantry: fresh garlic is No. Historical availability is not current evidence."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Each remix uses garlic powder instead of fresh garlic. Other ingredients may need to be purchased; pantry quantities are not specified.

Dish 1: Ginger Turkey Tomato Pot
Servings: 6 | Style: STEW_BRAISE | Appliance: Large stovetop pot
Prep: 10 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 0.75 tsp | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
Steps:
1. Dice the onions. Brown the turkey in the pot, breaking it up, then add the onions and cook until softened.
2. Stir in garlic powder, ginger and tomatoes. Simmer for 20 minutes, stirring occasionally, until the turkey reaches 165°F.
3. Divide into six portions and top with grated cheddar.
Reheat: Reheat covered in the microwave or on the stovetop until 165°F, adding a splash of water if needed.

Dish 2: Turkey and Black Bean Tomato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stovetop pot
Prep: 10 min | Cook: 30 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 0.75 tsp | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.5 tsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
Steps:
1. Dice the onions. Brown the turkey in the pot, then add onions and cook until softened.
2. Stir in garlic powder, ginger and chili powder. Add tomatoes and drained, rinsed beans.
3. Simmer for 20 minutes until the turkey reaches 165°F. Divide into six portions and top with grated cheddar.
Reheat: Reheat in the microwave or on the stovetop until 165°F; loosen with a little water if needed.

Dish 3: Turkey Tomato and Zucchini Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and stovetop skillet
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 0.75 tsp | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 0.5 tsp | Optional: False
- Fresh zucchini | ID: zucchini-fresh | Quantity: 1.5 lb | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
Steps:
1. Heat the oven to 400°F. Dice the onions and slice the zucchini.
2. Brown the turkey in a skillet; add onions and cook until softened. Stir in garlic powder, ginger and tomatoes.
3. Transfer the turkey mixture and zucchini to a baking dish and mix. Cover and bake for 25 minutes, until the zucchini is tender and the turkey reaches 165°F.
4. Uncover, sprinkle with grated cheddar and bake for 5 minutes more. Divide into six portions.
Reheat: Reheat covered in the microwave or oven until 165°F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

# Blinded recipe review — batch 18

[Review instructions](../REVIEWING.md) · [All batches](../README.md) · [Compact grading sheet](../grades.json)

All grading fields are blank. Schema status below is an automatic format check, not a dietary or quality grade.

## Review `dffa57fb1cebc772be77ec10` — fixture R07

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
Explanation: Three dairy-free batch meals for six; dairy pantry items are deliberately excluded.

Dish 1: Smoky Bean and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 360 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 large | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 1 15-ounce can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 2 28-ounce cans | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Heat olive oil in a skillet over medium heat. Cook onion for 4 minutes; stir in garlic for 30 seconds.
2. Add onion mixture and all remaining ingredients to the slow cooker. Stir to combine.
3. Cover and cook on low for 6 hours, until the sweet potatoes are tender. Stir before serving.
Reheat: Refrigerate promptly in covered portions for up to 4 days. Reheat on the stovetop over medium-low heat, stirring occasionally, until steaming; add a splash of water or broth if thick.

Dish 2: Coconut Chickpea and Red Lentil Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large covered Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Ground turmeric | ID: turmeric-ground | Quantity: 1 teaspoon | Optional: False
- Dried red lentils, rinsed | ID: red-lentils-dried | Quantity: 1.5 cups | Optional: False
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 14-ounce can | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 13.5-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Dry basmati rice, for serving | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
Steps:
1. In a covered Dutch oven, heat oil over medium heat. Cook onion until softened, about 5 minutes. Add garlic, ginger, curry powder, and turmeric; stir for 1 minute.
2. Stir in lentils, chickpeas, tomatoes, coconut milk, broth, and salt. Bring to a boil, then cover and simmer gently for 30–35 minutes, stirring occasionally, until lentils are soft.
3. Meanwhile, cook rice according to package directions. Stir spinach into the curry until wilted; serve over rice.
Reheat: Store curry and rice separately in covered portions, refrigerated for up to 4 days. Reheat curry on the stovetop with a little water until bubbling throughout; reheat rice with a splash of water, covered, until steaming.

Dish 3: Tomato White Bean and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart heavy-bottomed Dutch oven
Prep: 20 min | Cook: 55 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Celery, sliced | ID: celery-stalks | Quantity: 3 stalks | Optional: False
- Fresh cremini mushrooms, quartered | ID: mushrooms-cremini-fresh | Quantity: 8 ounces | Optional: False
- Potatoes, cut into 1-inch pieces | ID: potatoes-fresh | Quantity: 1.5 pounds | Optional: False
- Canned Great Northern beans, drained and rinsed | ID: great-northern-beans-canned | Quantity: 2 15-ounce cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-ounce can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 teaspoons | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
- Fresh kale, chopped | ID: kale-fresh | Quantity: 4 cups | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat. Cook onion, carrots, celery, and mushrooms for 7 minutes, stirring occasionally. Add garlic and cook 30 seconds.
2. Add potatoes, beans, tomatoes, broth, Italian seasoning, bay leaf, salt, and pepper. Bring to a boil, then cover and simmer gently for 35–40 minutes, until potatoes are tender.
3. Remove the bay leaf. Stir in kale and simmer uncovered for 5 minutes, until wilted. Taste and adjust seasoning if needed.
Reheat: Cool and refrigerate in covered portions for up to 4 days. Reheat gently on the stovetop, stirring occasionally, until the stew is bubbling and hot throughout; loosen with broth or water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e054392ad4d5db78b7fa61a7` — fixture R08

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
Explanation: Three reheatable gluten-free batch meals for 6; wheat flour is omitted to honor the mandatory dietary constraint.

Dish 1: Tomato Beef and Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 25 min | Cook: 420 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Fresh potatoes, cubed | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 cups | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Beef broth labeled gluten-free | ID: beef-broth | Quantity: 3 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 teaspoon | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 1 leaf | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Add beef, potatoes, carrots, onion, and garlic to the slow cooker.
2. Whisk broth with crushed tomatoes, tomato paste, olive oil, thyme, salt, and pepper; pour over the ingredients and add the bay leaf.
3. Cover and cook on LOW for 7 hours, until beef is fork-tender and potatoes are cooked through. Remove bay leaf and stir.
4. Cool leftovers promptly and refrigerate in portions. Reheat on the stovetop over medium-low heat, stirring occasionally, until steaming hot; add a splash of broth if needed.
Reheat: Reheat covered on the stovetop over medium-low heat, stirring occasionally, until steaming hot; loosen with a little gluten-free broth if thick.

Dish 2: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 6-quart Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 cans (15 oz each) | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 cans (13.5 oz each) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (14.5 oz) | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 oz | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Gluten-free curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water, for rice | ID: water | Quantity: 3 cups | Optional: False
Steps:
1. Rinse rice. In a saucepan, combine rice and water, bring to a boil, cover, and simmer according to package directions until tender; keep warm.
2. Heat oil in the Dutch oven over medium heat. Cook onion for 5 minutes until soft, then stir in garlic, ginger, curry powder, and cumin for 30 seconds.
3. Add chickpeas, coconut milk, tomatoes, and salt. Bring to a gentle simmer and cook uncovered for 20 minutes, stirring occasionally.
4. Stir in spinach and cook until wilted, about 2 minutes. Serve over rice. Use curry powder labeled gluten-free and check all packaged ingredients for gluten-containing additives.
5. Refrigerate curry and rice promptly in separate portions. Reheat until steaming hot, stirring the curry; add a splash of water or coconut milk if needed.
Reheat: For best texture, reheat curry and rice separately in the microwave or on the stovetop until steaming hot; add a spoonful of water to the rice and a splash of liquid to the curry if needed.

Dish 3: Black Bean, Sweet Potato and Pepper Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart stovetop Dutch oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 3 cans (15 oz each) | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Vegetable broth labeled gluten-free | ID: vegetable-broth | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Gluten-free chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tablespoons | Optional: True
Steps:
1. Heat oil in the Dutch oven over medium heat. Add onion and bell peppers; cook for 5 minutes, stirring until softened.
2. Stir in garlic, chili powder, cumin, and smoked paprika; cook for 30 seconds.
3. Add sweet potatoes, beans, crushed tomatoes, broth, and salt. Bring to a boil, then reduce to a gentle simmer.
4. Cover partially and simmer for 30–35 minutes, stirring occasionally, until sweet potatoes are tender and chili has thickened. Stir in lime juice if using. Check spice labels and broth for gluten-free status.
5. Cool promptly and refrigerate in individual portions. Reheat on the stovetop over medium heat, stirring until bubbling gently and steaming hot; thin with a little water if desired.
Reheat: Reheat on the stovetop over medium heat, stirring occasionally until steaming hot; add a splash of water if the chili has thickened in storage.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e0611ea7ab4e2044e3c1a220` — fixture R09

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
Explanation: Generated three distinct, practical, reheatable batch meal plans tailored to target servings of 6 using standard pantry items since the pantry was empty.

Dish 1: Hearty Beef and Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop
Prep: 20 min | Cook: 120 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2.5 pounds | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 3 medium | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 whole | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 whole | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Cut the beef into bite-sized pieces and season with salt and pepper.
2. Heat olive oil in a large pot over medium-high heat and brown the beef on all sides.
3. Add chopped onions, carrots, and diced potatoes to the pot.
4. Pour in the beef broth, bring to a boil, then reduce heat to low, cover, and simmer for 2 hours until the beef is tender.
5. Divide into storage containers for future meals.
Reheat: Reheat on the stovetop over medium heat with a splash of water or broth until hot throughout, stirring occasionally.

Dish 2: Classic Three-Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground beef | ID: ground-beef-80-20 | Quantity: 2 pounds | Optional: False
- Canned kidney beans | ID: kidney-beans-canned | Quantity: 2 cans | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 ounces | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 whole | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tablespoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. In a large pot, cook the ground beef and diced onion over medium heat until the meat is fully browned.
2. Drain excess fat if needed.
3. Stir in the canned crushed tomatoes, drained kidney beans, drained black beans, chili powder, cumin, and salt.
4. Bring the mixture to a simmer, then reduce heat to low and cook uncovered for 45 minutes to let flavors meld.
5. Portion into containers for meal prep.
Reheat: Microwave in a covered container on high for 3 minutes, stir, and heat for an additional 2 minutes until steaming.

Dish 3: Cheesy Potato and Broccoli Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 20 min | Cook: 45 min
Ingredients:
- Fresh Russet potatoes | ID: russet-potatoes-fresh | Quantity: 3 pounds | Optional: False
- Broccoli | ID: broccoli-fresh | Quantity: 1 head | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 2 cups | Optional: False
- Butter | ID: butter-salted-unsalted | Quantity: 4 tablespoons | Optional: False
- Whole milk (3.25%) | ID: milk-whole | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Preheat oven to 375 degrees Fahrenheit (190 degrees Celsius).
2. Peel and slice the potatoes, and cut the broccoli into small florets.
3. Boil the potatoes and broccoli in salted water for 10 minutes, then drain well.
4. In a large bowl, mash the cooked vegetables slightly with butter, milk, salt, and pepper, then fold in half of the cheddar cheese.
5. Transfer the mixture to a greased baking dish and top with the remaining cheddar cheese.
6. Bake for 45 minutes until golden and bubbling.
Reheat: Reheat individual portions in the oven at 350 degrees Fahrenheit for 15 minutes or microwave covered until heated through.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e0a3c6ca5f6e3bfa5d048ae0` — fixture R25

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
Explanation: The zero-weight turkey offer cannot support a unit price; other ingredient prices are unknown.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and mince the garlic; drain and rinse the beans.
2. Heat oil in a large pot. Soften the onion for 5 minutes, then add garlic and chili powder for 30 seconds.
3. Add turkey and cook, breaking it up, until it reaches 165°F. Stir in tomatoes, beans, water and salt.
4. Simmer uncovered for 20 minutes, stirring occasionally. Divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat to 165°F, adding water if needed.

Dish 2: Coconut Chickpea and Sweet Potato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
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
1. Dice the sweet potatoes and onion, mince the garlic, and drain and rinse the chickpeas.
2. Heat oil in a deep skillet. Cook onion for 5 minutes; stir in garlic and curry powder for 30 seconds.
3. Add sweet potatoes, chickpeas, coconut milk, water and salt. Cover and simmer for 20–25 minutes, until the potatoes are tender.
4. Stir in spinach until wilted, then divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat to 165°F, stirring and adding a splash of water if needed.

Dish 3: Chicken and White Bean Tomato Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and carrots, mince the garlic, and drain and rinse the beans.
2. Heat oil in a Dutch oven. Cook onion and carrots for 5 minutes; add garlic and Italian seasoning for 30 seconds.
3. Add chicken, tomatoes, beans, water and salt. Cover and simmer for 25–30 minutes, until the carrots are tender and chicken reaches 165°F.
4. Cut or shred the chicken, return it to the sauce, and divide into six portions.
Reheat: Refrigerate promptly for up to 4 days or freeze. Reheat to 165°F, adding a little water if the sauce is thick.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e0e0aed91d8492f328eb24ad` — fixture R36

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
Explanation: Three distinct six-serving batch dishes using a slow cooker or Instant Pot, each with one specific method. No dietary constraints were supplied, and no offers were supplied, so no prices are stated.

Dish 1: Slow Cooker Beef Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 480 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2.5 lb | Optional: False
- All-purpose wheat flour | ID: all-purpose-flour | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cups | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
Steps:
1. Toss the beef cubes with the flour, salt, and pepper.
2. Heat the olive oil in a skillet over medium-high heat and brown the beef in batches, about 2 minutes per side. Transfer to the slow cooker.
3. Saute the chopped onion and minced garlic in the same skillet for 3 minutes, then stir in the tomato paste for 1 minute.
4. Add the onion mixture, beef broth, potatoes cut into 1-inch chunks, carrots cut into 1-inch pieces, thyme, and bay leaves to the slow cooker and stir.
5. Cover and cook on LOW for 8 hours until the beef is fork-tender. Remove the bay leaves before serving.
Reheat: Refrigerate within 2 hours. Reheat portions in a covered saucepan over medium heat for 10 minutes, adding a splash of broth if thick.

Dish 2: Instant Pot Chicken and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Instant Pot
Prep: 15 min | Cook: 25 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15 oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28 oz can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Select Sauté on the Instant Pot and heat the olive oil.
2. Cook the chopped onion and bell peppers for 4 minutes, then stir in the minced garlic for 30 seconds.
3. Add the chicken thighs, crushed tomatoes, chicken broth, chili powder, cumin, and salt. Drain and rinse the black beans and add them.
4. Cancel Sauté, seal the lid, and cook on HIGH pressure for 10 minutes.
5. Allow a 10-minute natural pressure release, then quick release any remaining pressure. Shred the chicken with two forks and stir it back into the chili.
Reheat: Store cooled chili in airtight containers for up to 4 days. Reheat on the stovetop over medium heat, stirring occasionally, until steaming hot throughout.

Dish 3: Instant Pot Chickpea Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 6-quart Instant Pot
Prep: 15 min | Cook: 20 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Ginger | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned chickpeas | ID: chickpeas-canned | Quantity: 2 15 oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 14.5 oz can | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 13.5 oz can | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 6 cups | Optional: False
Steps:
1. Select Sauté on the Instant Pot and heat the olive oil.
2. Cook the chopped onion for 4 minutes, then add the minced garlic and grated ginger for 1 minute.
3. Stir in the curry powder for 30 seconds until fragrant.
4. Add the drained chickpeas, crushed tomatoes, coconut milk, vegetable broth, and salt. Stir well.
5. Cancel Sauté, seal the lid, and cook on HIGH pressure for 4 minutes. Quick release the pressure.
6. Open the lid, stir in the fresh spinach until wilted, and simmer on Sauté for 2 minutes.
Reheat: Refrigerate for up to 4 days. Reheat in a saucepan over medium heat with a splash of water, stirring until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e2614a87c84edcc557ca2a36` — fixture R38

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
Explanation: Moon dust 731 is kept unmapped; its identity and price are unknown.

Dish 1: Tomato Chickpea Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Moon dust 731 | ID: None | Quantity: 0.25 tsp | Optional: True
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice the onion, mince the garlic, and drain and rinse the chickpeas.
2. Heat oil in a large pot over medium heat. Cook onion for 5 minutes; add garlic and cook for 1 minute.
3. Add chickpeas, tomatoes and salt. Simmer for 20 minutes, adding water if needed.
4. Stir in spinach until wilted. If Moon dust 731 is intended for cooking, add a small amount to taste.
Reheat: Refrigerate in portions and reheat on the stovetop or in the microwave until steaming hot; add a splash of water if thick.

Dish 2: Chicken and Sweet Potato Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oven to 425°F. Cut sweet potatoes into small cubes, slice peppers and mince garlic.
2. Toss vegetables with half the oil and spread on a large baking sheet. Roast for 15 minutes.
3. Toss chicken with remaining oil, garlic, paprika and salt. Add to the sheet and roast for 20–25 minutes, until chicken reaches 165°F and vegetables are tender.
Reheat: Refrigerate in portions and reheat covered in the microwave or oven until hot throughout.

Dish 3: Red Lentil Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop
Prep: 10 min | Cook: 30 min
Ingredients:
- Dried red lentils | ID: red-lentils-dried | Quantity: 2 cups | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 14 oz | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Rinse lentils. Dice onion and carrots and mince garlic.
2. Heat oil in a large deep skillet or pot. Cook onion and carrots for 5 minutes; add garlic and curry powder and cook for 1 minute.
3. Add lentils, coconut milk and broth. Simmer, stirring occasionally, for 20–25 minutes until lentils and carrots are tender. Add salt and water as needed.
Reheat: Refrigerate in portions and reheat until steaming hot, adding water to loosen the curry.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e2c2203a5d19f7b5fb9bfc4a` — fixture R39

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
Explanation: The request asks for gluten-free recipes made only with wheat pasta with no substitutions. Wheat pasta contains gluten, so it cannot satisfy the mandatory GLUTEN_FREE dietary constraint. Please either allow a gluten-free pasta (for example, rice or corn pasta) or drop the wheat-pasta requirement so gluten-free dishes can be generated.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e32df04536a94d3ec58a71d5` — fixture R13

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
Explanation: Three distinct low-effort reheatable batch dishes for 6 servings using catalog IDs where exact matches exist; salt and olive oil are pantry-available, other ingredients are proposed shopping items with null IDs where no exact catalog match. No dietary constraints apply; no prices are invented.

Dish 1: Classic Beef Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven on stovetop
Prep: 20 min | Cook: 150 min
Ingredients:
- Raw beef stew meat | ID: beef-stew-meat-raw | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 2 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Celery | ID: celery-stalks | Quantity: 3 stalk | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Beef broth | ID: beef-broth | Quantity: 4 cup | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
Steps:
1. Pat beef dry, season with salt and pepper.
2. Heat olive oil in Dutch oven over medium-high; brown beef in batches and set aside.
3. Saute onion, carrot, and celery 5 minutes; add garlic and tomato paste and cook 1 minute.
4. Return beef, add broth, thyme, and bay leaf; bring to simmer.
5. Cover and simmer over low heat 1.5 hours until beef is tender.
6. Add potatoes and simmer uncovered 25 minutes until tender. Remove bay leaf, adjust seasoning, and divide into containers.
Reheat: Refrigerate up to 4 days or freeze up to 3 months; reheat gently on stovetop with a splash of water or broth.

Dish 2: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large pot on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 can (15 oz) | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
Steps:
1. Heat olive oil in pot over medium-high; brown turkey, breaking it up, about 6 minutes.
2. Add onion and bell pepper and cook 5 minutes; add garlic and spices and cook 1 minute.
3. Stir in crushed tomatoes, drained beans, and broth.
4. Simmer uncovered 30 minutes, stirring occasionally, until thickened. Season with salt and portion into containers.
Reheat: Refrigerate up to 4 days or freeze up to 3 months; reheat in a covered pot over medium heat, adding a little water if thick.

Dish 3: Sheet Pan Sausage and Potato Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Large sheet pan in oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Raw smoked sausage | ID: smoked-sausage-raw | Quantity: 2 lb | Optional: False
- Fresh red potatoes | ID: red-potatoes-fresh | Quantity: 2 lb | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 1 tsp | Optional: False
Steps:
1. Preheat oven to 425 F.
2. Cut potatoes into 1-inch pieces, sausage into rounds, peppers and onion into chunks.
3. Toss everything with olive oil, salt, pepper, paprika, and garlic powder.
4. Spread on a large sheet pan in a single layer and roast 35-40 minutes, turning once, until potatoes are tender and sausage is browned.
5. Cool and divide into containers.
Reheat: Refrigerate up to 4 days; reheat in a 375 F oven for 12-15 minutes or in a skillet until hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e33129fdd115ae800d37a089` — fixture R19

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
Explanation: Three batch meals using raw andouille; check the sausage package for its required safe cooking temperature.

Dish 1: Andouille, White Bean and Kale Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 lb | Optional: False
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Fresh kale | ID: kale-fresh | Quantity: 1 bunch | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
Steps:
1. Dice the onion and carrots; chop the kale. Drain and rinse the beans.
2. Heat oil in a Dutch oven. Cook the raw andouille whole over medium heat, turning, until the center reaches at least 160°F, or 165°F if made with poultry. Transfer to a clean plate and slice.
3. Cook onion and carrots in the pot for 5 minutes. Add thyme, broth and beans; simmer for 15 minutes.
4. Add kale and sliced sausage; simmer for 5 minutes until the kale is tender. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat with a splash of broth until steaming and 165°F throughout.

Dish 2: Andouille, Pepper and Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and stovetop skillet
Prep: 15 min | Cook: 55 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 lb | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2.5 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oven to 375°F. Dice peppers and onion; rinse the rice.
2. Heat oil in a skillet. Cook the raw andouille whole, turning, until the center reaches at least 160°F, or 165°F if made with poultry. Transfer to a clean plate and slice.
3. Mix rice, peppers, onion, tomatoes, broth and oregano in a deep 9-by-13-inch baking dish. Cover tightly with foil and bake for 40 minutes.
4. Check that rice is tender; if needed, add a little water and bake covered 5–10 minutes longer. Stir in sausage and heat through, then divide into six portions.
Reheat: Cool and refrigerate promptly in shallow containers. Reheat covered with a splash of water until 165°F throughout.

Dish 3: Andouille, Sweet Potato and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop stockpot
Prep: 15 min | Cook: 40 min
Ingredients:
- Raw andouille sausage | ID: andouille-raw | Quantity: 1.5 lb | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 3 15-oz cans | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Chili powder | ID: chili-powder | Quantity: 1 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Dice the sweet potatoes and onion. Drain and rinse the beans.
2. Heat oil in a stockpot. Cook the raw andouille whole over medium heat, turning, until the center reaches at least 160°F, or 165°F if made with poultry. Transfer to a clean plate and slice.
3. Cook onion in the pot for 5 minutes. Stir in chili powder, sweet potatoes, tomatoes and broth. Cover and simmer for 20–25 minutes, until the potatoes are tender.
4. Stir in beans and sliced sausage; simmer for 5 minutes. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat on the stovetop or in the microwave until 165°F throughout, adding water if thick.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e341b884818c252c81be256e` — fixture R07

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
Explanation: All three dishes are dairy-free. Butter, whole milk and cheddar from the pantry are excluded, and no dairy garnish or dairy reheating step is used. Pantry evidence is limited to olive oil and garlic, so other ingredients are listed as shopping items. No prices or savings are stated.

Dish 1: Turkey Kidney Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Dutch oven on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 30 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat olive oil in a Dutch oven over medium heat and cook onion until soft, about 5 minutes.
2. Add garlic, turkey, chili powder and cumin, and brown the turkey while breaking it apart, about 6 minutes.
3. Stir in crushed tomatoes, kidney beans, salt and pepper, and add 1 cup water if the chili looks thick.
4. Simmer uncovered over low heat for 30 minutes, stirring occasionally, until thickened.
5. Cool completely, then refrigerate in airtight containers.
Reheat: Reheat portions in a covered saucepan over medium-low heat with a splash of water, stirring until hot throughout, about 165 F.

Dish 2: Beef and Root Vegetable Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Large heavy pot or Dutch oven on stovetop
Prep: 20 min | Cook: 120 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Raw beef stew meat, cut into 1-inch pieces | ID: beef-stew-meat-raw | Quantity: 2.5 lb | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 tsp | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Russet potatoes, cubed | ID: russet-potatoes-fresh | Quantity: 2 medium | Optional: False
- Beef broth | ID: beef-broth | Quantity: 6 cups | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tbsp | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaves | Optional: False
Steps:
1. Season beef with salt and pepper, then brown in batches in olive oil over medium-high heat and set aside.
2. Cook onion and garlic in the same pot for 4 minutes, then stir in tomato paste for 1 minute.
3. Return beef to the pot with broth, thyme and bay leaves, then bring to a simmer.
4. Cover and simmer over low heat for 1 hour 30 minutes.
5. Add carrots and potatoes and simmer uncovered 30 minutes more until tender. Remove bay leaves, cool and refrigerate.
Reheat: Reheat covered over medium-low heat, adding a splash of broth if needed, until steaming and hot throughout, about 165 F.

Dish 3: Chickpea Spinach Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep skillet with lid on stovetop
Prep: 10 min | Cook: 25 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 60 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 27 fl oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in a large skillet over medium heat and cook onion for 5 minutes.
2. Add garlic, ginger and curry powder and stir for 1 minute.
3. Stir in chickpeas, coconut milk, crushed tomatoes and salt, then simmer uncovered 15 minutes.
4. Stir in spinach until wilted, about 2 minutes, then cool and refrigerate.
Reheat: Reheat covered in a skillet over medium heat with a splash of water, stirring until hot throughout, about 165 F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e4f73eb838336d33181df062` — fixture R02

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
Explanation: Three dairy-free batch meals, each serving six.

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
1. Dice the onion and peppers, mince the garlic, and drain and rinse the beans.
2. Heat the oil in a Dutch oven. Cook the onion and peppers for 5 minutes, then add garlic and turkey. Break up the turkey and cook until no longer pink.
3. Stir in spices, salt, tomatoes, beans and water. Simmer uncovered for 20–25 minutes, stirring occasionally; ensure the turkey reaches 165°F.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot and 165°F, adding a splash of water if needed.

Dish 2: Coconut Chickpea and Sweet Potato Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet with lid
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
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and sweet potatoes into small pieces, mince the garlic, and drain and rinse the chickpeas.
2. Heat oil in the skillet and soften the onion for 5 minutes. Add garlic and curry powder and stir for 30 seconds.
3. Add sweet potatoes, chickpeas, coconut milk, water and salt. Cover and simmer for 20–25 minutes, until the sweet potatoes are tender.
4. Stir in spinach until wilted. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat to 165°F, stirring and adding water if the sauce has thickened.

Dish 3: Chicken, Potato and Carrot Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven with lid
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Dairy-free chicken broth | ID: chicken-broth | Quantity: 3 cups | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Cut chicken into large pieces, potatoes into roughly 1-inch chunks, carrots into thick slices, and dice the onion. Mince the garlic.
2. Heat oil in the Dutch oven and cook the onion for 5 minutes. Add garlic and thyme and stir briefly.
3. Add chicken, vegetables, dairy-free broth, salt and pepper. Bring to a simmer, cover and cook for 30–35 minutes, until vegetables are tender and chicken reaches 165°F.
Reheat: Refrigerate promptly in shallow containers. Reheat to 165°F on the stovetop or in the microwave, adding broth or water as needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e536f3f5888bfb2cfdc4c83e` — fixture R12

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
Explanation: Three distinct chickpea and onion batch dishes for 6 servings. Pantry items are canned chickpeas and onions. Other items are proposed shopping additions, not pantry evidence. No prices are stated.

Dish 1: Chickpea and Onion Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch deep skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 cans (15 oz each) | Optional: False
- Onions, thinly sliced | ID: onions-fresh | Quantity: 2 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tablespoons | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 can (13.5 oz) | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 ounces | Optional: True
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in the skillet over medium heat. Add sliced onions and cook 8 minutes until golden.
2. Stir in garlic, ginger, and curry powder. Cook 1 minute until fragrant.
3. Add crushed tomatoes, coconut milk, chickpeas, and salt. Simmer uncovered 15 minutes, stirring occasionally.
4. Stir in spinach if using and cook until wilted, about 2 minutes. Adjust salt and serve.
Reheat: Refrigerate up to 4 days. Reheat covered over medium-low heat with a splash of water, stirring until hot throughout.

Dish 2: Smoky Chickpea and Onion Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven with lid
Prep: 10 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 cans (15 oz each) | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Chili powder | ID: chili-powder | Quantity: 3 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 can (28 oz) | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Bell peppers, diced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium heat. Add onions and bell peppers and cook 7 minutes.
2. Stir in garlic, chili powder, and cumin. Cook 1 minute.
3. Add crushed tomatoes, broth, chickpeas, and salt. Bring to a boil.
4. Reduce heat, cover, and simmer 25 minutes, stirring occasionally, until thickened.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat on the stove over medium heat, adding broth if too thick.

Dish 3: Mediterranean Chickpea and Onion Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart Dutch oven with lid
Prep: 15 min | Cook: 45 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 3 cans (15 oz each) | Optional: False
- Onions, cut into wedges | ID: onions-fresh | Quantity: 2 large | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Garlic, sliced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tablespoons | Optional: False
- Tomato paste | ID: tomato-paste | Quantity: 2 tablespoons | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 4 cups | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 2 teaspoons | Optional: False
- Black pepper | ID: black-pepper | Quantity: 1 teaspoon | Optional: False
- Lemon juice and zest | ID: lemon-fresh | Quantity: 1 lemon | Optional: True
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat. Add onion wedges and carrots and cook 6 minutes until browned at edges.
2. Stir in garlic and tomato paste and cook 1 minute.
3. Add broth, oregano, pepper, salt, and chickpeas. Bring to a simmer, cover, and cook 35 minutes until carrots are tender.
4. Uncover and simmer 5 minutes to reduce slightly. Finish with lemon juice and zest if using.
Reheat: Refrigerate up to 4 days. Reheat covered over medium-low heat with a splash of broth until steaming.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e57092ca983c9bb7c5d72b58` — fixture R33

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
Explanation: Three distinct four-serving sheet-pan batch meals with practical oven methods and reheating instructions.

Dish 1: Lemon-Garlic Chicken and Potatoes
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Rimmed sheet pan and oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.25 lb | Optional: False
- Fresh potatoes, cut into 1-inch chunks | ID: potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Carrots, cut into chunks | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Lemon, juiced | ID: lemon-fresh | Quantity: 1 lemon | Optional: False
- Dried oregano | ID: dried-oregano | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.75 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Heat oven to 425°F (220°C). Line a rimmed sheet pan with foil or parchment.
2. Toss potatoes and carrots with half the oil, half the garlic, and half the salt and pepper. Spread on the pan and roast for 15 minutes.
3. Mix remaining oil, garlic, lemon juice, oregano, and remaining salt and pepper. Coat chicken with the mixture.
4. Move vegetables to make space, add chicken, and roast 20–25 minutes more, until chicken reaches 165°F (74°C) and vegetables are tender.
5. Divide into four containers, including the pan juices. Cool promptly and refrigerate.
Reheat: Reheat a portion covered in the microwave for 2–3 minutes, stirring or turning halfway, until steaming hot. For crisper potatoes, reheat on a sheet pan at 375°F (190°C) for about 12 minutes.

Dish 2: Smoky Sausage, Peppers, and Sweet Potatoes
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Rimmed sheet pan and oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Fully cooked smoked sausage, sliced | ID: smoked-sausage-fully-cooked | Quantity: 1 lb | Optional: False
- Sweet potatoes, cut into 1-inch chunks | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Bell peppers, sliced | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Onion, cut into wedges | ID: onions-fresh | Quantity: 1 large | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1.5 tbsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Garlic powder | ID: garlic-powder | Quantity: 0.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.25 tsp | Optional: False
Steps:
1. Heat oven to 425°F (220°C). Line a rimmed sheet pan for easier cleanup.
2. Toss sweet potatoes with olive oil, paprika, garlic powder, salt, and pepper. Spread in a single layer and roast for 15 minutes.
3. Add bell peppers, onion, and sliced sausage. Toss everything together and spread evenly.
4. Roast for 18–20 minutes, turning once, until the sweet potatoes are tender and the sausage is hot and lightly browned.
5. Divide evenly among four containers and cool promptly before refrigerating.
Reheat: Microwave a portion covered for 2–3 minutes, stirring halfway, until hot throughout. Alternatively, spread on a sheet pan and heat at 375°F (190°C) for 10–12 minutes.

Dish 3: Chickpea, Cauliflower, and Zucchini Curry Tray Bake
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Rimmed sheet pan and oven
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 2 15-ounce cans | Optional: False
- Cauliflower, cut into small florets | ID: cauliflower-fresh | Quantity: 1 large head | Optional: False
- Zucchini, cut into chunks | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Onion, cut into wedges | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Salt | ID: salt | Quantity: 0.75 tsp | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 0.5 cup | Optional: False
- Lime juice | ID: lime-juice | Quantity: 1 tbsp | Optional: False
Steps:
1. Heat oven to 425°F (220°C). Line a rimmed sheet pan with foil or parchment.
2. In a large bowl, stir oil, curry powder, garlic, and salt together. Toss with cauliflower, zucchini, onion, and chickpeas until coated.
3. Spread the mixture evenly on the pan and roast for 25–30 minutes, stirring once, until cauliflower is tender and browned at the edges.
4. Warm coconut milk in a small microwave-safe bowl or saucepan, then stir in lime juice. Drizzle over the tray-bake and toss gently.
5. Divide into four containers, spooning any sauce over the vegetables and chickpeas. Cool promptly and refrigerate.
Reheat: Microwave a portion covered for 2–3 minutes, stirring halfway, until steaming hot; add a small splash of water or coconut milk if it seems dry.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e6ba0da7664acf6ebd8942ce` — fixture R32

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
Explanation: Remixed the turkey-and-tomato seed into three batch-friendly variations, using fresh grated ginger in place of ground ginger throughout.

Dish 1: Fresh Ginger Turkey Tomato Pot
Servings: 6 | Style: STEW_BRAISE | Appliance: Dutch oven on stovetop
Prep: 15 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, finely grated | ID: ginger-fresh | Quantity: 1.5 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, grated | ID: cheddar-cheese | Quantity: 3 oz | Optional: True
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oil in a Dutch oven over medium heat. Add onion and cook until softened, about 6 minutes.
2. Add turkey, salt, and pepper; break it up and cook until no longer pink, about 8 minutes.
3. Stir in garlic and grated fresh ginger and cook for 30 seconds.
4. Add crushed tomatoes and 1/2 cup water. Bring to a gentle simmer, cover partly, and cook 25 minutes, stirring occasionally.
5. Taste and adjust seasoning. Serve topped with cheddar if desired.
Reheat: Reheat portions covered in a saucepan over medium-low heat, stirring occasionally; add a splash of water if thick. Microwave covered portions, stirring halfway through.

Dish 2: Ginger Turkey Tomato and Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Heavy-bottomed pot on stovetop
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned kidney beans, drained and rinsed | ID: kidney-beans-canned | Quantity: 30 oz | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, finely grated | ID: ginger-fresh | Quantity: 1.5 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: water | Quantity: 1 cup | Optional: False
Steps:
1. Heat oil in a heavy-bottomed pot over medium heat. Cook onion for 5 to 6 minutes until softened.
2. Add turkey and salt; cook, breaking it into small pieces, until no longer pink.
3. Stir in garlic, fresh ginger, chili powder, and cumin; cook 30 seconds.
4. Add tomatoes, beans, and water. Bring to a simmer, then cook uncovered for 25 to 30 minutes, stirring occasionally, until thickened.
5. Taste and adjust seasoning before portioning.
Reheat: Warm gently in a covered pot, stirring now and then and adding a little water if needed. Microwave covered servings, stirring halfway through.

Dish 3: Ginger Turkey Tomato Rice Casserole
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and 9-by-13-inch baking dish
Prep: 20 min | Cook: 65 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Dry basmati rice, rinsed | ID: basmati-rice-dry | Quantity: 1.5 cups | Optional: False
- Onions, diced | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, finely grated | ID: ginger-fresh | Quantity: 1.5 tbsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Cheddar cheese, grated | ID: cheddar-cheese | Quantity: 3 oz | Optional: True
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 375°F (190°C). Lightly oil a 9-by-13-inch baking dish.
2. Heat oil in a skillet over medium heat. Cook onion until softened, about 5 minutes; add turkey, salt, and pepper and cook, breaking it up, until no longer pink.
3. Stir in garlic and fresh ginger for 30 seconds. Add crushed tomatoes and broth and bring to a simmer.
4. Spread rinsed rice in the baking dish. Pour the hot turkey-tomato mixture over it and stir gently to distribute the rice. Cover tightly with foil.
5. Bake 45 minutes, then check that the rice is tender and liquid absorbed. If needed, cover and bake 5 to 10 minutes more. Sprinkle with cheddar if desired and rest 10 minutes before serving.
Reheat: Reheat covered portions in a 350°F (175°C) oven until hot, or microwave covered with a spoonful of water to keep the rice moist.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e7bdbbed2d345fade5983637` — fixture R01

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
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Gluten-free canned black beans | ID: black-beans-canned | Quantity: 2 15-oz cans | Optional: False
- Gluten-free canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28-oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell pepper | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Gluten-free ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Gluten-free smoked paprika | ID: smoked-paprika | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and peppers, mince the garlic, and drain and rinse the beans.
2. Heat the oil in a Dutch oven. Cook the onion and peppers for 5 minutes, then add the garlic, cumin and paprika for 30 seconds.
3. Add the turkey and cook, breaking it up, until no longer pink.
4. Add the beans, tomatoes, water and salt. Simmer uncovered for 25 minutes, stirring occasionally. Ensure the turkey reaches 165°F.
Reheat: Refrigerate promptly in shallow containers. Reheat portions on the stove or in the microwave to 165°F, adding water if needed.

Dish 2: Chicken, Potato and Carrot Braise
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop Dutch oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 1 lb | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Gluten-free dried thyme | ID: thyme-dried | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Gluten-free black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Water | ID: None | Quantity: 2 cups | Optional: False
Steps:
1. Cut the potatoes and carrots into bite-size pieces, dice the onion and mince the garlic.
2. Heat the oil in a Dutch oven and cook the onion for 5 minutes. Add the garlic and thyme and stir briefly.
3. Add the chicken, potatoes, carrots, water, salt and pepper. Bring to a simmer, cover and cook for 30–35 minutes, until the vegetables are tender and the chicken reaches 165°F.
4. Cut or shred the chicken and return it to the pot. Stir and divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat covered to 165°F, adding a splash of water if needed.

Dish 3: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet and saucepan
Prep: 10 min | Cook: 30 min
Ingredients:
- Gluten-free canned chickpeas | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Gluten-free canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Gluten-free curry powder | ID: curry-powder | Quantity: 1 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
- Water | ID: None | Quantity: 3 cups | Optional: False
Steps:
1. Rinse the rice and cook with the water in a covered saucepan according to package directions.
2. Dice the onion, mince the garlic, and drain and rinse the chickpeas.
3. Heat the oil in a deep skillet. Cook the onion for 5 minutes, then stir in the garlic and curry powder for 30 seconds.
4. Add the chickpeas, coconut milk and salt. Simmer for 15 minutes, then stir in the spinach until wilted. Serve over the rice.
Reheat: Cool and refrigerate the curry and rice promptly in shallow containers. Reheat to 165°F, adding a little water to loosen the curry.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e7e88eed50abe18578d1ad72` — fixture R29

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
Explanation: Three chickpea-based remixes of the tomato batch pot; canned chickpeas replace the turkey and do not need browning.

Dish 1: Ginger-tomato chickpea pot
Servings: 6 | Style: STEW_BRAISE | Appliance: Large stovetop pot
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice the onions, mince the garlic, and drain and rinse the chickpeas.
2. Heat oil in the pot and soften onions for 8 minutes. Stir in garlic and ginger for 30 seconds.
3. Add tomatoes, chickpeas, salt and 1 cup water. Simmer for 20 minutes, stirring occasionally.
4. Divide into six portions and sprinkle with shredded cheddar.
Reheat: Refrigerate promptly and reheat portions on the stove or in the microwave until steaming hot; add a splash of water if needed.

Dish 2: Smoky chickpea tomato chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stovetop pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 peppers | Optional: False
- Chili powder | ID: chili-powder | Quantity: 1 tbsp | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice onions and peppers, mince garlic, and drain and rinse chickpeas.
2. Heat oil in the pot; cook onions and peppers for 8 minutes. Add garlic, chili powder and paprika and stir for 30 seconds.
3. Add chickpeas, tomatoes, salt and 1 cup water. Simmer for 25 minutes, stirring occasionally.
4. Serve in six portions topped with shredded cheddar.
Reheat: Refrigerate promptly. Reheat in a covered saucepan or microwave until steaming hot, adding water if the chili has thickened.

Dish 3: Coconut ginger chickpea curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep stovetop skillet
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 4 15-oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 1 tbsp | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice onions, mince garlic, and drain and rinse chickpeas.
2. Heat oil in the skillet and soften onions for 8 minutes. Stir in garlic, ginger and curry powder for 30 seconds.
3. Add tomatoes, coconut milk, chickpeas and salt. Simmer for 20 minutes, stirring occasionally.
4. Stir in spinach until wilted, then divide into six portions.
Reheat: Refrigerate promptly and reheat gently on the stove or in the microwave until steaming hot, stirring and adding a little water if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e7ea542a59ce049363f80b56` — fixture R30

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
Explanation: Remixed the seed turkey tomato batch into three slow cooker dishes for 6 servings, with no oven required. Olive oil and garlic are marked available, but quantities are listed as full-batch needs and no prices are invented.

Dish 1: Slow Cooker Turkey Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart slow cooker (or Instant Pot slow cook mode)
Prep: 15 min | Cook: 360 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned kidney beans, drained | ID: kidney-beans-canned | Quantity: 30 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Shredded cheddar cheese | ID: cheddar-cheese | Quantity: 3 oz | Optional: True
Steps:
1. Heat olive oil in a skillet over medium-high heat and brown the turkey, breaking it up, about 6 to 8 minutes.
2. Add onions and cook 4 minutes until softened, then add garlic and cook 1 minute.
3. Transfer turkey mixture to the slow cooker and stir in crushed tomatoes, drained kidney beans, chili powder and cumin.
4. Cover and cook on LOW for 6 hours, or HIGH for 3 hours, until the flavors have melded.
5. Stir well, portion into containers and top individual servings with cheddar before serving.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat portions in a covered microwave bowl at 70 percent power, stirring halfway, until steaming hot throughout.

Dish 2: Slow Cooker Ginger Turkey Sweet Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker (or Instant Pot slow cook mode)
Prep: 20 min | Cook: 420 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Garam masala | ID: garam-masala | Quantity: 2 tsp | Optional: False
- Sweet potatoes, peeled and cubed | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
Steps:
1. Heat olive oil in a skillet over medium-high heat and brown the turkey, about 6 to 8 minutes.
2. Add onions and cook 4 minutes, then add garlic, ground ginger and garam masala and cook 1 minute more.
3. Transfer to the slow cooker and add sweet potatoes, crushed tomatoes and drained chickpeas. Stir to combine.
4. Cover and cook on LOW for 7 hours or HIGH for 3.5 hours, until sweet potatoes are tender.
5. Mash a few cubes against the side of the pot to thicken slightly, then portion.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat in a covered pot over medium heat with a splash of water, stirring until hot throughout, or microwave covered at 70 percent power.

Dish 3: Slow Cooker Turkey Coconut Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 6-quart slow cooker (or Instant Pot slow cook mode)
Prep: 15 min | Cook: 300 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 1 lb | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Ground ginger | ID: ginger-ground | Quantity: 1 tsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
Steps:
1. Heat olive oil in a skillet over medium-high heat and brown the turkey, about 6 to 8 minutes.
2. Add onions and cook 4 minutes, then add garlic, ground ginger and curry powder and cook 1 minute.
3. Transfer to the slow cooker, add crushed tomatoes and coconut milk and stir well.
4. Cover and cook on LOW for 5 hours or HIGH for 2.5 hours.
5. Stir in spinach until wilted, about 5 minutes, then portion.
Reheat: Refrigerate up to 4 days or freeze up to 3 months. Reheat covered on the stovetop over medium-low heat, stirring occasionally, or microwave covered at 70 percent power until steaming hot.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e8278821f838550e6a87fe94` — fixture R18

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
Explanation: Fresh ginger is marked unavailable, so shop for it; ground ginger is not a substitute here. Other ingredients may also require shopping.

Dish 1: Ginger chicken and sweet potato stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Large stovetop pot
Prep: 20 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 900 g | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 40 g | Optional: False
- Sweet potatoes | ID: sweet-potatoes | Quantity: 900 g | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 liter | Optional: False
- Soy sauce | ID: soy-sauce | Quantity: 2 tbsp | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Dice the chicken, sweet potatoes and onion; grate the ginger.
2. Heat oil in a large pot. Soften the onion for 5 minutes, then stir in ginger for 1 minute.
3. Add chicken, sweet potatoes, broth and soy sauce. Simmer for 25–30 minutes, until the potatoes are tender and chicken reaches 165°F (74°C). Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot and 165°F (74°C), adding a splash of water if needed.

Dish 2: Ginger coconut chickpea curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large deep stovetop skillet
Prep: 15 min | Cook: 25 min
Ingredients:
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 3 15-oz cans | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 40 g | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 2 13.5-oz cans | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 300 g | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canola oil | ID: canola-oil | Quantity: 1 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice the onion, grate the ginger and drain and rinse the chickpeas.
2. Heat oil in a deep skillet. Cook onion for 5 minutes, then stir in ginger and curry powder for 1 minute.
3. Add chickpeas, coconut milk and salt. Simmer for 15 minutes; stir in spinach until wilted. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot and 165°F (74°C), stirring and adding a little water if thick.

Dish 3: Ginger lentil and carrot soup
Servings: 6 | Style: CHILI_SOUP | Appliance: Large stovetop pot
Prep: 15 min | Cook: 30 min
Ingredients:
- Dried red lentils | ID: red-lentils-dried | Quantity: 450 g | Optional: False
- Fresh ginger | ID: ginger-fresh | Quantity: 40 g | Optional: False
- Carrots | ID: carrots-fresh | Quantity: 600 g | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 large | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 1.75 liters | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 tsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
Steps:
1. Rinse the lentils. Dice the carrots and onion, and grate the ginger.
2. Heat oil in a large pot and soften onion and carrots for 5 minutes. Add ginger and cumin and stir for 1 minute.
3. Add lentils and broth. Simmer for 20–25 minutes, stirring occasionally, until lentils and carrots are tender. Divide into six portions.
Reheat: Refrigerate promptly in shallow containers. Reheat until steaming hot and 165°F (74°C), thinning with water as needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e849348021fef0eff1adc9e9` — fixture R04

Automatic schema validation: **failed**.

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
[No usable output returned]
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e85c61453c780cd56796526f` — fixture R26

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
Explanation: Generated three distinct reheatable batch meals utilizing available pantry items and standard ingredients.

Dish 1: Garlic Olive Oil Chicken and Rice Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven
Prep: 15 min | Cook: 45 min
Ingredients:
- Boneless skinless chicken breast | ID: chicken-breast-boneless | Quantity: 1.5 pounds | Optional: False
- Dry jasmine rice | ID: jasmine-rice-dry | Quantity: 2 cups | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
Steps:
1. Preheat oven to 375 degrees Fahrenheit.
2. In a 9x13 inch baking dish, combine the dry jasmine rice, chicken broth, olive oil, minced garlic, salt, and black pepper.
3. Place the boneless skinless chicken breasts on top of the rice mixture.
4. Cover tightly with aluminum foil and bake for 40 minutes, then uncover and bake for an additional 5 minutes until chicken is cooked through and liquid is absorbed.
5. Let cool before storing in airtight containers for meal prep.
Reheat: Reheat in the microwave for 2 minutes with a splash of water or chicken broth to restore moisture to the rice.

Dish 2: Garlic Olive Oil Tuscan White Bean Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: Stovetop
Prep: 10 min | Cook: 30 min
Ingredients:
- Canned cannellini beans | ID: cannellini-beans-canned | Quantity: 3 cans | Optional: False
- Vegetable broth | ID: vegetable-broth | Quantity: 3 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 4 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 6 cloves | Optional: False
- Onions | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 4 cups | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tablespoon | Optional: False
Steps:
1. Heat olive oil in a large pot over medium heat.
2. Add diced onions and minced garlic, sautéing until translucent and fragrant.
3. Pour in the canned cannellini beans (rinsed and drained), vegetable broth, salt, and Italian seasoning.
4. Bring to a simmer and cook for 20 minutes to meld the flavors.
5. Stir in the fresh spinach until wilted, then remove from heat and portion into batch containers.
Reheat: Simmer gently on the stovetop over medium-low heat for 5 to 7 minutes, stirring occasionally.

Dish 3: Garlic Olive Oil Ground Beef and Potato Skillet
Servings: 6 | Style: CURRY_SKILLET | Appliance: Skillet
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground beef | ID: ground-beef-80-20 | Quantity: 1.5 pounds | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2 pounds | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tablespoons | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 5 cloves | Optional: False
- Bell peppers | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
Steps:
1. Wash and dice the fresh potatoes into bite-sized cubes.
2. Heat olive oil in a large skillet over medium-high heat, add the potatoes, and cook until tender and golden brown, about 15 minutes.
3. Add the ground beef, minced garlic, and diced bell peppers to the skillet.
4. Cook until the beef is fully browned and vegetables are tender, breaking up the meat with a spoon.
5. Season with salt and smoked paprika, mix well, and divide into meal prep containers.
Reheat: Reheat in a skillet over medium heat for 5 minutes or microwave covered for 2 minutes to keep potatoes from drying out.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `e9e1074a76dc0718fc2e3e3f` — fixture R23

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
Explanation: The supplied ground turkey offer is $3 per 1 lb package at Safeway; other prices are unknown.

Dish 1: Turkey and Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Stovetop pot
Prep: 15 min | Cook: 35 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1 lb | Optional: False
- Canned black beans | ID: black-beans-canned | Quantity: 2 15 oz cans | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28 oz can | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Bell pepper | ID: bell-peppers | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
- Water | ID: None | Quantity: 1 cup | Optional: False
Steps:
1. Dice the onion and pepper; mince the garlic. Drain and rinse the beans.
2. Heat oil in a pot over medium heat. Soften onion and pepper for 5 minutes; add garlic, chili powder and cumin for 30 seconds.
3. Add turkey and cook, breaking it up, until it reaches 165°F.
4. Add beans, tomatoes, water and salt. Simmer for 20 minutes, stirring occasionally.
Reheat: Refrigerate in shallow containers within 2 hours. Reheat portions on the stovetop or in the microwave to 165°F, adding water if needed.

Dish 2: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Stovetop deep skillet
Prep: 10 min | Cook: 25 min
Ingredients:
- Canned chickpeas | ID: chickpeas-canned | Quantity: 3 15 oz cans | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 1 13.5 oz can | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28 oz can | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 5 oz | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Dice onion, mince garlic, and drain and rinse chickpeas.
2. Heat oil in a deep skillet over medium heat. Cook onion for 5 minutes, then stir in garlic and curry powder for 30 seconds.
3. Add chickpeas, coconut milk, tomatoes and salt. Simmer for 15 minutes, then stir in spinach until wilted.
Reheat: Refrigerate in shallow containers within 2 hours. Reheat on the stovetop or in the microwave to 165°F, stirring and adding a splash of water if needed.

Dish 3: Turkey, Potato and Vegetable Bake
Servings: 6 | Style: CASSEROLE_BAKE | Appliance: Oven and stovetop skillet
Prep: 20 min | Cook: 55 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1 lb | Optional: False
- Fresh potatoes | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Fresh zucchini | ID: zucchini-fresh | Quantity: 2 medium | Optional: False
- Onion | ID: onions-fresh | Quantity: 1 medium | Optional: False
- Garlic | ID: garlic-fresh | Quantity: 2 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 1 28 oz can | Optional: False
- Low-moisture mozzarella | ID: mozzarella-low-moisture | Quantity: 1 cup shredded | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 2 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 400°F. Thinly slice potatoes and zucchini, dice onion and mince garlic.
2. Heat oil in a skillet. Cook onion for 5 minutes, add garlic, then cook turkey until it reaches 165°F. Stir in tomatoes, seasoning and salt.
3. Layer potatoes, zucchini and turkey sauce in a baking dish. Cover tightly with foil and bake for 40 minutes, until the potatoes are tender.
4. Uncover, sprinkle with mozzarella and bake for 10 minutes more.
Reheat: Refrigerate in shallow containers within 2 hours. Reheat covered in the oven or microwave until the center reaches 165°F.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `eaa8a0411c571d84f716e3e3` — fixture R33

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
Explanation: Three four-serving sheet-pan batch meals using the supplied pantry staples (olive oil, garlic) where listed, with no dietary constraints to apply and no offers used for pricing.

Dish 1: Sheet-Pan Garlic Herb Chicken with Potatoes and Broccoli
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Half sheet pan in oven at 425°F
Prep: 15 min | Cook: 35 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 1.5 lb | Optional: False
- Fresh Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 1.5 lb | Optional: False
- Broccoli florets | ID: broccoli-fresh | Quantity: 12 oz | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Italian seasoning | ID: italian-seasoning | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F and line a half sheet pan with foil.
2. Toss potatoes with 2 tbsp olive oil, half the salt, and pepper; spread on the pan and roast 15 minutes.
3. Mix chicken with remaining olive oil, garlic, Italian seasoning, and remaining salt.
4. Move potatoes to one side, add chicken and broccoli to the pan, and roast 20 minutes until chicken reaches 165°F internal temperature.
5. Cool completely, then divide into four containers.
Reheat: Microwave one portion covered for 2 to 3 minutes, or reheat at 350°F for 15 minutes until hot throughout.

Dish 2: Sheet-Pan Smoky Sausage and Peppers
Servings: 4 | Style: CASSEROLE_BAKE | Appliance: Half sheet pan in oven at 425°F
Prep: 10 min | Cook: 25 min
Ingredients:
- Fully cooked smoked sausage, sliced | ID: smoked-sausage-fully-cooked | Quantity: 16 oz | Optional: False
- Bell peppers, sliced | ID: bell-peppers | Quantity: 3 each | Optional: False
- Onion, sliced | ID: onions-fresh | Quantity: 1 each | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 tsp | Optional: False
- Salt | ID: salt | Quantity: 0.5 tsp | Optional: False
Steps:
1. Heat oven to 425°F and line a half sheet pan with foil.
2. Toss sausage, peppers, and onion with olive oil, garlic, paprika, and salt.
3. Spread in a single layer and roast 25 minutes, stirring once, until peppers are tender and sausage is browned.
4. Cool completely, then divide into four containers.
Reheat: Microwave one portion covered for 2 minutes, or reheat at 350°F for 12 minutes until hot throughout.

Dish 3: Sheet-Pan Curry Chickpeas, Sweet Potato, and Cauliflower
Servings: 4 | Style: CURRY_SKILLET | Appliance: Half sheet pan in oven at 425°F
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 30 oz | Optional: False
- Sweet potatoes, cubed | ID: sweet-potatoes | Quantity: 2 lb | Optional: False
- Cauliflower florets | ID: cauliflower-fresh | Quantity: 1 lb | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Olive oil | ID: olive-oil | Quantity: 3 tbsp | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat oven to 425°F and line a half sheet pan with foil.
2. Pat chickpeas dry and toss with 1 tbsp olive oil and half the curry powder; spread on one side of the pan.
3. Toss sweet potatoes and cauliflower with remaining olive oil, remaining curry powder, and salt; add to the pan.
4. Roast 30 minutes, stirring halfway, until sweet potatoes are tender and chickpeas are crisp.
5. Cool completely, then divide into four containers.
Reheat: Reheat covered in the microwave for 2 to 3 minutes, or at 350°F for 15 minutes until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `eac319e785e9be2e4618bcba` — fixture R10

Automatic schema validation: **passed**.

### Request and expected rules

```json
{
  "id": "R10",
  "category": "availability",
  "task": "generate",
  "prompt": "I have olive oil marked Yes, but have not provided a quantity. Never claim it is sufficient.",
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
      "availability_is_not_quantity_sufficiency"
    ],
    "reviewNotes": [
      "I have olive oil marked Yes, but have not provided a quantity. Never claim it is sufficient."
    ]
  }
}
```

### Output

```text
Status: ok
Explanation: Three 6-serving batch dishes are proposed. Olive oil is marked available but no quantity was supplied, so pantry sufficiency is unverified and the listed olive oil amount is only the full-batch need. No offers were supplied, so all prices are unknown. Other items not in the pantry are shopping ingredients with null IDs unless they match catalog entries.

Dish 1: Turkey Black Bean Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: Large Dutch oven
Prep: 15 min | Cook: 40 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Canned black beans, drained | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tbsp | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 tsp | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cup | Optional: False
- Salt | ID: salt | Quantity: 1 tsp | Optional: False
Steps:
1. Heat olive oil in the Dutch oven over medium-high heat.
2. Brown the ground turkey, breaking it up, about 6 minutes.
3. Add onion and cook until softened, about 4 minutes. Add garlic and cook 1 minute.
4. Stir in chili powder and cumin for 30 seconds, then add tomatoes, beans, broth, and salt.
5. Simmer uncovered over medium-low heat for 30 minutes, stirring occasionally. Divide into 6 portions.
Reheat: Refrigerate up to 4 days. Reheat portions in a covered pot or microwave with a splash of water, stirring until steaming hot throughout.

Dish 2: Chickpea Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: Large skillet with lid
Prep: 15 min | Cook: 30 min
Ingredients:
- Olive oil | ID: olive-oil | Quantity: 2 tbsp | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 clove | Optional: False
- Ginger, grated | ID: ginger-fresh | Quantity: 1 tbsp | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tbsp | Optional: False
- Canned chickpeas, drained | ID: chickpeas-canned | Quantity: 60 oz | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 14 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 13.5 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 10 oz | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cup | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Cook basmati rice according to package directions and set aside.
2. Heat olive oil in the skillet over medium heat. Cook onion 5 minutes until soft.
3. Add garlic, ginger, and curry powder; stir 1 minute.
4. Add chickpeas, tomatoes, coconut milk, and salt. Simmer covered 15 minutes.
5. Stir in spinach until wilted, about 2 minutes. Serve over rice, dividing into 6 portions.
Reheat: Refrigerate curry and rice separately up to 4 days. Reheat curry covered over medium-low with a splash of water, and microwave rice with a damp towel until hot.

Dish 3: Chicken Thigh Potato Stew
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 420 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tbsp | Optional: False
- Fresh Yukon Gold potatoes, cubed | ID: yukon-gold-potatoes-fresh | Quantity: 2 lb | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 4 medium | Optional: False
- Onion, diced | ID: onions-fresh | Quantity: 1 large | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 clove | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 4 cup | Optional: False
- Dried thyme | ID: thyme-dried | Quantity: 1 tsp | Optional: False
- Bay leaf | ID: bay-leaf | Quantity: 2 leaf | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 tsp | Optional: False
- Salt | ID: salt | Quantity: 1.5 tsp | Optional: False
Steps:
1. Heat olive oil in a skillet over medium-high heat and brown chicken thighs 2 minutes per side.
2. Transfer chicken to the slow cooker with potatoes, carrots, onion, garlic, broth, thyme, bay leaves, pepper, and salt.
3. Cover and cook on low for 7 hours or until chicken is tender and reaches 165°F.
4. Remove bay leaves, shred or chop chicken, and divide into 6 portions.
Reheat: Refrigerate up to 4 days. Reheat in a covered saucepan over medium heat, adding broth if thickened, until hot throughout.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

## Review `eae78c7159385c12f7e95813` — fixture R02

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
Explanation: Three reheatable, dairy-free batch meals for six; all ingredients, garnishes, and finishing fats are dairy-free.

Dish 1: Tomato-Braised Chicken and Potatoes
Servings: 6 | Style: STEW_BRAISE | Appliance: 6-quart slow cooker
Prep: 20 min | Cook: 360 min
Ingredients:
- Boneless skinless chicken thighs | ID: chicken-thighs-boneless | Quantity: 2 lb | Optional: False
- Fresh potatoes, cut into chunks | ID: potatoes-fresh | Quantity: 2 lb | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 2 medium | Optional: False
- Carrots, sliced | ID: carrots-fresh | Quantity: 3 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 4 cloves | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 1 cup | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Dried oregano | ID: oregano-dried | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Black pepper | ID: black-pepper | Quantity: 0.5 teaspoon | Optional: False
- Fresh parsley, chopped | ID: parsley-fresh | Quantity: 0.25 cup | Optional: True
Steps:
1. Add potatoes, onions, carrots, garlic, tomatoes, broth, olive oil, oregano, salt, and pepper to the slow cooker; stir.
2. Nestle chicken into the mixture and cover. Cook on low for 6 hours, until chicken is tender and reaches 165°F internally.
3. Shred or leave the chicken in pieces, then stir into the sauce. Serve with parsley if desired.
4. Refrigerate leftovers promptly in shallow containers. Reheat portions covered in a microwave, stirring once, or gently in a saucepan until steaming hot.
Reheat: Reheat gently with a spoonful of water or broth if the tomato sauce has thickened.

Dish 2: Smoky Turkey, Black Bean, and Sweet Potato Chili
Servings: 6 | Style: CHILI_SOUP | Appliance: 6-quart Dutch oven on stovetop
Prep: 20 min | Cook: 45 min
Ingredients:
- Ground turkey | ID: ground-turkey | Quantity: 1.5 lb | Optional: False
- Canned black beans, drained and rinsed | ID: black-beans-canned | Quantity: 30 oz | Optional: False
- Sweet potatoes, peeled and diced | ID: sweet-potatoes | Quantity: 1.5 lb | Optional: False
- Onions, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Bell peppers, chopped | ID: bell-peppers | Quantity: 2 medium | Optional: False
- Canned crushed tomatoes | ID: crushed-tomatoes-canned | Quantity: 28 oz | Optional: False
- Chicken broth | ID: chicken-broth | Quantity: 2 cups | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Chili powder | ID: chili-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 2 teaspoons | Optional: False
- Smoked paprika | ID: smoked-paprika | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Fresh cilantro, chopped | ID: cilantro-fresh | Quantity: 0.25 cup | Optional: True
- Hass avocado, diced | ID: avocados-hass | Quantity: 1 medium | Optional: True
Steps:
1. Warm olive oil in the Dutch oven over medium heat. Add onion and bell pepper and cook for 5 minutes, stirring occasionally.
2. Add turkey and break it up with a spoon. Cook until no longer pink, about 6–8 minutes. Stir in chili powder, cumin, paprika, and salt.
3. Add sweet potato, crushed tomatoes, broth, and black beans. Bring to a simmer, cover partly, and cook 30–35 minutes, stirring occasionally, until the sweet potato is tender and turkey is cooked through.
4. Serve with cilantro and avocado if desired. Cool leftovers promptly and refrigerate in shallow containers.
5. Reheat on the stovetop over medium-low heat, stirring occasionally, until steaming hot; add a splash of water or broth if needed.
Reheat: Store avocado and cilantro separately; add them fresh after reheating.

Dish 3: Coconut Chickpea and Spinach Curry
Servings: 6 | Style: CURRY_SKILLET | Appliance: 12-inch deep lidded skillet on stovetop
Prep: 15 min | Cook: 30 min
Ingredients:
- Canned chickpeas, drained and rinsed | ID: chickpeas-canned | Quantity: 45 oz | Optional: False
- Canned coconut milk | ID: coconut-milk-canned | Quantity: 27 oz | Optional: False
- Fresh spinach | ID: spinach-fresh | Quantity: 8 oz | Optional: False
- Onion, chopped | ID: onions-fresh | Quantity: 1 large | Optional: False
- Fresh tomatoes, chopped | ID: tomatoes-fresh | Quantity: 3 medium | Optional: False
- Garlic, minced | ID: garlic-fresh | Quantity: 3 cloves | Optional: False
- Fresh ginger, grated | ID: ginger-fresh | Quantity: 1 tablespoon | Optional: False
- Olive oil | ID: olive-oil | Quantity: 1 tablespoon | Optional: False
- Curry powder | ID: curry-powder | Quantity: 2 tablespoons | Optional: False
- Ground cumin | ID: ground-cumin | Quantity: 1 teaspoon | Optional: False
- Salt | ID: salt | Quantity: 1 teaspoon | Optional: False
- Lime juice | ID: lime-juice | Quantity: 2 tablespoons | Optional: False
- Dry basmati rice | ID: basmati-rice-dry | Quantity: 2 cups | Optional: False
Steps:
1. Cook basmati rice according to package directions; keep covered while making the curry.
2. Heat olive oil in the deep skillet over medium heat. Cook onion for 5 minutes until softened. Add garlic, ginger, curry powder, and cumin; stir for 30 seconds.
3. Add tomatoes and cook for 3 minutes. Stir in chickpeas, coconut milk, and salt. Bring to a gentle simmer, cover, and cook for 15 minutes, stirring once or twice.
4. Stir in spinach until wilted, then mix in lime juice. Serve over rice.
5. Cool leftovers promptly and refrigerate the curry and rice in separate shallow containers. Reheat covered in the microwave, stirring halfway through, or warm gently in a skillet until steaming hot.
Reheat: Keep rice separate from the curry for better texture; loosen the curry with a splash of water when reheating if needed.
```

### Your grades

Record this review ID in `grades.json` or your reply. Rules passed: blank; critical dietary violation: blank. Practicality / method clarity / quantities and servings / adherence / variety: blank. Notes: blank.

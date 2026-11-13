#!/usr/bin/env python3
"""Offline fixture and planning-budget checks. No provider SDK, network or env access."""
import hashlib
import json
import math
from collections import Counter
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def load(name):
    return json.loads((HERE / name).read_text())


def require(condition, message):
    if not condition:
        raise ValueError(message)


def usd(value):
    return Decimal(str(value))


def validate():
    catalog_bytes = (ROOT / 'src/data/cooking-catalog.json').read_bytes()
    catalog = json.loads(catalog_bytes)
    ids = {item['id'] for item in catalog['ingredients']}
    config = load('candidates.json')
    datasets = {name: load(name + '.json') for name in ('recipes', 'speech')}
    for name, count in (('recipes', 40), ('speech', 20)):
        data = datasets[name]
        require(data['synthetic'] is True, f'{name}: synthetic-only')
        require(data['catalogVersion'] == catalog['catalogVersion'], f'{name}: catalog version drift')
        require(data['catalogSha256'] == hashlib.sha256(catalog_bytes).hexdigest(), f'{name}: catalog content drift')
        require(data['scoredRepeats'] == 3, f'{name}: approved repeat count changed')
        require(len(data['cases']) == count, f'{name}: approved fixture count changed')
        require(len({case['id'] for case in data['cases']}) == count, f'{name}: duplicate fixture ID')
        for case in data['cases']:
            references = []
            if name == 'recipes':
                context, expected = case['context'], case['expected']
                references += [x['ingredientId'] for x in context['pantry'] + context['offers']]
                references += expected['forbiddenIngredientIds'] + expected.get('requiredIngredientIds', [])
                references += [x['ingredientId'] for x in context.get('seedPlan', {}).get('ingredients', [])]
                require(context['targetServings'] in (4, 6, 8), f"{case['id']}: unsupported servings")
                require(context['catalogVersion'] == catalog['catalogVersion'], f"{case['id']}: context catalog drift")
                require(expected['dishCount'] == (3 if expected['status'] == 'ok' else 0), f"{case['id']}: status/dish count conflict")
                require(not set(expected.get('requiredIngredientIds', [])) & set(expected['forbiddenIngredientIds']), f"{case['id']}: contradictory ingredient oracle")
                require('no_inventory_mutations' in expected['checks'], f"{case['id']}: mutation boundary missing")
                require((case['task'] == 'remix') == ('seedPlan' in context), f"{case['id']}: remix seed missing/unexpected")
                require(set(context['dietaryConstraints']) <= {'GLUTEN_FREE','DAIRY_FREE','NUT_FREE','VEGETARIAN_PESCATARIAN'}, f"{case['id']}: unsupported diet")
                for offer in context['offers']:
                    require(offer['synthetic'] is True, f"{case['id']}: non-synthetic offer")
            else:
                expected = case['expected']
                references += [x['ingredientId'] for x in expected['items']] + expected['excludedIngredientIds']
                if case['id'] in ('S13','S14','S15','S16','S17'):
                    require(expected['maxProposedItems'] == 0, f"{case['id']}: no-add oracle missing")
                if case['id'] == 'S17':
                    require(set(expected['acceptedStatuses']) == {'no_change','needs_review'}, 'noise status equivalence missing')
                require(expected['committedWrites'] == 0, f"{case['id']}: unexpected writes")
                require(not set(x['ingredientId'] for x in expected['items']) & set(expected['excludedIngredientIds']), f"{case['id']}: contradictory speech oracle")
                require(len(set(x['ingredientId'] for x in expected['items'])) == len(expected['items']), f"{case['id']}: duplicate expected item")
                require(case['audio']['maxDurationSeconds'] == 30, f"{case['id']}: duration cap changed")
                require(bool(case['transcript']) == (case['audio']['generation'] == 'local-macos-say'), f"{case['id']}: audio/script mismatch")
                require(expected['status'] == ('needs_review' if expected['reviewRequired'] else 'proposal' if expected['items'] else 'no_change'), f"{case['id']}: status mismatch")
                for item in expected['items']:
                    require(('quantity' in item) == ('unit' in item), f"{case['id']}: partial quantity label")
                    require(item['available'] is True, f"{case['id']}: unexpected No write")
                    if 'quantity' in item:
                        require(math.isfinite(item['quantity']) and item['quantity'] > 0, f"{case['id']}: invalid quantity")
            require(set(references) <= ids, f"{case['id']}: unknown catalog IDs {set(references) - ids}")
    require(sum(c['task'] == 'remix' for c in datasets['recipes']['cases']) == 6, 'remix coverage drift')
    require(config['execution']['paidCallsEnabled'] is False, 'this preparation packet cannot authorize paid calls')
    require(config['execution']['automaticRetries'] == 0, 'unbudgeted automatic retries')
    require(config['spikeApiCapUsd'] == 10 and config['reference']['apiCapUsd'] == 25, 'approved ceiling drift')
    require(config['reference']['recipeRequests'] == config['reference']['speechMinutes'] == 1000, 'reference workload drift')
    prompts = load('prompts.json')
    require(len(prompts['tuning']['recipeExamples']) == len(prompts['tuning']['speechScripts']) == 2, 'tuning sample count drift')
    require(not set(prompts['tuning']['speechScripts']) & {case['transcript'] for case in datasets['speech']['cases']}, 'scored speech leaked into tuning')
    require(not {x['prompt'] for x in prompts['tuning']['recipeExamples']} & {case['prompt'] for case in datasets['recipes']['cases']}, 'scored recipe leaked into tuning')
    require('expected' in prompts['requestProjection']['neverSend'], 'oracle disclosure guard missing')
    manifest = load('audio-manifest.json')
    require({x['id'] for x in manifest['clips']} == {x['id'] for x in datasets['speech']['cases']} and len(manifest['clips']) == 20, 'audio manifest coverage drift')
    require(all(0 < x['durationSeconds'] <= 30 for x in manifest['clips']), 'audio duration invalid')
    recipe_costs = {}
    for candidate in config['recipes']:
        per_call = (usd(candidate['maxInputTokens']) * usd(candidate['inputUsdPerMillion']) + usd(candidate['maxBillableOutputTokens']) * usd(candidate['outputUsdPerMillion'])) / 1_000_000
        recipe_costs[candidate['id']] = per_call * 120
    speech_costs = {}
    speech_bounds = {}
    for pipeline in config['speechPipelines']:
        billing = pipeline['billing']
        seconds = usd(pipeline['audioSecondsMax'])
        require(seconds == 30 and pipeline['accountBoundsVerified'] is False, 'draft audio/account bounds changed')
        if billing['kind'] == 'audio-and-text-tokens':
            input_tokens = seconds * usd(billing['audioTokensPerSecondCeiling']) + usd(billing['maxTextInputTokens'])
            bound = (input_tokens * usd(billing['inputUsdPerMillion']) + usd(billing['maxBillableOutputTokens']) * usd(billing['outputUsdPerMillion'])) / 1_000_000
        else:
            require(billing['kind'] == 'duration', 'unsupported speech billing model')
            increment = usd(billing['billingIncrementSecondsCeiling'])
            require(increment > 0, 'invalid billing increment')
            billed_seconds = max(usd(billing['minimumBilledSecondsCeiling']), usd(math.ceil(seconds / increment)) * increment)
            bound = billed_seconds / 60 * usd(billing['audioUsdPerMinuteCeiling'])
        if 'extraction' in pipeline:
            extraction = pipeline['extraction']
            bound += (usd(extraction['maxInputTokens']) * usd(extraction['inputUsdPerMillion']) + usd(extraction['maxBillableOutputTokens']) * usd(extraction['outputUsdPerMillion'])) / 1_000_000
        reservation = usd(pipeline['reservationUsdPerAttempt'])
        require(reservation >= bound, f"{pipeline['id']}: speech reservation below derived planning bound")
        speech_bounds[pipeline['id']] = float(bound)
        speech_costs[pipeline['id']] = reservation * 60
    primary = sum(cost for key, cost in recipe_costs.items() if next(c for c in config['recipes'] if c['id'] == key)['role'] == 'primary')
    control = sum(recipe_costs.values()) - primary
    total = sum(recipe_costs.values()) + sum(speech_costs.values()) + usd(config['ancillaryReserveUsd'])
    require(total <= usd(config['spikeApiCapUsd']), 'planning reservations exceed approved cap')
    report = {
        'issue': 731, 'validation': 'passed', 'paidCallsMade': 0,
        'catalogVersion': catalog['catalogVersion'],
        'fixtures': {key: len(value['cases']) for key, value in datasets.items()},
        'categories': {key: dict(Counter(c['category'] for c in value['cases'])) for key, value in datasets.items()},
        'scoredRecipeCallsPrimary': 360, 'scoredRecipeCallsOptionalControl': 120,
        'scoredSpeechPipelineAttempts': 240,
        'recipeReservationUsd': {key: float(value) for key, value in recipe_costs.items()},
        'speechDerivedPerAttemptBoundUsd': speech_bounds,
        'speechReservationUsd': {key: float(value) for key, value in speech_costs.items()},
        'primaryRecipeReservationUsd': float(primary), 'optionalControlReservationUsd': float(control),
        'ancillaryReservationUsd': config['ancillaryReserveUsd'], 'totalPlanningReservationUsd': float(total),
        'unallocatedUsd': float(usd(config['spikeApiCapUsd']) - total),
        'audioPreparation': {'clips':20, 'totalSeconds':round(sum(x['durationSeconds'] for x in manifest['clips']),6), 'apiSpendUsd':0, 'checks':'Local generation manifest validated; WAV bytes were separately checked at preparation time.', 'listeningReview':'pending owner/reviewer; not claimed'},
        'warning': 'Planning envelope only: all billable bounds, account access, audio bytes and final plan approval must be verified before paid execution.',
        'inputSha256': {name: hashlib.sha256((HERE / name).read_bytes()).hexdigest() for name in ['recipes.json','speech.json','candidates.json','recipe-output.schema.json','speech-output.schema.json','prompts.json','audio-manifest.json','validate.py','prepare_audio.py']},
    }
    return report


if __name__ == '__main__':
    print(json.dumps(validate(), indent=2))

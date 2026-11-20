'use client';

import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { Button, Checkbox, SegmentedControl, TextField } from '@/components/ui';
import { ALL_STORE_CHAINS, resolveStoreBanner } from '@/data/store-registry';
import { useAppRouter } from '@/modules/shell/app-router';
import { markSetupCompleted } from '@/modules/shell/first-run';
import { useLocationContext, usePreferencesContext } from '@/modules/shell/app-context';
import { MODULE_PATHS } from '@/modules/shell/navigation';
import type { DietaryConstraint, MacroGoal } from '@/types/domain';

// v2.0 M4-2b: first-run setup (wireframes Onboarding and OnboardingPrefs): step 1 asks for the ZIP and stores, step 2 for
// optional food preferences, and both can be skipped with today's defaults (ZIP 80542, every store). It adds no storage format
// and no sync code: each choice calls the action the Settings or Plan control calls, so it is written to the same keys
// (`pantrybot_user_zip`, `pantrybot_active_stores`, `pantrybot_nutrition_profile_v12`) and, for a guest, stays on the device;
// signing in later syncs it through the existing path. The setup-completed marker is the only new key. The step is local to
// this page: a reload starts again at step 1 and nothing is lost, because every choice is saved as it is made.
const DIETARY_OPTIONS: ReadonlyArray<{ value: DietaryConstraint; label: string }> = [
  { value: 'GLUTEN_FREE', label: 'Gluten-free' },
  { value: 'DAIRY_FREE', label: 'Dairy-free' },
  { value: 'NUT_FREE', label: 'Nut-free' },
  { value: 'VEGETARIAN_PESCATARIAN', label: 'Pescatarian' },
];
const MACRO_OPTIONS: ReadonlyArray<{ value: MacroGoal; label: string }> = [
  { value: 'ANY', label: 'Any' },
  { value: 'HIGH_PROTEIN', label: 'High Protein' },
  { value: 'LOW_CARB_KETO', label: 'Low Carb' },
  { value: 'BALANCED_FAMILY', label: 'Balanced' },
];

export default function WelcomePage() {
  const router = useAppRouter();
  const { currentZip, zipError, zipLoading, handleZipSubmit } = useLocationContext();
  const {
    activeStores, handleToggleActiveStore, dietaryConstraints, handleToggleDietaryConstraint, macroGoal, handleMacroGoalChange,
  } = usePreferencesContext();
  const [step, setStep] = useState<1 | 2>(1);
  const [zip, setZip] = useState('');

  function finish() {
    markSetupCompleted(localStorage);
    router.replace(MODULE_PATHS.shop);
  }

  async function continueFromLocation() {
    // An empty ZIP keeps today's default; a typed one is saved and used for the deals, like the Settings ZIP form.
    if (zip.trim() !== '') {
      await handleZipSubmit(undefined, zip);
      if (!/^\d{5}$/.test(zip.trim())) return; // the context reports the error; stay on this step
    }
    setStep(2);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-control bg-accent text-on-accent">
          <ChefHat className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight text-ink">PantryBot</span>
      </div>

      {step === 1 ? (
        <section aria-labelledby="welcome-title" className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-muted">Step 1 of 2</p>
            <h1 id="welcome-title" className="text-[28px] font-bold leading-tight text-ink">Where Do You Shop?</h1>
            <p className="text-base text-muted">Set once. You can change it later in Settings.</p>
          </div>
          <TextField
            label="ZIP code"
            value={zip}
            onChange={(event) => setZip(event.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder={currentZip}
            error={zipError ?? undefined}
          />
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-ink">Stores</legend>
            {ALL_STORE_CHAINS.map((chain) => (
              <Checkbox
                key={chain}
                label={resolveStoreBanner(chain, currentZip)}
                checked={activeStores.includes(chain)}
                onChange={() => handleToggleActiveStore(chain)}
              />
            ))}
          </fieldset>
          <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={continueFromLocation} loading={zipLoading}>Continue</Button>
            <Button variant="quiet" onClick={finish}>Skip for now (uses ZIP {currentZip} and all stores)</Button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="welcome-title" className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-muted">Step 2 of 2</p>
            <h1 id="welcome-title" className="text-[28px] font-bold leading-tight text-ink">Any Food Preferences?</h1>
            <p className="text-base text-muted">Optional. We use these to suggest dishes. Change them anytime in Settings.</p>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-ink">Dietary Restrictions</legend>
            {DIETARY_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={dietaryConstraints.includes(option.value)}
                onChange={() => handleToggleDietaryConstraint(option.value)}
              />
            ))}
          </fieldset>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Macro Goal</p>
            <SegmentedControl label="Macro goal" options={MACRO_OPTIONS} value={macroGoal} onChange={handleMacroGoalChange} />
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={finish}>Finish</Button>
            <Button variant="quiet" onClick={finish}>Skip for Now</Button>
          </div>
        </section>
      )}
    </div>
  );
}

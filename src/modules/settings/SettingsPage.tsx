'use client';

import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, Checkbox, List, ListRow, PageHeader, SegmentedControl, Select } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { THEME_PREFERENCES, type ThemePreference } from '@/design/theme';
import { DeleteAccountSheet, SyncStatusSheet, useExport } from '@/modules/settings/AccountSheets';
import AlertsPanel from '@/modules/shell/AlertsPanel';
import AppLink from '@/modules/shell/AppLink';
import StoresPanel from '@/modules/shell/StoresPanel';
import ZipPanel from '@/modules/shell/ZipPanel';
import {
  useAccountContext, useDashboardContext, useLocationContext, usePreferencesContext, useShellContext, useShopContext,
} from '@/modules/shell/app-context';
import type { CookingVesselArchetype, DietaryConstraint, MacroGoal, SyncStatus } from '@/types/domain';

// v2.0 M4-2a: Account and Settings (wireframes Settings and IpadSettings), a page at /settings and not a tab: a full screen on
// compact widths and a centred panel on wider ones, with Back to the tab the user came from. Location, My stores, the weekly
// digest preview open in place under their row (the same components the page-top drawers used, which the shell does not
// render on this page), so nothing here has new state or new sync code: every control calls the context action the old control
// called. v2.0 M4-6b: the account lives here (the old account panel is gone). Signed out, the card's Sign In opens the sign-in
// sheet (M4-6a). Signed in, the card shows who you are with Sign Out, and the Account section has Sync Status (a sheet with Sync
// Now and what syncs), AI Features, the weekly digest, Export My Grocery Data, and Delete Account & Data (a two-step sheet).
// The temporary ZIP and alerts controls on the other screens stay until the Shop redesign (M4 decision 19).

const MACRO_OPTIONS: ReadonlyArray<{ value: MacroGoal; label: string }> = [
  { value: 'ANY', label: 'Any' },
  { value: 'HIGH_PROTEIN', label: 'High protein (40g or more)' },
  { value: 'LOW_CARB_KETO', label: 'Low carb or keto' },
  { value: 'CALORIE_CONSCIOUS', label: 'Under 460 calories' },
  { value: 'BALANCED_FAMILY', label: 'Balanced' },
];
const DIETARY_OPTIONS: ReadonlyArray<{ value: DietaryConstraint; label: string }> = [
  { value: 'GLUTEN_FREE', label: 'Gluten-free' },
  { value: 'DAIRY_FREE', label: 'Dairy-free' },
  { value: 'NUT_FREE', label: 'Nut-free' },
  { value: 'VEGETARIAN_PESCATARIAN', label: 'Pescatarian' },
];
const VESSEL_OPTIONS: ReadonlyArray<{ value: CookingVesselArchetype; label: string }> = [
  { value: 'ANY', label: 'Any' },
  { value: 'SLOW_COOKER_INSTANT_POT', label: 'Slow cooker or Instant Pot' },
  { value: 'DUTCH_OVEN_BRAISE', label: 'Dutch oven' },
  { value: 'CASSEROLE_SHEET_PAN', label: 'Sheet pan or casserole' },
  { value: 'BIG_BATCH_SKILLET', label: 'Skillet' },
];
const THEME_LABELS: Record<ThemePreference, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const SERVINGS = ['4', '6', '8'] as const;
const SYNC_LABELS: Record<SyncStatus, string> = {
  IDLE: 'Synced', SYNCED: 'Synced', SYNCING: 'Syncing', OFFLINE_QUEUED: 'Queued offline', ERROR: 'Sync failed',
};
const ABOUT_LINKS: ReadonlyArray<{ href: string; title: string; subtitle: string }> = [
  { href: '/data', title: 'Data Explorer', subtitle: 'See where each price comes from' },
  { href: '/docs', title: 'API Docs', subtitle: 'The public API' },
  { href: '/privacy', title: 'Privacy Policy', subtitle: 'What we store and what we never do' },
  { href: '/terms', title: 'Terms and Conditions', subtitle: 'Service terms and price disclaimers' },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="px-1 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { userSync, canUseAi, pantry } = useAccountContext();
  const { data } = useDashboardContext();
  const { currentZip, showZipModal, setShowZipModal } = useLocationContext();
  const {
    activeStores, targetServings, handleServingsChange, macroGoal, handleMacroGoalChange, dietaryConstraints,
    handleToggleDietaryConstraint, applianceFilter, handleVesselChange,
  } = usePreferencesContext();
  const {
    lastTab, showStoresModal, setShowStoresModal, showAlertsModal, handleToggleAlertsModal, setShowAccountModal, setAccountIntent,
    showAiSignIn, handleForceCloudSync,
  } = useShellContext();
  const { shopView } = useShopContext();
  const { preference, setPreference } = useTheme();
  const signedIn = userSync.authenticated;
  const openSignIn = () => { setAccountIntent('account'); setShowAccountModal(true); };
  const [syncOpen, setSyncOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const exported = useExport(userSync.exportAccountDataJson);
  const labelOf = <T extends string>(options: ReadonlyArray<{ value: T; label: string }>, value: T) => options.find((option) => option.value === value)?.label ?? value;
  const preferencesSummary = `${labelOf(MACRO_OPTIONS, macroGoal)}, ${dietaryConstraints.length} dietary ${dietaryConstraints.length === 1 ? 'rule' : 'rules'}, cookware: ${labelOf(VESSEL_OPTIONS, applianceFilter)}`;
  const back = lastTab === 'shop' ? { module: 'shop' as const, view: shopView } : { module: lastTab };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <AppLink
        to={back}
        className="inline-flex min-h-touch items-center gap-1 rounded-control text-base font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
        <span>Back</span>
      </AppLink>
      <PageHeader title="Account and Settings" />

      <Card as="section" aria-label="Your account" className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink">{signedIn ? userSync.profile?.displayName || 'Account' : 'Guest'}</p>
          <p className="text-sm text-muted">
            {signedIn ? [userSync.profile?.email, `Signed in with ${userSync.profile?.provider === 'apple' ? 'Apple' : 'Google'}`].filter(Boolean).join(' \u00b7 ') : 'Saved on this device'}
          </p>
        </div>
        {signedIn
          ? <Button variant="secondary" disabled={userSync.authLoading} onClick={() => void userSync.signOut()}>Sign Out</Button>
          : <Button variant="primary" onClick={openSignIn}>Sign In</Button>}
      </Card>

      <Section id="settings-shopping" title="Shopping">
        <Card padding="none" className="px-4">
          <List>
            <ListRow title="Location" subtitle={`${data.cityLabel} ${currentZip}`} onClick={() => setShowZipModal(!showZipModal)} />
            {showZipModal && <li><ZipPanel /></li>}
            <ListRow title="My Stores" subtitle={`${activeStores.length} selected`} onClick={() => setShowStoresModal(!showStoresModal)} />
            {showStoresModal && <li><StoresPanel /></li>}
          </List>
        </Card>
      </Section>

      <Section id="settings-meal-prep" title="Meal Prep">
        <Card className="space-y-4">
          <Select label="Macro goal" value={macroGoal} onChange={(event) => handleMacroGoalChange(event.target.value as MacroGoal)}>
            {MACRO_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-ink">Dietary rules</legend>
            {DIETARY_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={dietaryConstraints.includes(option.value)}
                onChange={() => handleToggleDietaryConstraint(option.value)}
              />
            ))}
          </fieldset>
          <Select label="Cookware" value={applianceFilter} onChange={(event) => handleVesselChange(event.target.value as CookingVesselArchetype)}>
            {VESSEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Default servings</p>
            <SegmentedControl
              label="Default servings"
              options={SERVINGS.map((value) => ({ value, label: value }))}
              value={String(targetServings) as (typeof SERVINGS)[number]}
              onChange={(value) => handleServingsChange(Number(value) as 4 | 6 | 8)}
            />
          </div>
        </Card>
      </Section>

      <Section id="settings-appearance" title="Appearance">
        <Card>
          <SegmentedControl
            label="Theme"
            options={THEME_PREFERENCES.map((value) => ({ value, label: THEME_LABELS[value] }))}
            value={preference}
            onChange={setPreference}
          />
        </Card>
      </Section>

      <Section id="settings-account" title="Account">
        <Card padding="none" className="px-4">
          <List>
            {signedIn
              ? (
                <ListRow
                  title="Sync Status"
                  onClick={() => setSyncOpen(true)}
                  trailing={(
                    <span className="flex items-center gap-1 text-sm text-muted">
                      {SYNC_LABELS[userSync.syncStatus]}
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </span>
                  )}
                />
              )
              : <ListRow title="Sync Status" trailing={<span className="text-sm text-muted">Device only</span>} />}
            <ListRow
              title="AI Features"
              trailing={canUseAi
                ? <span className="text-sm text-muted">On</span>
                : signedIn
                  ? <span className="text-sm text-muted">Not available yet</span>
                  : <Button variant="secondary" onClick={showAiSignIn}>Sign In to Access</Button>}
            />
            <ListRow title="Weekly Digest" subtitle="Preview" onClick={handleToggleAlertsModal} />
            {showAlertsModal && <li><AlertsPanel /></li>}
            {signedIn && (
              <ListRow
                title="Export My Grocery Data"
                subtitle="A portable JSON copy of your pantry, preferences and saved recipes"
                onClick={() => void exported.run()}
                trailing={exported.done ? <span className="text-sm text-muted">Downloaded .JSON!</span> : undefined}
              />
            )}
            {signedIn && <ListRow title="Delete Account & Data" subtitle="Permanently removes your account and everything in it" onClick={() => setDeleteOpen(true)} />}
          </List>
        </Card>
      </Section>
      {signedIn && (
        <>
          <SyncStatusSheet
            open={syncOpen}
            onClose={() => setSyncOpen(false)}
            syncStatus={userSync.syncStatus}
            storageMode={userSync.storageMode}
            lastSyncedIso={userSync.lastSyncedIso}
            currentZip={currentZip}
            storeCount={activeStores.length}
            pantryItemCount={pantry.entries.filter((entry) => !entry.deletedAtIso).length}
            preferencesSummary={preferencesSummary}
            onSyncNow={handleForceCloudSync}
          />
          <DeleteAccountSheet
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            authLoading={userSync.authLoading}
            onExport={userSync.exportAccountDataJson}
            onDelete={userSync.deleteAccountAndData}
          />
        </>
      )}

      <Section id="settings-about" title="About">
        <Card padding="none" className="px-4">
          <List>
            {ABOUT_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="flex min-h-touch w-full items-center gap-3 rounded-control py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="text-base text-ink">{link.title}</span>
                    <span className="text-sm text-muted">{link.subtitle}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 text-muted" />
                </a>
              </li>
            ))}
          </List>
        </Card>
      </Section>
    </div>
  );
}

'use client';

import { ChevronLeft } from 'lucide-react';
import { focusRing } from '@/components/ui/cx';
import { resolveStoreBanner } from '@/data/store-registry';
import { recipePantryIngredientId } from '@/lib/pantry/recipe-identity';
import PantryDetail, { type PantryDeal } from '@/modules/pantry/PantryDetail';
import VirtualPantry from '@/modules/pantry/VirtualPantry';
import AppLink from '@/modules/shell/AppLink';
import { useAccountContext, useDashboardContext, useLocationContext, useShellContext } from '@/modules/shell/app-context';
import { useAppRouter } from '@/modules/shell/app-router';
import { itemIdOfPath } from '@/modules/shell/navigation';

// v2.0 M3 Phase B.2d: the Pantry module's entry point, moved verbatim from MealPrepDashboard's header drawer. Since B.3b
// the Pantry is a module of its own: this is its page, shown while the module is current (the shell decides); since
// M4-1a it is a tab, with no Close button and no origin to return to. It reads the
// private pantry (owner, entries and the save, delete, retry, resolve and import actions) from the Account context and
// the drawer state from the Shell context, and hands them to VirtualPantry, which stays a presentational component with
// its own tests. The drawer is remounted when the pantry owner changes (the key below), so a half-typed entry never
// carries over to another account. The three flags are page-level configuration, not state, so they stay props.
//
// v2.0 M4-4b: Ingredient Detail is this page at /pantry/item/<entry id>. Below 1024 px it replaces the list (a screen with a Back
// link); from 1024 px the list is the left column (380 px) and the detail the pane beside it, with a prompt in the pane until an
// ingredient is chosen. The detail's read-only cards are derived here from data the app already has: the dishes in this week's
// plan that use the ingredient, and the current deals for it, both matched by the reviewed recipe identity (never by name).
interface PantryDrawerProps {
  speechConfigured?: boolean;
  barcodeEnabled?: boolean;
  cameraEnabled?: boolean;
}

export default function PantryDrawer({ speechConfigured = false, barcodeEnabled = false, cameraEnabled = false }: PantryDrawerProps) {
  const { pantry, pantryAccountId } = useAccountContext();
  const { showAiSignIn, navigateTo } = useShellContext();
  const { data, activeTrio } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { pathname } = useAppRouter();
  const itemId = itemIdOfPath(pathname);
  const entry = itemId === null ? null : pantry.entries.find((candidate) => candidate.id === itemId && !candidate.deletedAtIso) ?? null;

  const pantryId = entry?.ingredientId;
  const usedIn = pantryId
    ? activeTrio.filter((dish) => dish.matchedIngredients.some((matched) => recipePantryIngredientId(matched.ingredientId) === pantryId)).map((dish) => dish.title)
    : [];
  const deals: PantryDeal[] = pantryId
    ? data.commodities.filter((commodity) => recipePantryIngredientId(commodity.ingredient.id) === pantryId).map((commodity) => ({
      id: commodity.ingredient.id,
      name: commodity.ingredient.name,
      offer: `${resolveStoreBanner(commodity.bestOffer.store, currentZip)} $${commodity.bestOffer.normalizedPricePerUnit.toFixed(2)}/${commodity.ingredient.standardUnit}`,
    }))
    : [];

  const back = (
    <AppLink to={{ module: 'pantry' }} className={`inline-flex min-h-touch items-center gap-1 text-accent wide:hidden ${focusRing}`}>
      <ChevronLeft aria-hidden="true" className="size-5" />
      <span>Pantry</span>
    </AppLink>
  );
  return (
    <div className="wide:grid wide:grid-cols-[380px_minmax(0,1fr)] wide:items-start wide:gap-6">
      <div className={`min-w-0 ${itemId !== null ? 'hidden wide:block' : ''}`}>
        <VirtualPantry speechConfigured={speechConfigured} onAiSignIn={showAiSignIn} owner={pantry.owner} barcodeEnabled={barcodeEnabled} cameraEnabled={cameraEnabled}
          key={pantry.owner ?? `loading:${pantryAccountId ?? 'guest'}`}
          entries={pantry.entries} acceptedCatalogIds={pantry.acceptedCatalogIds} status={pantry.status} error={pantry.error} guest={pantry.guest} hasLegacyEdits={pantry.hasLegacyEdits}
          importDuplicates={pantry.importDuplicates}
          guestEntries={pantry.guestEntries} conflicts={pantry.conflicts}
          onSave={pantry.save} onDelete={pantry.remove} onRetry={pantry.retry} onResolve={pantry.resolve}
          onImportGuest={pantry.importGuest} onReviewLegacy={pantry.reviewLegacy} onImportLegacy={pantry.importLegacy}
          selectedId={itemId}
          renderEntryName={(candidate, name) => (
            <AppLink to={{ module: 'pantry', item: candidate.id }} className={`flex min-h-touch items-center ${focusRing}`}>{name}</AppLink>
          )}
        />
      </div>
      <section aria-label="Ingredient detail" className={`min-w-0 wide:sticky wide:top-4 ${itemId !== null ? '' : 'hidden wide:block'}`}>
        {itemId !== null
          ? <PantryDetail key={pantry.owner ?? 'loading'} entry={entry} loading={pantry.status === 'Loading'} entries={pantry.entries} acceptedCatalogIds={pantry.acceptedCatalogIds}
            usedIn={usedIn} deals={deals} onSave={pantry.save} onDelete={pantry.remove} onRemoved={() => navigateTo({ module: 'pantry' })}
            back={back}
            dealLink={(deal, children) => <AppLink to={{ module: 'shop', view: 'BOARD', deal: deal.id }} className={`flex min-h-touch items-center text-accent ${focusRing}`}>{children}</AppLink>} />
          : <p className="rounded-card bg-chip p-6 text-center text-sm text-muted">Choose an ingredient to see its details.</p>}
      </section>
    </div>
  );
}

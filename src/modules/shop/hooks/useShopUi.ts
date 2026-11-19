import { useState } from 'react';
import type { ShopView } from '@/modules/shell/navigation';
import { formatShoppingListForClipboard } from '@/lib/cart-exporter';
import type { CommodityCategory, StoreChain } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase B.1b): the Shop view state and its handlers. All of it is
// pure view state that survives navigation (owner decision 1), so the provider keeps it, not the Shop components.
// Two things to keep when editing:
//  1. The handlers are plain functions recreated every render (not memoized), like the closures they were.
//  2. useShopUi has no inputs because the derived-data chain (useDerivedDashboard) reads categoryFilter, sortMode and
//     tripMode. The copy handler needs that chain's output, so it is a second hook, useShopCopyAction, called after it.
export function useShopUi() {
  const [shopView, setShopView] = useState<ShopView>('BOARD');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CommodityCategory>('ALL');
  const [sortMode, setSortMode] = useState<
    'VALUE_SCORE' | 'LOWEST_PRICE' | 'BIGGEST_DISCOUNT'
  >('VALUE_SCORE');
  const [copiedChecklist, setCopiedChecklist] = useState(false);
  const [showPrintSlipModal, setShowPrintSlipModal] = useState(false);
  const [tripMode, setTripMode] = useState<'SPLIT' | StoreChain>('SPLIT');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [clippedCoupons, setClippedCoupons] = useState<Record<string, boolean>>({});

  function toggleCheckedItem(key: string) {
    setCheckedItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mead_checked_items_v03', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }

  function toggleClippedCoupon(key: string) {
    setClippedCoupons((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mead_clipped_coupons_v03', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }

  function handlePrintShoppingSlip() {
    setShowPrintSlipModal(true);
    setTimeout(() => {
      window.print();
    }, 150);
  }

  return {
    shopView, setShopView, categoryFilter, setCategoryFilter, sortMode, setSortMode, copiedChecklist, setCopiedChecklist,
    showPrintSlipModal, setShowPrintSlipModal, tripMode, setTripMode, checkedItems, setCheckedItems,
    clippedCoupons, setClippedCoupons, toggleCheckedItem, toggleClippedCoupon, handlePrintShoppingSlip,
  };
}

type ClipboardArgs = Parameters<typeof formatShoppingListForClipboard>[0];
interface ShopCopyArgs {
  resolvedShoppingItems: ClipboardArgs['items'];
  shoppingPlan: Pick<ClipboardArgs, 'pantryChecklist' | 'tripComparison'>;
  activeTrio: ClipboardArgs['activeTrio'];
  currentZip: string;
  cityLabel: ClipboardArgs['cityLabel'];
  tripMode: ClipboardArgs['tripMode'];
  checkedItems: ClipboardArgs['checkedItems'];
  setCopiedChecklist: (copied: boolean) => void;
}

export function useShopCopyAction({
  resolvedShoppingItems, shoppingPlan, activeTrio, currentZip, cityLabel, tripMode, checkedItems, setCopiedChecklist,
}: ShopCopyArgs) {
  // v1.2 Ticket #23: Copy formatted checklist for Apple Notes / Google Keep / Reminders
  function handleCopyShoppingListForNotes() {
    const text = formatShoppingListForClipboard({
      items: resolvedShoppingItems,
      pantryChecklist: shoppingPlan.pantryChecklist,
      tripComparison: shoppingPlan.tripComparison,
      activeTrio,
      zipCode: currentZip,
      cityLabel,
      tripMode,
      checkedItems,
    });
    navigator.clipboard?.writeText(text);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 3000);
  }

  return { handleCopyShoppingListForNotes };
}

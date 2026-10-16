import { NextRequest, NextResponse } from 'next/server';
import { resolveStoreBanner } from '@/data/store-registry';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import {
  getRecentSyncRunsFromSqlite,
  recordSyncRunToSqlite,
} from '@/lib/db/sqlite';
import {
  FridayWeekendDigest,
  SmartPushNotificationPayload,
  WeeklySyncCronResult,
} from '@/types/domain';

async function executeWeeklySync(
  cycle: string,
  zipCode = '80542',
  recordRun = true
): Promise<WeeklySyncCronResult> {
  const executedAtIso = new Date().toISOString();

  const dashboard = await buildDashboardPayload({
    zipCode,
    storeFilter: 'ALL',
    pinnedIngredientIds: [],
    onHandIngredientIds: [],
    targetServings: 6,
  });

  const { items: shoppingItems, tripComparison } =
    buildShoppingListAndStoreComparison(
      dashboard.recommendedTrio,
      dashboard.commodities,
      [],
      zipCode
    );

  const digitalCouponItems = shoppingItems.filter(
    (item) => item.optimalDealType === 'DIGITAL_COUPON'
  );

  const topCommodity = dashboard.commodities[0];
  const topSplurge = dashboard.splurgeAlerts[0];
  const topDish = dashboard.recommendedTrio[0];

  const totalTrioServings = dashboard.recommendedTrio.reduce(
    (sum, d) => sum + d.servings,
    0
  );
  const avgCostPerServing =
    totalTrioServings > 0
      ? Number(
          (tripComparison.optimalSplitTotal / totalTrioServings).toFixed(2)
        )
      : 0;

  const smartPushNotifications: SmartPushNotificationPayload[] = [];

  if (topCommodity) {
    const storeName = resolveStoreBanner(topCommodity.bestOffer.store, zipCode);
    smartPushNotifications.push({
      id: `push-wed-${Date.now()}`,
      triggerType: 'WEDNESDAY_AD_DROP',
      scheduledWindowLabel: 'Wednesdays • 6:00 AM MT',
      title: `🛒 Mead (${zipCode}) Weekly Circulars Live!`,
      subtitle: `#1 Value: ${topCommodity.ingredient.name} at $${topCommodity.bestOffer.normalizedPricePerUnit.toFixed(2)}/${topCommodity.ingredient.standardUnit} (${storeName})`,
      body: `${Math.round(topCommodity.discountVsBaselinePct * 100)}% below USDA Mountain Region baseline. ${digitalCouponItems.length} digital coupons ready to clip for this weekend's top 3 batch meals.`,
      deepLinkPath: '/?tab=leaderboard',
      badgeText: `Score ${topCommodity.valueScore}/100`,
      priority: 'high',
    });
  }

  if (topSplurge) {
    const storeName = resolveStoreBanner(topSplurge.bestOffer.store, zipCode);
    smartPushNotifications.push({
      id: `push-splurge-${Date.now()}`,
      triggerType: 'SPLURGE_ALERT',
      scheduledWindowLabel: 'Real-Time Deep Discount Trigger',
      title: `💎 Splurge Stock-Up Alert: ${topSplurge.ingredient.name}`,
      subtitle: `$${topSplurge.bestOffer.normalizedPricePerUnit.toFixed(2)}/${topSplurge.ingredient.standardUnit} at ${storeName} (-${Math.round(topSplurge.discountVsBaselinePct * 100)}% vs. Baseline)`,
      body: `${topSplurge.bestOffer.rawPriceText}${topSplurge.bestOffer.dealConditions ? ` (${topSplurge.bestOffer.dealConditions})` : ''}. Rare 6-week local low for freezer stock-up or Dutch oven braising.`,
      deepLinkPath: '/?tab=splurge',
      badgeText: `-${Math.round(topSplurge.discountVsBaselinePct * 100)}% OFF`,
      priority: 'high',
    });
  }

  const dishTitlesJoined = dashboard.recommendedTrio
    .map((d) => d.title)
    .join(' • ');

  smartPushNotifications.push({
    id: `push-fri-${Date.now()}`,
    triggerType: 'FRIDAY_PREP_DIGEST',
    scheduledWindowLabel: 'Fridays • 4:00 PM MT',
    title: `🍲 Weekend Prep Ready: ${totalTrioServings} Meals for $${tripComparison.optimalSplitTotal.toFixed(2)} ($${avgCostPerServing.toFixed(2)}/meal)`,
    subtitle: tripComparison.recommendationHeadline,
    body: `This weekend's lineup: ${dishTitlesJoined}. Clip ${digitalCouponItems.length} digital coupon(s) before heading out!`,
    deepLinkPath: '/?tab=shopping-list',
    badgeText: `Save $${(tripComparison.regularShelfTotal - tripComparison.optimalSplitTotal).toFixed(2)}`,
    priority: 'normal',
  });

  const markdownLines: string[] = [
    `# 🍲 Mead, CO (${zipCode}) Weekend Meal-Prep Digest`,
    `**Ad Cycle:** ${dashboard.adCycleLabel} | **Generated:** ${new Date(executedAtIso).toLocaleString('en-US', { timeZone: 'America/Denver' })} MT`,
    ``,
    `## 1. Weekend Batch Trio (${totalTrioServings} Total Servings)`,
    ...dashboard.recommendedTrio.map(
      (d, idx) =>
        `${idx + 1}. **${d.title}** (${d.style} • ${d.appliance}) — **$${d.totalBatchCost.toFixed(2)} batch** ($${d.costPerServing.toFixed(2)}/serving, saves $${d.totalBatchSavings.toFixed(2)}) | *${d.macrosPerServing.calories} kcal, ${d.macrosPerServing.proteinGrams}g P / ${d.macrosPerServing.carbsGrams}g C / ${d.macrosPerServing.fatGrams}g F*`
    ),
    ``,
    `## 2. Store Trip Cost Optimizer`,
    `- **Optimal 2-Store Split:** $${tripComparison.optimalSplitTotal.toFixed(2)} (Saves $${(tripComparison.regularShelfTotal - tripComparison.optimalSplitTotal).toFixed(2)} vs. regular shelf)`,
    `- **King Soopers 1-Stop (#62000116 Firestone):** $${tripComparison.kingSoopersOnlyTotal.toFixed(2)}`,
    `- **Safeway 1-Stop (1632 Main St Longmont):** $${tripComparison.safewayOnlyTotal.toFixed(2)}`,
    `- **Verdict:** ${tripComparison.recommendationHeadline} — ${tripComparison.recommendationDetail}`,
    ``,
    `## 3. 📱 Digital Coupon Pre-Flight Checklist (${digitalCouponItems.length} to Clip)`,
    ...(digitalCouponItems.length > 0
      ? digitalCouponItems.map(
          (item) =>
            `- [ ] **${item.optimalStore === 'KING_SOOPERS' ? 'King Soopers App' : 'Safeway for U App'}:** ${item.ingredientName} — ${item.optimalRawDealText}${item.optimalDealConditions ? ` (${item.optimalDealConditions})` : ''}`
        )
      : [`- No digital coupons required for this weekend's trio.`]),
    ``,
    `## 4. Top 5 Commodity Value Leaders`,
    ...dashboard.commodities.slice(0, 5).map(
      (c, i) =>
        `${i + 1}. **${c.ingredient.name}**: $${c.bestOffer.normalizedPricePerUnit.toFixed(2)}/${c.ingredient.standardUnit} at ${c.bestOffer.store === 'KING_SOOPERS' ? 'King Soopers' : 'Safeway'} (-${Math.round(c.discountVsBaselinePct * 100)}% vs. USDA Mountain Baseline, Value Score: ${c.valueScore}/100)`
    ),
  ];

  const fridayWeekendDigest: FridayWeekendDigest = {
    generatedAtIso: executedAtIso,
    adCycleLabel: dashboard.adCycleLabel,
    zipCode,
    topValueCommodities: dashboard.commodities.slice(0, 5).map((c) => ({
      name: c.ingredient.name,
      bestPrice: c.bestOffer.normalizedPricePerUnit,
      unit: c.ingredient.standardUnit,
      store: c.bestOffer.store,
      discountVsBaselinePct: c.discountVsBaselinePct,
      dealType: c.bestOffer.dealType,
      dealConditions: c.bestOffer.dealConditions,
    })),
    splurgeAlerts: dashboard.splurgeAlerts.map((s) => ({
      name: s.ingredient.name,
      bestPrice: s.bestOffer.normalizedPricePerUnit,
      unit: s.ingredient.standardUnit,
      store: s.bestOffer.store,
      discountVsBaselinePct: s.discountVsBaselinePct,
      rawDealText: s.bestOffer.rawPriceText,
    })),
    recommendedWeekendTrio: dashboard.recommendedTrio.map((d) => ({
      title: d.title,
      prepStyle: d.style,
      cookware: d.appliance,
      servings: d.servings,
      totalBatchCost: d.totalBatchCost,
      costPerServing: d.costPerServing,
      totalBatchSavings: d.totalBatchSavings,
      macrosPerServing: d.macrosPerServing,
    })),
    tripOptimization: tripComparison,
    digitalCouponChecklistCount: digitalCouponItems.length,
    markdownDigest: markdownLines.join('\n'),
  };

  if (recordRun) {
    recordSyncRunToSqlite({
      cycle,
      syncedOffersCount: dashboard.commodities.length * 2,
      flippLive: dashboard.dataSourcesActive.flippLive,
      krogerLive: dashboard.dataSourcesActive.krogerLive,
      usdaLive: dashboard.dataSourcesActive.usdaLive,
      topDishTitle: topDish ? topDish.title : 'N/A',
      optimalBasketTotal: tripComparison.optimalSplitTotal,
    });
  }

  const recentSyncRuns = getRecentSyncRunsFromSqlite(6);

  return {
    ok: true,
    cycle,
    executedAtIso,
    syncedOffersCount: dashboard.commodities.length * 2,
    dataSources: {
      flippLive: dashboard.dataSourcesActive.flippLive,
      krogerLive: dashboard.dataSourcesActive.krogerLive,
      usdaLive: dashboard.dataSourcesActive.usdaLive,
    },
    smartPushNotifications,
    fridayWeekendDigest,
    recentSyncRuns,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cycle = searchParams.get('cycle') || 'preview_digest';
    const zipCode = searchParams.get('zip') || '80542';
    const recordParam = searchParams.get('record') === 'true';

    // Record run automatically if invoked by Vercel Cron or explicitly requested
    const isCronHeader = Boolean(request.headers.get('x-vercel-cron'));
    const result = await executeWeeklySync(
      cycle,
      zipCode,
      isCronHeader || recordParam
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Weekly cron sync GET failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to execute weekly circular sync' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      cycle?: string;
      zipCode?: string;
    };
    const cycle = body.cycle || 'manual_sync';
    const zipCode = body.zipCode || '80542';

    const result = await executeWeeklySync(cycle, zipCode, true);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Weekly cron sync POST failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to trigger manual weekly sync' },
      { status: 500 }
    );
  }
}

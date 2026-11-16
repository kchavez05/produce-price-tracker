'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, Plus, Search } from 'lucide-react';
import {
  Badge, Banner, Button, Card, Checkbox, Chip, EmptyState, IconButton, List, ListRow, PageHeader,
  SegmentedControl, Select, Sheet, Sidebar, Skeleton, TabBar, TextField, VisuallyHidden, type BadgeTone, type BannerTone,
} from '@/components/ui';
import { contrastRatio } from '@/design/contrast';
import { THEME_PREFERENCES, type ThemePreference } from '@/design/theme';
import {
  THEMES, colorTokens, radiusTokens, textContrastPairs, typeTokens, uiContrastPairs, type ColorToken,
} from '@/design/tokens';
import { useTheme } from '@/hooks/useTheme';

const NAV = [{ id: 'shop', label: 'Shop' }, { id: 'pantry', label: 'Pantry' }, { id: 'plan', label: 'Plan' }];
const THEME_OPTIONS = THEME_PREFERENCES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignGuide() {
  const { preference, theme, setPreference } = useTheme();
  const [nav, setNav] = useState('shop');
  const [segment, setSegment] = useState('weekly');
  const [chip, setChip] = useState(false);
  const [sheet, setSheet] = useState<'sheet' | 'dialog' | null>(null);
  const [banner, setBanner] = useState(true);
  const opener = useRef<HTMLButtonElement>(null);

  // Opt this page into the token-driven color-scheme, as M4 screens will.
  useEffect(() => {
    document.documentElement.setAttribute('data-ds', '');
    return () => document.documentElement.removeAttribute('data-ds');
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink" style={{ fontFamily: typeTokens.family }}>
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6">
        <PageHeader title="Design System" subtitle="Development only. Tokens, themes and primitives (v2.0 M1)." />

        <Section title="Theme">
          <SegmentedControl
            label="Theme preference"
            options={THEME_OPTIONS}
            value={preference}
            onChange={(value) => setPreference(value as ThemePreference)}
          />
          <p className="text-sm text-muted">Resolved theme: {theme}. Stored on this device.</p>
        </Section>

        <Section title="Color Tokens">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(colorTokens) as ColorToken[]).map((name) => (
              <div key={name} className="flex items-center gap-2 rounded-control bg-surface p-2 text-sm">
                <span aria-hidden="true" className="size-8 shrink-0 rounded-pill border border-border-strong" style={{ backgroundColor: `var(--ds-${name})` }} />
                <span className="min-w-0">
                  <span className="block font-semibold">{name}</span>
                  <span className="block text-xs text-muted">{colorTokens[name].light} / {colorTokens[name].dark}</span>
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Contrast">
          <div className="overflow-x-auto rounded-card bg-surface">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Computed contrast ratios per theme</caption>
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="p-2">Pair</th><th scope="col" className="p-2">Need</th>
                  {THEMES.map((name) => <th key={name} scope="col" className="p-2">{name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...textContrastPairs.map((p) => [p, 4.5] as const), ...uiContrastPairs.map((p) => [p, 3] as const)].map(([[fg, bg], need]) => (
                  <tr key={`${fg}-${bg}-${need}`} className="border-t border-border">
                    <th scope="row" className="p-2 font-normal">{fg} on {bg}</th>
                    <td className="p-2">{need}:1</td>
                    {THEMES.map((name) => <td key={name} className="p-2">{contrastRatio(colorTokens[fg][name], colorTokens[bg][name]).toFixed(2)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Typography and Shape">
          <Card>
            <p className="text-[28px] font-bold">Large Title 28</p>
            <p className="text-xl font-bold">Heading 20</p>
            <p className="text-base">Body {typeTokens.size.body}</p>
            <p className="text-sm text-muted">Caption {typeTokens.size.caption}</p>
            <p className="mt-2 text-xs text-muted">Radius: control {radiusTokens.control}, card {radiusTokens.card}, pill {radiusTokens.pill}</p>
          </Card>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Primary</Button>
            <Button>Secondary</Button>
            <Button variant="quiet">Quiet</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="primary" loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Notifications" icon={<Bell className="size-5" />} />
            <IconButton label="Search" icon={<Search className="size-5" />} />
          </div>
        </Section>

        <Section title="Form Controls">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Ingredient" placeholder="Olive oil" hint="Search the catalog or add your own." />
            <TextField label="ZIP code" defaultValue="80" error="Enter a five digit ZIP code." />
            <Select label="Storage location" defaultValue="PANTRY">
              <option value="PANTRY">Pantry</option><option value="FRIDGE">Fridge</option><option value="FREEZER">Freezer</option>
            </Select>
            <Checkbox label="Show items marked No" />
          </div>
          <SegmentedControl
            label="Plan length"
            options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
            value={segment}
            onChange={setSegment}
          />
          <div className="flex flex-wrap gap-2">
            <Chip selected={chip} onClick={() => setChip(!chip)}>Vegetarian</Chip>
            <Chip>Plain chip</Chip>
          </div>
        </Section>

        <Section title="Status">
          <div className="flex flex-wrap gap-2">
            {(['neutral', 'accent', 'save', 'warning', 'danger'] as BadgeTone[]).map((tone) => <Badge key={tone} tone={tone}>{tone}</Badge>)}
          </div>
          {(['info', 'warning', 'error'] as BannerTone[]).map((tone) => (
            <Banner key={tone} tone={tone} title={`${tone[0].toUpperCase()}${tone.slice(1)} Banner`}>Banners carry meaning in text.</Banner>
          ))}
          {banner && <Banner onDismiss={() => setBanner(false)}>A dismissible banner.</Banner>}
          <div role="status">
            <VisuallyHidden>Loading</VisuallyHidden>
            <div className="flex flex-col gap-2"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-full" /></div>
          </div>
        </Section>

        <Section title="Lists and Empty States">
          <Card padding="none" className="px-4">
            <List>
              <ListRow title="Kale" subtitle="$2.49 / lb" trailing={<Badge tone="save">Low</Badge>} />
              <ListRow title="Open Pantry" onClick={() => undefined} leading={<Plus className="size-4" />} />
            </List>
          </Card>
          <Card><EmptyState title="Nothing Here Yet" description="Add an ingredient to get started." action={<Button variant="primary">Add Ingredient</Button>} /></Card>
        </Section>

        <Section title="Navigation">
          <div className="overflow-hidden rounded-card border border-border">
            <TabBar label="Main tabs" items={NAV} current={nav} onSelect={setNav} />
          </div>
          <Sidebar label="Main sidebar" items={NAV} current={nav} onSelect={setNav} header={<p className="px-3 text-lg font-bold">PantryBot</p>} />
        </Section>

        <Section title="Sheet and Dialog">
          <div className="flex gap-2">
            <Button ref={opener} onClick={() => setSheet('sheet')}>Open Sheet</Button>
            <Button onClick={() => setSheet('dialog')}>Open Dialog</Button>
          </div>
          <Sheet open={sheet !== null} variant={sheet ?? 'sheet'} onClose={() => setSheet(null)} title="Edit Ingredient">
            <div className="flex flex-col gap-3">
              <TextField label="Name" defaultValue="Olive oil" />
              <Button variant="primary" onClick={() => setSheet(null)}>Save</Button>
            </div>
          </Sheet>
        </Section>
      </main>
    </div>
  );
}

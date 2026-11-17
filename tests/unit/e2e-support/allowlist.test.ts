import { describe, expect, it } from 'vitest';
import { axeEntries, describeResult, evaluateAllowlist, scrollEntries, type AllowlistEntry } from '../../e2e/support/allowlist';

const entry = (over: Partial<AllowlistEntry> = {}): AllowlistEntry => ({
  screen: 'home', rule: 'color-contrast', projects: ['iphone-webkit'], issue: 1, reason: 'legacy palette', ...over,
});

describe('evaluateAllowlist', () => {
  it('accepts allowlisted findings and flags new ones', () => {
    const result = evaluateAllowlist([entry()], 'home', 'iphone-webkit', [{ rule: 'color-contrast', nodes: 60 }, { rule: 'image-alt', nodes: 1 }]);
    expect(result.unexpected).toEqual([{ rule: 'image-alt', nodes: 1 }]);
    expect(result.stale).toEqual([]);
  });

  it('flags a stale entry that no longer occurs so it must be removed (ratchet)', () => {
    const result = evaluateAllowlist([entry(), entry({ rule: 'select-name', issue: 2 })], 'home', 'iphone-webkit', [{ rule: 'color-contrast', nodes: 3 }]);
    expect(result.unexpected).toEqual([]);
    expect(result.stale.map((e) => e.rule)).toEqual(['select-name']);
  });

  it('only applies entries to their own screen and project', () => {
    const entries = [entry()];
    expect(evaluateAllowlist(entries, 'home', 'ipad-webkit', [{ rule: 'color-contrast', nodes: 1 }]).unexpected).toHaveLength(1);
    expect(evaluateAllowlist(entries, 'pantry', 'iphone-webkit', [{ rule: 'color-contrast', nodes: 1 }]).unexpected).toHaveLength(1);
    expect(evaluateAllowlist(entries, 'pantry', 'iphone-webkit', []).stale).toEqual([]);
  });

  it('passes cleanly with no entries and no findings', () => {
    const result = evaluateAllowlist([], 'home', 'iphone-webkit', []);
    expect(describeResult('home', 'iphone-webkit', result)).toBe('');
  });

  it('describes both kinds of failure', () => {
    const message = describeResult('home', 'iphone-webkit', { unexpected: [{ rule: 'image-alt', nodes: 2 }], stale: [entry({ issue: 9 })] });
    expect(message).toContain('new problem on "home" (iphone-webkit): image-alt (2 nodes)');
    expect(message).toContain('stale allowlist entry');
    expect(message).toContain('#9');
  });
});

describe('axeEntries and scrollEntries', () => {
  const entries = [entry(), entry({ rule: 'horizontal-scroll', issue: 3 })];

  it('keeps overflow entries out of the axe check so they are never reported stale there', () => {
    expect(axeEntries(entries).map((e) => e.rule)).toEqual(['color-contrast']);
    const result = evaluateAllowlist(axeEntries(entries), 'home', 'iphone-webkit', [{ rule: 'color-contrast', nodes: 1 }]);
    expect(result.stale).toEqual([]);
  });

  it('keeps axe entries out of the overflow check', () => {
    expect(scrollEntries(entries).map((e) => e.rule)).toEqual(['horizontal-scroll']);
    expect(evaluateAllowlist(scrollEntries(entries), 'home', 'iphone-webkit', []).stale.map((e) => e.rule)).toEqual(['horizontal-scroll']);
  });
});

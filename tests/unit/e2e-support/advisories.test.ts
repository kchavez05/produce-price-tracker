import { describe, expect, it } from 'vitest';
import { matchAdvisory } from '../../e2e/support/advisories';

const preload = "The resource http://localhost:3210/_next/static/css/169d089783bb77c2.css was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it wasn't preloaded for nothing.";

describe('matchAdvisory', () => {
  it('recognizes the unused stylesheet preload warning', () => {
    expect(matchAdvisory('warning', preload)).toMatchObject({ id: 'unused-css-preload' });
  });

  it('does not treat the same text as benign when it is an error', () => {
    expect(matchAdvisory('error', preload)).toBeUndefined();
  });

  it('keeps hydration warnings and other warnings as problems', () => {
    expect(matchAdvisory('warning', 'Warning: Text content did not match. Server: "a" Client: "b"')).toBeUndefined();
    expect(matchAdvisory('error', 'Hydration failed because the server rendered HTML didn\'t match the client.')).toBeUndefined();
    expect(matchAdvisory('warning', 'Failed to load resource: the server responded with a status of 404')).toBeUndefined();
  });

  it('only matches stylesheet preloads, not other resources', () => {
    expect(matchAdvisory('warning', preload.replace('.css', '.js'))).toBeUndefined();
  });
});

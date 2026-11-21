'use client';

import { useEffect } from 'react';

// v2.0 M4-7a: opts a page into the design tokens' color scheme (`data-ds` on <html>, which turns on `color-scheme` so form controls and
// scrollbars follow the theme), as the app shell does for the app screens. The theme itself (`data-theme`) is set before first paint by
// the root layout's script. The static pages (the Data Explorer now; legal and docs in M4-8) use this until the root layout adopts the
// tokens (M4-10).
export default function TokenScope() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-ds', '');
    return () => root.removeAttribute('data-ds');
  }, []);
  return null;
}

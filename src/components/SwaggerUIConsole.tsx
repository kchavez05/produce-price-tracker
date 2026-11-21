'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Badge, Banner, Button, Card, Chip } from '@/components/ui';
import { cx, focusRing } from '@/components/ui/cx';
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Search,
} from 'lucide-react';
import 'swagger-ui-dist/swagger-ui.css';

interface SwaggerUIConsoleProps {
  specUrl?: string;
}

export default function SwaggerUIConsole({
  specUrl = '/api/openapi.json',
}: SwaggerUIConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function initSwagger() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import client-side bundles
        const { SwaggerUIBundle, SwaggerUIStandalonePreset } = await import('swagger-ui-dist');

        if (!isMounted || !containerRef.current) return;

        // Clear any previous instances
        containerRef.current.innerHTML = '';

        SwaggerUIBundle({
          url: specUrl,
          domNode: containerRef.current,
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset,
          ],
          layout: 'BaseLayout',
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          docExpansion: 'list',
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: true,
          displayRequestDuration: true,
          persistAuthorization: true,
        });

        if (isMounted) {
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error('Failed to initialize Swagger UI:', err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load Swagger UI console'
          );
          setLoading(false);
        }
      }
    }

    initSwagger();

    return () => {
      isMounted = false;
    };
  }, [specUrl]);

  const handleCopySpecUrl = async () => {
    try {
      const fullUrl = `${window.location.origin}${specUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQuickTagFilter = (tag: string) => {
    setFilterText(tag);
    if (typeof window !== 'undefined') {
      const searchInput = document.querySelector(
        '.swagger-ui .filter-container input'
      ) as HTMLInputElement | null;
      if (searchInput) {
        searchInput.value = tag;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Developer Action & Info Toolbar */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="save" className="gap-1.5 px-2.5 py-1">
                <Sparkles aria-hidden="true" className="size-3.5" />
                OpenAPI 3.1.0 Standard
              </Badge>
              <Badge tone="neutral" className="gap-1.5 px-2.5 py-1">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Zero-Key Offline Resilience
              </Badge>
              <Badge tone="neutral" className="px-2.5 py-1">PostgreSQL RLS &amp; SQLite</Badge>
            </div>
            <p className="pt-1 text-sm text-muted">
              Explore endpoints, inspect typed schemas, and execute live API requests directly against your local or preview server.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleCopySpecUrl} title="Copy OpenAPI spec URL to clipboard">
              {copied ? (
                <>
                  <Check aria-hidden="true" className="size-4" />
                  <span>Copied URL!</span>
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" className="size-4" />
                  <span>Copy Spec URL</span>
                </>
              )}
            </Button>

            <a
              href={specUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cx(
                'inline-flex min-h-touch items-center justify-center gap-2 rounded-control bg-accent px-4 text-base font-semibold text-on-accent',
                focusRing,
              )}
            >
              <FileCode aria-hidden="true" className="size-4" />
              <span>Raw openapi.json</span>
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Tag Pills */}
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2 text-sm" data-quick-filter="">
            <span className="mr-1 flex items-center gap-1 font-medium text-muted">
              <Search aria-hidden="true" className="size-3.5" /> Quick Filter:
            </span>
            {[
              { label: 'All', query: '' },
              { label: 'Dashboard & Deals', query: 'Dashboard' },
              { label: 'Locations & Stores', query: 'Locations' },
              { label: 'Virtual Pantry', query: 'Virtual Pantry' },
              { label: 'Retired Inventory', query: 'Legacy Inventory' },
              { label: 'Saved Recipes', query: 'Saved Recipes' },
              { label: 'AI Meal Planner', query: 'AI Meal' },
              { label: 'Cloud Sync', query: 'Sync' },
              { label: 'Account & GDPR', query: 'Account' },
              { label: 'Automation & Cron', query: 'Cron' },
            ].map((pill) => (
              <Chip key={pill.label} selected={filterText === pill.query} onClick={() => handleQuickTagFilter(pill.query)}>
                {pill.label}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <div className="mb-3 inline-flex size-10 animate-spin items-center justify-center rounded-full border-4 border-border border-t-accent motion-reduce:animate-none" />
          <h3 className="text-base font-semibold text-ink">
            Initializing Swagger UI &amp; OpenAPI Spec...
          </h3>
          <p className="mt-1 text-sm text-muted">
            Parsing 8 REST routes, 18 data models, and typed schemas.
          </p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Banner tone="error" title="Failed to load Swagger UI Console">
          <p>{error}</p>
          <a href={specUrl} className="mt-2 inline-block font-semibold underline">
            Inspect {specUrl} directly
          </a>
        </Banner>
      )}

      {/* The Swagger UI container. Swagger UI is third-party and styled for a light page, so it stays a light panel in both themes (spec
          decision 7: its internals are not themed); `color-scheme: light` keeps its form controls light too. The panel scrolls sideways
          on a narrow screen instead of widening the page (#546). */}
      <div
        className={`overflow-x-auto rounded-card border border-border-strong bg-white p-3 [color-scheme:light] md:p-6 transition-opacity duration-200 ${
          loading ? 'opacity-0 h-0 overflow-hidden p-0 m-0 border-0' : 'opacity-100'
        }`}
      >
        <div
          ref={containerRef}
          id="swagger-ui-container"
          className="pantrybot-swagger-ui min-w-0"
        />
      </div>

      <style jsx global>{`
        .pantrybot-swagger-ui .swagger-ui {
          font-family: inherit;
          color: #1e293b;
        }
        .pantrybot-swagger-ui .swagger-ui .info {
          margin: 16px 0 24px 0;
        }
        .pantrybot-swagger-ui .swagger-ui .info .title {
          font-size: 24px;
          color: #0f172a;
          font-weight: 700;
        }
        .pantrybot-swagger-ui .swagger-ui .info p {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
        }
        .pantrybot-swagger-ui .swagger-ui .opblock {
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          margin-bottom: 12px;
          border-width: 1px;
        }
        .pantrybot-swagger-ui .swagger-ui .opblock .opblock-summary {
          border-radius: 11px;
          padding: 8px 16px;
        }
        .pantrybot-swagger-ui .swagger-ui .opblock.opblock-get {
          border-color: #93c5fd;
          background: #eff6ff;
        }
        .pantrybot-swagger-ui .swagger-ui .opblock.opblock-post {
          border-color: #a7f3d0;
          background: #ecfdf5;
        }
        .pantrybot-swagger-ui .swagger-ui .opblock.opblock-patch {
          border-color: #fde68a;
          background: #fffbeb;
        }
        .pantrybot-swagger-ui .swagger-ui .opblock.opblock-delete {
          border-color: #fecaca;
          background: #fef2f2;
        }
        .pantrybot-swagger-ui .swagger-ui .btn.execute {
          background-color: #047857;
          border-color: #047857;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 600;
          transition: background-color 0.15s ease;
        }
        .pantrybot-swagger-ui .swagger-ui .btn.execute:hover {
          background-color: #065f46;
          border-color: #065f46;
        }
        .pantrybot-swagger-ui .swagger-ui .btn.try-out__btn {
          border-radius: 6px;
          font-weight: 600;
        }
        .pantrybot-swagger-ui .swagger-ui select,
        .pantrybot-swagger-ui .swagger-ui input[type='text'] {
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          padding: 6px 10px;
        }
        .pantrybot-swagger-ui .swagger-ui .responses-inner {
          padding: 16px;
        }
        .pantrybot-swagger-ui .swagger-ui section.models {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .pantrybot-swagger-ui .swagger-ui section.models h4 {
          font-weight: 700;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}

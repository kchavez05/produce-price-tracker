'use client';

import React, { useEffect, useRef, useState } from 'react';
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                OpenAPI 3.1.0 Standard
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                Zero-Key Offline Resilience
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
                PostgreSQL RLS &amp; SQLite
              </span>
            </div>
            <p className="text-sm text-slate-600 pt-1">
              Explore endpoints, inspect typed schemas, and execute live API requests directly against your local or preview server.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopySpecUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              title="Copy OpenAPI spec URL to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied URL!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Spec URL</span>
                </>
              )}
            </button>

            <a
              href={specUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Raw openapi.json</span>
              <ExternalLink className="h-3 w-3 opacity-80" />
            </a>
          </div>
        </div>

        {/* Quick Tag Pills */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-500 mr-1">
              <Search className="h-3 w-3" /> Quick Filter:
            </span>
            {[
              { label: 'All', query: '' },
              { label: 'Dashboard & Deals', query: 'Dashboard' },
              { label: 'Locations & Stores', query: 'Locations' },
              { label: 'Virtual Freezer', query: 'Freezer' },
              { label: 'Saved Recipes', query: 'Saved Recipes' },
              { label: 'AI Meal Planner', query: 'AI Meal' },
              { label: 'Cloud Sync', query: 'Sync' },
              { label: 'Account & GDPR', query: 'Account' },
              { label: 'Automation & Cron', query: 'Cron' },
            ].map((pill) => {
              const active = filterText === pill.query;
              return (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => handleQuickTagFilter(pill.query)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-4 border-emerald-200 border-t-emerald-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            Initializing Swagger UI &amp; OpenAPI Spec...
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Parsing 8 REST routes, 18 data models, and typed schemas.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
          <h3 className="text-sm font-bold">Failed to load Swagger UI Console</h3>
          <p className="text-xs mt-1">{error}</p>
          <a
            href={specUrl}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-700 underline"
          >
            Inspect {specUrl} directly
          </a>
        </div>
      )}

      {/* Swagger UI Container with PantryBot Emerald Theme Overrides */}
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6 transition-opacity duration-200 ${
          loading ? 'opacity-0 h-0 overflow-hidden p-0 m-0 border-0' : 'opacity-100'
        }`}
      >
        <div
          ref={containerRef}
          id="swagger-ui-container"
          className="pantrybot-swagger-ui"
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

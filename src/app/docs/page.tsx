import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChefHat, ArrowLeft, Terminal, BookOpen, Layers } from 'lucide-react';
import SwaggerUIConsole from '@/components/SwaggerUIConsole';
import AppFooter from '@/components/AppFooter';

export const metadata: Metadata = {
  title: 'API Documentation & Swagger UI | PantryBot',
  description:
    'Interactive OpenAPI 3.1 REST API specification and Swagger testing console for PantryBot grocery deal discovery, batch meal planning, and Virtual Pantry availability.',
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Navigation / Header */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 font-black text-slate-900 hover:text-emerald-700 transition"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
                    <ChefHat className="h-5 w-5" />
                  </span>
                  <span className="text-lg tracking-tight">PantryBot</span>
                </Link>
                <span className="text-slate-300">/</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Terminal className="h-3.5 w-3.5 text-slate-500" />
                  API Documentation &amp; Swagger Console
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-emerald-900 text-white py-8 border-b border-emerald-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Developer Portal &bull; REST API
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  PantryBot Backend API &amp; Swagger UI
                </h1>
                <p className="mt-1 text-sm text-emerald-100 max-w-2xl">
                  Inspect OpenAPI 3.1 endpoints for supermarket circular deals, 3-dish stew &amp; casserole scoring, wholesale bulk normalizer, and cloud synchronization.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 md:pt-0">
                <div className="rounded-xl bg-emerald-800/80 p-3 border border-emerald-700/60 text-xs text-emerald-100">
                  <div className="flex items-center gap-2 font-bold text-white mb-0.5">
                    <Layers className="h-4 w-4 text-emerald-300" />
                    <span>OpenAPI 3.1.0</span>
                  </div>
                  <span>Fully typed schemas &amp; real-time execution</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Swagger UI Body */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <SwaggerUIConsole specUrl="/api/openapi.json" />
        </main>
      </div>

      <AppFooter />
    </div>
  );
}

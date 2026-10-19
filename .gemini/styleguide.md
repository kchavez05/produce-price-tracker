# PantryBot (produce-price-tracker) Code Review Style Guide

## Stack & Architecture
- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5.8 (strict mode), Tailwind CSS v4.
- **Zero-Key Offline Resilience:** The application must work 100% out-of-the-box without requiring API keys (`GEMINI_API_KEY`, `USDA_MARS_API_KEY`, `KROGER_CLIENT_ID`). Any live API integration must gracefully fall back to deterministic local baselines or cached feeds.
- **Gemini SDK:** Always use `@google/genai` (`GoogleGenAI`) and current models (`gemini-2.5-flash`). Never introduce the deprecated `@google/generative-ai` package.

## Review Focus Areas
1. **Type Safety:** Flag `any` types, unsafe type assertions, or unhandled `null`/`undefined` edge cases in price normalization (`$/lb`, `$/oz`, `$/ea`) and grocery item parsing.
2. **Security & Secrets:** Ensure API keys are never exposed in client-rendered bundles unless explicitly user-supplied via `localStorage` in the client modal. Server-side environment variables must stay inside Route Handlers (`src/app/api/**`) or server modules.
3. **Price & Arbitrage Math:** Verify division-by-zero guards when computing unit prices, wholesale club comparisons, and Virtual Freezer `$0.00` protein substitutions.
4. **React 19 & Next.js 15 Patterns:** Ensure client components declare `'use client'`, avoid hydration mismatches when reading `localStorage`, and properly await async `params`/`searchParams` in Next.js 15 route handlers or pages.

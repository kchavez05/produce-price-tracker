// The docs page (v2.0 M4-8b): the API docs on the document shell's wide variant, with the Swagger console for the OpenAPI spec; /api-docs
// still goes there.
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const redirect = vi.fn();
vi.mock('next/navigation', () => ({ redirect: (path: string) => redirect(path), useRouter: () => ({ back: () => undefined }) }));
vi.mock('swagger-ui-dist/swagger-ui.css', () => ({}));
import DocsPage, { metadata } from '@/app/docs/page';
import ApiDocsRedirect from '@/app/api-docs/page';
import DocumentShell from '@/components/document/DocumentShell';
import SwaggerUIConsole from '@/components/SwaggerUIConsole';

describe('the docs page', () => {
  const tree = DocsPage() as ReactElement<{ variant: string; label: string; title: string; subtitle: string; children: ReactNode }>;

  it('is the document shell, wide, labelled API Docs, titled for the API and Swagger UI', () => {
    expect(tree.type).toBe(DocumentShell);
    expect(tree.props.variant).toBe('wide');
    expect(tree.props.label).toBe('API Docs');
    expect(tree.props.title).toBe('PantryBot Backend API & Swagger UI');
    expect(tree.props.subtitle).toContain('OpenAPI 3.1 endpoints');
  });

  it('shows the Swagger console on the OpenAPI spec route', () => {
    const child = Children.toArray(tree.props.children).find(isValidElement) as ReactElement<{ specUrl: string }>;
    expect(child.type).toBe(SwaggerUIConsole);
    expect(child.props.specUrl).toBe('/api/openapi.json');
  });

  it('keeps its page title and description', () => {
    expect(metadata.title).toBe('API Documentation & Swagger UI | PantryBot');
    expect(String(metadata.description)).toContain('OpenAPI 3.1');
  });

  it('is where /api-docs goes', () => {
    ApiDocsRedirect();
    expect(redirect).toHaveBeenCalledWith('/docs');
  });
});

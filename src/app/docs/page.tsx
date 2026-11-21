import type { Metadata } from 'next';
import { Terminal } from 'lucide-react';
import { Badge } from '@/components/ui';
import DocumentShell from '@/components/document/DocumentShell';
import SwaggerUIConsole from '@/components/SwaggerUIConsole';

export const metadata: Metadata = {
  title: 'API Documentation & Swagger UI | PantryBot',
  description:
    'Interactive OpenAPI 3.1 REST API specification and Swagger testing console for PantryBot grocery deal discovery, batch meal planning, and Virtual Pantry availability.',
};

// v2.0 M4-8b (spec decision 7): the API docs on the shared document shell (wide variant). The page's own header, hero and footer markup went;
// the Swagger console is wrapped by SwaggerUIConsole, whose internals stay Swagger's.
export default function ApiDocsPage() {
  return (
    <DocumentShell
      variant="wide"
      label="API Docs"
      badge={(
        <Badge tone="neutral" className="gap-1.5 px-3 py-1">
          <Terminal aria-hidden="true" className="size-3.5" />
          <span>Developer Portal &bull; REST API</span>
        </Badge>
      )}
      title="PantryBot Backend API & Swagger UI"
      subtitle="Inspect OpenAPI 3.1 endpoints for supermarket circular deals, 3-dish stew & casserole scoring, wholesale bulk normalizer, and cloud synchronization."
    >
      <SwaggerUIConsole specUrl="/api/openapi.json" />
    </DocumentShell>
  );
}

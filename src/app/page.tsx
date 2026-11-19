import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LAST_MODULE_COOKIE, lastModulePath } from '@/modules/shell/navigation';

export const dynamic = 'force-dynamic';

// v2.0 M3 Phase B.3c: "/" opens the last-used module (owner decision 10), Shop on a first visit. The cookie holds the module
// name only and is written by the app shell on every module change.
export default async function HomePage() {
  const jar = await cookies();
  redirect(lastModulePath(jar.get(LAST_MODULE_COOKIE)?.value));
}

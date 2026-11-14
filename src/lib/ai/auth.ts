import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AiAccessError } from './access-errors';

/** Paid access uses a freshly verified Auth user, never a local/demo profile or caller ID. */
export async function requireAiAccount(): Promise<string> {
  try {
    const client = await createServerSupabaseClient();
    if (!client) throw new AiAccessError('AUTH_REQUIRED');
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw new AiAccessError(error.status !== undefined && error.status < 500 ? 'AUTH_REQUIRED' : 'AUTH_UNAVAILABLE');
    if (!user || user.is_anonymous || !(user.email_confirmed_at || user.phone_confirmed_at)) throw new AiAccessError('AUTH_REQUIRED');
    return user.id;
  } catch (error: unknown) {
    if (error instanceof AiAccessError) throw error;
    throw new AiAccessError('AUTH_UNAVAILABLE');
  }
}

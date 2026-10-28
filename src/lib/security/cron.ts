import { timingSafeEqual } from 'node:crypto';
export function authorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const actual = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  return Boolean(secret && Buffer.byteLength(actual) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(actual), Buffer.from(expected)));
}

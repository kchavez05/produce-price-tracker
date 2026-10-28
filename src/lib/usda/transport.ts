export class UsdaTransport {
  requests = 0;
  constructor(private readonly key: string, readonly deadline = Date.now() + 90000) {}
  async get(path: string, params = new URLSearchParams()): Promise<unknown> {
    if (!/^\/(?:[0-9]+)?$/.test(path)) throw new Error('invalid_report_path');
    for (let attempt = 0; attempt < 3; attempt++) {
      if (this.requests >= 20 || Date.now() >= this.deadline) throw new Error('request_budget_exhausted');
      this.requests++;
      let delay = Math.min(500 * 2 ** attempt + Math.random() * 200, 3000);
      try {
        const response = await fetch(`https://marsapi.ams.usda.gov/services/v1.2/reports${path}?${params}`, {
          headers: { Authorization: `Basic ${Buffer.from(`${this.key}:`).toString('base64')}`, Accept: 'application/json' },
          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(Math.max(1, Math.min(15000, this.deadline - Date.now()))),
        });
        if (response.status === 401 || response.status === 403) throw new Error('usda_auth_failed');
        if (response.status === 429 || response.status >= 500) {
          const retry = response.headers.get('retry-after');
          if (retry) {
            const seconds = Number(retry);
            delay = Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, Date.parse(retry) - Date.now());
          }
          await response.body?.cancel();
          if (attempt === 2 || !Number.isFinite(delay) || Date.now() + delay >= this.deadline) throw new Error('usda_retry_exhausted');
        } else {
          if (!response.ok) throw new Error('usda_http_failed');
          const reader = response.body?.getReader();
          if (!reader) throw new Error('usda_empty_response');
          const chunks: Uint8Array[] = []; let size = 0;
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 3500000) { await reader.cancel(); throw new Error('usda_payload_limit'); }
            chunks.push(value);
          }
          const body = Buffer.concat(chunks).toString('utf8');
          if (body.includes(this.key) || body.includes(Buffer.from(`${this.key}:`).toString('base64'))) throw new Error('usda_credential_echo');
          try { return JSON.parse(body) as unknown; } catch { throw new Error('usda_invalid_json'); }
        }
      } catch (error) {
        // Only transport errors retry here; protocol, validation and auth errors never do.
        if (error instanceof Error && error.message.startsWith('usda_')) throw error;
        if (attempt === 2) throw new Error('usda_transport_failed');
      }
      if (Date.now() + delay >= this.deadline) throw new Error('request_budget_exhausted');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error('usda_retry_exhausted');
  }
}
export function reportQuery(start: string, end: string) {
  const us = (day: string) => `${day.slice(5, 7)}/${day.slice(8, 10)}/${day.slice(0, 4)}`;
  return new URLSearchParams({ q: `report_begin_date=${us(start)}:${us(end)}`, allSections: 'true' });
}

import { describe, expect, it, vi } from 'vitest';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

describe('upgraded SDK wire compatibility without external services', () => {
  it('sends the existing Gemini model and JSON schema to the explicit beta endpoint', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { role: 'model', parts: [{ text: '[]' }] }, finishReason: 'STOP' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const ai = new GoogleGenAI({ apiKey: 'not-a-real-key', apiVersion: 'v1beta', httpOptions: { fetch } });
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test',
      config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } } });
    expect(response.text).toBe('[]');
    expect(fetch).toHaveBeenCalledOnce();
    const [input, init] = fetch.mock.calls[0];
    const request = new Request(input, init);
    expect(request.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    expect(await request.json()).toMatchObject({ generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'STRING' } } } });
  });

  it('retains pantry RPC payloads, authorization and errors through the real Supabase client', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ entries: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: '42501', message: 'permission denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } }));
    const client = createClient('https://example.supabase.co', 'not-a-real-key', {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { fetch, headers: { Authorization: 'Bearer test-session' } },
    });
    const payload = { p_action: 'read', p_payload: {} };
    expect(await client.rpc('pantry_rpc', payload)).toMatchObject({ data: { entries: [] }, error: null });
    const [input, init] = fetch.mock.calls[0];
    const request = new Request(input, init);
    expect(request.url).toBe('https://example.supabase.co/rest/v1/rpc/pantry_rpc');
    expect(request.headers.get('authorization')).toBe('Bearer test-session');
    expect(await request.json()).toEqual(payload);
    expect(await client.rpc('pantry_rpc', payload)).toMatchObject({ data: null, error: { code: '42501', message: 'permission denied' } });
  });
});

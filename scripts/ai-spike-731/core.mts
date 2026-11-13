import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const PACKET = resolve(ROOT, 'docs/research/ai-provider-spike-731');
// A second linked worktree must not receive a second $10 budget.
const commonGit = resolve(ROOT, execFileSync('git', ['rev-parse','--git-common-dir'], { cwd:ROOT, encoding:'utf8' }).trim());
export const STATE = resolve(dirname(commonGit), 'data/ai-spike-731');
export const CAP = 10_000_000; // Integer micro-USD, shared by every run/provider.
export type ObjectValue = Record<string, unknown>;
export function object(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
  return value as ObjectValue;
}
export function sha(value: string | Buffer): string { return createHash('sha256').update(value).digest('hex'); }
export function readJson(path: string): unknown { return JSON.parse(readFileSync(path, 'utf8')); }
export function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid nonnegative integer');
  return value;
}
export function micros(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error('Invalid money');
  return integer(Math.ceil(value * 1_000_000 - 1e-8));
}
export function atomicJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${process.pid}.tmp`;
  const fd = openSync(temporary, 'wx', 0o600);
  try { writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temporary, path);
  const directory = openSync(dirname(path), 'r');
  try { fsyncSync(directory); } finally { closeSync(directory); }
}

export interface RecipeCandidate {
  id: string; provider: 'google' | 'openai' | 'anthropic'; model: string;
  inputUsdPerMillion: number; outputUsdPerMillion: number;
  maxInputTokens: number; maxBillableOutputTokens: number; role: string;
}
export interface Pipeline { id: string; reservationUsdPerAttempt: number; audioSecondsMax: number; billing: ObjectValue; extraction?: ObjectValue }
export interface Fixture { id: string; task?: string; prompt?: string; context?: ObjectValue; expected: ObjectValue; transcript?: string; audio?: ObjectValue }
export interface Packet {
  hash: string; recipes: Fixture[]; speech: Fixture[]; models: RecipeCandidate[]; pipelines: Pipeline[];
  prompts: ObjectValue; recipeSchema: ObjectValue; speechSchema: ObjectValue;
  catalog: { id: string; name: string }[]; audio: { id: string; filename: string; sha256: string; durationSeconds: number }[];
}
export function loadPacket(): Packet {
  const approval = object(readJson(resolve(PACKET, 'execution-approval.json')));
  if (approval.issue !== 731 || approval.owner !== 'kchavez05' || approval.apiCapUsd !== 10) throw new Error('Missing approved plan');
  const hashes = object(approval.fixtureHashes);
  for (const [name, expected] of Object.entries(hashes)) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(name) || sha(readFileSync(resolve(PACKET, name))) !== expected) throw new Error(`Approved packet drift: ${name}`);
  }
  const recipes = object(readJson(resolve(PACKET, 'recipes.json')));
  const speech = object(readJson(resolve(PACKET, 'speech.json')));
  const catalogBytes = readFileSync(resolve(ROOT, 'src/data/cooking-catalog.json'));
  if (sha(catalogBytes) !== recipes.catalogSha256 || sha(catalogBytes) !== speech.catalogSha256) throw new Error('Catalog drift');
  const catalog = object(JSON.parse(catalogBytes.toString('utf8')));
  const config = object(readJson(resolve(PACKET, 'candidates.json')));
  // Local packet casts are safe only after the approved byte hashes above match.
  return {
    hash: sha(JSON.stringify(hashes)), recipes: recipes.cases as Fixture[], speech: speech.cases as Fixture[],
    models: config.recipes as RecipeCandidate[], pipelines: config.speechPipelines as Pipeline[],
    prompts: object(readJson(resolve(PACKET, 'prompts.json'))),
    recipeSchema: object(readJson(resolve(PACKET, 'recipe-output.schema.json'))),
    speechSchema: object(readJson(resolve(PACKET, 'speech-output.schema.json'))),
    catalog: (catalog.ingredients as { id: string; name: string }[]).map(({ id, name }) => ({ id, name })),
    audio: object(readJson(resolve(PACKET, 'audio-manifest.json'))).clips as Packet['audio'],
  };
}
export interface Job { key: string; task: 'recipe' | 'speech'; target: string; fixture: string; repeat: number; bound: number }
export function recipeBound(candidate: RecipeCandidate): number {
  return micros((candidate.maxInputTokens * candidate.inputUsdPerMillion + candidate.maxBillableOutputTokens * candidate.outputUsdPerMillion) / 1_000_000);
}
export function jobs(packet: Packet): Job[] {
  const result: Job[] = [];
  for (let repeat = 1; repeat <= 3; repeat++) {
    for (const model of packet.models) for (const fixture of packet.recipes) result.push({ key: `recipe:${model.id}:${fixture.id}:${repeat}`, task: 'recipe', target: model.id, fixture: fixture.id, repeat, bound: recipeBound(model) });
    for (const pipeline of packet.pipelines) for (const fixture of packet.speech) result.push({ key: `speech:${pipeline.id}:${fixture.id}:${repeat}`, task: 'speech', target: pipeline.id, fixture: fixture.id, repeat, bound: micros(pipeline.reservationUsdPerAttempt) });
  }
  let seed = 731;
  for (let index = result.length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const other = seed % (index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
export function projection(fixture: Fixture, task: 'recipe' | 'speech', packet: Packet, transcript?: string): ObjectValue {
  return task === 'recipe'
    ? { id: fixture.id, task: fixture.task, prompt: fixture.prompt, context: fixture.context, catalogIdsAndNames: packet.catalog }
    : { id: fixture.id, ...(transcript === undefined ? {} : { transcriptFromProvider: transcript }), catalogIdsAndNames: packet.catalog };
}
export function audioBytes(packet: Packet, fixture: string, directory: string): { bytes: Buffer; seconds: number } {
  const clip = packet.audio.find(item => item.id === fixture);
  if (!clip || !/^S\d{2}\.wav$/.test(clip.filename)) throw new Error('Unknown audio fixture');
  const bytes = readFileSync(resolve(directory, clip.filename));
  if (sha(bytes) !== clip.sha256 || clip.durationSeconds <= 0 || clip.durationSeconds > 30) throw new Error('Audio hash/duration drift');
  return { bytes, seconds: clip.durationSeconds };
}

interface Entry { key: string; bound: number; state: 'pending' | 'settled' | 'uncertain'; cost: number; receipt?: ObjectValue }
interface LedgerState { issue: number; packet: string; entries: Entry[]; halted: boolean; activeMs: number }
export class Ledger {
  private path: string;
  private lock: string;
  private data: LedgerState;
  private opened = performance.now();
  private baseActiveMs = 0;
  constructor(directory: string, packet: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.path = resolve(directory, 'ledger.json'); this.lock = resolve(directory, 'ledger.lock');
    // Lock is held for the entire process, including network calls. Crash locks are never auto-cleared.
    mkdirSync(this.lock, { mode: 0o700 });
    try {
      this.data = existsSync(this.path) ? readJson(this.path) as LedgerState : { issue: 731, packet, entries: [], halted: false, activeMs:0 };
      if (this.data.issue !== 731 || this.data.packet !== packet || !Array.isArray(this.data.entries) || typeof this.data.halted !== 'boolean') throw new Error('Ledger identity drift');
      for (const entry of this.data.entries) {
        integer(entry.bound); integer(entry.cost);
        if (typeof entry.key !== 'string' || !entry.key) throw new Error('Corrupt run identity');
        if (!['pending','settled','uncertain'].includes(entry.state)) throw new Error('Corrupt ledger');
        if (entry.cost > entry.bound) this.data.halted = true;
      }
      if (new Set(this.data.entries.map(entry => entry.key)).size !== this.data.entries.length) throw new Error('Duplicate ledger entry');
      this.baseActiveMs = integer(this.data.activeMs);
      if (this.exposure() > CAP) this.data.halted = true;
      this.persist();
    } catch (error) { rmSync(this.lock, { recursive: true }); throw error; }
  }
  close(): void { this.persist(); rmSync(this.lock, { recursive: true }); }
  activeMs(): number { return this.baseActiveMs + Math.ceil(performance.now() - this.opened); }
  private persist(): void { this.data.activeMs = this.activeMs(); atomicJson(this.path, this.data); }
  entries(): readonly Entry[] { return structuredClone(this.data.entries); }
  halt(): void { this.data.halted = true; this.persist(); }
  assertRunnable(): void {
    if (this.data.halted || this.data.entries.some(entry => entry.state !== 'settled')) throw new Error('Ledger halted or uncertain; audit before continuing');
  }
  exposure(): number { return this.data.entries.reduce((sum, entry) => sum + (entry.state === 'settled' ? entry.cost : entry.bound), 0); }
  reserve(key: string, bound: number, remainingCommitment: number): void {
    integer(bound); integer(remainingCommitment);
    this.assertRunnable();
    if (!bound) throw new Error('Empty billable bound');
    if (this.data.entries.some(entry => entry.key === key)) throw new Error('Run identity already reserved; never replay');
    if (this.exposure() + bound + remainingCommitment > CAP) throw new Error('Cap or remaining committed coverage would be exceeded');
    this.data.entries.push({ key, bound, state: 'pending', cost: 0 }); this.persist();
  }
  settle(key: string, cost: number, receipt: ObjectValue): void {
    integer(cost);
    const entry = this.data.entries.find(item => item.key === key);
    if (!entry || entry.state !== 'pending') throw new Error('No pending reservation');
    entry.cost = cost; entry.receipt = receipt; entry.state = 'settled';
    if (cost > entry.bound || this.exposure() > CAP) this.data.halted = true;
    this.persist();
    if (this.data.halted) throw new Error('Usage exceeded verified bound; stop');
  }
  uncertain(key: string, receipt: ObjectValue): void {
    const entry = this.data.entries.find(item => item.key === key);
    if (!entry || entry.state !== 'pending') throw new Error('No pending reservation');
    entry.state = 'uncertain'; entry.receipt = receipt; this.data.halted = true; this.persist();
  }
}

// Complete validator for the deliberately small schema vocabulary in the approved contracts.
// Unknown keywords fail closed; this is not a general-purpose JSON Schema implementation.
const KEYWORDS = new Set(['$schema','title','type','additionalProperties','required','properties','items','minItems','maxItems','minLength','minimum','exclusiveMinimum','enum','const','allOf','if','then','else']);
export function schemaErrors(value: unknown, schema: ObjectValue, path = '$'): string[] {
  for (const key of Object.keys(schema)) if (!KEYWORDS.has(key)) throw new Error(`Unsupported schema keyword ${key}`);
  const errors: string[] = [];
  const matchType = (type: unknown): boolean => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'object' ? !!value && typeof value === 'object' && !Array.isArray(value) : type === 'integer' ? typeof value === 'number' && Number.isSafeInteger(value) : type === 'number' ? typeof value === 'number' && Number.isFinite(value) : typeof value === type;
  if (schema.type !== undefined && !(Array.isArray(schema.type) ? schema.type : [schema.type]).some(matchType)) return [`${path}: type`];
  if (schema.enum && !(schema.enum as unknown[]).some(item => JSON.stringify(item) === JSON.stringify(value))) errors.push(`${path}: enum`);
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(value)) errors.push(`${path}: const`);
  if (typeof value === 'string' && typeof schema.minLength === 'number' && [...value].length < schema.minLength) errors.push(`${path}: minLength`);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) errors.push(`${path}: nonfinite`);
    if (typeof schema.minimum === 'number' && value < schema.minimum) errors.push(`${path}: minimum`);
    if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) errors.push(`${path}: exclusiveMinimum`);
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) errors.push(`${path}: minItems`);
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) errors.push(`${path}: maxItems`);
    if (schema.items) value.forEach((item, index) => errors.push(...schemaErrors(item, object(schema.items), `${path}[${index}]`)));
  } else if (value && typeof value === 'object') {
    const record = object(value); const properties = schema.properties ? object(schema.properties) : {};
    for (const required of (schema.required ?? []) as string[]) if (!Object.hasOwn(record,required)) errors.push(`${path}.${required}: required`);
    for (const [key, item] of Object.entries(record)) {
      if (Object.hasOwn(properties,key)) errors.push(...schemaErrors(item, object(properties[key]), `${path}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${path}.${key}: unexpected`);
    }
  }
  for (const child of (schema.allOf ?? []) as ObjectValue[]) errors.push(...schemaErrors(value, child, path));
  if (schema.if) {
    const branch = schemaErrors(value, object(schema.if), path).length === 0 ? schema.then : schema.else;
    if (branch) errors.push(...schemaErrors(value, object(branch), path));
  }
  return errors;
}
export function providerSchema(schema: ObjectValue): ObjectValue {
  // Common provider-supported subset; full local validation retains the conditional constraints.
  const result = Object.fromEntries(Object.entries(schema).filter(([key]) => !['$schema','title','allOf','if','then','else'].includes(key)).map(([key, value]) => [key,
    key === 'properties' ? Object.fromEntries(Object.entries(object(value)).map(([name, child]) => [name, providerSchema(object(child))]))
      : key === 'items' ? providerSchema(object(value)) : value]));
  if (!result.type && (result.enum || 'const' in result)) {
    const types = [...new Set(((result.enum ?? [result.const]) as unknown[]).map(value => value === null ? 'null' : typeof value))];
    result.type = types.length === 1 ? types[0] : types;
  }
  return result;
}
export function percentile95(values: number[]): number {
  if (!values.length) return Infinity;
  return [...values].sort((a,b) => a-b)[Math.ceil(values.length * 0.95) - 1];
}
export function parseOutput(text: string): unknown { return JSON.parse(text); }
export function redact(text: string, secrets: string[]): string {
  return secrets.filter(secret => secret.length > 0).reduce((value, secret) => value.split(secret).join('[REDACTED]'), text);
}

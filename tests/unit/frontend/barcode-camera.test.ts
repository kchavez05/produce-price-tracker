// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BarcodeFormat, NotFoundException } from '@zxing/library';
import { captureBarcode } from '@/lib/barcodes/camera';
import BarcodeCamera from '@/components/BarcodeCamera';

const decoder = vi.hoisted(() => ({ decode: vi.fn(), formats: [] as number[] }));
vi.mock('@zxing/browser', () => ({ BrowserMultiFormatReader: class {
  set possibleFormats(value: number[]) { decoder.formats = value; }
  decodeFromVideoElement = decoder.decode;
} }));
const stopTrack = vi.fn(); const stopDecoder = vi.fn(); const capture = vi.fn(); const failure = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
let callback: (result: { getText: () => string; getBarcodeFormat: () => BarcodeFormat } | undefined, error: Error | undefined, controls: { stop: () => void }) => void;
const result = (format = BarcodeFormat.UPC_A, code = '011110118134') => ({ getText: () => code, getBarcodeFormat: () => format });
const controls = { stop: stopDecoder };
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
async function run(action: () => unknown) { await act(async () => { await action(); await tick(); }); }
let root: Root | undefined; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.stubGlobal('isSecureContext', true);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } });
  vi.clearAllMocks(); decoder.decode.mockImplementation(async (_video, cb) => { callback = cb; return controls; });
});
afterEach(async () => { if (root) { await run(() => root!.unmount()); root = undefined; container.remove(); } vi.unstubAllGlobals(); });
describe('local camera lifetime', () => {
  it('restricts formats and stops at the first valid decode without repeated callbacks', async () => {
    const video = document.createElement('video'); const request = new AbortController();
    await captureBarcode(video, request.signal, capture, failure);
    expect(decoder.formats).toEqual([BarcodeFormat.UPC_A, BarcodeFormat.EAN_13]);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: false, video: { facingMode: { ideal: 'environment' } } });
    callback(result(), undefined, controls); callback(result(), undefined, controls);
    expect(capture).toHaveBeenCalledExactlyOnceWith('011110118134', 'UPC_A'); expect(stopTrack).toHaveBeenCalled();
    expect(video.srcObject).toBeNull(); expect(failure).not.toHaveBeenCalled();
  });
  it('accepts EAN-13 with its original leading zero', async () => {
    await captureBarcode(document.createElement('video'), new AbortController().signal, capture, failure);
    callback(result(BarcodeFormat.EAN_13, '0011110118134'), undefined, controls);
    expect(capture).toHaveBeenCalledExactlyOnceWith('0011110118134', 'EAN_13');
  });
  it('stops a stream whose permission resolves after cancellation', async () => {
    let resolve!: (stream: MediaStream) => void;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValue(new Promise((done) => { resolve = done; }));
    const request = new AbortController(); const pending = captureBarcode(document.createElement('video'), request.signal, capture, failure);
    request.abort(); resolve(stream); await pending;
    expect(stopTrack).toHaveBeenCalled(); expect(decoder.decode).not.toHaveBeenCalled(); expect(capture).not.toHaveBeenCalled();
  });
  it('stops decoder controls returned after cancellation and ignores late frames', async () => {
    let resolve!: (value: typeof controls) => void;
    decoder.decode.mockImplementation((_video, cb) => { callback = cb; return new Promise((done) => { resolve = done; }); });
    const request = new AbortController(); const pending = captureBarcode(document.createElement('video'), request.signal, capture, failure);
    await tick(); request.abort(); callback(result(), undefined, controls); resolve(controls); await pending;
    expect(stopTrack).toHaveBeenCalled(); expect(stopDecoder).toHaveBeenCalled(); expect(capture).not.toHaveBeenCalled();
  });
  it.each([BarcodeFormat.QR_CODE, BarcodeFormat.UPC_E])('rejects unexpected symbology %s regardless of valid digits', async (format) => {
    await captureBarcode(document.createElement('video'), new AbortController().signal, capture, failure);
    callback(result(format), undefined, controls);
    expect(capture).not.toHaveBeenCalled(); expect(failure).toHaveBeenCalledOnce(); expect(stopTrack).toHaveBeenCalled();
  });
  it('rejects invalid check digits and allows ordinary no-result frames', async () => {
    await captureBarcode(document.createElement('video'), new AbortController().signal, capture, failure);
    callback(undefined, new NotFoundException(), controls); expect(failure).not.toHaveBeenCalled();
    callback(result(BarcodeFormat.UPC_A, '011110118135'), undefined, controls);
    expect(capture).not.toHaveBeenCalled(); expect(failure).toHaveBeenCalledOnce();
  });
  it.each(['denied', 'missing', 'decoder', 'insecure'])('reports recoverable %s failure without raw errors', async (kind) => {
    if (kind === 'insecure') vi.stubGlobal('isSecureContext', false);
    else if (kind === 'decoder') decoder.decode.mockRejectedValue(new Error('private raw diagnostic'));
    else vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new DOMException('private device', kind === 'denied' ? 'NotAllowedError' : 'NotFoundError'));
    await captureBarcode(document.createElement('video'), new AbortController().signal, capture, failure);
    expect(failure).toHaveBeenCalledExactlyOnceWith(); expect(capture).not.toHaveBeenCalled();
    if (kind === 'decoder') expect(stopTrack).toHaveBeenCalled();
  });
});
describe('camera interaction', () => {
  async function render() {
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    await run(() => root!.render(createElement(BarcodeCamera, { onCapture: capture, onTyped: failure })));
  }
  function button() { return container.querySelector('button')!; }
  it('requests no permission before deliberate start, pauses on hidden and requires resume', async () => {
    await render(); expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled(); expect(document.activeElement).toBe(button());
    const video = container.querySelector('video')!; expect(video.muted).toBe(true); expect(video.playsInline).toBe(true);
    await run(() => button().click()); expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    await run(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    expect(stopTrack).toHaveBeenCalled(); expect(button().disabled).toBe(false);
    await run(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    await run(() => button().click()); expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    await run(() => root!.unmount()); root = undefined; container.remove(); expect(stopDecoder).toHaveBeenCalled();
  });
  it('keeps typed action available after denied permission and stops on pagehide', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(new Error('denied'));
    await render(); await run(() => button().click());
    expect(container.textContent).toContain('type the printed digits'); expect(button().disabled).toBe(false);
    await run(() => button().click()); await run(() => window.dispatchEvent(new Event('pagehide')));
    expect(stopTrack).toHaveBeenCalled();
    await run(() => container.querySelectorAll('button')[1].click()); expect(failure).toHaveBeenCalledOnce();
  });
});

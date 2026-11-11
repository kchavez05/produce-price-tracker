import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, ChecksumException, FormatException, NotFoundException } from '@zxing/library';
import { validateBarcode } from './validation';
import type { BarcodeFormat as CaptureFormat } from '@/types/barcode';

/** Local video only. The caller owns cancellation, including permission/startup races. */
export async function captureBarcode(video: HTMLVideoElement, signal: AbortSignal,
  onCapture: (code: string, format: CaptureFormat) => void, onError: () => void): Promise<void> {
  let stream: MediaStream | undefined;
  let controls: { stop: () => void } | undefined;
  let stopped = signal.aborted;
  const stop = () => {
    stopped = true;
    controls?.stop();
    stream?.getTracks().forEach((track) => track.stop());
    if (stream && video.srcObject === stream) video.srcObject = null;
    signal.removeEventListener('abort', stop);
  };
  if (stopped) return;
  signal.addEventListener('abort', stop, { once: true });
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } });
    if (stopped) { stop(); return; }
    video.srcObject = stream;
    const reader = new BrowserMultiFormatReader();
    reader.possibleFormats = [BarcodeFormat.UPC_A, BarcodeFormat.EAN_13];
    controls = await reader.decodeFromVideoElement(video, (result, error, current) => {
      if (stopped) { current.stop(); return; }
      if (result) {
        const format = result.getBarcodeFormat() === BarcodeFormat.UPC_A ? 'UPC_A' : result.getBarcodeFormat() === BarcodeFormat.EAN_13 ? 'EAN_13' : null;
        const code = result.getText();
        // Reject unexpected symbologies even if their text resembles a supported code.
        if (!format || !validateBarcode(code, format).ok) { current.stop(); stop(); onError(); return; }
        current.stop(); stop(); onCapture(code, format);
      } else if (error && !(error instanceof NotFoundException || error instanceof ChecksumException || error instanceof FormatException)) {
        current.stop(); stop(); onError();
      }
    });
    // Decoder startup can complete after cancellation or its first callback.
    if (stopped) stop();
  } catch {
    const report = !stopped;
    stop();
    if (report) onError();
  }
}

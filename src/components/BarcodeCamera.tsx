'use client';

import { useEffect, useRef, useState } from 'react';
import type { BarcodeFormat } from '@/types/barcode';
import { Button } from '@/components/ui';

export default function BarcodeCamera({ onCapture, onTyped }: {
  onCapture: (code: string, format: BarcodeFormat) => void;
  onTyped: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const session = useRef<AbortController | null>(null);
  const [message, setMessage] = useState('Camera paused. Start when ready, or type the printed digits.');
  const [active, setActive] = useState(false);
  const startButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    startButton.current?.focus();
    const pause = () => {
      session.current?.abort(); session.current = null; setActive(false);
      setMessage('Camera paused. Resume deliberately or type the printed digits.');
    };
    const hidden = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', pause);
    return () => { session.current?.abort(); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', pause); };
  }, []);
  async function start() {
    if (session.current || document.hidden) return;
    const request = new AbortController(); session.current = request;
    setActive(true); setMessage('Requesting camera. Hold a UPC-A or EAN-13 barcode steady in view.');
    const fail = () => {
      if (request.signal.aborted) return;
      request.abort(); session.current = null; setActive(false);
      setMessage('Camera could not read a supported barcode. Check camera permission, try again, or type the printed digits.');
    };
    try {
      const { captureBarcode } = await import('@/lib/barcodes/camera');
      if (request.signal.aborted || !video.current) return;
      await captureBarcode(video.current, request.signal, (code, format) => {
        if (request.signal.aborted) return;
        request.abort(); session.current = null; setActive(false); onCapture(code, format);
      }, fail);
    } catch { fail(); }
  }
  return <div className="min-w-0 space-y-2">
    <p className="text-sm text-muted">Camera frames stay on this device. Capture fills the digits; review and confirmation are still required.</p>
    <video ref={video} muted playsInline autoPlay aria-label="Barcode camera preview" className="aspect-video w-full max-w-md rounded-card bg-ink" />
    <p role="status" className="text-sm text-ink">{message}</p>
    <div className="flex flex-wrap gap-2">
      <Button ref={startButton} variant="secondary" disabled={active} onClick={() => void start()}>Start / resume camera</Button>
      <Button variant="quiet" onClick={onTyped}>Stop camera and type digits</Button>
    </div>
    <details className="text-xs text-muted"><summary className="flex min-h-touch cursor-pointer items-center text-accent">Scanner licenses</summary>
      <a href="/licenses/zxing-browser-MIT.txt" className="mr-3 inline-flex min-h-touch items-center underline" target="_blank" rel="noopener noreferrer">ZXing browser (MIT)</a>
      <a href="/licenses/zxing-library-Apache-2.0.txt" className="inline-flex min-h-touch items-center underline" target="_blank" rel="noopener noreferrer">ZXing library (Apache 2.0)</a>
    </details>
  </div>;
}

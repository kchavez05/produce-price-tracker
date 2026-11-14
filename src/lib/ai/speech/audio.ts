import { AiAccessError } from '../access-errors';
export const SPEECH_SAMPLE_RATE = 16000;
export const SPEECH_MAX_SECONDS = 30;
export const SPEECH_MAX_BYTES = 44 + SPEECH_SAMPLE_RATE * SPEECH_MAX_SECONDS * 2;
/** Deliberately one canonical format; byte length establishes duration, not a caller field. */
export function validateSpeechWav(bytes: Uint8Array): number {
  const bad = ():never => { throw new AiAccessError('INVALID_REQUEST'); };
  if (bytes.length < 44 + 8000 || bytes.length > SPEECH_MAX_BYTES || bytes.length % 2) return bad();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset:number) => String.fromCharCode(...bytes.subarray(offset, offset+4));
  if (tag(0)!=='RIFF' || tag(8)!=='WAVE' || tag(12)!=='fmt ' || tag(36)!=='data' ||
    view.getUint32(4,true)!==bytes.length-8 || view.getUint32(16,true)!==16 ||
    view.getUint16(20,true)!==1 || view.getUint16(22,true)!==1 || view.getUint32(24,true)!==16000 ||
    view.getUint32(28,true)!==32000 || view.getUint16(32,true)!==2 || view.getUint16(34,true)!==16 ||
    view.getUint32(40,true)!==bytes.length-44) return bad();
  return (bytes.length-44)/32000;
}
export async function readSpeechAudio(request:Request):Promise<Uint8Array> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='audio/wav') throw new AiAccessError('INVALID_REQUEST');
  const reader=request.body?.getReader(); if(!reader)throw new AiAccessError('INVALID_REQUEST');
  const chunks:Uint8Array[]=[]; let size=0;
  try {
    while(true) {const {done,value}=await reader.read();if(done)break;size+=value.length;
      if(size>SPEECH_MAX_BYTES){await reader.cancel();throw new AiAccessError('INVALID_REQUEST');} chunks.push(value);}
  } catch {throw new AiAccessError('INVALID_REQUEST');} finally {reader.releaseLock();}
  const bytes=new Uint8Array(size); let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  validateSpeechWav(bytes); return bytes;
}

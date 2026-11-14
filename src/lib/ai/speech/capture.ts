'use client';
export interface SpeechRecording { stop():Promise<Uint8Array>; cancel():void }
export function speechCaptureSupported():boolean {
  return Boolean(globalThis.isSecureContext && typeof navigator.mediaDevices?.getUserMedia==='function' &&
    typeof globalThis.AudioContext==='function' && typeof globalThis.AudioWorkletNode==='function' && typeof globalThis.OfflineAudioContext==='function');
}
export function encodeSpeechWav(samples:Float32Array):Uint8Array {
  const bytes=new Uint8Array(44+samples.length*2), view=new DataView(bytes.buffer);
  const tag=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)bytes[offset+i]=value.charCodeAt(i);};
  tag(0,'RIFF');view.setUint32(4,bytes.length-8,true);tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,16,true);
  view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);
  view.setUint16(32,2,true);view.setUint16(34,16,true);tag(36,'data');view.setUint32(40,samples.length*2,true);
  samples.forEach((sample,index)=>view.setInt16(44+index*2,Math.round(Math.max(-1,Math.min(1,sample))*(sample<0?32768:32767)),true));
  return bytes;
}
/** Call from an explicit user action. A cancelled late permission grant is closed immediately. */
export async function startSpeechRecording(signal:AbortSignal,onLimit:()=>void):Promise<SpeechRecording> {
  if(!speechCaptureSupported())throw new Error('Microphone recording is unavailable. Use manual pantry entry.');
  const context=new AudioContext();
  let stream:MediaStream|undefined,source:MediaStreamAudioSourceNode|undefined,node:AudioWorkletNode|undefined;
  let stopped=false,frames=0,timer:ReturnType<typeof setTimeout>|undefined;
  const chunks:Float32Array[]=[];
  const release=()=>{if(timer)clearTimeout(timer);node?.disconnect();source?.disconnect();stream?.getTracks().forEach(track=>track.stop());void context.close().catch(()=>{});};
  const cancel=()=>{stopped=true;release();chunks.length=0;signal.removeEventListener('abort',cancel);};
  signal.addEventListener('abort',cancel,{once:true});
  try {
    if(signal.aborted)throw new Error('Recording cancelled.');
    await context.resume();
    // Load the local processor before requesting a live stream; setup failure cannot leave a microphone open.
    let setupTimer:ReturnType<typeof setTimeout>|undefined;
    try {await Promise.race([context.audioWorklet.addModule('/audio/pantry-capture.js'),new Promise<never>((_,reject)=>{setupTimer=setTimeout(()=>reject(new Error('Recording setup timed out.')),5000);})]);}
    finally {if(setupTimer)clearTimeout(setupTimer);}
    if(stopped||signal.aborted)throw new Error('Recording cancelled.');
    stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true},video:false});
    if(stopped||signal.aborted){release();throw new Error('Recording cancelled.');}
    source=context.createMediaStreamSource(stream);node=new AudioWorkletNode(context,'pantry-capture');
    node.port.onmessage=(event:MessageEvent<unknown>)=>{
      if(stopped)return;
      if(event.data==='done'){onLimit();return;}
      if(event.data instanceof Float32Array && frames+event.data.length<=context.sampleRate*30){frames+=event.data.length;chunks.push(event.data);}
    };
    source.connect(node);node.connect(context.destination);
    timer=setTimeout(onLimit,30000);
    return {cancel,async stop(){
      if(stopped)throw new Error('Recording is no longer available.');stopped=true;release();signal.removeEventListener('abort',cancel);
      const rate=context.sampleRate;
      if(frames<rate/4){chunks.length=0;throw new Error('Record at least a quarter second, then stop.');}
      const samples=new Float32Array(frames);let offset=0;for(const chunk of chunks){samples.set(chunk,offset);offset+=chunk.length;}chunks.length=0;
      const outputFrames=Math.min(480000,Math.floor(frames/rate*16000));
      const offline=new OfflineAudioContext(1,outputFrames,16000);const buffer=offline.createBuffer(1,frames,rate);
      buffer.copyToChannel(samples,0);const player=offline.createBufferSource();player.buffer=buffer;player.connect(offline.destination);player.start();
      const rendered=await offline.startRendering();if(signal.aborted)throw new Error('Recording cancelled.');
      return encodeSpeechWav(rendered.getChannelData(0));
    }};
  } catch(error) {cancel();throw error;}
}

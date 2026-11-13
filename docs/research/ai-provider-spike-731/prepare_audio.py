#!/usr/bin/env python3
"""Generate synthetic WAV fixtures offline with installed macOS voices. Never uploads."""
import argparse
import array
import hashlib
import json
import math
import random
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
from validate import HERE, validate


def read_pcm(path):
    with wave.open(str(path), 'rb') as source:
        if (source.getnchannels(), source.getsampwidth(), source.getframerate()) != (1, 2, 16000):
            raise ValueError('Expected mono PCM16 16 kHz')
        samples = array.array('h', source.readframes(source.getnframes()))
    if sys.byteorder != 'little':
        samples.byteswap()
    return samples


def write_pcm(path, samples):
    samples = array.array('h', samples)
    if sys.byteorder != 'little':
        samples.byteswap()
    with wave.open(str(path), 'wb') as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(16000)
        target.writeframes(samples.tobytes())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True, help='Local output directory; WAV files are not committed')
    args = parser.parse_args()
    validate()
    cases = json.loads((HERE / 'speech.json').read_text())['cases']
    voices = subprocess.run(['/usr/bin/say', '-v', '?'], check=True, capture_output=True, text=True).stdout
    installed = {line.split()[0] for line in voices.splitlines() if line.strip()}
    required = {case['audio']['voice'] for case in cases if case['audio']['voice']}
    if not required <= installed:
        raise ValueError(f'Install/choose voices explicitly before generation; no downloads attempted: {required - installed}')
    args.out.mkdir(parents=True, exist_ok=True)
    manifest = {'issue':731, 'synthetic':True, 'uploaded':False, 'apiSpendUsd':0, 'generator':'local macOS say/afconvert plus seeded PCM noise', 'clips':[]}
    with tempfile.TemporaryDirectory(prefix='spike-731-audio-') as temporary:
        for case in cases:
            clip_id = case['id']
            if not re.fullmatch(r'S\d{2}', clip_id):
                raise ValueError('Invalid clip identifier')
            spec = case['audio']
            rng = random.Random(73100 + int(clip_id[1:]))
            destination = args.out / f'{clip_id}.wav'
            if case['transcript']:
                aiff = Path(temporary) / f'{clip_id}.aiff'
                clean = Path(temporary) / f'{clip_id}.wav'
                subprocess.run(['/usr/bin/say', '-v', spec['voice'], '-r', str(spec['wordsPerMinute']), '-o', str(aiff), case['transcript']], check=True, capture_output=True)
                subprocess.run(['/usr/bin/afconvert', '-f', 'WAVE', '-d', 'LEI16@16000', '-c', '1', str(aiff), str(clean)], check=True, capture_output=True)
                samples = read_pcm(clean)
                if spec['effect'] == 'noise-15db':
                    rms = math.sqrt(sum(x*x for x in samples)/len(samples))
                    noise = [rng.gauss(0, 1) for _ in samples]
                    noise_rms = math.sqrt(sum(x*x for x in noise)/len(noise))
                    gain = rms / (10 ** (15/20)) / noise_rms
                    mixed = [x + y*gain for x,y in zip(samples, noise)]
                    scale = min(1, 32000 / max(abs(x) for x in mixed))
                    samples = array.array('h', (round(x*scale) for x in mixed))
            else:
                samples = array.array('h', (0 if spec['effect'] == 'silence' else round(rng.uniform(-2000,2000)) for _ in range(32000)))
            if not 0 < len(samples) <= 30*16000:
                raise ValueError(f'{clip_id}: empty or over-30-second synthesis ({len(samples)} samples); do not silently truncate')
            if case['transcript'] and not any(samples):
                raise ValueError(f'{clip_id}: unexpected silent synthesis')
            write_pcm(destination, samples)
            manifest['clips'].append({'id':clip_id, 'filename':destination.name, 'durationSeconds':round(len(samples)/16000,6), 'sha256':hashlib.sha256(destination.read_bytes()).hexdigest(), 'voice':spec['voice'], 'effect':spec['effect'], 'rms':round(math.sqrt(sum(x*x for x in samples)/len(samples)),3)})
    (args.out / 'audio-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'clips':len(manifest['clips']), 'seconds':sum(x['durationSeconds'] for x in manifest['clips']), 'out':str(args.out.resolve()), 'apiSpendUsd':0},indent=2))


if __name__ == '__main__':
    main()

/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

'use strict';

import { EventEmitter } from 'events';

interface AudioMeter extends ScriptProcessorNode {
  clipping: boolean;
  lastClip: number;
  volume: number;
  clipLevel: number;
  averaging: number;
  clipLag: number;
  checkClipping: () => boolean;
  shutdown: () => void;
}

export class DetectSpeaking extends EventEmitter {
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private meter: AudioMeter | null = null;
  private isPitchDetectionSupported: boolean;

  constructor(stream: MediaStream) {
    super();
    this.isPitchDetectionSupported = this.checkAudioContextSupport();

    if (this.isPitchDetectionSupported) {
      this.start(stream);
    }
  }

  private checkAudioContextSupport(): boolean {
    return typeof window !== 'undefined' && (!!window.AudioContext || !!(window as any).webkitAudioContext);
  }

  private start(stream: MediaStream): void {
    if (!this.isPitchDetectionSupported) {
      console.warn('Pitch detection is not supported in this browser.');
      return;
    }

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    this.meter = this.createAudioMeter(this.audioContext);
    this.mediaStreamSource.connect(this.meter);
  }

  private createAudioMeter(audioContext: AudioContext, clipLevel = 0.98, averaging = 0.95, clipLag = 750): AudioMeter {
    const processor = audioContext.createScriptProcessor(512) as AudioMeter;
    processor.onaudioprocess = this.volumeAudioProcess.bind(this);
    processor.clipping = false;
    processor.lastClip = 0;
    processor.volume = 0;
    processor.clipLevel = clipLevel;
    processor.averaging = averaging;
    processor.clipLag = clipLag;

    processor.connect(audioContext.destination);

    processor.checkClipping = (): boolean => {
      if (!processor.clipping) return false;
      if (processor.lastClip + processor.clipLag < window.performance.now()) {
        processor.clipping = false;
      }
      return processor.clipping;
    };

    processor.shutdown = (): void => {
      processor.disconnect();
      processor.onaudioprocess = null;
    };

    return processor;
  }

  private volumeAudioProcess(event: AudioProcessingEvent): void {
    const buf = event.inputBuffer.getChannelData(0);
    const bufLength = buf.length;
    let sum = 0;

    for (let i = 0; i < bufLength; i++) {
      const x = buf[i];
      if (Math.abs(x) >= this.meter!.clipLevel) {
        this.meter!.clipping = true;
        this.meter!.lastClip = window.performance.now();
      }
      sum += x * x;
    }

    const rms = Math.sqrt(sum / bufLength);
    this.meter!.volume = Math.max(rms, this.meter!.volume * this.meter!.averaging);
    const finalVolume = Math.round(this.meter!.volume * 100);

    if (finalVolume > 5) {
      this.emit('volumeChange', finalVolume);
    }
  }

  public stop(): void {
    if (this.meter) {
      this.meter.shutdown();
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}


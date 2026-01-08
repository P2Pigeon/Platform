/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import { EventEmitter } from 'events';


interface Language {
  name: string;
  dialects: [string, string][];
}

export const speechLanguages: Language[] = [
  { name: 'English', dialects: [['en-US', 'United States'], ['en-GB', 'United Kingdom']] },
  { name: 'Español', dialects: [['es-ES', 'España'], ['es-MX', 'México']] },
  // Add other languages as needed
];

export class SpeechRecognitionService extends EventEmitter {
  private recognition: SpeechRecognition | null = null;
  private isRunning = false;

  constructor(private language: string = 'en-US') {
    super();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.initialize();
    } else {
      console.warn('Speech Recognition API is not supported in this browser.');
    }
  }

  private initialize(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.lang = this.language;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isRunning = true;
      this.emit('start');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (transcript) {
        this.emit('result', transcript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.emit('error', event.error);
    };

    this.recognition.onend = () => {
      this.isRunning = false;
      this.emit('end');
    };
  }

  public start(): void {
    if (this.recognition && !this.isRunning) {
      try {
        this.recognition.start();
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  public stop(): void {
    if (this.recognition && this.isRunning) {
      this.recognition.stop();
    }
  }

  public setLanguage(lang: string): void {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }
}


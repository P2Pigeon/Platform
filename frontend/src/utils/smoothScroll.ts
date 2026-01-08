/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * @file smoothScroll.ts
 * @description This module provides a reusable and type-safe class for smooth scrolling to anchor links.
 * It uses requestAnimationFrame for a performant and fluid animation, replacing the legacy
 * smooth-scroll logic from landing.js with a modern, encapsulated solution.
 */

interface SmoothScrollOptions {
  selector?: string;
  duration?: number;
}

export class SmoothScroll {
  private triggerElements: HTMLElement[];
  private defaultDuration: number;

  constructor(options: SmoothScrollOptions = {}) {
    const { selector = '.smooth-scroll', duration = 1000 } = options;
    this.triggerElements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    this.defaultDuration = duration;
    this.init();
  }

  private init(): void {
    this.triggerElements.forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleClick(element);
      });
    });
  }

  private handleClick(element: HTMLElement): void {
    const targetId = element.getAttribute('href')?.split('#')[1];
    if (!targetId) return;

    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const duration = parseInt(element.getAttribute('data-duration') || '', 10) || this.defaultDuration;
    const startPosition = window.pageYOffset;
    const targetPosition = targetElement.getBoundingClientRect().top;

    let startTime = 0;

    const animation = (currentTime: number) => {
      if (startTime === 0) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = this.ease(timeElapsed, startPosition, targetPosition, duration);
      window.scrollTo(0, progress);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

  // Easing function for a smooth animation effect
  private ease(t: number, b: number, c: number, d: number): number {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  public destroy(): void {
    // In a full SPA, you would remove event listeners here.
    console.log('SmoothScroll event listeners would be removed here.');
  }
}

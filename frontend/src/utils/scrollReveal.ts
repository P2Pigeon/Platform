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
 * @file scrollReveal.ts
 * @description This module provides a performant, reusable, and type-safe class for revealing
 * elements as they enter the viewport during scrolling. It uses a throttled event listener
 * for optimal performance and refactors legacy code from landing.js into a modern solution.
 */

interface ScrollRevealOptions {
  selector?: string;
  throttleDelay?: number;
}

export class ScrollReveal {
  private elements: HTMLElement[];
  private throttleDelay: number;
  private isThrottled = false;

  constructor(options: ScrollRevealOptions = {}) {
    const { selector = '[class*=reveal-]', throttleDelay = 30 } = options;
    this.elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    this.throttleDelay = throttleDelay;

    if (this.elements.length > 0 && document.body.classList.contains('has-animations')) {
      this.init();
    }
  }

  private init(): void {
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.handleScroll);
    // Initial check on load
    document.addEventListener('DOMContentLoaded', this.handleScroll);
  }

  private handleScroll(): void {
    if (this.isThrottled) return;
    this.isThrottled = true;

    setTimeout(() => {
      this.checkElements();
      this.isThrottled = false;
    }, this.throttleDelay);
  }

  private checkElements(): void {
    const viewportHeight = window.innerHeight;

    this.elements.forEach((element) => {
      if (element.classList.contains('is-revealed')) return;

      const offset = parseInt(element.getAttribute('data-reveal-offset') || '200', 10);
      const delay = parseInt(element.getAttribute('data-reveal-delay') || '0', 10);

      if (element.getBoundingClientRect().top <= viewportHeight - offset) {
        if (delay > 0) {
          setTimeout(() => {
            element.classList.add('is-revealed');
          }, delay);
        } else {
          element.classList.add('is-revealed');
        }
      }
    });

    // If all elements have been revealed, we can clean up the listeners
    if (this.elements.every((el) => el.classList.contains('is-revealed'))) {
      this.destroy();
    }
  }

  public destroy(): void {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleScroll);
  }
}

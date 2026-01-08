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
 * @file carousel.ts
 * @description This module provides a reusable and type-safe class for managing carousel/slider components.
 * It includes swipe gesture support, auto-play, and bullet navigation, refactoring legacy code
 * from landing.js into a modern, encapsulated, and performant solution.
 */

interface CarouselOptions {
  selector: string;
  autoplay?: boolean;
  autoplaySpeed?: number;
}

export class Carousel {
  private element!: HTMLElement; // Using definite assignment assertion
  private items!: HTMLElement[]; // Using definite assignment assertion
  private bullets: HTMLElement[] | null = null;
  private activeIndex = 0;
  private autoplay: boolean = false; // Default value
  private autoplaySpeed: number = 5000; // Default value
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  // Swipe detection properties
  private touchStartX = 0;
  private touchEndX = 0;
  private minSwipePixels = 50;

  constructor(options: CarouselOptions) {
    const element = document.querySelector(options.selector) as HTMLElement;
    if (!element) {
      console.warn(`Carousel with selector "${options.selector}" not found.`);
      return;
    }
    this.element = element;
    this.items = Array.from(this.element.querySelectorAll('.carousel-item')) as HTMLElement[];
    this.autoplay = options.autoplay || false;
    this.autoplaySpeed = options.autoplaySpeed || 5000;

    this.init();
  }

  private init(): void {
    this.createBullets();
    this.setActive(0);
    this.addEventListeners();
    if (this.autoplay) {
      this.startAutoplay();
    }
  }

  private createBullets(): void {
    const bulletContainer = this.element.parentElement?.querySelector('.carousel-bullets');
    if (!bulletContainer) return;

    this.items.forEach((_, index) => {
      const button = document.createElement('button');
      button.classList.add('carousel-bullet');
      button.addEventListener('click', () => this.setActive(index));
      bulletContainer.appendChild(button);
    });
    this.bullets = Array.from(bulletContainer.children) as HTMLElement[];
  }

  private setActive(index: number): void {
    // Clamp the index to be within bounds
    this.activeIndex = (index + this.items.length) % this.items.length;

    this.items.forEach((item, i) => {
      item.classList.toggle('is-active', i === this.activeIndex);
    });

    if (this.bullets) {
      this.bullets.forEach((bullet, i) => {
        bullet.classList.toggle('is-active', i === this.activeIndex);
      });
    }

    if (this.autoplay) {
      this.resetAutoplay();
    }
  }

  public next(): void {
    this.setActive(this.activeIndex + 1);
  }

  public prev(): void {
    this.setActive(this.activeIndex - 1);
  }

  private startAutoplay(): void {
    this.autoplayTimer = setInterval(() => this.next(), this.autoplaySpeed);
  }

  private resetAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.startAutoplay();
    }
  }

  private addEventListeners(): void {
    this.element.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.element.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });
  }

  private handleSwipe(): void {
    const swipeDistance = this.touchEndX - this.touchStartX;
    if (Math.abs(swipeDistance) < this.minSwipePixels) return;

    if (swipeDistance > 0) {
      this.prev();
    } else {
      this.next();
    }
  }

  public destroy(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
    }
    // Remove other event listeners if necessary in a SPA context
  }
}

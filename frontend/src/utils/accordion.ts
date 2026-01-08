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
 * @file accordion.ts
 * @description This module provides a reusable and type-safe class for managing accordion UI components.
 * It replaces the legacy, globally-scoped accordion logic from landing.js with an encapsulated,
 * modern implementation.
 */

export class Accordion {
  private accordionElements: HTMLElement[];

  constructor(selector: string) {
    this.accordionElements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    this.init();
  }

  private init(): void {
    this.accordionElements.forEach((element) => {
      const header = element.querySelector('.accordion-header') as HTMLElement;
      const content = header.nextElementSibling as HTMLElement;

      if (!header || !content) {
        console.warn('Accordion element is missing a header or content.', element);
        return;
      }

      // Set initial state based on the presence of the 'is-active' class
      if (element.classList.contains('is-active')) {
        this.open(element, content);
      } else {
        content.style.maxHeight = '0px';
      }

      header.addEventListener('click', () => this.toggle(element, content));
    });
  }

  private open(container: HTMLElement, content: HTMLElement): void {
    container.classList.add('is-active');
    // Temporarily set to 'auto' to calculate the full height, then set to the specific pixel value
    content.style.maxHeight = `${content.scrollHeight}px`;
  }

  private close(container: HTMLElement, content: HTMLElement): void {
    container.classList.remove('is-active');
    content.style.maxHeight = '0px';
  }

  private toggle(container: HTMLElement, content: HTMLElement): void {
    if (container.classList.contains('is-active')) {
      this.close(container, content);
    } else {
      this.open(container, content);
    }
  }

  public destroy(): void {
    // In a full SPA, you would remove event listeners here to prevent memory leaks.
    // For this migration, it's sufficient to have the logic in place.
    console.log('Accordion event listeners would be removed here.');
  }
}

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
 * @file pricingToggle.ts
 * @description This module provides a reusable and type-safe class for managing a pricing toggle switch.
 * It updates text content based on the toggle's state (e.g., monthly vs. yearly) and refactors
 * legacy code from landing.js into a modern, encapsulated solution.
 */

export class PricingToggle {
  private toggleElement: HTMLInputElement;
  private switchableElements: HTMLElement[];

  constructor(toggleSelector: string, switchableSelector: string) {
    this.toggleElement = document.querySelector(toggleSelector) as HTMLInputElement;
    this.switchableElements = Array.from(document.querySelectorAll(switchableSelector)) as HTMLElement[];

    if (!this.toggleElement) {
      console.warn(`Pricing toggle with selector "${toggleSelector}" not found.`);
      return;
    }

    this.init();
  }

  private init(): void {
    this.updatePrices(); // Set initial state on load
    this.toggleElement.addEventListener('change', () => this.updatePrices());
  }

  private updatePrices(): void {
    const isYearly = this.toggleElement.checked;
    this.switchableElements.forEach((element) => {
      const monthlyPrice = element.getAttribute('data-pricing-monthly');
      const yearlyPrice = element.getAttribute('data-pricing-yearly');

      if (isYearly && yearlyPrice) {
        element.innerHTML = yearlyPrice;
      } else if (monthlyPrice) {
        element.innerHTML = monthlyPrice;
      }
    });
  }

  public destroy(): void {
    this.toggleElement.removeEventListener('change', this.updatePrices);
  }
}

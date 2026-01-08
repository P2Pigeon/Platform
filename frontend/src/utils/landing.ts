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
 * @file landing.ts
 * @description This is the main entry point for initializing all interactive components on the landing page.
 * It imports and instantiates the various UI modules (Accordion, Carousel, etc.) that were refactored
 * from the legacy landing.js file.
 */

import { Accordion } from './accordion';
import { Carousel } from './carousel';
import { Modal } from './modal';
import { PricingToggle } from './pricingToggle';
import { ScrollReveal } from './scrollReveal';
import { SmoothScroll } from './smoothScroll';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all the interactive components for the landing page
  new Accordion('.accordion');
  new Carousel({ selector: '.carousel-items', autoplay: true });
  new Modal({ triggerSelector: '.modal-trigger' });
  new PricingToggle('#pricing-toggle', '.pricing-switchable');
  new ScrollReveal();
  new SmoothScroll();
});

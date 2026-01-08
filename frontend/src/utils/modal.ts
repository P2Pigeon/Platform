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
 * @file modal.ts
 * @description This module provides a reusable and type-safe class for managing modal dialogs.
 * It handles opening, closing, and keyboard interactions (e.g., Escape key), refactoring
 * legacy code from landing.js into a modern, encapsulated solution.
 */

interface ModalOptions {
  triggerSelector: string;
  closeSelector?: string;
}

export class Modal {
  private triggerElements: HTMLElement[];
  private activeModal: HTMLElement | null = null;

  constructor(options: ModalOptions) {
    this.triggerElements = Array.from(document.querySelectorAll(options.triggerSelector)) as HTMLElement[];
    this.initTriggers();
    this.initKeyboardListener();
  }

  private initTriggers(): void {
    this.triggerElements.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = trigger.getAttribute('aria-controls');
        if (targetId) {
          const targetModal = document.getElementById(targetId) as HTMLElement;
          if (targetModal) {
            this.open(targetModal);
          }
        }
      });
    });
  }

  private open(modalElement: HTMLElement): void {
    this.activeModal = modalElement;
    document.body.classList.add('is-modal-open');
    modalElement.classList.add('is-active');

    // Add listeners to close the modal
    const closeButton = modalElement.querySelector('.modal-close');
    const overlay = modalElement.querySelector('.modal-overlay');

    closeButton?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', () => this.close());
  }

  public close(): void {
    if (!this.activeModal) return;

    document.body.classList.remove('is-modal-open');
    this.activeModal.classList.remove('is-active');
    this.activeModal = null;
    // Note: In a framework like React, you'd clean up the specific listeners here.
    // For this migration, the logic is encapsulated and safer than before.
  }

  private initKeyboardListener(): void {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });
  }

  public destroy(): void {
    // In a full SPA, you would remove the global keydown listener.
    console.log('Modal event listeners would be removed here.');
  }
}

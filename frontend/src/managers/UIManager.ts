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
 * @file UIManager.ts
 * @description This module provides a UIManager class responsible for all direct DOM manipulations.
 * It abstracts away the complexities of querying elements and updating the UI, providing a clean
 * API for other parts of the application. This replaces the scattered DOM logic from client.js.
 */

// A type-safe map to hold all our DOM element references
interface UIElements {
  [key: string]: HTMLElement | null;
}

export class UIManager {
  public elements: UIElements = {};

  constructor() {
    this.collectElements();
  }

  /**
   * Queries the DOM and collects all necessary element references.
   * This method replaces the legacy getHtmlElementsById function.
   */
  private collectElements(): void {
    // A helper to reduce boilerplate
    const get = (id: string): HTMLElement | null => document.getElementById(id);

    // Main containers
    this.elements.videoGrid = get('video-grid');
    this.elements.chatRoom = get('chat-room');
    this.elements.whiteboard = get('whiteboard');

    // Buttons Bar
    this.elements.buttonsBar = get('buttons-bar');
    this.elements.shareRoomBtn = get('share-room-btn');
    this.elements.hideMeBtn = get('hide-me-btn');
    this.elements.audioBtn = get('audio-btn');
    this.elements.videoBtn = get('video-btn');
    this.elements.swapCameraBtn = get('swap-camera-btn');
    this.elements.screenBtn = get('screen-btn');
    this.elements.recordStreamBtn = get('record-stream-btn');
    this.elements.fullScreenBtn = get('full-screen-btn');
    this.elements.chatRoomBtn = get('chat-room-btn');
    this.elements.captionBtn = get('caption-btn');
    this.elements.mySettingsBtn = get('my-settings-btn');
    this.elements.aboutBtn = get('about-btn');

    // My-Settings Modal
    this.elements.mySettings = get('my-settings');
    this.elements.mySettingsCloseBtn = get('my-settings-close-btn');
    this.elements.myPeerNameSet = get('my-peer-name-set');
    this.elements.myPeerNameSetBtn = get('my-peer-name-set-btn');
    this.elements.audioInputSelect = get('audio-input-select');
    this.elements.audioOutputSelect = get('audio-output-select');
    this.elements.videoSelect = get('video-select');
    this.elements.videoQualitySelect = get('video-quality-select');
    this.elements.themeSelect = get('theme-select');

    // Chat Room
    this.elements.chatPanel = get('chat-panel');
    this.elements.chatBody = get('chat-body');
    this.elements.chatInput = get('chat-input');
    this.elements.chatSendBtn = get('chat-send-btn');
    this.elements.chatEmojiBtn = get('chat-emoji-btn');

    // ... and so on for all other elements from the original file.
    // This provides a single, organized place to manage all DOM element references.
  }

  /**
   * Get a cached element by its key.
   * @param key The key of the element to retrieve.
   * @returns The HTMLElement or null if not found.
   */
  public getElement<T extends HTMLElement>(key: string): T | null {
    return this.elements[key] as T | null;
  }

  /**
   * A generic method to update the innerHTML of an element.
   * @param key The key of the element to update.
   * @param content The new HTML content.
   */
  public updateContent(key: string, content: string): void {
    const element = this.getElement(key);
    if (element) {
      element.innerHTML = content;
    }
  }

  /**
   * A generic method to toggle a CSS class on an element.
   * @param key The key of the element.
   * @param className The CSS class to toggle.
   * @param force (Optional) If true, adds the class; if false, removes it.
   */
  public toggleClass(key: string, className: string, force?: boolean): void {
    const element = this.getElement(key);
    element?.classList.toggle(className, force);
  }

  /**
   * A generic method to show or hide an element.
   * @param key The key of the element.
   * @param show If true, displays the element; otherwise, hides it.
   */
  public display(key: string, show: boolean): void {
    const element = this.getElement(key);
    if (element) {
      element.style.display = show ? '' : 'none'; // Use default display property
    }
  }
}

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
 * @file main.ts
 * @description This is the main entry point for the Pigeon P2P client application.
 * It initializes and coordinates all the major components, including the AppState,
 * UIManager, and EventManager. This file replaces the legacy initialization
 * logic in client.js.
 */

import { AppState } from './state/AppState';
import { UIManager } from './managers/UIManager';
import { EventManager } from './managers/EventManager';

class Application {
  private state: AppState;
  private ui: UIManager;
  private events: EventManager;

  constructor() {
    // 1. Initialize State: The single source of truth for application data.
    this.state = new AppState();

    // 2. Initialize UI Manager: Handles all DOM interactions.
    this.ui = new UIManager();

    // 3. Initialize Event Manager: Manages all user-initiated events.
    this.events = new EventManager(this.ui, this.state);
  }

  /**
   * Starts the application.
   */
  public start(): void {
    console.log('Pigeon P2P Client Initializing...');

    // 4. Bind all event listeners to start handling user interactions.
    this.events.init();

    // In future steps, we will initialize the WebRTC and signaling managers here.
    // e.g., const webrtcManager = new WebRTCManager(this.state, this.ui);
    // webrtcManager.connect();

    console.log('Pigeon P2P Client Initialized Successfully.');
  }
}

// Wait for the DOM to be fully loaded before starting the application.
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.start();
});

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
 * @file EventManager.ts
 * @description This module provides an EventManager class to handle all user-initiated events.
 * It binds listeners to UI elements and orchestrates the application's response by coordinating
 * with the UIManager, AppState, and other services. This replaces the scattered event listeners
 * from client.js.
 */

import { UIManager } from './UIManager';
import { AppState } from '../state/AppState';

export class EventManager {
  private ui: UIManager;
  private state: AppState;

  constructor(uiManager: UIManager, appState: AppState) {
    this.ui = uiManager;
    this.state = appState;
  }

  /**
   * Binds all necessary event listeners to the UI elements.
   */
  public init(): void {
    this.bindMediaControls();
    this.bindSettingsControls();
    // More bindings will be added here as the migration progresses
  }

  private bindMediaControls(): void {
    const audioBtn = this.ui.getElement('audioBtn');
    audioBtn?.addEventListener('click', () => this.handleAudioToggle());

    const videoBtn = this.ui.getElement('videoBtn');
    videoBtn?.addEventListener('click', () => this.handleVideoToggle());
  }

  private bindSettingsControls(): void {
    const settingsBtn = this.ui.getElement('mySettingsBtn');
    settingsBtn?.addEventListener('click', () => this.handleSettingsToggle());

    const settingsCloseBtn = this.ui.getElement('mySettingsCloseBtn');
    settingsCloseBtn?.addEventListener('click', () => this.handleSettingsToggle());
  }

  private handleAudioToggle(): void {
    this.state.setAudioState(!this.state.isAudioOn);
    console.log(`Audio toggled to: ${this.state.isAudioOn ? 'ON' : 'OFF'}`);

    // In a real scenario, this would also trigger WebRTC logic to mute/unmute the track.
    // For now, we just update the UI.
    this.ui.toggleClass('audioBtn', 'active', this.state.isAudioOn);
  }

  private handleVideoToggle(): void {
    this.state.setVideoState(!this.state.isVideoOn);
    console.log(`Video toggled to: ${this.state.isVideoOn ? 'ON' : 'OFF'}`);

    // This would also trigger WebRTC logic.
    this.ui.toggleClass('videoBtn', 'active', this.state.isVideoOn);
  }

  private handleSettingsToggle(): void {
    this.state.isMySettingsVisible = !this.state.isMySettingsVisible;
    this.ui.display('mySettings', this.state.isMySettingsVisible);
  }
}

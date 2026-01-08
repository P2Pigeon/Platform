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
 * @file AppState.ts
 * @description This module provides a centralized class for managing the application's dynamic state.
 * It encapsulates all state variables that were previously global in client.js, providing a single
 * source of truth and making the application's state predictable and easier to manage.
 */

export class AppState {
  // Room and User State
  public isRoomLocked = false;
  public myPeerName = 'Guest';
  public myPeerId = '';
  public isPresenter = false;

  // Media and Stream State
  public isAudioOn = true;
  public isVideoOn = true;
  public isScreenStreaming = false;
  public isMyVideoHidden = false; // 'hide-me' functionality
  public isPushToTalk = false;
  public isAudioPitchBar = false;

  // UI Visibility State
  public isChatRoomVisible = false;
  public isCaptionBoxVisible = false;
  public isMySettingsVisible = false;
  public isButtonsVisible = false;
  public isVideoUrlPlayerOpen = false;
  public isVideoOnFullScreen = false;

  // Feature-specific State
  public isRecording = false;
  public isFileTransferInProgress = false;
  public isVideoPinned = false;
  public pinnedVideoPlayerId: string | null = null;

  // Technical/Configuration State
  public videoQualitySelectedIndex = 0;
  public theme = 'dark';
  public notifyBySound = true;

  constructor() {
    // In a future step, we could initialize parts of this state
    // from localStorage to persist user preferences.
  }

  // Example setter methods. More will be added as the migration progresses.
  public setRoomLocked(isLocked: boolean): void {
    this.isRoomLocked = isLocked;
    // In a future step, we could emit an event here, e.g., this.emit('room-lock-changed', isLocked);
  }

  public setMyPeerName(name: string): void {
    this.myPeerName = name;
  }

  public setAudioState(isOn: boolean): void {
    this.isAudioOn = isOn;
  }

  public setVideoState(isOn: boolean): void {
    this.isVideoOn = isOn;
  }

  public setTheme(theme: string): void {
    this.theme = theme;
  }
}

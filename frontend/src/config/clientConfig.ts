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
 * @file clientConfig.ts
 * @description This module centralizes all static configuration, constants, and enumerations for the main client application.
 * It replaces the scattered global variables from the legacy client.js, improving maintainability and clarity.
 */

// Assuming these are utility functions that can be imported or replaced later
// For now, we define placeholders.
const getSignalingServer = (): string => (window as any).getSignalingServer();
const getRoomId = (): string => (window as any).getRoomId();

// Server and Room Configuration
export const signalingServer = getSignalingServer();
export const roomId = getRoomId();
export const myRoomUrl = window.location.href;

// Image Asset Paths
export const welcomeImg = '../images/image-placeholder.png';
export const shareUrlImg = '../images/image-placeholder.png';
export const leaveRoomImg = '../images/leave-room.png';
export const confirmImg = '../images/image-placeholder.png';
export const fileSharingImg = '../images/share.png';
export const roomLockedImg = '../images/locked.png';
export const camOffImg = '../images/cam-off.png';
export const audioOffImg = '../images/audio-off.png';
export const deleteImg = '../images/delete.png';
export const youtubeImg = '../images/youtube.png';
export const messageImg = '../images/message.png';
export const kickedOutImg = '../images/leave-room.png';
export const audioGif = '../images/audio.gif';
export const videoAudioShare = '../images/va-share.png';
export const aboutImg = '../images/pigeon-logo.png';
export const imgFeedback = '../images/feedback.png';
export const forbiddenImg = '../images/forbidden.png';
export const avatarImg = '../images/mirotalk-logo.png';
export const camMicOff = '../images/cam-mic-off.png';

// Feature-specific Configurations
export const fileSharingInput = '*'; // Allow all file extensions
export const wbImageInput = 'image/*';
export const wbWidth = 1200;
export const wbHeight = 600;

// Emoji Replacements
export const chatInputEmoji: { [key: string]: string } = {
  '<3': '\u2764\uFE0F',
  '</3': '\uD83D\uDC94',
  ':D': '\uD83D\uDE00',
  ':)': '\uD83D\uDE03',
  ';)': '\uD83D\uDE09',
  ':(': '\uD83D\uDE12',
  ':p': '\uD83D\uDE1B',
  ';p': '\uD83D\uDE1C',
  ":'(": '\uD83D\uDE22',
  ':+1:': '\uD83D\uDC4D',
};

// CSS Class Names for UI elements (FontAwesome)
export const className = {
  user: 'fas fa-user',
  clock: 'fas fa-clock',
  hideMeOn: 'fas fa-user-slash',
  hideMeOff: 'fas fa-user',
  audioOn: 'fas fa-microphone',
  audioOff: 'fas fa-microphone-slash',
  videoOn: 'fas fa-video',
  videoOff: 'fas fa-video-slash',
  screenOn: 'fas fa-desktop',
  screenOff: 'fas fa-stop-circle',
  handPulsate: 'fas fa-hand-paper pulsate',
  privacy: 'far fa-circle',
  snapShot: 'fas fa-camera-retro',
  pinUnpin: 'fas fa-map-pin',
  zoomIn: 'fas fa-magnifying-glass-plus',
  zoomOut: 'fas fa-magnifying-glass-minus',
  fullScreen: 'fas fa-expand',
  fsOn: 'fas fa-compress-alt',
  fsOff: 'fas fa-expand-alt',
  msgPrivate: 'fas fa-paper-plane',
  shareFile: 'fas fa-upload',
  shareVideoAudio: 'fab fa-youtube',
  kickOut: 'fas fa-sign-out-alt',
  chatOn: 'fas fa-comment',
  chatOff: 'fas fa-comment-slash',
  ghost: 'fas fa-ghost',
  undo: 'fas fa-undo',
  captionOn: 'fas fa-closed-captioning',
  trash: 'fas fa-trash',
  copy: 'fas fa-copy',
  heart: 'fas fa-heart',
  pip: 'fas fa-images',
};

// HTML String Icons
export const icons = {
  lock: '<i class="fas fa-lock"></i>',
  unlock: '<i class="fas fa-lock-open"></i>',
  pitchBar: '<i class="fas fa-microphone-lines"></i>',
  sounds: '<i class="fas fa-music"></i>',
  user: '<i class="fas fa-user"></i>',
  fileSend: '<i class="fas fa-file-export"></i>',
  fileReceive: '<i class="fas fa-file-import"></i>',
};

// Button Visibility Configuration
const showVideoPipBtn = document.pictureInPictureEnabled;
export const buttons = {
  main: {
    showShareRoomBtn: true,
    showHideMeBtn: true,
    showAudioBtn: true,
    showVideoBtn: true,
    showScreenBtn: true,
    showRecordStreamBtn: true,
    showChatRoomBtn: true,
    showCaptionRoomBtn: true,
    showMySettingsBtn: true,
    showAboutBtn: true,
    showRoomLockedBtn: true,
    showLockRoomBtn: true,
    showFullScreenBtn: true,
    showVideoPipBtn: showVideoPipBtn,
    showSwapCameraBtn: false, // Auto-detected
  },
  remote: {
    showAudioBtn: true,
    showVideoBtn: true,
    showKickOutBtn: true,
    showSnapShotBtn: true,
    showFileShareBtn: true,
    showShareVideoAudioBtn: true,
    showPrivateMessageBtn: true,
    showZoomInOutBtn: false,
    showVideoPipBtn: showVideoPipBtn,
  },
  local: {
    showSnapShotBtn: true,
    showVideoCircleBtn: true,
    showZoomInOutBtn: false,
    showVideoPipBtn: showVideoPipBtn,
  },
};

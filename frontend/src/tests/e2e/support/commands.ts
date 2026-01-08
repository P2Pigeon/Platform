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
 * @file commands.ts
 * @description Custom Cypress commands for P2Pigeon end-to-end testing. */

// Import type definitions for Cypress
/// <reference types="cypress" />

// WebRTC mocking handled inline - cypress-webrtc package not available

// Augment the Cypress namespace to include custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Create a secure room with specified encryption settings
       * @param roomName - Name of the room to create
       * @param encryptionLevel - Level of encryption to use (standard, enhanced, maximum)
       * @example cy.createSecureRoom('TestRoom', 'enhanced')
       */
      createSecureRoom(roomName: string, encryptionLevel?: 'standard' | 'enhanced' | 'maximum'): Chainable<Element>;
      
      /**
       * Join an existing room with the specified room ID and optional password
       * @param roomId - ID of the room to join
       * @param password - Optional room password
       * @example cy.joinRoom('abc-123-def-456', 'secretpassword')
       */
      joinRoom(roomId: string, password?: string): Chainable<Element>;
      
      /**
       * Verify that the connection is encrypted and secure
       * @example cy.verifySecureConnection()
       */
      verifySecureConnection(): Chainable<Element>;
      
      /**
       * Send an encrypted message to peers in the room
       * @param message - Message content to send
       * @example cy.sendEncryptedMessage('Hello, this is a secure message')
       */
      sendEncryptedMessage(message: string): Chainable<Element>;
      
      /**
       * Verify received message contents
       * @param expectedContent - Expected message content
       * @example cy.verifyReceivedMessage('Hello, this is a secure message')
       */
      verifyReceivedMessage(expectedContent: string): Chainable<Element>;
      
      /**
       * Verify peer connection status
       * @param status - Expected connection status
       * @example cy.verifyPeerStatus('connected')
       */
      verifyPeerStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error'): Chainable<Element>;
      
      /**
       * Enable or disable camera/microphone
       * @param device - Device type to toggle
       * @param enable - Whether to enable or disable
       * @example cy.toggleMediaDevice('camera', false)
       */
      toggleMediaDevice(device: 'camera' | 'microphone', enable: boolean): Chainable<Element>;
      
      /**
       * Test file transfer with encryption
       * @param fileName - Name of file to transfer
       * @param fileSize - Size of file in bytes
       * @example cy.testSecureFileTransfer('test.pdf', 1024 * 1024)
       */
      testSecureFileTransfer(fileName: string, fileSize: number): Chainable<Element>;
      
      /**
       * Mock peer connection with specified number of peers
       * @param peerCount - Number of peers to simulate
       * @example cy.mockPeerConnections(3)
       */
      mockPeerConnections(peerCount: number): Chainable<Element>;
      
      /**
       * Verify security indicators in the UI
       * @param expectedIndicators - Expected security indicators to be present
       * @example cy.verifySecurityIndicators(['encryption', 'verified_peers'])
       */
      verifySecurityIndicators(expectedIndicators: string[]): Chainable<Element>;
      
      /**
       * Login with cryptographic identity
       * @param identityKey - Identity key to use (can be 'generate' to create new)
       * @example cy.loginWithCryptoIdentity('generate')
       */
      loginWithCryptoIdentity(identityKey: string | 'generate'): Chainable<Element>;
    }
  }
}

// Implementation of custom commands

/**
 * Create a secure room with specified encryption settings
 */
Cypress.Commands.add('createSecureRoom', (roomName: string, encryptionLevel = 'standard') => {
  cy.log(`Creating secure room: ${roomName} with ${encryptionLevel} encryption`);
  
  cy.visit('/');
  cy.get('[data-testid="create-room-button"]').click();
  cy.get('[data-testid="room-name-input"]').type(roomName);
  
  // Select encryption level
  cy.get('[data-testid="encryption-level-select"]').select(encryptionLevel);
  
  // Submit form
  cy.get('[data-testid="create-room-submit"]').click();
  
  // Wait for room creation and encryption setup
  cy.get('[data-testid="room-created-success"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="encryption-status-indicator"]').should('contain', 'Encrypted');
  
  // Return room ID from URL for later use
  return cy.url().then(url => {
    const roomId = url.split('/').pop() || '';
    cy.log(`Room created with ID: ${roomId}`);
    return roomId;
  });
});

/**
 * Join an existing room with the specified room ID and optional password
 */
Cypress.Commands.add('joinRoom', (roomId: string, password?: string) => {
  cy.log(`Joining room with ID: ${roomId}`);
  
  cy.visit(`/join/${roomId}`);
  
  // Enter password if provided
  if (password) {
    cy.get('[data-testid="room-password-input"]').type(password);
    cy.get('[data-testid="submit-password-button"]').click();
  }
  
  // Wait for room join success
  cy.get('[data-testid="room-joined-success"]', { timeout: 10000 }).should('be.visible');
});

/**
 * Verify that the connection is encrypted and secure
 */
Cypress.Commands.add('verifySecureConnection', () => {
  cy.log('Verifying secure connection');
  
  // Check encryption indicator
  cy.get('[data-testid="encryption-status-indicator"]')
    .should('be.visible')
    .should('contain', 'Encrypted');
  
  // Check security details
  cy.get('[data-testid="security-details-button"]').click();
  cy.get('[data-testid="security-details-modal"]').within(() => {
    cy.get('[data-testid="encryption-algorithm"]').should('contain', 'AES-GCM');
    cy.get('[data-testid="key-exchange-method"]').should('contain', 'ECDH');
  });
});

/**
 * Send an encrypted message to peers in the room
 */
Cypress.Commands.add('sendEncryptedMessage', (message: string) => {
  cy.log(`Sending encrypted message: ${message}`);
  
  cy.get('[data-testid="chat-input"]').type(message);
  cy.get('[data-testid="send-message-button"]').click();
  
  // Verify message was sent and has encryption indicator
  cy.get('[data-testid="message-sent-indicator"]').should('be.visible');
  cy.get('[data-testid="message-encryption-indicator"]').last().should('be.visible');
});

/**
 * Verify received message contents
 */
Cypress.Commands.add('verifyReceivedMessage', (expectedContent: string) => {
  cy.log(`Verifying received message content: ${expectedContent}`);
  
  cy.get('[data-testid="message-content"]')
    .should('contain', expectedContent);
});

/**
 * Verify peer connection status
 */
Cypress.Commands.add('verifyPeerStatus', (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
  cy.log(`Verifying peer status: ${status}`);
  
  const statusIndicator = {
    connecting: 'connecting-indicator',
    connected: 'connected-indicator',
    disconnected: 'disconnected-indicator',
    error: 'error-indicator'
  };
  
  cy.get(`[data-testid="${statusIndicator[status]}"]`).should('be.visible');
});

/**
 * Enable or disable camera/microphone
 */
Cypress.Commands.add('toggleMediaDevice', (device: 'camera' | 'microphone', enable: boolean) => {
  const deviceMap = {
    camera: 'video-toggle-button',
    microphone: 'audio-toggle-button'
  };
  
  const action = enable ? 'Enabling' : 'Disabling';
  cy.log(`${action} ${device}`);
  
  cy.get(`[data-testid="${deviceMap[device]}"]`).then($btn => {
    // Only click if current state doesn't match desired state
    const isEnabled = $btn.attr('data-enabled') === 'true';
    if (isEnabled !== enable) {
      cy.wrap($btn).click();
    }
  });
  
  // Verify device state
  cy.get(`[data-testid="${deviceMap[device]}"]`)
    .should('have.attr', 'data-enabled', enable.toString());
});

/**
 * Test file transfer with encryption
 */
Cypress.Commands.add('testSecureFileTransfer', (fileName: string, fileSize: number) => {
  cy.log(`Testing secure file transfer: ${fileName} (${fileSize} bytes)`);
  
  // Create test file
  cy.fixture('example.json', 'base64').then(fileContent => {
    const testFile = Cypress.Blob.base64StringToBlob(fileContent);
    const file = new File([testFile], fileName, { type: 'application/octet-stream' });
    
    // Attach file to uploader
    cy.get('[data-testid="file-input"]').attachFile({
      fileContent: testFile,
      fileName: fileName,
      mimeType: 'application/octet-stream'
    });
  });
  
  // Wait for file to be processed and encryption to complete
  cy.get('[data-testid="file-encryption-progress"]', { timeout: 10000 }).should('exist');
  cy.get('[data-testid="file-ready-indicator"]', { timeout: 30000 }).should('be.visible');
  
  // Initiate transfer
  cy.get('[data-testid="send-file-button"]').click();
  
  // Verify file transfer progress and completion
  cy.get('[data-testid="file-transfer-progress"]', { timeout: 10000 }).should('exist');
  cy.get('[data-testid="file-transfer-complete"]', { timeout: 30000 }).should('be.visible');
});

/**
 * Mock peer connections
 */
Cypress.Commands.add('mockPeerConnections', (peerCount: number) => {
  cy.log(`Mocking ${peerCount} peer connections`);
  
  cy.window().then(win => {
    win.eval(`
      if (!window.mockedPeers) {
        window.mockedPeers = [];
      }
      
      // Clear existing mocked peers
      window.mockedPeers = [];
      
      // Create specified number of mock peers
      for (let i = 0; i < ${peerCount}; i++) {
        const peerId = 'mock-peer-' + i;
        const peerName = 'Mock User ' + i;
        
        window.mockedPeers.push({
          id: peerId,
          name: peerName,
          isConnected: true,
          hasCamera: i % 2 === 0,
          hasMicrophone: true
        });
        
        // Dispatch peer connected event
        const peerEvent = new CustomEvent('peerConnected', {
          detail: {
            peerId,
            peerName,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(peerEvent);
      }
      
      console.log('Created ' + ${peerCount} + ' mock peers');
    `);
  });
  
  // Verify peers appear in the UI
  cy.get('[data-testid="peer-item"]').should('have.length', peerCount);
});

/**
 * Verify security indicators in the UI
 */
Cypress.Commands.add('verifySecurityIndicators', (expectedIndicators: string[]) => {
  cy.log(`Verifying security indicators: ${expectedIndicators.join(', ')}`);
  
  expectedIndicators.forEach(indicator => {
    cy.get(`[data-testid="security-indicator-${indicator}"]`).should('be.visible');
  });
});

/**
 * Login with cryptographic identity
 */
Cypress.Commands.add('loginWithCryptoIdentity', (identityKey: string | 'generate') => {
  cy.log(`Logging in with ${identityKey === 'generate' ? 'new' : 'existing'} cryptographic identity`);
  
  cy.visit('/identity');
  
  if (identityKey === 'generate') {
    cy.get('[data-testid="generate-identity-button"]').click();
    cy.get('[data-testid="identity-generated-confirmation"]', { timeout: 10000 }).should('be.visible');
  } else {
    cy.get('[data-testid="import-identity-button"]').click();
    cy.get('[data-testid="identity-key-input"]').type(identityKey);
    cy.get('[data-testid="import-identity-submit"]').click();
  }
  
  // Verify identity is active
  cy.get('[data-testid="active-identity-indicator"]', { timeout: 10000 }).should('be.visible');
});

// Add cypress-file-upload commands
import 'cypress-file-upload';

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
 * @file secure-communication.spec.ts
 * @description End-to-end tests for secure P2P communication features. */

describe('Secure P2P Communication', () => {
  context('Room Creation and Security', () => {
    it('should create a secure room with encryption enabled', () => {
      // Create room with enhanced security
      cy.createSecureRoom('TestSecureRoom', 'enhanced');
      
      // Verify room was created with encryption
      cy.verifySecureConnection();
      
      // Verify security indicators
      cy.verifySecurityIndicators(['encryption', 'peer_verification', 'zero_trust']);
    });
    
    it('should enforce access controls with room password', () => {
      const roomName = 'PasswordProtectedRoom';
      const roomPassword = 'SecureP@ssw0rd!';
      
      // Visit home page and create password protected room
      cy.visit('/');
      cy.get('[data-testid="create-room-button"]').click();
      cy.get('[data-testid="room-name-input"]').type(roomName);
      cy.get('[data-testid="password-protected-checkbox"]').check();
      cy.get('[data-testid="room-password-input"]').type(roomPassword);
      cy.get('[data-testid="encryption-level-select"]').select('enhanced');
      cy.get('[data-testid="create-room-submit"]').click();
      
      // Get room ID from URL
      cy.url().then(url => {
        const roomId = url.split('/').pop() || '';
        
        // Open new browser/tab and try to join without password
        cy.visit('/');
        cy.visit(`/join/${roomId}`);
        
        // Should show password prompt
        cy.get('[data-testid="room-password-prompt"]').should('be.visible');
        
        // Try incorrect password
        cy.get('[data-testid="room-password-input"]').type('WrongPassword');
        cy.get('[data-testid="submit-password-button"]').click();
        
        // Should show error
        cy.get('[data-testid="password-error-message"]').should('be.visible');
        
        // Enter correct password
        cy.get('[data-testid="room-password-input"]').clear().type(roomPassword);
        cy.get('[data-testid="submit-password-button"]').click();
        
        // Should join room successfully
        cy.get('[data-testid="room-joined-success"]', { timeout: 10000 }).should('be.visible');
        cy.verifySecureConnection();
      });
    });
  });
  
  context('Encrypted Messaging', () => {
    beforeEach(() => {
      // Create a secure room and mock peer connections for testing
      cy.createSecureRoom('TestMessagingRoom', 'enhanced');
      cy.mockPeerConnections(2);
    });
    
    it('should send and receive encrypted messages', () => {
      const testMessage = 'This is a secure test message with special chars: !@#$%^&*()';
      
      // Send encrypted message
      cy.sendEncryptedMessage(testMessage);
      
      // Verify message has encryption indicator
      cy.get('[data-testid="message-encryption-indicator"]').last().should('be.visible');
      
      // Verify sent message is displayed correctly
      cy.verifyReceivedMessage(testMessage);
      
      // Mock received message from peer
      cy.window().then(win => {
        win.eval(`
          if (window.dispatchEvent) {
            const messageEvent = new CustomEvent('peerMessageReceived', {
              detail: {
                peerId: 'mock-peer-0',
                peerName: 'Mock User 0',
                message: 'Response from peer: Received your message',
                encrypted: true,
                timestamp: Date.now()
              }
            });
            window.dispatchEvent(messageEvent);
          }
        `);
      });
      
      // Verify received message from peer
      cy.verifyReceivedMessage('Response from peer: Received your message');
    });
    
    it('should handle special message types and formatting', () => {
      // Send message with markdown formatting
      cy.sendEncryptedMessage('**Bold text** and *italic text*');
      
      // Send message with code block
      cy.sendEncryptedMessage('```\nconst secureMsg = encrypt(message);\n```');
      
      // Send message with link
      cy.sendEncryptedMessage('Check out [P2Pigeon](https://p2pigeon.com)');
      
      // Verify markdown rendering if supported
      cy.get('[data-testid="message-content"]').should('exist');
    });
  });
  
  context('Media Communication', () => {
    beforeEach(() => {
      // Create room and setup mock WebRTC
      cy.createSecureRoom('MediaTestRoom');
      cy.mockPeerConnections(1);
    });
    
    it('should toggle camera and microphone', () => {
      // Toggle camera off
      cy.toggleMediaDevice('camera', false);
      
      // Toggle microphone off
      cy.toggleMediaDevice('microphone', false);
      
      // Verify devices are off
      cy.get('[data-testid="video-toggle-button"]')
        .should('have.attr', 'data-enabled', 'false');
      cy.get('[data-testid="audio-toggle-button"]')
        .should('have.attr', 'data-enabled', 'false');
      
      // Toggle camera back on
      cy.toggleMediaDevice('camera', true);
      
      // Toggle microphone back on
      cy.toggleMediaDevice('microphone', true);
      
      // Verify devices are on
      cy.get('[data-testid="video-toggle-button"]')
        .should('have.attr', 'data-enabled', 'true');
      cy.get('[data-testid="audio-toggle-button"]')
        .should('have.attr', 'data-enabled', 'true');
    });
    
    it('should handle peer video streams', () => {
      // Mock peer video streams
      cy.window().then(win => {
        win.eval(`
          if (window.mockPeerVideoStream) {
            window.mockPeerVideoStream('mock-peer-0', true);
          }
        `);
      });
      
      // Verify peer video container exists
      cy.get('[data-testid="peer-video-container"]').should('exist');
    });
  });
  
  context('Secure File Transfer', () => {
    beforeEach(() => {
      // Create room and mock peer connections
      cy.createSecureRoom('FileTransferRoom', 'maximum');
      cy.mockPeerConnections(1);
    });
    
    it('should securely transfer files with encryption', () => {
      const fileName = 'test-document.pdf';
      const fileSize = 1024 * 1024; // 1MB
      
      // Test file transfer
      cy.testSecureFileTransfer(fileName, fileSize);
      
      // Verify file received by peer (mocked)
      cy.window().then(win => {
        win.eval(`
          if (window.dispatchEvent) {
            const fileEvent = new CustomEvent('peerFileReceived', {
              detail: {
                peerId: 'mock-peer-0',
                peerName: 'Mock User 0',
                fileName: '${fileName}',
                fileSize: ${fileSize},
                fileId: 'mock-file-id',
                encrypted: true,
                timestamp: Date.now()
              }
            });
            window.dispatchEvent(fileEvent);
          }
        `);
      });
      
      // Verify file transfer success message
      cy.get('[data-testid="file-transfer-success"]').should('be.visible');
      cy.get('[data-testid="file-encryption-indicator"]').should('be.visible');
    });
  });
  
  context('Security and Identity', () => {
    it('should create and verify cryptographic identity', () => {
      // Generate new identity
      cy.loginWithCryptoIdentity('generate');
      
      // Verify identity is active and fingerprint is displayed
      cy.get('[data-testid="identity-fingerprint"]').should('be.visible');
      
      // Create secure room with this identity
      cy.createSecureRoom('IdentityVerificationRoom');
      
      // Mock incoming verification request
      cy.window().then(win => {
        win.eval(`
          if (window.dispatchEvent) {
            const verificationEvent = new CustomEvent('peerVerificationRequest', {
              detail: {
                peerId: 'mock-peer-0',
                peerName: 'Mock User 0',
                publicKey: 'mock-public-key-data',
                timestamp: Date.now()
              }
            });
            window.dispatchEvent(verificationEvent);
          }
        `);
      });
      
      // Accept verification request
      cy.get('[data-testid="verification-request-notification"]').should('be.visible');
      cy.get('[data-testid="accept-verification-button"]').click();
      
      // Verify peer is now verified
      cy.get('[data-testid="peer-verified-indicator"]').should('be.visible');
    });
  });
});

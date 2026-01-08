/// <reference types="cypress" />
import 'cypress-file-upload';

// Custom commands for P2Pigeon E2E testing

Cypress.Commands.add('createSecureRoom', (roomName: string, encryptionLevel = 'standard') => {
  cy.log(`Creating secure room: ${roomName}`);
  cy.visit('/');
  cy.get('[data-testid="create-room-button"]', { timeout: 10000 }).click();
  cy.get('[data-testid="room-name-input"]').type(roomName);
  if (encryptionLevel !== 'standard') {
    cy.get('[data-testid="encryption-level-select"]').select(encryptionLevel);
  }
  cy.get('[data-testid="create-room-submit"]').click();
});

Cypress.Commands.add('verifySecureConnection', () => {
  cy.get('[data-testid="encryption-status-indicator"]', { timeout: 10000 })
    .should('be.visible');
});

declare global {
  namespace Cypress {
    interface Chainable {
      createSecureRoom(roomName: string, encryptionLevel?: string): Chainable<void>;
      verifySecureConnection(): Chainable<void>;
    }
  }
}

/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main landing page heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Secure Peer-to-Peer Communication for Everyone/i);
  expect(headingElement).toBeInTheDocument();
});

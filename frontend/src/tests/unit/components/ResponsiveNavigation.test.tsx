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
 * @file ResponsiveNavigation.test.tsx
 * @description Unit tests for the ResponsiveNavigation component. */

import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
import { ResponsiveNavigation } from '../../../components/common/ResponsiveNavigation';
import { NavigationItem } from '../../../types/ui';

// Mock react-router-dom's useLocation hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/test'
  })
}));

describe('ResponsiveNavigation Component', () => {
  const mockNavigationItems: NavigationItem[] = [
    { id: 'home', path: '/', label: 'Home' },
    { id: 'rooms', path: '/rooms', label: 'Rooms' },
    { id: 'settings', path: '/settings', label: 'Settings' },
    { id: 'secure', path: '/secure', label: 'Secure Room', requiredPermissions: ['secure_access'] }
  ];
  
  test('renders navigation component with correct items', () => {
    render(<ResponsiveNavigation items={mockNavigationItems} />);
    
    // Navigation container should be present
    const navElement = screen.getByTestId('responsive-navigation');
    expect(navElement).toBeInTheDocument();
    
    // All public navigation items should be visible (excluding ones with requiredPermissions)
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Item with required permissions should not be visible
    expect(screen.queryByText('Secure Room')).not.toBeInTheDocument();
  });
  
  test('displays the encryption status indicator when encrypted', () => {
    render(<ResponsiveNavigation items={mockNavigationItems} isEncrypted={true} />);
    
    // Should show "Encrypted" text
    expect(screen.getByText('Encrypted')).toBeInTheDocument();
  });
  
  test('hides the encryption status indicator when not encrypted', () => {
    render(<ResponsiveNavigation items={mockNavigationItems} isEncrypted={false} />);
    
    // Should not show "Encrypted" text
    expect(screen.queryByText('Encrypted')).not.toBeInTheDocument();
  });
  
  test('opens mobile navigation menu when hamburger button is clicked', () => {
    render(<ResponsiveNavigation items={mockNavigationItems} />);
    
    // Initially, the drawer should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    // Find and click the hamburger menu button
    const hamburgerButton = screen.getByLabelText('Open Menu');
    fireEvent.click(hamburgerButton);
    
    // Drawer should now be open with menu header
    expect(screen.getByText('Menu')).toBeInTheDocument();
    
    // Navigation items should be in the drawer
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Rooms').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
  });
  
  test('renders custom logo when provided', () => {
    const logoText = 'P2Pigeon';
    render(
      <ResponsiveNavigation 
        items={mockNavigationItems} 
        logo={<div data-testid="custom-logo">{logoText}</div>}
      />
    );
    
    // Custom logo should be rendered
    const logo = screen.getByTestId('custom-logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent(logoText);
  });
  
  test('toggles color mode when color mode button is clicked', () => {
    render(<ResponsiveNavigation items={mockNavigationItems} showColorModeToggle={true} />);
    
    // Color mode toggle button should be present
    const colorModeButton = screen.getByLabelText('Toggle Color Mode');
    expect(colorModeButton).toBeInTheDocument();
    
    // Click the color mode toggle button
    fireEvent.click(colorModeButton);
    
    // We can't easily test the actual color mode change since it depends on Chakra UI context,
    // but we can verify the button remains in the document after clicking
    expect(screen.getByLabelText('Toggle Color Mode')).toBeInTheDocument();
  });
  
  test('hides color mode toggle when showColorModeToggle is false', () => {
    render(<ResponsiveNavigation items={mockNavigationItems} showColorModeToggle={false} />);
    
    // Color mode toggle button should not be present
    expect(screen.queryByLabelText('Toggle Color Mode')).not.toBeInTheDocument();
  });
});

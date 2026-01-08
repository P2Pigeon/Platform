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
 * @file SecureFileUpload.test.tsx
 * @description Unit tests for the SecureFileUpload component. */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { SecureFileUpload } from '../../../components/common/SecureFileUpload';
import userEvent from '@testing-library/user-event';

// Mock file data
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([], name, { type });
  Object.defineProperty(file, 'size', {
    get() {
      return size;
    }
  });
  return file;
};

describe('SecureFileUpload Component', () => {
  const mockOnFileSelected = jest.fn();
  
  beforeEach(() => {
    mockOnFileSelected.mockClear();
  });
  
  test('renders upload area with correct instructions', () => {
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        maxFileSize={10 * 1024 * 1024} // 10MB
      />
    );
    
    // Component container should be present
    expect(screen.getByTestId('secure-file-upload')).toBeInTheDocument();
    
    // Should display upload instructions
    expect(screen.getByText(/Drag and drop files here or click to browse/i)).toBeInTheDocument();
    
    // Should display file size limit
    expect(screen.getByText(/Maximum file size: 10 MB/i)).toBeInTheDocument();
    
    // Should display encryption notice by default
    expect(screen.getByText(/Files are encrypted before upload/i)).toBeInTheDocument();
  });
  
  test('shows file types when allowedTypes is provided', () => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        allowedTypes={allowedTypes}
      />
    );
    
    expect(screen.getByText(/of type: image\/jpeg, image\/png/i)).toBeInTheDocument();
  });
  
  test('handles single file upload correctly', async () => {
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        multiple={false}
      />
    );
    
    const inputElement = screen.getByTestId('file-input') as HTMLInputElement;
    const mockFile = createMockFile('test.jpg', 5 * 1024 * 1024, 'image/jpeg');
    
    // Simulate file selection
    userEvent.upload(inputElement, mockFile);
    
    // Wait for validation to complete
    await waitFor(() => {
      expect(mockOnFileSelected).toHaveBeenCalledTimes(1);
    });
    
    // Verify onFileSelected was called with the correct file
    expect(mockOnFileSelected).toHaveBeenCalledWith([mockFile]);
    
    // Should display the file name
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });
  
  test('rejects files larger than maxFileSize', async () => {
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        maxFileSize={maxFileSize}
      />
    );
    
    const inputElement = screen.getByTestId('file-input') as HTMLInputElement;
    const largeFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB
    
    // Simulate file selection
    userEvent.upload(inputElement, largeFile);
    
    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText(/exceeds the maximum file size/i)).toBeInTheDocument();
    });
    
    // onFileSelected should not be called for invalid files
    expect(mockOnFileSelected).not.toHaveBeenCalled();
  });
  
  test('rejects files with disallowed types', async () => {
    const allowedTypes = ['image/png'];
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        allowedTypes={allowedTypes}
      />
    );
    
    const inputElement = screen.getByTestId('file-input') as HTMLInputElement;
    const wrongTypeFile = createMockFile('doc.pdf', 1024 * 1024, 'application/pdf');
    
    // Simulate file selection
    userEvent.upload(inputElement, wrongTypeFile);
    
    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
    });
    
    // onFileSelected should not be called for invalid files
    expect(mockOnFileSelected).not.toHaveBeenCalled();
  });
  
  test('uses custom validation function when provided', async () => {
    const mockValidateFile = jest.fn().mockImplementation((file: File) => {
      return Promise.resolve({
        valid: file.name.startsWith('valid'),
        message: file.name.startsWith('valid') ? undefined : 'Custom validation failed'
      });
    });
    
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        validateFile={mockValidateFile}
      />
    );
    
    const inputElement = screen.getByTestId('file-input') as HTMLInputElement;
    
    // File that will pass custom validation
    const validFile = createMockFile('valid-file.jpg', 1024 * 1024, 'image/jpeg');
    
    // Simulate file selection
    userEvent.upload(inputElement, validFile);
    
    // Wait for validation to complete
    await waitFor(() => {
      expect(mockValidateFile).toHaveBeenCalledTimes(1);
      expect(mockOnFileSelected).toHaveBeenCalledWith([validFile]);
    });
    
    // Reset mocks for next test
    mockValidateFile.mockClear();
    mockOnFileSelected.mockClear();
    
    // File that will fail custom validation
    const invalidFile = createMockFile('invalid-file.jpg', 1024 * 1024, 'image/jpeg');
    
    // Simulate file selection
    userEvent.upload(inputElement, invalidFile);
    
    // Wait for validation to complete
    await waitFor(() => {
      expect(mockValidateFile).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Custom validation failed')).toBeInTheDocument();
    });
    
    // onFileSelected should not be called for invalid files
    expect(mockOnFileSelected).not.toHaveBeenCalled();
  });
  
  test('shows correct message for multiple file upload mode', () => {
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        multiple={true}
      />
    );
    
    expect(screen.getByText(/You can upload multiple files/i)).toBeInTheDocument();
  });
  
  test('shows correct message for single file upload mode', () => {
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        multiple={false}
      />
    );
    
    expect(screen.getByText(/You can upload one file/i)).toBeInTheDocument();
  });
  
  test('hides encryption notice when encryption is disabled', () => {
    render(
      <SecureFileUpload 
        onFileSelected={mockOnFileSelected}
        enableEncryption={false}
      />
    );
    
    expect(screen.queryByText(/Files are encrypted before upload/i)).not.toBeInTheDocument();
  });
});

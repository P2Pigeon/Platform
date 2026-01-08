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
 * @file PermissionPage.tsx
 * @description This component handles requests for camera and microphone permissions,
 * integrating with the central CommunicationContext for device management.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunication } from '../context/CommunicationContext';

const PermissionPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    audioInputs, 
    videoInputs 
  } = useCommunication();
  const [deviceError, setDeviceError] = React.useState<string | null>(null);

  const refreshDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setDeviceError(null);
    } catch (err) {
      setDeviceError('Failed to access camera/microphone. Please grant permissions.');
    }
  };

  // Effect to redirect user upon successful permission grant
  useEffect(() => {
    // If we have devices and there's no error, permissions are granted.
    if ((audioInputs.length > 0 || videoInputs.length > 0) && !deviceError) {
      navigate('/app');
    }
  }, [audioInputs, videoInputs, deviceError, navigate]);

  // Effect to request permissions on component mount if no devices are found
  useEffect(() => {
    if (audioInputs.length === 0 && videoInputs.length === 0) {
      refreshDevices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleRequestPermissions = async () => {
    // The refreshDevices function from useDeviceManager will trigger the permission prompt.
    await refreshDevices();
  };

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="p-8 border rounded-lg shadow-lg bg-white w-full max-w-md text-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl font-bold">Permissions Required</h1>
          <p>
            P2Pigeon needs access to your camera and microphone to function. 
            Please grant permission to continue.
          </p>
          {deviceError && (
            <p className="text-red-500" data-testid="permission-error-message">{deviceError}</p>
          )}
          <button onClick={handleRequestPermissions} className="w-full py-2 px-4 bg-cyan-500 text-white rounded hover:bg-cyan-600">
            Grant Permissions
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionPage;

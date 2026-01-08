/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';

export interface MediaDevices {
    audioIn: MediaDeviceInfo[];
    videoIn: MediaDeviceInfo[];
    audioOut: MediaDeviceInfo[];
}

export interface SelectedMediaDevices {
    audioInId: string | undefined;
    videoInId: string | undefined;
    audioOutId: string | undefined;
}

const useDeviceManager = (autoEnumerate: boolean = false) => {
    const [devices, setDevices] = useState<MediaDevices>({ audioIn: [], videoIn: [], audioOut: [] });
    const [selectedDevices, setSelectedDevices] = useLocalStorage<SelectedMediaDevices>('selected-media-devices', {
        audioInId: undefined,
        videoInId: undefined,
        audioOutId: undefined,
    });
    const [error, setError] = useState<string | null>(null);

    const getDevices = useCallback(async (requestPermissions: boolean = false) => {
        try {
            // Only request permissions if explicitly asked (e.g., in JoinRoomModal)
            // This prevents camera access on landing page
            if (requestPermissions) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                // Stop the stream immediately - we just needed permissions
                stream.getTracks().forEach(track => track.stop());
            }

            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const audioIn = allDevices.filter((device) => device.kind === 'audioinput');
            const videoIn = allDevices.filter((device) => device.kind === 'videoinput');
            const audioOut = allDevices.filter((device) => device.kind === 'audiooutput');

            setDevices({ audioIn, videoIn, audioOut });

            // Set default device if none is selected
            if (!selectedDevices.audioInId && audioIn.length > 0) {
                setSelectedDevices((prev) => ({ ...prev, audioInId: audioIn[0].deviceId }));
            }
            if (!selectedDevices.videoInId && videoIn.length > 0) {
                setSelectedDevices((prev) => ({ ...prev, videoInId: videoIn[0].deviceId }));
            }
            if (!selectedDevices.audioOutId && audioOut.length > 0) {
                setSelectedDevices((prev) => ({ ...prev, audioOutId: audioOut[0].deviceId }));
            }
        } catch (err) {
            console.error('Error enumerating devices:', err);
            setError('Could not access media devices. Please check your browser permissions.');
        }
    }, [selectedDevices.audioInId, selectedDevices.videoInId, selectedDevices.audioOutId, setSelectedDevices]);

    useEffect(() => {
        // Only auto-enumerate if explicitly enabled (disabled by default)
        if (autoEnumerate) {
            getDevices(false); // Don't request permissions on auto-enumerate
        }
        
        const handleDeviceChange = () => getDevices(false);
        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
        };
    }, [autoEnumerate, getDevices]);

    const selectAudioInput = (device: MediaDeviceInfo) => {
        setSelectedDevices((prev) => ({ ...prev, audioInId: device.deviceId }));
    };

    const selectVideoInput = (device: MediaDeviceInfo) => {
        setSelectedDevices((prev) => ({ ...prev, videoInId: device.deviceId }));
    };

    const selectAudioOutput = (device: MediaDeviceInfo) => {
        setSelectedDevices((prev) => ({ ...prev, audioOutId: device.deviceId }));
    };

    const selectedAudioInput = devices.audioIn.find(d => d.deviceId === selectedDevices.audioInId) || null;
    const selectedVideoInput = devices.videoIn.find(d => d.deviceId === selectedDevices.videoInId) || null;
    const selectedAudioOutput = devices.audioOut.find(d => d.deviceId === selectedDevices.audioOutId) || null;

    return { 
        audioInputs: devices.audioIn,
        videoInputs: devices.videoIn,
        audioOutputs: devices.audioOut,
        selectedAudioInput,
        selectedVideoInput,
        selectedAudioOutput,
        selectAudioInput,
        selectVideoInput,
        selectAudioOutput,
        error, 
        refreshDevices: getDevices 
    };
};

export default useDeviceManager;

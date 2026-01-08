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
 * @file DashboardPage.tsx
 * @description P2Pigeon dashboard with premium glassmorphism design
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowRight, LogIn, Database, MessageCircle, Shield, Loader2, AlertCircle, X, Clock } from 'lucide-react';
import meetingService from '../services/meetingService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

// Meeting state stored in sessionStorage after leaving a room
interface MeetingState {
  type: 'ended' | 'left';
  roomId: string;
  duration: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, publicIdentity } = useAuth();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingState, setMeetingState] = useState<MeetingState | null>(null);

  // Check for meeting state on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('meetingState');
    if (stored) {
      try {
        setMeetingState(JSON.parse(stored));
        sessionStorage.removeItem('meetingState');
      } catch (e) {
        sessionStorage.removeItem('meetingState');
      }
    }
  }, []);

  const closeMeetingModal = () => setMeetingState(null);
  
  const returnToCall = () => {
    if (meetingState?.roomId) {
      navigate(`/app/join/${meetingState.roomId}`);
    }
    setMeetingState(null);
  };

  const handleStartCall = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const roomId = meetingService.generateLocalRoomKey();
      // Mark this user as the host/creator of this room
      sessionStorage.setItem(`host_${roomId}`, 'true');
      navigate(`/app/join/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCall = () => {
    if (joinRoomId.trim()) {
      navigate(`/app/join/${joinRoomId.trim()}`);
    } else {
      setError('Please enter a room ID to join.');
    }
  };

  const welcomeMessage = status === 'guest' 
    ? 'Welcome, Guest' 
    : `Welcome back, ${publicIdentity?.displayName || 'User'}`;

  const mainActions = [
    {
      icon: Video,
      title: 'Start Meeting',
      description: 'Create a secure, encrypted video room instantly',
      gradient: 'from-pigeon-primary to-purple-500',
      onClick: handleStartCall,
      loading: isCreating,
    },
    {
      icon: MessageCircle,
      title: 'Nostr Chat',
      description: 'Decentralized messaging with E2E encryption',
      gradient: 'from-emerald-500 to-cyan-500',
      onClick: () => navigate('/app/chat'),
    },
    {
      icon: Database,
      title: 'Data Rooms',
      description: 'Collaborative encrypted file sharing',
      gradient: 'from-amber-500 to-orange-500',
      onClick: () => navigate('/app/files'),
    },
  ];


  return (
    <div className="min-h-full p-6 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-pigeon-text mb-2">{welcomeMessage}</h1>
          <p className="text-pigeon-text-secondary text-lg">What would you like to do today?</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-card p-4 border-pigeon-danger/50 flex items-center gap-3 animate-slide-down">
            <AlertCircle className="w-5 h-5 text-pigeon-danger flex-shrink-0" />
            <p className="text-pigeon-danger">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-pigeon-text-muted hover:text-pigeon-text">×</button>
          </div>
        )}

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {mainActions.map((action, i) => (
            <button
              key={action.title}
              onClick={action.onClick}
              disabled={action.loading}
              className="p-6 text-left group animate-slide-up disabled:opacity-70 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:shadow-glow transition-shadow duration-300`}>
                {action.loading ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <action.icon className="w-7 h-7 text-white" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-pigeon-text mb-2 group-hover:text-white transition-colors">
                {action.title}
              </h3>
              <p className="text-pigeon-text-secondary text-sm mb-4">{action.description}</p>
              <div className="flex items-center gap-2 text-pigeon-primary font-medium text-sm">
                <span>{action.loading ? 'Creating...' : 'Get started'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Join Section - Two Columns */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Join Meeting */}
          <div className="p-6 rounded-lg bg-gray-800 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-pigeon-text">Join Meeting</h3>
                <p className="text-pigeon-text-secondary text-sm">Enter a room ID to join</p>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Room ID (e.g., abc-def-123)"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinCall()}
                className="input-premium flex-1"
              />
              <Button onClick={handleJoinCall} size="sm">Join</Button>
            </div>
          </div>

          {/* Join Data Room */}
          <div className="p-6 rounded-lg bg-gray-800 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Database className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-pigeon-text">Join Data Room</h3>
                <p className="text-pigeon-text-secondary text-sm">Enter a drive key to access</p>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Drive key"
                className="input-premium flex-1"
              />
              <Button onClick={() => navigate('/app/files')} size="sm">Join</Button>
            </div>
          </div>
        </div>

        {/* Security Banner */}
        <div className="p-6 rounded-lg bg-gray-800 flex items-center gap-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="w-12 h-12 rounded-lg bg-pigeon-success/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-pigeon-success" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-pigeon-text mb-1">Your communications are protected</h3>
            <p className="text-pigeon-text-secondary text-sm">
              All video calls, messages, and file transfers are end to end encrypted. 
              Your private keys never leave your device.
            </p>
          </div>
          <div className="badge-success hidden md:flex">Encrypted</div>
        </div>
      </div>

      {/* Meeting Modal - shown after leaving/ending a meeting */}
      {meetingState && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl border border-gray-700 relative">
            {/* Close X button */}
            <button
              onClick={closeMeetingModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                meetingState.type === 'ended' ? 'bg-cyan-600/20' : 'bg-amber-600/20'
              }`}>
                {meetingState.type === 'ended' ? (
                  <Clock className="w-8 h-8 text-cyan-400" />
                ) : (
                  <Video className="w-8 h-8 text-amber-400" />
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">
                {meetingState.type === 'ended' ? 'Meeting has ended' : 'You have left the meeting'}
              </h2>
              
              {/* Time elapsed - only for ended meetings */}
              {meetingState.type === 'ended' && (
                <div className="bg-gray-900 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Time Elapsed</p>
                  <p className="text-2xl font-mono text-cyan-400 font-bold">{meetingState.duration}</p>
                </div>
              )}
              
              {/* Buttons */}
              <div className="flex flex-col gap-3 mt-4">
                {meetingState.type === 'left' && (
                  <button
                    onClick={returnToCall}
                    className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                  >
                    Return to Call
                  </button>
                )}
                <button
                  onClick={closeMeetingModal}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    meetingState.type === 'ended' 
                      ? 'bg-cyan-600 text-white hover:bg-cyan-700' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

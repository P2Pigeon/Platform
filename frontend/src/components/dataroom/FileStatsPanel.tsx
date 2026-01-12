/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 */

import React, { useState, useEffect } from 'react';
import { X, Eye, Download, BarChart3, Users, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { FileStats, getRoomFileStats } from '../../services/dataroom/DataRoomAPI';

interface FileStatsPanelProps {
  roomId: string;
  isNdaRoom: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const FileStatsPanel: React.FC<FileStatsPanelProps> = ({ roomId, isNdaRoom, isOpen, onClose }) => {
  const [stats, setStats] = useState<FileStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fileStats = await getRoomFileStats(roomId);
        setStats(fileStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [isOpen, roomId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const totalViews = stats.reduce((sum, s) => sum + s.totalViews, 0);
  const totalDownloads = stats.reduce((sum, s) => sum + s.totalDownloads, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">File Statistics</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.length}</p>
              <p className="text-sm text-gray-400">Total Files</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{totalViews}</p>
              <p className="text-sm text-gray-400">Total Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{totalDownloads}</p>
              <p className="text-sm text-gray-400">Total Downloads</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              <p className="mt-2 text-gray-400">Loading statistics...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No file statistics available yet</div>
          ) : (
            <div className="space-y-3">
              {stats.map(fileStat => (
                <div key={fileStat.fileId} className="bg-gray-900 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFile(expandedFile === fileStat.fileId ? null : fileStat.fileId)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium truncate">{fileStat.fileName}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-sm text-cyan-400">
                          <Eye className="w-4 h-4" />
                          {fileStat.totalViews} views
                        </span>
                        <span className="flex items-center gap-1 text-sm text-green-400">
                          <Download className="w-4 h-4" />
                          {fileStat.totalDownloads} downloads
                        </span>
                      </div>
                    </div>
                    {isNdaRoom && fileStat.userStats && fileStat.userStats.length > 0 && (
                      expandedFile === fileStat.fileId ? 
                        <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isNdaRoom && expandedFile === fileStat.fileId && fileStat.userStats && (
                    <div className="border-t border-gray-700 p-4 bg-gray-800/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-orange-400" />
                        <h4 className="text-sm font-semibold text-orange-400">Per-User Statistics (NDA Tracking)</h4>
                      </div>
                      
                      {fileStat.userStats.length === 0 ? (
                        <p className="text-sm text-gray-500">No user activity recorded yet</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 font-medium pb-2 border-b border-gray-700">
                            <span>User</span>
                            <span className="text-center">Views</span>
                            <span className="text-center">Downloads</span>
                            <span className="text-center">Last Viewed</span>
                            <span className="text-center">Last Downloaded</span>
                          </div>
                          {fileStat.userStats.map(userStat => (
                            <div key={userStat.userId} className="grid grid-cols-5 gap-2 text-sm py-2 border-b border-gray-700/50 last:border-0">
                              <span className="text-white truncate" title={userStat.userId}>
                                {userStat.userName || userStat.userId.slice(0, 8) + '...'}
                              </span>
                              <span className="text-center text-cyan-400">{userStat.viewCount}</span>
                              <span className="text-center text-green-400">{userStat.downloadCount}</span>
                              <span className="text-center text-gray-400 text-xs flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" />
                                {userStat.lastViewedAt ? new Date(userStat.lastViewedAt).toLocaleDateString() : '-'}
                              </span>
                              <span className="text-center text-gray-400 text-xs flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" />
                                {userStat.lastDownloadedAt ? new Date(userStat.lastDownloadedAt).toLocaleDateString() : '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <p className="text-xs text-gray-500 text-center">
            {isNdaRoom 
              ? 'NDA room: Detailed per-user tracking enabled. Click a file to see individual user statistics.'
              : 'Standard room: Aggregate statistics only. Upgrade to NDA room for per-user tracking.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileStatsPanel;

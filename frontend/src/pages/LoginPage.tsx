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
 * @file LoginPage.tsx
 * @description ARQON-styled login page
 */

import React, { useState } from 'react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging in with:', { username, password });
  };

  return (
    <div className="min-h-screen bg-arqon-bg flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="arqon-card w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-arqon-text text-center">Login</h1>
        
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-arqon-text">
            Username
          </label>
          <input
            id="username"
            type="text"
            className="arqon-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-arqon-text">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="arqon-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" className="arqon-btn-primary w-full">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

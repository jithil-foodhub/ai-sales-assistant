'use client';

import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
      isConnected 
        ? 'bg-success-100 text-success-700' 
        : 'bg-danger-100 text-danger-700'
    }`}>
      {isConnected ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span>
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

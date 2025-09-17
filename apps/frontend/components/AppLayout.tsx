"use client";

import React, { useState, useEffect } from "react";
import { ClassicSidebar } from "./ClassicSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  currentScreen?: string;
  onScreenChange?: (screen: string) => void;
}

export function AppLayout({ children, currentScreen = "home", onScreenChange }: AppLayoutProps) {
  const [clientCount, setClientCount] = useState(0);
  const [clientStats, setClientStats] = useState<any>(null);

  // Fetch client stats
  useEffect(() => {
    const fetchClientStats = async () => {
      try {
        const response = await fetch('/api/clients/stats');
        const data = await response.json();
        if (data.success) {
          setClientStats(data.data);
          setClientCount(data.data.totalClients || 0);
        }
      } catch (error) {
        console.error('Error fetching client stats:', error);
      }
    };

    fetchClientStats();
  }, []);

  const handleScreenChange = (screen: string) => {
    if (onScreenChange) {
      onScreenChange(screen);
    } else {
      // Default navigation behavior
      if (screen === "home") {
        window.location.href = "/dashboard";
      } else if (screen === "clients") {
        window.location.href = "/clients";
      } else if (screen === "analytics") {
        window.location.href = "/analytics";
      } else if (screen === "settings") {
        window.location.href = "/settings";
      } else if (screen === "ai-suggestions") {
        window.location.href = "/ai-suggestions";
      }
    }
  };

  const handleAddClient = () => {
    window.location.href = "/clients";
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <ClassicSidebar
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
        onAddClient={handleAddClient}
        clientCount={clientCount}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

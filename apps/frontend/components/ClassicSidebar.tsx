'use client';

import React from 'react';
import { 
  Users, 
  Home,
  BarChart3,
  ChevronRight,
  Plus,
  Building2
} from 'lucide-react';

interface ClassicSidebarProps {
  currentScreen: string;
  onScreenChange: (screen: string) => void;
  onAddClient: () => void;
  clientCount?: number;
}

export function ClassicSidebar({ 
  currentScreen, 
  onScreenChange, 
  onAddClient,
  clientCount = 0 
}: ClassicSidebarProps) {
  const menuItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview and analytics'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      description: 'Manage client relationships',
      count: clientCount
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Call performance insights'
    }
  ];

  return (
    <div className="w-72 bg-slate-900 text-white h-screen flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-8 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">FoodHub AI</h1>
            <p className="text-sm text-slate-400">Sales Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  isActive ? 'bg-white/20' : 'bg-slate-700 group-hover:bg-slate-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className="text-xs text-slate-400 group-hover:text-slate-300">
                    {item.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {item.count !== undefined && (
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full font-medium">
                    {item.count}
                  </span>
                )}
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Add Client Button */}
      <div className="p-6 border-t border-slate-700">
        <button
          onClick={onAddClient}
          className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <div className="p-2 bg-white/20 rounded-lg">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-semibold">Add New Client</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-700">
        <div className="text-xs text-slate-400 text-center">
          <div className="font-medium">FoodHub AI Sales Assistant</div>
          <div className="mt-1">v1.0.0 • Professional Edition</div>
        </div>
      </div>
    </div>
  );
}
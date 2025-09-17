"use client";

import React, { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Key,
  Save,
  RefreshCw,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    soundAlerts: false,
    autoSave: true,
    theme: "light",
    language: "en",
    timezone: "UTC",
  });

  const handleSave = () => {
    console.log("Saving settings:", settings);
    // Here you would typically save to backend
  };

  return (
    <AppLayout currentScreen="settings">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
            <p className="text-xl text-slate-600">
              Manage your application preferences and configuration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                <button className="w-full flex items-center px-4 py-3 text-left text-slate-700 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">
                  <User className="w-5 h-5 mr-3" />
                  Profile Settings
                </button>
                <button className="w-full flex items-center px-4 py-3 text-left text-slate-700 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">
                  <Bell className="w-5 h-5 mr-3" />
                  Notifications
                </button>
                <button className="w-full flex items-center px-4 py-3 text-left text-slate-700 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">
                  <Shield className="w-5 h-5 mr-3" />
                  Security
                </button>
                <button className="w-full flex items-center px-4 py-3 text-left text-slate-700 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">
                  <Database className="w-5 h-5 mr-3" />
                  Data Management
                </button>
                <button className="w-full flex items-center px-4 py-3 text-left text-slate-700 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">
                  <Key className="w-5 h-5 mr-3" />
                  API Keys
                </button>
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                  Notification Preferences
                </h2>

                <div className="space-y-6">
                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">
                        Push Notifications
                      </h3>
                      <p className="text-sm text-slate-600">
                        Receive real-time notifications for new calls and
                        transcripts
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Email Alerts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">
                        Email Alerts
                      </h3>
                      <p className="text-sm text-slate-600">
                        Get email notifications for important events
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailAlerts}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            emailAlerts: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Sound Alerts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">
                        Sound Alerts
                      </h3>
                      <p className="text-sm text-slate-600">
                        Play sounds for incoming calls and messages
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.soundAlerts}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            soundAlerts: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Auto Save */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">
                        Auto Save
                      </h3>
                      <p className="text-sm text-slate-600">
                        Automatically save changes and transcripts
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            autoSave: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Theme Selection */}
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-3">
                      Theme
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() =>
                          setSettings({ ...settings, theme: "light" })
                        }
                        className={`p-4 rounded-lg border-2 ${
                          settings.theme === "light"
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="w-full h-8 bg-white rounded border mb-2"></div>
                        <span className="text-sm font-medium">Light</span>
                      </button>
                      <button
                        onClick={() =>
                          setSettings({ ...settings, theme: "dark" })
                        }
                        className={`p-4 rounded-lg border-2 ${
                          settings.theme === "dark"
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="w-full h-8 bg-slate-800 rounded border mb-2"></div>
                        <span className="text-sm font-medium">Dark</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset to Defaults
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientDashboard } from "@/components/ClientDashboard";
import { ClassicSidebar } from "@/components/ClassicSidebar";
import { TrendingUp, Users, Clock, BarChart3, Phone } from "lucide-react";

type Screen = "home" | "clients" | "analytics";

export default function Home() {
  const router = useRouter();
  const [agentId, setAgentId] = useState<string>("");
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientCount, setClientCount] = useState(0);
  const [clientStats, setClientStats] = useState<any>(null);

  // Fetch client count and stats for sidebar
  useEffect(() => {
    const fetchClientStats = async () => {
      try {
        const response = await fetch("/api/clients/stats");
        const data = await response.json();
        if (data.success) {
          setClientStats(data.data);
          setClientCount(data.data.totalClients);
        }
      } catch (error) {
        console.error("Error fetching client stats:", error);
      }
    };
    fetchClientStats();
    const interval = setInterval(fetchClientStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    ws.onopen = () => {
      console.log('🔌 Connected to WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message);
        
        // Handle call status updates
        if (message.type === 'call_status_update') {
          console.log(`📞 Call Update: ${message.status} from ${message.from}`);
          
          // Auto-redirect to AI suggestion screen when call starts
          if (message.status === 'ringing' || message.status === 'in-progress') {
            // Find or create client for this phone number
            handleIncomingCall(message.from, message.callSid);
          }
        }
        
        // Handle transcript processing
        if (message.type === 'call_transcript_processed') {
          console.log(`📄 Transcript processed for call: ${message.callRecord.id}`);
          console.log(`💡 AI Suggestions:`, message.callRecord.aiSuggestions);
          
          // Update selected client if it matches
          if (selectedClient && selectedClient.phoneNumber === message.callRecord.phoneNumber) {
            setSelectedClient({
              ...selectedClient,
              lastCallDate: message.callRecord.timestamp,
              mood: message.callRecord.mood,
              sentiment: message.callRecord.sentiment
            });
          }
        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, [selectedClient]);

  const handleIncomingCall = async (phoneNumber: string, callSid: string) => {
    try {
      // Try to find existing client
      const response = await fetch(`/api/clients?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();
      
      let client = null;
      if (data.success && data.data.length > 0) {
        client = data.data[0];
      } else {
        // Create new client
        const createResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            status: 'prospect',
            notes: `Auto-created from incoming call ${callSid}`
          })
        });
        const createData = await createResponse.json();
        if (createData.success) {
          client = createData.data;
        }
      }
      
      if (client) {
        setSelectedClient(client);
        setCurrentScreen('clients');
        console.log(`🎯 Auto-redirected to clients screen for client: ${client.phoneNumber}`);
      }
    } catch (error) {
      console.error('Error handling incoming call:', error);
    }
  };

  const handleStartSession = () => {
    if (agentId.trim()) {
      router.push(`/agent/${agentId}`);
    } else {
      // Generate a random agent ID for demo
      const randomId = `agent-${Math.random().toString(36).substr(2, 9)}`;
      router.push(`/agent/${randomId}`);
    }
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setCurrentScreen("clients");
  };

  const handleAddClient = () => {
    setCurrentScreen("clients");
  };

  const handleScreenChange = (screen: Screen) => {
    setCurrentScreen(screen);
    
    // Navigate to specific routes for certain screens
    if (screen === "home") {
      window.location.href = "/dashboard";
    } else if (screen === "clients") {
      window.location.href = "/clients";
    } else if (screen === "analytics") {
      window.location.href = "/analytics";
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "clients":
        return <ClientDashboard onClientSelect={handleClientSelect} />;
      default:
        return renderHomeScreen();
    }
  };

  const renderHomeScreen = () => (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
      {/* Welcome Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Welcome to FoodHub AI
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl leading-relaxed">
          Your intelligent sales assistant for restaurant technology solutions.
          Manage clients, track interactions, and get AI-powered insights to
          close more deals.
        </p>
      </div>

      {/* Stats Overview */}
      {clientStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Clients
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {clientStats.totalClients}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Active Prospects
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {clientStats.prospects}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Converted</p>
                <p className="text-3xl font-bold text-slate-900">
                  {clientStats.converted}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Positive Mood
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {clientStats.moodDistribution?.positive || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 ml-4">
              Client Management
            </h3>
          </div>
          <p className="text-slate-600 mb-6 leading-relaxed">
            View and manage all your clients, track their status, mood, and
            complete call history.
          </p>
          <button
            onClick={() => setCurrentScreen("clients")}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            Manage Clients
          </button>
        </div>


        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Phone className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 ml-4">
              Agent Session
            </h3>
          </div>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Start a live agent session to receive real-time AI suggestions
            during calls.
          </p>
          <button
            onClick={handleStartSession}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            Start Session
          </button>
        </div>
      </div>

    </div>
  );


  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <ClassicSidebar
        currentScreen={currentScreen}
        onScreenChange={(screen: string) => handleScreenChange(screen as Screen)}
        onAddClient={handleAddClient}
        clientCount={clientCount}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

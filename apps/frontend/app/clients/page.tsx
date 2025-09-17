"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Phone, Search, Plus, Calendar, MessageSquare, Trash2, AlertTriangle, Building2, MapPin, Target, Zap } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { EnhancedClientForm } from "./enhanced-form";

interface Client {
  _id: string;
  phoneNumber: string;
  status: string;
  notes: string;
  createdAt: string;
  lastCallDate?: string;
  mood?: string;
  sentiment?: number;
  // Enhanced fields
  name?: string;
  email?: string;
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    cuisineType?: string;
    establishmentSize?: string;
    yearsInBusiness?: number;
    monthlyRevenue?: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  currentSolutions?: {
    hasExistingPOS?: boolean;
    posProvider?: string;
    hasKiosk?: boolean;
    hasNativeApp?: boolean;
    hasWebsite?: boolean;
    hasDeliveryIntegration?: boolean;
    hasOnlineOrdering?: boolean;
  };
  requirements?: {
    primaryGoals?: string[];
    painPoints?: string[];
    budgetRange?: string;
    timeline?: string;
    preferredContactMethod?: string;
  };
  competitiveInfo?: {
    isReceivingCompetitorCalls?: boolean;
    competitorNames?: string[];
  };
  leadQuality?: {
    leadScore?: number;
    leadSource?: string;
    isHotLead?: boolean;
    engagementLevel?: string;
    conversionProbability?: string;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    phoneNumber: "",
    status: "prospect",
    notes: "",
    name: "",
    email: "",
    // Enhanced fields
    businessInfo: {
      businessName: "",
      businessType: "",
      cuisineType: "",
      establishmentSize: "",
      yearsInBusiness: 0,
      monthlyRevenue: ""
    },
    location: {
      country: "",
      region: "",
      city: ""
    },
    currentSolutions: {
      hasExistingPOS: false,
      posProvider: "",
      hasKiosk: false,
      hasNativeApp: false,
      hasWebsite: false,
      hasDeliveryIntegration: false,
      hasOnlineOrdering: false
    },
    requirements: {
      primaryGoals: [] as string[],
      painPoints: [] as string[],
      budgetRange: "",
      timeline: "",
      preferredContactMethod: ""
    },
    competitiveInfo: {
      isReceivingCompetitorCalls: false,
      competitorNames: [] as string[]
    },
    leadQuality: {
      leadScore: 5,
      leadSource: "",
      isHotLead: false,
      engagementLevel: "",
      conversionProbability: ""
    }
  });
  const [showClearModal, setShowClearModal] = useState(false);
  const [clientToClear, setClientToClear] = useState<Client | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'business' | 'solutions' | 'requirements' | 'competitive' | 'quality'>('basic');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      
      const data = await response.json();
      if (data.success) {
        setClients([...clients, data.data]);
        setNewClient({
          phoneNumber: "",
          status: "prospect",
          notes: "",
          name: "",
          email: "",
          businessInfo: {
            businessName: "",
            businessType: "",
            cuisineType: "",
            establishmentSize: "",
            yearsInBusiness: 0,
            monthlyRevenue: ""
          },
          location: {
            country: "",
            region: "",
            city: ""
          },
          currentSolutions: {
            hasExistingPOS: false,
            posProvider: "",
            hasKiosk: false,
            hasNativeApp: false,
            hasWebsite: false,
            hasDeliveryIntegration: false,
            hasOnlineOrdering: false
          },
          requirements: {
            primaryGoals: [],
            painPoints: [],
            budgetRange: "",
            timeline: "",
            preferredContactMethod: ""
          },
          competitiveInfo: {
            isReceivingCompetitorCalls: false,
            competitorNames: []
          },
          leadQuality: {
            leadScore: 5,
            leadSource: "",
            isHotLead: false,
            engagementLevel: "",
            conversionProbability: ""
          }
        });
        setActiveTab('basic');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleArrayInput = (field: string, value: string, action: 'add' | 'remove') => {
    const [parent, child] = field.split('.');
    setNewClient(prev => {
      const parentObj = prev[parent as keyof typeof prev] as any;
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [child]: action === 'add' 
            ? [...(parentObj[child] || []), value]
            : (parentObj[child] || []).filter((item: string) => item !== value)
        }
      };
    });
  };

  const handleEditArrayInput = (field: string, value: string, action: 'add' | 'remove') => {
    const [parent, child] = field.split('.');
    setEditingClient(prev => {
      if (!prev) return prev;
      const parentObj = prev[parent as keyof typeof prev] as any;
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [child]: action === 'add' 
            ? [...(parentObj[child] || []), value]
            : (parentObj[child] || []).filter((item: string) => item !== value)
        }
      };
    });
  };

  const handleClientClick = (client: Client) => {
    router.push(`/clients/${client._id}`);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient({
      ...client,
      // Ensure all enhanced fields are present with defaults
      businessInfo: {
        businessName: "",
        businessType: "",
        cuisineType: "",
        establishmentSize: "",
        yearsInBusiness: 0,
        monthlyRevenue: "",
        ...client.businessInfo
      },
      location: {
        country: "",
        region: "",
        city: "",
        ...client.location
      },
      currentSolutions: {
        hasExistingPOS: false,
        posProvider: "",
        hasKiosk: false,
        hasNativeApp: false,
        hasWebsite: false,
        hasDeliveryIntegration: false,
        hasOnlineOrdering: false,
        ...client.currentSolutions
      },
      requirements: {
        primaryGoals: [],
        painPoints: [],
        budgetRange: "",
        timeline: "",
        preferredContactMethod: "",
        ...client.requirements
      },
      competitiveInfo: {
        isReceivingCompetitorCalls: false,
        competitorNames: [],
        ...client.competitiveInfo
      },
      leadQuality: {
        leadScore: 5,
        leadSource: "",
        isHotLead: false,
        engagementLevel: "",
        conversionProbability: "",
        ...client.leadQuality
      }
    });
    setShowEditModal(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      console.log('Updating client with data:', editingClient);
      const response = await fetch(`/api/clients/${editingClient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient)
      });
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        setClients(clients.map(client => 
          client._id === editingClient._id ? editingClient : client
        ));
        setShowEditModal(false);
        setEditingClient(null);
        setActiveTab('basic');
        console.log('Client updated successfully');
      } else {
        console.error('Update failed:', data.error);
        alert('Failed to update client: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error updating client: ' + error);
    }
  };

  const handleClearData = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setClientToClear(client);
    setShowClearModal(true);
  };

  const confirmClearData = async () => {
    if (!clientToClear) return;
    
    try {
      setIsClearing(true);
      const response = await fetch(`/api/clients/${clientToClear._id}/clear-data`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove client from list
        setClients(prev => prev.filter(c => c._id !== clientToClear._id));
        setShowClearModal(false);
        setClientToClear(null);
        alert('Client data cleared successfully');
      } else {
        alert(data.error || 'Failed to clear client data');
      }
    } catch (error) {
      console.error('Error clearing client data:', error);
      alert('Error clearing client data');
    } finally {
      setIsClearing(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.phoneNumber.includes(searchTerm) ||
    client.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-yellow-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout currentScreen="clients">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="mb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 header-title">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Client Portfolio
                    </h1>
                    <p className="text-lg text-slate-600 font-medium">
                      {filteredClients.length} active relationships
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center add-client-btn"
              >
                <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                <Plus className="w-5 h-5 mr-2 relative z-10" />
                <span className="font-semibold relative z-10">New Client</span>
              </button>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="mb-8 search-bar">
            <div className="relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by phone, status, business name, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all duration-200 text-slate-900"
              />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Clients', value: filteredClients.length, color: 'from-blue-500 to-blue-600', icon: Users },
              { label: 'Active Prospects', value: filteredClients.filter(c => c.status === 'prospect').length, color: 'from-yellow-500 to-orange-500', icon: Target },
              { label: 'Customers', value: filteredClients.filter(c => c.status === 'customer').length, color: 'from-green-500 to-emerald-600', icon: Building2 },
              { label: 'Hot Leads', value: filteredClients.filter(c => c.leadQuality?.isHotLead).length, color: 'from-red-500 to-pink-600', icon: Zap }
            ].map((stat, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/40 shadow-sm hover:shadow-md transition-all duration-200 stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Clients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClients.map((client, index) => (
              <div
                key={client._id}
                className="group bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-xl border border-slate-200/40 hover:border-slate-300/60 p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer client-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Client Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 client-avatar">
                        <Phone className="w-7 h-7 text-white" />
                      </div>
                      {client.leadQuality?.isHotLead && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg truncate">
                        {client.businessInfo?.businessName || client.name || client.phoneNumber}
                      </h3>
                      <p className="text-slate-600 font-medium">
                        {client.phoneNumber}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(client.status)}`}>
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </span>
                        {client.location?.country && (
                          <span className="inline-flex items-center text-xs text-slate-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {client.location.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Info Cards */}
                <div className="space-y-3 mb-6">
                  <div className="bg-slate-50/80 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Last Contact</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {client.lastCallDate 
                            ? new Date(client.lastCallDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'No contact'
                          }
                        </p>
                      </div>
                      {client.mood && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Sentiment</p>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              client.mood === 'positive' ? 'bg-green-500' :
                              client.mood === 'neutral' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm font-semibold ${getMoodColor(client.mood)}`}>
                              {client.mood}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Info */}
                  {(client.businessInfo?.businessType || client.businessInfo?.cuisineType) && (
                    <div className="bg-blue-50/50 rounded-xl p-4">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Business Profile</p>
                      <div className="space-y-1">
                        {client.businessInfo?.businessType && (
                          <p className="text-sm text-slate-900 font-medium">{client.businessInfo.businessType}</p>
                        )}
                        {client.businessInfo?.cuisineType && (
                          <p className="text-sm text-slate-600">{client.businessInfo.cuisineType}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Preview */}
                {client.notes && (
                  <div className="mb-6">
                    <p className="text-sm text-slate-600 line-clamp-2 italic bg-slate-50/50 rounded-lg p-3 border-l-4 border-blue-200">
                      "{client.notes}"
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                  <div className="flex items-center text-xs text-slate-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Added {new Date(client.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditClient(client); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Edit client"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleClearData(client, e); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Clear data"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleClientClick(client)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Empty State */}
          {filteredClients.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {searchTerm ? 'No matching clients found' : 'Your client portfolio awaits'}
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  {searchTerm 
                    ? 'Try refining your search terms or browse all clients to find what you\'re looking for.' 
                    : 'Start building meaningful relationships by adding your first client to the portfolio.'
                  }
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 font-semibold"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Client
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Enhanced Add Client Modal */}
        {showAddModal && (
          <EnhancedClientForm
            newClient={newClient}
            setNewClient={setNewClient}
            handleAddClient={handleAddClient}
            setShowAddModal={setShowAddModal}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleArrayInput={handleArrayInput}
          />
        )}

        {/* Enhanced Edit Client Modal */}
        {showEditModal && editingClient && (
          <EnhancedClientForm
            newClient={editingClient}
            setNewClient={setEditingClient}
            handleAddClient={handleUpdateClient}
            setShowAddModal={setShowEditModal}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleArrayInput={handleEditArrayInput}
            isEditMode={true}
          />
        )}

        {/* Enhanced Clear Data Confirmation Modal */}
        {showClearModal && clientToClear && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200/50">
              <div className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl shadow-inner">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      Clear Client Data
                    </h3>
                    <p className="text-sm text-slate-600 font-medium">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                
                <div className="mb-8">
                  <p className="text-slate-700 mb-4 leading-relaxed">
                    Are you sure you want to permanently remove all data for{' '}
                    <span className="font-bold text-slate-900">
                      {clientToClear.businessInfo?.businessName || clientToClear.name || clientToClear.phoneNumber}
                    </span>?
                  </p>
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/60 rounded-2xl p-4">
                    <p className="text-sm text-red-800 font-semibold mb-3">This will permanently delete:</p>
                    <ul className="text-sm text-red-700 space-y-2">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span>All call records and transcripts</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span>AI suggestions and analysis</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span>Client preferences and website data</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span>All metrics and analytics</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowClearModal(false);
                      setClientToClear(null);
                    }}
                    className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 font-semibold"
                    disabled={isClearing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClearData}
                    disabled={isClearing}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                  >
                    {isClearing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        <span>Clearing...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  User, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';

interface Client {
  _id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  company?: string;
  lastCallDate?: string;
  totalCalls: number;
  status: 'active' | 'inactive' | 'prospect' | 'converted';
  mood: 'positive' | 'neutral' | 'negative' | 'unknown';
  lastInteraction?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CallRecord {
  _id: string;
  clientId: string;
  phoneNumber: string;
  timestamp: string;
  duration: number;
  transcript: string;
  mood: 'positive' | 'neutral' | 'negative';
  sentiment: number;
  direction: 'inbound' | 'outbound';
  outcome: 'successful' | 'follow_up' | 'no_answer' | 'busy' | 'declined';
  aiSuggestions: any[];
  metadata?: any;
}

interface ClientDashboardProps {
  onClientSelect?: (client: Client) => void;
}

export function ClientDashboard({ onClientSelect }: ClientDashboardProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<any>(null);
  const [newClient, setNewClient] = useState({
    phoneNumber: '',
    name: '',
    email: '',
    company: '',
    notes: ''
  });

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch client stats
  const fetchClientStats = async () => {
    try {
      const response = await fetch('/api/clients/stats');
      const data = await response.json();
      
      if (data.success) {
        setClientStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching client stats:', error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchClientStats();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.phoneNumber.includes(searchTerm) || 
                         client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.lastInteraction?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesMood = moodFilter === 'all' || client.mood === moodFilter;
    
    return matchesSearch && matchesStatus && matchesMood;
  });

  const handleAddClient = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      const data = await response.json();
      
      if (data.success) {
        setClients(prev => [data.data, ...prev]);
        setNewClient({
          phoneNumber: '',
          name: '',
          email: '',
          company: '',
          notes: ''
        });
        setShowAddClient(false);
        fetchClientStats(); // Refresh stats
      } else {
        alert(data.error || 'Failed to add client');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setClients(prev => prev.filter(client => client._id !== clientId));
        fetchClientStats(); // Refresh stats
      } else {
        alert(data.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Client Management</h1>
            <p className="text-xl text-slate-600">Manage your client relationships and call history</p>
          </div>
          <button
            onClick={() => setShowAddClient(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add Client
          </button>
        </div>

        {/* Stats Cards */}
        {clientStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Clients</p>
                  <p className="text-3xl font-bold text-slate-900">{clientStats.totalClients}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Prospects</p>
                  <p className="text-3xl font-bold text-slate-900">{clientStats.prospects}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Converted</p>
                  <p className="text-3xl font-bold text-slate-900">{clientStats.converted}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Positive Mood</p>
                  <p className="text-3xl font-bold text-slate-900">{clientStats.moodDistribution?.positive || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clients by phone, name, company, or interaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            >
              <option value="all">All Status</option>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="converted">Converted</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            >
              <option value="all">All Moods</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mood</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Call</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Calls</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Interaction</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {client.phoneNumber}
                        </div>
                        {client.company && (
                          <div className="text-xs text-gray-400">{client.company}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getMoodIcon(client.mood)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{client.mood}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.lastCallDate ? formatDate(client.lastCallDate) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.totalCalls}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {client.lastInteraction || 'No interactions'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onClientSelect?.(client)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newClient.phoneNumber}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1-555-0123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Client Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={newClient.company}
                  onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newClient.notes}
                  onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddClient(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

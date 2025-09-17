'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Phone, MessageSquare, Clock, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, User, Search, Filter } from 'lucide-react';

interface Customer {
  id: string;
  phoneNumber: string;
  name?: string;
  lastCallDate: string;
  totalCalls: number;
  status: 'active' | 'inactive' | 'prospect' | 'converted';
  mood: 'positive' | 'neutral' | 'negative' | 'unknown';
  lastInteraction: string;
  callHistory: CallRecord[];
  notes?: string;
}

interface CallRecord {
  id: string;
  timestamp: string;
  duration: number;
  transcript: string;
  mood: 'positive' | 'neutral' | 'negative';
  sentiment: number; // -1 to 1
  aiSuggestions: any[];
  outcome: 'successful' | 'follow_up' | 'no_answer' | 'busy' | 'declined';
  direction: 'inbound' | 'outbound';
}

interface CustomerDashboardProps {
  onCustomerSelect?: (customer: Customer) => void;
}

export function CustomerDashboard({ onCustomerSelect }: CustomerDashboardProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        phoneNumber: '+1-555-0123',
        name: 'John Smith',
        lastCallDate: '2025-01-08T10:30:00Z',
        totalCalls: 3,
        status: 'prospect',
        mood: 'positive',
        lastInteraction: 'Interested in POS system',
        callHistory: [
          {
            id: 'call-1',
            timestamp: '2025-01-08T10:30:00Z',
            duration: 450,
            transcript: 'Customer called asking about POS systems for their restaurant...',
            mood: 'positive',
            sentiment: 0.7,
            aiSuggestions: [],
            outcome: 'follow_up',
            direction: 'inbound'
          }
        ],
        notes: 'Very interested in Fusion EPOS system'
      },
      {
        id: '2',
        phoneNumber: '+1-555-0456',
        name: 'Sarah Johnson',
        lastCallDate: '2025-01-07T14:15:00Z',
        totalCalls: 1,
        status: 'active',
        mood: 'neutral',
        lastInteraction: 'Inquiry about online ordering',
        callHistory: [
          {
            id: 'call-2',
            timestamp: '2025-01-07T14:15:00Z',
            duration: 320,
            transcript: 'Customer interested in online ordering solutions...',
            mood: 'neutral',
            sentiment: 0.2,
            aiSuggestions: [],
            outcome: 'successful',
            direction: 'inbound'
          }
        ]
      },
      {
        id: '3',
        phoneNumber: '+1-555-0789',
        name: 'Mike Wilson',
        lastCallDate: '2025-01-06T09:45:00Z',
        totalCalls: 5,
        status: 'converted',
        mood: 'positive',
        lastInteraction: 'Signed up for Android POS',
        callHistory: [
          {
            id: 'call-3',
            timestamp: '2025-01-06T09:45:00Z',
            duration: 680,
            transcript: 'Customer decided to go with Android POS solution...',
            mood: 'positive',
            sentiment: 0.8,
            aiSuggestions: [],
            outcome: 'successful',
            direction: 'outbound'
          }
        ],
        notes: 'Converted to Android POS Pro package'
      }
    ];
    setCustomers(mockCustomers);
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.phoneNumber.includes(searchTerm) || 
                         customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.lastInteraction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesMood = moodFilter === 'all' || customer.mood === moodFilter;
    
    return matchesSearch && matchesStatus && matchesMood;
  });

  const handleAddCustomer = () => {
    if (newCustomerPhone.trim()) {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        phoneNumber: newCustomerPhone,
        lastCallDate: new Date().toISOString(),
        totalCalls: 0,
        status: 'prospect',
        mood: 'unknown',
        lastInteraction: 'New customer added',
        callHistory: []
      };
      setCustomers(prev => [newCustomer, ...prev]);
      setNewCustomerPhone('');
      setShowAddCustomer(false);
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

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'successful': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'follow_up': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'no_answer': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'busy': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
          <button
            onClick={() => setShowAddCustomer(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Prospects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.status === 'prospect').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.status === 'converted').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Positive Mood</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.mood === 'positive').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by phone, name, or interaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mood</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Call</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Interaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {customer.phoneNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getMoodIcon(customer.mood)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{customer.mood}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(customer.lastCallDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.totalCalls}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {customer.lastInteraction}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCustomerSelect?.(customer);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="+1-555-0123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddCustomer(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-4/5 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Customer Details - {selectedCustomer.name || selectedCustomer.phoneNumber}</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div>
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Phone:</span> {selectedCustomer.phoneNumber}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                      {selectedCustomer.status}
                    </span>
                  </p>
                  <p><span className="font-medium">Mood:</span> 
                    <span className="ml-2 flex items-center">
                      {getMoodIcon(selectedCustomer.mood)}
                      <span className="ml-1 capitalize">{selectedCustomer.mood}</span>
                    </span>
                  </p>
                  <p><span className="font-medium">Total Calls:</span> {selectedCustomer.totalCalls}</p>
                  <p><span className="font-medium">Last Call:</span> {formatDate(selectedCustomer.lastCallDate)}</p>
                </div>
              </div>

              {/* Call History */}
              <div>
                <h4 className="font-semibold mb-3">Call History</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedCustomer.callHistory.map((call) => (
                    <div key={call.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {getOutcomeIcon(call.outcome)}
                          <span className="ml-2 text-sm font-medium capitalize">{call.outcome.replace('_', ' ')}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(call.timestamp)} • {formatDuration(call.duration)}
                        </div>
                      </div>
                      <div className="flex items-center mb-2">
                        {getMoodIcon(call.mood)}
                        <span className="ml-2 text-sm text-gray-600">Sentiment: {call.sentiment > 0 ? '+' : ''}{call.sentiment.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{call.transcript}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedCustomer.notes && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Notes</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedCustomer.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

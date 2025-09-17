// Enhanced Client Form Component
import React from 'react';
import { Users, Building2, Target, Zap, MessageSquare, Phone, MapPin } from "lucide-react";

interface EnhancedClientFormProps {
  newClient: any;
  setNewClient: (client: any) => void;
  handleAddClient: (e: React.FormEvent) => void;
  setShowAddModal: (show: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  handleArrayInput: (field: string, value: string, action: 'add' | 'remove') => void;
  isEditMode?: boolean;
}

export const EnhancedClientForm: React.FC<EnhancedClientFormProps> = ({
  newClient,
  setNewClient,
  handleAddClient,
  setShowAddModal,
  activeTab,
  setActiveTab,
  handleArrayInput,
  isEditMode = false
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            {isEditMode ? 'Edit Client' : 'Add New Client'}
          </h2>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'basic', label: 'Basic Info', icon: Users },
              { id: 'business', label: 'Business', icon: Building2 },
              { id: 'solutions', label: 'Current Solutions', icon: Target },
              { id: 'requirements', label: 'Requirements', icon: Zap },
              { id: 'competitive', label: 'Competitive', icon: MessageSquare },
              { id: 'quality', label: 'Lead Quality', icon: Phone }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAddClient}>
            <div className="space-y-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={newClient.phoneNumber}
                        onChange={(e) => setNewClient({...newClient, phoneNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1234567890"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        value={newClient.status}
                        onChange={(e) => setNewClient({...newClient, status: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="prospect">Prospect</option>
                        <option value="active">Active</option>
                        <option value="converted">Converted</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newClient.name || ''}
                        onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Client name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newClient.email || ''}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="client@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={newClient.notes}
                      onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Additional notes about this client..."
                    />
                  </div>
                </div>
              )}

              {/* Business Information Tab */}
              {activeTab === 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={newClient.businessInfo.businessName}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          businessInfo: {...newClient.businessInfo, businessName: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Restaurant Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Business Type
                      </label>
                      <select
                        value={newClient.businessInfo.businessType}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          businessInfo: {...newClient.businessInfo, businessType: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select type</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="cafe">Cafe</option>
                        <option value="food_truck">Food Truck</option>
                        <option value="catering">Catering</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cuisine Type
                      </label>
                      <input
                        type="text"
                        value={newClient.businessInfo.cuisineType}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          businessInfo: {...newClient.businessInfo, cuisineType: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Italian, Mexican, Asian, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Establishment Size
                      </label>
                      <select
                        value={newClient.businessInfo.establishmentSize}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          businessInfo: {...newClient.businessInfo, establishmentSize: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select size</option>
                        <option value="small">Small (1-10 seats)</option>
                        <option value="medium">Medium (11-50 seats)</option>
                        <option value="large">Large (51-100 seats)</option>
                        <option value="chain">Chain (100+ seats)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Years in Business
                      </label>
                      <input
                        type="number"
                        value={newClient.businessInfo.yearsInBusiness}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          businessInfo: {...newClient.businessInfo, yearsInBusiness: parseInt(e.target.value) || 0}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Monthly Revenue
                      </label>
                      <select
                        value={newClient.businessInfo.monthlyRevenue}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          businessInfo: {...newClient.businessInfo, monthlyRevenue: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select range</option>
                        <option value="under_10k">Under $10K</option>
                        <option value="10k_50k">$10K - $50K</option>
                        <option value="50k_100k">$50K - $100K</option>
                        <option value="100k_500k">$100K - $500K</option>
                        <option value="over_500k">Over $500K</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Location Information */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-slate-900 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={newClient.location.country}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            location: {...newClient.location, country: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="United States"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Region/State
                        </label>
                        <input
                          type="text"
                          value={newClient.location.region}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            location: {...newClient.location, region: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="California"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={newClient.location.city}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            location: {...newClient.location, city: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="San Francisco"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Solutions Tab */}
              {activeTab === 'solutions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Current Technology Solutions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900">Point of Sale (POS) System</h4>
                        <p className="text-sm text-slate-600">Does the client currently have a POS system?</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="hasPOS"
                            checked={newClient.currentSolutions.hasExistingPOS}
                            onChange={(e) => setNewClient({
                              ...newClient,
                              currentSolutions: {...newClient.currentSolutions, hasExistingPOS: true}
                            })}
                            className="mr-2"
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="hasPOS"
                            checked={!newClient.currentSolutions.hasExistingPOS}
                            onChange={(e) => setNewClient({
                              ...newClient,
                              currentSolutions: {...newClient.currentSolutions, hasExistingPOS: false}
                            })}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                    
                    {newClient.currentSolutions.hasExistingPOS && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          POS Provider
                        </label>
                        <input
                          type="text"
                          value={newClient.currentSolutions.posProvider}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            currentSolutions: {...newClient.currentSolutions, posProvider: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Square, Toast, Clover, etc."
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900">Self-Service Kiosk</h4>
                          <p className="text-sm text-slate-600">Has kiosk ordering</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newClient.currentSolutions.hasKiosk}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            currentSolutions: {...newClient.currentSolutions, hasKiosk: e.target.checked}
                          })}
                          className="w-4 h-4"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900">Native Mobile App</h4>
                          <p className="text-sm text-slate-600">Has mobile app</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newClient.currentSolutions.hasNativeApp}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            currentSolutions: {...newClient.currentSolutions, hasNativeApp: e.target.checked}
                          })}
                          className="w-4 h-4"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900">Website</h4>
                          <p className="text-sm text-slate-600">Has business website</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newClient.currentSolutions.hasWebsite}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            currentSolutions: {...newClient.currentSolutions, hasWebsite: e.target.checked}
                          })}
                          className="w-4 h-4"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900">Delivery Integration</h4>
                          <p className="text-sm text-slate-600">Integrated with delivery platforms</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newClient.currentSolutions.hasDeliveryIntegration}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            currentSolutions: {...newClient.currentSolutions, hasDeliveryIntegration: e.target.checked}
                          })}
                          className="w-4 h-4"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900">Online Ordering</h4>
                          <p className="text-sm text-slate-600">Has online ordering system</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newClient.currentSolutions.hasOnlineOrdering}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            currentSolutions: {...newClient.currentSolutions, hasOnlineOrdering: e.target.checked}
                          })}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements Tab */}
              {activeTab === 'requirements' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Client Requirements & Goals</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Primary Goals
                      </label>
                      <div className="space-y-2">
                        {['Increase efficiency', 'Reduce costs', 'Improve customer experience', 'Expand online presence', 'Better inventory management', 'Staff training', 'Compliance'].map(goal => (
                          <label key={goal} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newClient.requirements.primaryGoals.includes(goal)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleArrayInput('requirements.primaryGoals', goal, 'add');
                                } else {
                                  handleArrayInput('requirements.primaryGoals', goal, 'remove');
                                }
                              }}
                              className="mr-2"
                            />
                            {goal}
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Pain Points
                      </label>
                      <div className="space-y-2">
                        {['Slow service', 'High costs', 'Staff turnover', 'Inventory issues', 'Customer complaints', 'Technology problems', 'Competition'].map(pain => (
                          <label key={pain} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newClient.requirements.painPoints.includes(pain)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleArrayInput('requirements.painPoints', pain, 'add');
                                } else {
                                  handleArrayInput('requirements.painPoints', pain, 'remove');
                                }
                              }}
                              className="mr-2"
                            />
                            {pain}
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Budget Range
                        </label>
                        <select
                          value={newClient.requirements.budgetRange}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            requirements: {...newClient.requirements, budgetRange: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select budget</option>
                          <option value="under_5k">Under $5K</option>
                          <option value="5k_15k">$5K - $15K</option>
                          <option value="15k_50k">$15K - $50K</option>
                          <option value="50k_100k">$50K - $100K</option>
                          <option value="over_100k">Over $100K</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Timeline
                        </label>
                        <select
                          value={newClient.requirements.timeline}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            requirements: {...newClient.requirements, timeline: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select timeline</option>
                          <option value="immediate">Immediate</option>
                          <option value="1_3_months">1-3 months</option>
                          <option value="3_6_months">3-6 months</option>
                          <option value="6_12_months">6-12 months</option>
                          <option value="over_1_year">Over 1 year</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preferred Contact Method
                      </label>
                      <select
                        value={newClient.requirements.preferredContactMethod}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          requirements: {...newClient.requirements, preferredContactMethod: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select method</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Competitive Information Tab */}
              {activeTab === 'competitive' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Competitive Intelligence</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900">Receiving Competitor Calls</h4>
                        <p className="text-sm text-slate-600">Is the client being contacted by competitors?</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="competitorCalls"
                            checked={newClient.competitiveInfo.isReceivingCompetitorCalls}
                            onChange={(e) => setNewClient({
                              ...newClient,
                              competitiveInfo: {...newClient.competitiveInfo, isReceivingCompetitorCalls: true}
                            })}
                            className="mr-2"
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="competitorCalls"
                            checked={!newClient.competitiveInfo.isReceivingCompetitorCalls}
                            onChange={(e) => setNewClient({
                              ...newClient,
                              competitiveInfo: {...newClient.competitiveInfo, isReceivingCompetitorCalls: false}
                            })}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                    
                    {newClient.competitiveInfo.isReceivingCompetitorCalls && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Competitor Names
                        </label>
                        <input
                          type="text"
                          placeholder="Enter competitor names separated by commas"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onBlur={(e) => {
                            const competitors = e.target.value.split(',').map(name => name.trim()).filter(name => name);
                            setNewClient({
                              ...newClient,
                              competitiveInfo: {...newClient.competitiveInfo, competitorNames: competitors}
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lead Quality Tab */}
              {activeTab === 'quality' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Lead Quality Assessment</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Lead Score (1-10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={newClient.leadQuality.leadScore}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          leadQuality: {...newClient.leadQuality, leadScore: parseInt(e.target.value)}
                        })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-slate-600 mt-1">
                        <span>1 (Low)</span>
                        <span className="font-medium">{newClient.leadQuality.leadScore}</span>
                        <span>10 (High)</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Lead Source
                        </label>
                        <select
                          value={newClient.leadQuality.leadSource}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            leadQuality: {...newClient.leadQuality, leadSource: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select source</option>
                          <option value="cold_call">Cold Call</option>
                          <option value="referral">Referral</option>
                          <option value="website">Website</option>
                          <option value="social_media">Social Media</option>
                          <option value="advertisement">Advertisement</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Engagement Level
                        </label>
                        <select
                          value={newClient.leadQuality.engagementLevel}
                          onChange={(e) => setNewClient({
                            ...newClient,
                            leadQuality: {...newClient.leadQuality, engagementLevel: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select level</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900">Hot Lead</h4>
                        <p className="text-sm text-slate-600">Is this a high-priority lead?</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={newClient.leadQuality.isHotLead}
                        onChange={(e) => setNewClient({
                          ...newClient,
                          leadQuality: {...newClient.leadQuality, isHotLead: e.target.checked}
                        })}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <div className="flex items-center space-x-3">
                {activeTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['basic', 'business', 'solutions', 'requirements', 'competitive', 'quality'];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1]);
                      }
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Previous
                  </button>
                )}
                {activeTab !== 'quality' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['basic', 'business', 'solutions', 'requirements', 'competitive', 'quality'];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
                  >
                    Next
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {isEditMode ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

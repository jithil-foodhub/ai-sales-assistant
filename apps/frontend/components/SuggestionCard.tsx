'use client';

import { useState } from 'react';
import { Check, X, MessageSquare, Eye, Mail } from 'lucide-react';

interface Suggestion {
  text: string;
  offer_id: string;
  type: 'upsell' | 'cross-sell' | 'retention' | 'new-offer';
  confidence: number;
  deliver_as: 'say' | 'show' | 'email';
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAction: (suggestion: Suggestion, action: 'accept' | 'reject') => void;
}

export function SuggestionCard({ suggestion, onAction }: SuggestionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'accept' | 'reject') => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
    onAction(suggestion, action);
    setIsProcessing(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'upsell':
        return 'suggestion-upsell';
      case 'cross-sell':
        return 'suggestion-cross-sell';
      case 'retention':
        return 'suggestion-retention';
      case 'new-offer':
        return 'suggestion-new-offer';
      case 'product_recommendation':
        return 'suggestion-product-recommendation';
      case 'solution_consultation':
        return 'suggestion-solution-consultation';
      case 'business_growth':
        return 'suggestion-business-growth';
      case 'technical_support':
        return 'suggestion-technical-support';
      case 'pricing_inquiry':
        return 'suggestion-pricing-inquiry';
      default:
        return 'suggestion-upsell';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'upsell':
        return 'Upsell';
      case 'cross-sell':
        return 'Cross-sell';
      case 'retention':
        return 'Retention';
      case 'new-offer':
        return 'New Offer';
      case 'product_recommendation':
        return '🛍️ Product Recommendation';
      case 'solution_consultation':
        return '💡 Solution Consultation';
      case 'business_growth':
        return '📈 Business Growth';
      case 'technical_support':
        return '🔧 Technical Support';
      case 'pricing_inquiry':
        return '💰 Pricing Inquiry';
      default:
        return 'Suggestion';
    }
  };

  const getDeliverIcon = (deliverAs: string) => {
    switch (deliverAs) {
      case 'say':
        return <MessageSquare className="w-4 h-4" />;
      case 'show':
        return <Eye className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600';
    if (confidence >= 0.6) return 'text-warning-600';
    return 'text-danger-600';
  };

  return (
    <div className={`suggestion-card ${getTypeColor(suggestion.type)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
            {getTypeLabel(suggestion.type)}
          </span>
          <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
            {Math.round(suggestion.confidence * 100)}% confidence
          </span>
        </div>
        <div className="flex items-center space-x-1 text-gray-500">
          {getDeliverIcon(suggestion.deliver_as)}
          <span className="text-xs capitalize">{suggestion.deliver_as}</span>
        </div>
      </div>

      <p className="text-gray-800 mb-3 leading-relaxed">
        {suggestion.text}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Offer ID: {suggestion.offer_id}
        </span>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleAction('reject')}
            disabled={isProcessing}
            className="btn btn-danger text-xs px-3 py-1 flex items-center space-x-1"
          >
            <X className="w-3 h-3" />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleAction('accept')}
            disabled={isProcessing}
            className="btn btn-success text-xs px-3 py-1 flex items-center space-x-1"
          >
            <Check className="w-3 h-3" />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}

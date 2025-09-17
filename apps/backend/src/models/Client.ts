import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  phoneNumber: string;
  name?: string;
  email?: string;
  company?: string;
  status: 'prospect' | 'active' | 'converted' | 'inactive';
  lastCallDate?: Date;
  totalCalls: number;
  lastInteraction?: string;
  notes?: string;
  websites?: Array<{
    url: string;
    fileName: string;
    deployedAt: Date;
    lastModified?: Date;
    isActive: boolean;
  }>;
  // Enhanced fields
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
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  company: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['prospect', 'active', 'converted', 'inactive'],
    default: 'prospect'
  },
  lastCallDate: {
    type: Date,
    required: false
  },
  totalCalls: {
    type: Number,
    default: 0
  },
  lastInteraction: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false
  },
  websites: [{
    url: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    deployedAt: {
      type: Date,
      default: Date.now
    },
    lastModified: {
      type: Date,
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Enhanced fields
  businessInfo: {
    businessName: { type: String, required: false },
    businessType: { type: String, required: false },
    cuisineType: { type: String, required: false },
    establishmentSize: { type: String, required: false },
    yearsInBusiness: { type: Number, required: false },
    monthlyRevenue: { type: String, required: false }
  },
  location: {
    country: { type: String, required: false },
    region: { type: String, required: false },
    city: { type: String, required: false }
  },
  currentSolutions: {
    hasExistingPOS: { type: Boolean, required: false },
    posProvider: { type: String, required: false },
    hasKiosk: { type: Boolean, required: false },
    hasNativeApp: { type: Boolean, required: false },
    hasWebsite: { type: Boolean, required: false },
    hasDeliveryIntegration: { type: Boolean, required: false },
    hasOnlineOrdering: { type: Boolean, required: false }
  },
  requirements: {
    primaryGoals: [{ type: String }],
    painPoints: [{ type: String }],
    budgetRange: { type: String, required: false },
    timeline: { type: String, required: false },
    preferredContactMethod: { type: String, required: false }
  },
  competitiveInfo: {
    isReceivingCompetitorCalls: { type: Boolean, required: false },
    competitorNames: [{ type: String }]
  },
  leadQuality: {
    leadScore: { type: Number, required: false },
    leadSource: { type: String, required: false },
    isHotLead: { type: Boolean, required: false },
    engagementLevel: { type: String, required: false },
    conversionProbability: { type: String, required: false }
  }
}, {
  timestamps: true
});

export const Client = mongoose.model<IClient>('Client', ClientSchema);

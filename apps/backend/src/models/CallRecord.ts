import mongoose, { Document, Schema } from 'mongoose';

export interface ICallRecord extends Document {
  clientId: mongoose.Types.ObjectId;
  phoneNumber: string;
  timestamp: Date;
  callStartTime?: Date;
  callEndTime?: Date;
  duration: number;
  transcript: string;
  mood: 'positive' | 'neutral' | 'negative';
  sentiment: number;
  direction: 'inbound' | 'outbound';
  status: 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy' | 'declined';
  outcome: 'successful' | 'follow_up' | 'no_answer' | 'busy' | 'declined';
  aiSuggestions: Array<{
    text: string;
    offer_id: string;
    type: string;
    confidence: number;
    deliver_as: string;
    reasoning?: string;
  }>;
  
  // Call Analysis Metrics
  callAnalysis?: {
    summary: string; // One-liner summary
    keyTopics: string[]; // Main topics discussed
    customerEngagement: number; // 0-1 scale
    agentPerformance: number; // 0-1 scale
    conversationFlow: {
      segments: Array<{
        timestamp: number;
        speaker: 'customer' | 'agent';
        content: string;
        sentiment: number;
        topic?: string;
      }>;
      transitions: Array<{
        from: number;
        to: number;
        type: 'topic_change' | 'speaker_change' | 'sentiment_shift';
        description: string;
      }>;
    };
    metrics: {
      totalWords: number;
      customerWords: number;
      agentWords: number;
      speakingTimeRatio: number; // agent/customer speaking time ratio
      averageResponseTime: number; // in seconds
      interruptionCount: number;
      questionCount: number;
      objectionCount: number;
      agreementCount: number;
      solutionMentioned: boolean;
      nextStepsAgreed: boolean;
      customerSatisfaction: number; // 0-1 scale
    };
    insights: {
      strengths: string[];
      improvements: string[];
      recommendations: string[];
      riskFactors: string[];
    };
  };
  
  // AI-Generated Agent Feedback
  agentFeedback?: {
    performanceScore: number; // 1-10 scale
    strengths: string[];
    improvements: string[];
    conversationQuality: {
      rating: number; // 1-10 scale
      feedback: string;
    };
    salesTechniques: {
      rating: number; // 1-10 scale
      feedback: string;
      suggestions: string[];
    };
    customerHandling: {
      rating: number; // 1-10 scale
      feedback: string;
      suggestions: string[];
    };
    nextSteps: string[];
    overallFeedback: string;
  };

  // AI-Generated Call Summary
  callSummary?: {
    overallAssessment: string; // "Call went good, customer's expectations were met..."
    customerTone: string; // "customer tone was bit arrogant as he is already using some product"
    expectationsMet: boolean;
    conversionAttempt: string; // "agent tried best to convert but was lacking in terms of..."
    keyOutcomes: string[];
    nextCallStrategy: string;
  };

  // Enhanced Call Analysis
  enhancedAnalysis?: {
    moodAnalysis: {
      mood: 'positive' | 'neutral' | 'negative';
      confidence: number;
      reasoning: string;
    };
    competitorAnalysis: {
      competitors: Array<{
        name: string;
        highlights: string[];
        context: string;
      }>;
    };
    jargonDetection: {
      jargon: Array<{
        term: string;
        context: string;
        needsClarification: boolean;
      }>;
    };
    businessDetails: {
      cuisineTypes: string[];
      address: string;
      postcode: string;
      businessType: string;
    };
    keyInformation: {
      summary: string[];
      importantPoints: string[];
      actionItems: string[];
    };
  };
  
  metadata?: {
    callerId?: string;
    location?: string;
    device?: string;
    audioUrl?: string;
    callSid?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CallRecordSchema = new Schema<ICallRecord>({
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  callStartTime: {
    type: Date,
    required: false
  },
  callEndTime: {
    type: Date,
    required: false
  },
  duration: {
    type: Number,
    required: true,
    default: 0
  },
  transcript: {
    type: String,
    required: false,
    default: ''
  },
  mood: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    required: true
  },
  sentiment: {
    type: Number,
    required: true,
    min: -1,
    max: 1
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'failed', 'no_answer', 'busy', 'declined'],
    required: false,
    default: 'in_progress'
  },
  outcome: {
    type: String,
    enum: ['successful', 'follow_up', 'no_answer', 'busy', 'declined'],
    required: false,
    default: 'follow_up'
  },
  aiSuggestions: {
    type: [{
      text: { type: String, required: true },
      offer_id: { type: String, required: true },
      type: { type: String, required: true },
      confidence: { type: Number, required: true },
      deliver_as: { type: String, required: true },
      reasoning: { type: String, required: false }
    }],
    default: []
  },
  callAnalysis: {
    summary: String,
    keyTopics: [String],
    customerEngagement: { type: Number, min: 0, max: 1 },
    agentPerformance: { type: Number, min: 0, max: 1 },
    conversationFlow: {
      segments: [{
        timestamp: Number,
        speaker: { type: String, enum: ['customer', 'agent'] },
        content: String,
        sentiment: Number,
        topic: String
      }],
      transitions: [{
        from: Number,
        to: Number,
        type: { type: String, enum: ['topic_change', 'speaker_change', 'sentiment_shift'] },
        description: String
      }]
    },
    metrics: {
      totalWords: Number,
      customerWords: Number,
      agentWords: Number,
      speakingTimeRatio: Number,
      averageResponseTime: Number,
      interruptionCount: Number,
      questionCount: Number,
      objectionCount: Number,
      agreementCount: Number,
      solutionMentioned: Boolean,
      nextStepsAgreed: Boolean,
      customerSatisfaction: { type: Number, min: 0, max: 1 }
    },
    insights: {
      strengths: [String],
      improvements: [String],
      recommendations: [String],
      riskFactors: [String]
    }
  },
  agentFeedback: {
    performanceScore: { type: Number, min: 1, max: 10 },
    strengths: [String],
    improvements: [String],
    conversationQuality: {
      rating: { type: Number, min: 1, max: 10 },
      feedback: String
    },
    salesTechniques: {
      rating: { type: Number, min: 1, max: 10 },
      feedback: String,
      suggestions: [String]
    },
    customerHandling: {
      rating: { type: Number, min: 1, max: 10 },
      feedback: String,
      suggestions: [String]
    },
    nextSteps: [String],
    overallFeedback: String
  },
  callSummary: {
    overallAssessment: String,
    customerTone: String,
    expectationsMet: Boolean,
    conversionAttempt: String,
    keyOutcomes: [String],
    nextCallStrategy: String
  },
  enhancedAnalysis: {
    moodAnalysis: {
      mood: { type: String, enum: ['positive', 'neutral', 'negative'] },
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: String
    },
    competitorAnalysis: {
      competitors: [{
        name: String,
        highlights: [String],
        context: String
      }]
    },
    jargonDetection: {
      jargon: [{
        term: String,
        context: String,
        needsClarification: Boolean
      }]
    },
    businessDetails: {
      cuisineTypes: [String],
      address: String,
      postcode: String,
      businessType: String
    },
    keyInformation: {
      summary: [String],
      importantPoints: [String],
      actionItems: [String]
    }
  },
  metadata: {
    callerId: String,
    location: String,
    device: String,
    audioUrl: String,
    callSid: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
CallRecordSchema.index({ clientId: 1, timestamp: -1 });
CallRecordSchema.index({ phoneNumber: 1, timestamp: -1 });

export const CallRecord = mongoose.model<ICallRecord>('CallRecord', CallRecordSchema);

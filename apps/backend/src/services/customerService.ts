export interface CustomerContext {
  tone: 'angry' | 'frustrated' | 'neutral' | 'positive' | 'confused' | 'urgent';
  sentiment: 'negative' | 'neutral' | 'positive';
  intent: 'complaint' | 'inquiry' | 'compliment' | 'request' | 'complaint' | 'general';
  urgency: 'low' | 'medium' | 'high';
  customer_type: 'new' | 'returning' | 'vip' | 'unknown';
  keywords: string[];
  suggested_approach: string;
}

export interface AgentPitch {
  text: string;
  approach: 'empathetic' | 'solution-focused' | 'upsell' | 'retention' | 'defensive' | 'consultative';
  tone: 'professional' | 'friendly' | 'urgent' | 'apologetic' | 'confident';
  confidence: number;
  deliver_as: 'say' | 'show' | 'email';
  follow_up_actions: string[];
}

export class CustomerService {
  
  analyzeCustomerMessage(message: string): CustomerContext {
    const messageLower = message.toLowerCase();
    
    // Analyze tone
    const tone = this.analyzeTone(messageLower);
    
    // Analyze sentiment
    const sentiment = this.analyzeSentiment(messageLower);
    
    // Analyze intent
    const intent = this.analyzeIntent(messageLower);
    
    // Analyze urgency
    const urgency = this.analyzeUrgency(messageLower);
    
    // Extract keywords
    const keywords = this.extractKeywords(messageLower);
    
    // Determine customer type (simplified)
    const customer_type = this.determineCustomerType(messageLower);
    
    // Generate suggested approach
    const suggested_approach = this.generateSuggestedApproach(tone, sentiment, intent, urgency);
    
    return {
      tone,
      sentiment,
      intent,
      urgency,
      customer_type,
      keywords,
      suggested_approach
    };
  }

  generateAgentPitch(customerContext: CustomerContext, message: string): AgentPitch[] {
    const pitches: AgentPitch[] = [];
    
    // Generate primary pitch based on context
    const primaryPitch = this.generatePrimaryPitch(customerContext, message);
    pitches.push(primaryPitch);
    
    // Generate secondary pitch if needed
    if (customerContext.urgency === 'high' || customerContext.tone === 'angry') {
      const secondaryPitch = this.generateSecondaryPitch(customerContext, message);
      pitches.push(secondaryPitch);
    }
    
    return pitches;
  }

  private analyzeTone(message: string): CustomerContext['tone'] {
    const angryWords = ['angry', 'mad', 'furious', 'terrible', 'awful', 'hate', 'disgusted'];
    const frustratedWords = ['frustrated', 'annoyed', 'upset', 'disappointed', 'problem', 'issue'];
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'quickly', 'fast'];
    const confusedWords = ['confused', 'don\'t understand', 'unclear', 'help', 'explain'];
    const positiveWords = ['great', 'excellent', 'love', 'amazing', 'wonderful', 'perfect'];
    
    if (angryWords.some(word => message.includes(word))) return 'angry';
    if (frustratedWords.some(word => message.includes(word))) return 'frustrated';
    if (urgentWords.some(word => message.includes(word))) return 'urgent';
    if (confusedWords.some(word => message.includes(word))) return 'confused';
    if (positiveWords.some(word => message.includes(word))) return 'positive';
    
    return 'neutral';
  }

  private analyzeSentiment(message: string): CustomerContext['sentiment'] {
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'wonderful', 'perfect', 'happy', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'upset', 'problem'];
    
    const positiveCount = positiveWords.filter(word => message.includes(word)).length;
    const negativeCount = negativeWords.filter(word => message.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private analyzeIntent(message: string): CustomerContext['intent'] {
    const complaintWords = ['complaint', 'problem', 'issue', 'wrong', 'broken', 'not working', 'disappointed'];
    const inquiryWords = ['question', 'ask', 'wondering', 'curious', 'how', 'what', 'when', 'where'];
    const complimentWords = ['great', 'excellent', 'love', 'amazing', 'wonderful', 'perfect', 'happy'];
    const requestWords = ['need', 'want', 'looking for', 'require', 'help', 'assistance'];
    
    if (complaintWords.some(word => message.includes(word))) return 'complaint';
    if (inquiryWords.some(word => message.includes(word))) return 'inquiry';
    if (complimentWords.some(word => message.includes(word))) return 'compliment';
    if (requestWords.some(word => message.includes(word))) return 'request';
    
    return 'general';
  }

  private analyzeUrgency(message: string): CustomerContext['urgency'] {
    const highUrgencyWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'now'];
    const mediumUrgencyWords = ['soon', 'quickly', 'fast', 'priority', 'important'];
    
    if (highUrgencyWords.some(word => message.includes(word))) return 'high';
    if (mediumUrgencyWords.some(word => message.includes(word))) return 'medium';
    return 'low';
  }

  private extractKeywords(message: string): string[] {
    const keywords = [];
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    const words = message.split(/\s+/).filter(word => 
      word.length > 2 && !commonWords.includes(word.toLowerCase())
    );
    
    return words.slice(0, 10); // Return top 10 keywords
  }

  private determineCustomerType(message: string): CustomerContext['customer_type'] {
    const newCustomerWords = ['first time', 'new', 'never used', 'trying'];
    const returningWords = ['again', 'back', 'returning', 'used before'];
    const vipWords = ['vip', 'premium', 'priority', 'special'];
    
    if (vipWords.some(word => message.includes(word))) return 'vip';
    if (newCustomerWords.some(word => message.includes(word))) return 'new';
    if (returningWords.some(word => message.includes(word))) return 'returning';
    
    return 'unknown';
  }

  private generateSuggestedApproach(
    tone: CustomerContext['tone'],
    sentiment: CustomerContext['sentiment'],
    intent: CustomerContext['intent'],
    urgency: CustomerContext['urgency']
  ): string {
    if (tone === 'angry' || sentiment === 'negative') {
      return 'Start with empathy and apology. Focus on resolving the issue quickly.';
    }
    
    if (urgency === 'high') {
      return 'Prioritize immediate response and solution. Escalate if necessary.';
    }
    
    if (intent === 'complaint') {
      return 'Listen actively, acknowledge the issue, and provide clear resolution steps.';
    }
    
    if (intent === 'inquiry') {
      return 'Provide clear, helpful information. Ask clarifying questions if needed.';
    }
    
    if (sentiment === 'positive') {
      return 'Acknowledge their positive experience and look for upsell opportunities.';
    }
    
    return 'Maintain professional, helpful tone. Focus on understanding their needs.';
  }

  private generatePrimaryPitch(context: CustomerContext, message: string): AgentPitch {
    const { tone, sentiment, intent, urgency, customer_type } = context;
    
    // Angry/Frustrated customers
    if (tone === 'angry' || tone === 'frustrated') {
      return {
        text: "I sincerely apologize for the inconvenience you've experienced. I understand your frustration, and I'm here to help resolve this issue for you right away. Can you please tell me more about what happened so I can provide the best solution?",
        approach: 'empathetic',
        tone: 'apologetic',
        confidence: 0.9,
        deliver_as: 'say',
        follow_up_actions: ['Listen actively', 'Take detailed notes', 'Escalate if needed', 'Follow up within 24 hours']
      };
    }
    
    // Urgent requests
    if (urgency === 'high') {
      return {
        text: "I understand this is urgent for you. I'm prioritizing your request and will work to resolve this as quickly as possible. Let me gather some information to help you right away.",
        approach: 'solution-focused',
        tone: 'urgent',
        confidence: 0.85,
        deliver_as: 'say',
        follow_up_actions: ['Escalate to supervisor', 'Set priority flag', 'Provide regular updates', 'Follow up within 2 hours']
      };
    }
    
    // Complaints
    if (intent === 'complaint') {
      return {
        text: "I'm sorry to hear about this issue. I want to make sure I understand the situation completely so I can help you resolve it. Could you walk me through what happened?",
        approach: 'empathetic',
        tone: 'professional',
        confidence: 0.8,
        deliver_as: 'say',
        follow_up_actions: ['Document the complaint', 'Identify root cause', 'Propose solution', 'Follow up on resolution']
      };
    }
    
    // Positive feedback
    if (sentiment === 'positive') {
      return {
        text: "Thank you so much for your positive feedback! It's wonderful to hear that you're happy with our service. I'd love to help you explore other ways we can continue to exceed your expectations.",
        approach: 'upsell',
        tone: 'friendly',
        confidence: 0.75,
        deliver_as: 'say',
        follow_up_actions: ['Acknowledge their feedback', 'Identify upsell opportunities', 'Share additional services', 'Schedule follow-up']
      };
    }
    
    // General inquiries
    if (intent === 'inquiry') {
      return {
        text: "I'd be happy to help you with that! To provide you with the most accurate information, could you tell me a bit more about what you're looking for?",
        approach: 'consultative',
        tone: 'friendly',
        confidence: 0.7,
        deliver_as: 'say',
        follow_up_actions: ['Gather requirements', 'Provide detailed information', 'Offer alternatives', 'Schedule follow-up if needed']
      };
    }
    
    // Default response
    return {
      text: "Thank you for reaching out! I'm here to help you today. How can I assist you?",
      approach: 'consultative',
      tone: 'professional',
      confidence: 0.6,
      deliver_as: 'say',
      follow_up_actions: ['Listen to their needs', 'Ask clarifying questions', 'Provide assistance', 'Follow up as needed']
    };
  }

  private generateSecondaryPitch(context: CustomerContext, message: string): AgentPitch {
    // Secondary pitch for high-urgency or angry customers
    if (context.urgency === 'high') {
      return {
        text: "I want to make sure you know that your issue is being taken seriously. I'm going to personally follow up on this and ensure it gets resolved to your satisfaction.",
        approach: 'solution-focused',
        tone: 'urgent',
        confidence: 0.8,
        deliver_as: 'say',
        follow_up_actions: ['Set reminder for follow-up', 'Notify supervisor', 'Document escalation', 'Provide contact information']
      };
    }
    
    if (context.tone === 'angry') {
      return {
        text: "I completely understand why you're upset, and I want to make this right for you. Let me see what I can do to resolve this immediately.",
        approach: 'empathetic',
        tone: 'apologetic',
        confidence: 0.85,
        deliver_as: 'say',
        follow_up_actions: ['Offer immediate resolution', 'Provide compensation if appropriate', 'Escalate to management', 'Schedule callback']
      };
    }
    
    return {
      text: "Is there anything else I can help you with today?",
      approach: 'consultative',
      tone: 'friendly',
      confidence: 0.6,
      deliver_as: 'say',
      follow_up_actions: ['Check for additional needs', 'Provide contact information', 'Schedule follow-up if needed']
    };
  }
}

import mongoose from 'mongoose';
import { CallRecord } from '../models/CallRecord';
import { Client } from '../models/Client';
import { mongoDBService } from '../services/mongodb';

// Sample data for comprehensive analytics testing
const sampleClients = [
  { phoneNumber: '+1555000001', status: 'prospect' },
  { phoneNumber: '+1555000002', status: 'active' },
  { phoneNumber: '+1555000003', status: 'converted' },
  { phoneNumber: '+1555000004', status: 'prospect' },
  { phoneNumber: '+1555000005', status: 'active' },
  { phoneNumber: '+1555000006', status: 'converted' },
  { phoneNumber: '+1555000007', status: 'prospect' },
  { phoneNumber: '+1555000008', status: 'active' },
];

const sampleTopics = [
  'Payment processing', 'POS integration', 'Menu management', 'Online ordering',
  'Delivery services', 'Customer analytics', 'Inventory management', 'Staff management',
  'Multi-location support', 'Mobile app', 'Kiosk integration', 'Third-party integrations'
];

const sampleStrengths = [
  'Excellent product knowledge and technical expertise',
  'Clear communication and professional tone',
  'Effective objection handling techniques',
  'Good listening skills and customer empathy',
  'Strong closing techniques and follow-up',
  'Proactive problem-solving approach',
  'Well-structured call flow and presentation'
];

const sampleImprovements = [
  'Could ask more discovery questions early in the call',
  'Missed opportunity to create urgency',
  'Should have provided more specific pricing examples',
  'Could have better addressed customer concerns',
  'Need to improve technical explanation clarity',
  'Should follow up on customer objections more thoroughly',
  'Could have offered more personalized solutions'
];

const sampleFeatureRequests = [
  'Multi-currency payment support',
  'Advanced reporting dashboard',
  'Mobile app for staff',
  'Integration with Uber Eats',
  'Loyalty program management',
  'Real-time inventory tracking',
  'Customer feedback system',
  'Automated marketing campaigns',
  'Voice ordering system',
  'QR code menu integration'
];

const sampleCompetitors = ['Toast', 'Square', 'Clover', 'Lightspeed', 'TouchBistro', 'Resy', 'OpenTable'];

const generateRandomCallRecord = (client: any, daysAgo: number) => {
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() - daysAgo);
  timestamp.setHours(Math.floor(Math.random() * 12) + 9); // 9 AM to 9 PM
  timestamp.setMinutes(Math.floor(Math.random() * 60));

  const callStartTime = new Date(timestamp);
  const duration = Math.floor(Math.random() * 1800) + 300; // 5-35 minutes
  const callEndTime = new Date(callStartTime.getTime() + duration * 1000);

  const direction = Math.random() > 0.6 ? 'inbound' : 'outbound';
  const mood = Math.random() > 0.7 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative';
  const sentiment = mood === 'positive' ? Math.random() * 0.5 + 0.5 : 
                   mood === 'neutral' ? Math.random() * 0.6 - 0.3 : 
                   Math.random() * 0.5 - 0.5;

  const outcome = Math.random() > 0.3 ? 'successful' : 
                 Math.random() > 0.5 ? 'follow_up' : 'no_answer';

  // Generate performance scores based on outcome
  const basePerformance = outcome === 'successful' ? 7 + Math.random() * 3 : 
                         outcome === 'follow_up' ? 5 + Math.random() * 3 : 
                         3 + Math.random() * 3;

  const performanceScore = Math.min(10, Math.max(1, basePerformance));
  const customerSatisfaction = Math.max(0, Math.min(1, sentiment + 0.5));
  const customerEngagement = Math.random() * 0.5 + 0.3;
  const agentPerformance = performanceScore / 10;

  // Select random topics (1-3 per call)
  const numTopics = Math.floor(Math.random() * 3) + 1;
  const keyTopics: string[] = [];
  for (let i = 0; i < numTopics; i++) {
    const topic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
    if (!keyTopics.includes(topic)) {
      keyTopics.push(topic);
    }
  }

  // Generate strengths and improvements
  const numStrengths = Math.floor(Math.random() * 3) + 2;
  const numImprovements = Math.floor(Math.random() * 3) + 1;
  
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  for (let i = 0; i < numStrengths; i++) {
    const strength = sampleStrengths[Math.floor(Math.random() * sampleStrengths.length)];
    if (!strengths.includes(strength)) {
      strengths.push(strength);
    }
  }
  
  for (let i = 0; i < numImprovements; i++) {
    const improvement = sampleImprovements[Math.floor(Math.random() * sampleImprovements.length)];
    if (!improvements.includes(improvement)) {
      improvements.push(improvement);
    }
  }

  // Generate feature requests (random chance)
  const featureRequests: string[] = [];
  if (Math.random() > 0.7) {
    const numRequests = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numRequests; i++) {
      const request = sampleFeatureRequests[Math.floor(Math.random() * sampleFeatureRequests.length)];
      if (!featureRequests.includes(request)) {
        featureRequests.push(request);
      }
    }
  }

  // Generate competitor mentions (random chance)
  const competitors = [];
  if (Math.random() > 0.8) {
    const competitor = sampleCompetitors[Math.floor(Math.random() * sampleCompetitors.length)];
    competitors.push({
      name: competitor,
      highlights: [`Customer mentioned ${competitor} as alternative`, `Comparing features with ${competitor}`],
      context: `Customer is evaluating ${competitor} alongside our solution`
    });
  }

  return {
    clientId: client._id,
    phoneNumber: client.phoneNumber,
    timestamp,
    callStartTime,
    callEndTime,
    duration,
    transcript: `Sample transcript for ${direction} call discussing ${keyTopics.join(', ')}. Customer showed ${mood} sentiment throughout the conversation.`,
    mood,
    sentiment,
    direction,
    status: 'completed',
    outcome,
    aiSuggestions: [
      {
        text: `Suggest focusing on ${keyTopics[0]} benefits`,
        offer_id: `offer_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'product_recommendation',
        confidence: Math.random() * 0.3 + 0.7,
        deliver_as: 'say',
        reasoning: `Customer showed interest in ${keyTopics[0]}`
      }
    ],
    callAnalysis: {
      summary: `${direction.charAt(0).toUpperCase() + direction.slice(1)} call discussing ${keyTopics.join(', ')} with ${mood} customer sentiment`,
      keyTopics,
      customerEngagement,
      agentPerformance,
      conversationFlow: {
        segments: [
          {
            timestamp: 0,
            speaker: 'agent',
            content: 'Opening greeting and introduction',
            sentiment: 0.2,
            topic: 'introduction'
          },
          {
            timestamp: 30,
            speaker: 'customer',
            content: `Discussion about ${keyTopics[0]}`,
            sentiment,
            topic: keyTopics[0]
          }
        ],
        transitions: [
          {
            from: 0,
            to: 1,
            type: 'speaker_change',
            description: 'Agent to customer transition'
          }
        ]
      },
      metrics: {
        totalWords: Math.floor(Math.random() * 2000) + 500,
        customerWords: Math.floor(Math.random() * 800) + 200,
        agentWords: Math.floor(Math.random() * 1200) + 300,
        speakingTimeRatio: Math.random() * 0.8 + 0.4,
        averageResponseTime: Math.random() * 3 + 1,
        interruptionCount: Math.floor(Math.random() * 5),
        questionCount: Math.floor(Math.random() * 15) + 5,
        objectionCount: Math.floor(Math.random() * 3),
        agreementCount: Math.floor(Math.random() * 8) + 2,
        solutionMentioned: Math.random() > 0.3,
        nextStepsAgreed: outcome === 'successful',
        customerSatisfaction
      },
      insights: {
        strengths,
        improvements,
        recommendations: [`Focus on ${keyTopics[0]} in future calls`, 'Schedule follow-up demonstration'],
        riskFactors: outcome === 'successful' ? [] : ['Customer hesitation about pricing', 'Competitor comparison needed']
      }
    },
    agentFeedback: {
      performanceScore,
      strengths,
      improvements,
      conversationQuality: {
        rating: Math.min(10, Math.max(1, performanceScore + Math.random() * 2 - 1)),
        feedback: `Agent demonstrated ${performanceScore > 7 ? 'excellent' : performanceScore > 5 ? 'good' : 'adequate'} conversation management`
      },
      salesTechniques: {
        rating: Math.min(10, Math.max(1, performanceScore + Math.random() * 2 - 1)),
        feedback: `Sales approach was ${performanceScore > 7 ? 'highly effective' : performanceScore > 5 ? 'effective' : 'needs improvement'}`,
        suggestions: ['Practice objection handling', 'Improve closing techniques']
      },
      customerHandling: {
        rating: Math.min(10, Math.max(1, performanceScore + Math.random() * 1.5 - 0.75)),
        feedback: `Customer relationship management was ${performanceScore > 7 ? 'excellent' : 'satisfactory'}`,
        suggestions: ['Active listening improvement', 'Empathy building']
      },
      nextSteps: outcome === 'successful' ? ['Schedule implementation call', 'Send contract'] : ['Follow up in 1 week', 'Send additional information'],
      overallFeedback: `Overall call performance was ${performanceScore > 7 ? 'excellent' : performanceScore > 5 ? 'good' : 'needs improvement'}. ${strengths[0]}. ${improvements[0]}.`
    },
    callSummary: {
      overallAssessment: `Call went ${outcome === 'successful' ? 'very well' : 'reasonably well'} with customer showing ${mood} sentiment`,
      customerTone: `Customer tone was ${mood} throughout the conversation`,
      expectationsMet: outcome === 'successful',
      conversionAttempt: outcome === 'successful' ? 'Agent successfully converted the customer' : 'Agent made good attempt but customer needs more time',
      keyOutcomes: outcome === 'successful' ? ['Customer agreed to purchase', 'Implementation scheduled'] : ['Customer interested but needs approval', 'Follow-up scheduled'],
      nextCallStrategy: 'Focus on addressing remaining concerns and building value proposition'
    },
    enhancedAnalysis: {
      moodAnalysis: {
        mood,
        confidence: Math.random() * 0.3 + 0.7,
        reasoning: `Customer sentiment analysis indicates ${mood} mood based on conversation tone and content`
      },
      competitorAnalysis: {
        competitors
      },
      jargonDetection: {
        jargon: [
          {
            term: 'POS',
            context: 'Point of Sale system discussion',
            needsClarification: false
          }
        ]
      },
      businessDetails: {
        cuisineTypes: ['Italian', 'Pizza'],
        address: '123 Main St',
        postcode: '12345',
        businessType: 'Restaurant'
      },
      keyInformation: {
        summary: [`Discussed ${keyTopics.join(', ')}`, `Customer showed ${mood} interest`],
        importantPoints: [`Customer needs ${keyTopics[0]}`, 'Budget considerations discussed'],
        actionItems: featureRequests
      }
    },
    metadata: {
      callSid: `CA${Math.random().toString(36).substring(2, 15)}`,
      location: 'New York, NY',
      device: 'Phone'
    }
  };
};

async function importSampleData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoDBService.connect();
    
    console.log('🗑️ Clearing existing data...');
    // Only clear if there are very few records to avoid data loss
    const existingCallsCount = await CallRecord.countDocuments();
    const existingClientsCount = await Client.countDocuments();
    
    if (existingCallsCount < 10 && existingClientsCount < 5) {
      await CallRecord.deleteMany({});
      await Client.deleteMany({});
      console.log('✅ Existing data cleared');
    } else {
      console.log(`⚠️ Skipping data clear - found ${existingCallsCount} calls and ${existingClientsCount} clients`);
    }

    console.log('👥 Creating sample clients...');
    const clients = [];
    for (const clientData of sampleClients) {
      const client = new Client({
        ...clientData,
        totalCalls: 0,
        notes: `Sample client for analytics testing - ${clientData.status}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });
      await client.save();
      clients.push(client);
    }
    console.log(`✅ Created ${clients.length} sample clients`);

    console.log('📞 Generating sample call records...');
    const callRecords = [];
    
    // Generate calls for the last 30 days
    for (let day = 0; day < 30; day++) {
      // Random number of calls per day (0-8)
      const callsToday = Math.floor(Math.random() * 9);
      
      for (let call = 0; call < callsToday; call++) {
        const randomClient = clients[Math.floor(Math.random() * clients.length)];
        const callRecord = generateRandomCallRecord(randomClient, day);
        
        const newCall = new CallRecord(callRecord);
        await newCall.save();
        callRecords.push(newCall);
        
        // Update client's total calls
        randomClient.totalCalls += 1;
        randomClient.lastCallDate = callRecord.timestamp;
        await randomClient.save();
      }
    }

    console.log(`✅ Generated ${callRecords.length} sample call records`);
    
    // Generate some analytics to verify data
    const totalCalls = await CallRecord.countDocuments();
    const successfulCalls = await CallRecord.countDocuments({ outcome: 'successful' });
    const avgPerformance = await CallRecord.aggregate([
      { $group: { _id: null, avg: { $avg: '$agentFeedback.performanceScore' }}}
    ]);
    
    console.log('\n📊 Sample Data Summary:');
    console.log(`Total Calls: ${totalCalls}`);
    console.log(`Successful Calls: ${successfulCalls}`);
    console.log(`Success Rate: ${Math.round((successfulCalls / totalCalls) * 100)}%`);
    console.log(`Average Performance Score: ${Math.round(avgPerformance[0]?.avg * 100) / 100}/10`);
    
    console.log('\n🎉 Sample data import completed successfully!');
    console.log('📈 You can now test the enhanced analytics dashboard at http://localhost:3001/dashboard');
    
  } catch (error) {
    console.error('❌ Error importing sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the import
if (require.main === module) {
  importSampleData();
}

export { importSampleData };

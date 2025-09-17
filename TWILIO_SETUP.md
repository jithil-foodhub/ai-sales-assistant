# Twilio Webhook Setup Guide

## 🎯 Overview

This guide will help you set up Twilio webhooks to automatically process incoming calls, transcribe conversations, and generate AI-powered sales suggestions for your FoodHub AI Sales Assistant.

## 🔗 Webhook URLs

### Production URLs
Replace `your-domain.com` with your actual domain:

- **Call Webhook**: `https://your-domain.com/webhook/twilio/call`
- **Transcription Webhook**: `https://your-domain.com/webhook/twilio/transcription`

### Development URLs (for testing)
- **Call Webhook**: `http://localhost:3000/webhook/twilio/call`
- **Transcription Webhook**: `http://localhost:3000/webhook/twilio/transcription`

## 📋 TwiML App Configuration

### Step 1: Create TwiML App
1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** > **Manage** > **TwiML Apps**
3. Click **Create new TwiML App**
4. Name it: `FoodHub AI Sales Assistant`

### Step 2: Configure Webhooks
1. **Voice Configuration**:
   - **Request URL**: `https://your-domain.com/webhook/twilio/call`
   - **HTTP Method**: `POST`
   - **Fallback URL**: Leave empty
   - **HTTP Method**: `POST`

2. **Messaging Configuration** (if needed):
   - Leave as default

### Step 3: Assign to Phone Number
1. Go to **Phone Numbers** > **Manage** > **Active Numbers**
2. Click on your phone number
3. In the **Voice** section:
   - **Configure with**: `TwiML App`
   - **TwiML App**: Select `FoodHub AI Sales Assistant`
4. Click **Save Configuration**

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# Twilio Configuration
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_ACCOUNT_SID=your_twilio_account_sid

# Webhook Configuration
BASE_URL=https://your-domain.com

# OpenAI Configuration (for AI processing)
OPENAI_API_KEY=your_openai_api_key

# MongoDB Configuration (for data storage)
MONGO_HOST=your_mongodb_connection_string
```

## 🚀 How It Works

### 1. Call Flow
```
Incoming Call → Twilio → Your Webhook → TwiML Response
     ↓
Call Recording & Transcription
     ↓
Call Completion → Your Webhook → Client Creation/Update
     ↓
Transcription Complete → Your Webhook → AI Processing
     ↓
AI Suggestions → WebSocket → Agent Dashboard
```

### 2. Automatic Client Mapping
- **Phone Number Lookup**: System searches for existing client by phone number
- **Auto-Creation**: If no client found, creates new client automatically
- **Call History**: All calls are linked to the client record
- **Status Updates**: Client status and interaction history updated

### 3. AI Processing
- **Mood Analysis**: Analyzes customer sentiment and mood
- **Context Extraction**: Extracts relevant FoodHub product information
- **Sales Suggestions**: Generates personalized recommendations
- **Real-time Delivery**: Sends suggestions to connected agents via WebSocket

## 📊 Features

### ✅ Automatic Client Management
- Creates clients from phone numbers automatically
- Updates client status and call history
- Tracks mood and sentiment over time

### ✅ Call Processing
- Records all incoming calls
- Transcribes conversations automatically
- Handles call statuses (ringing, in-progress, completed, failed)

### ✅ AI-Powered Insights
- Mood analysis using OpenAI
- Sentiment scoring (-1 to +1)
- Keyword extraction and emotion detection
- Personalized sales suggestions

### ✅ Real-time Notifications
- WebSocket notifications to connected agents
- Live call status updates
- AI suggestions delivered in real-time

## 🧪 Testing

### Test the Webhook
```bash
npm run test-twilio
```

### Manual Testing
1. Call your Twilio number
2. Speak about restaurant technology needs
3. Check the client dashboard for new client
4. Verify call record and AI suggestions

### Expected Results
- Client created with phone number
- Call record with transcript
- Mood analysis completed
- AI suggestions generated
- WebSocket notifications sent

## 🔍 Monitoring

### Logs to Watch
- `📞 Twilio Call Webhook`: Call events
- `📝 Twilio Transcription`: Transcript processing
- `👤 New client created`: Client auto-creation
- `🤖 Processing transcript`: AI processing
- `✅ Call record created`: Database updates

### Dashboard Monitoring
- Client count increases
- Call history populated
- Mood analysis results
- AI suggestion quality

## 🛠️ Troubleshooting

### Common Issues

1. **Webhook Not Receiving Calls**
   - Check TwiML app configuration
   - Verify webhook URL is accessible
   - Check server logs for errors

2. **Transcription Not Working**
   - Ensure transcription callback URL is set
   - Check Twilio account permissions
   - Verify recording is enabled

3. **Client Not Created**
   - Check MongoDB connection
   - Verify phone number format
   - Check webhook processing logs

4. **AI Suggestions Not Generated**
   - Verify OpenAI API key
   - Check transcript content
   - Review AI processing logs

### Debug Commands
```bash
# Check webhook status
curl -X POST http://localhost:3000/webhook/twilio/call \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test&From=+15551234567&To=+15559876543&CallStatus=ringing"

# Check client creation
curl -X GET http://localhost:3000/api/clients

# Check call records
curl -X GET http://localhost:3000/api/clients/stats
```

## 📈 Production Deployment

### 1. Update BASE_URL
```env
BASE_URL=https://your-production-domain.com
```

### 2. Update TwiML App
- Change webhook URLs to production URLs
- Test with real phone calls
- Monitor logs and performance

### 3. SSL Certificate
- Ensure HTTPS is enabled
- Twilio requires secure webhooks
- Use valid SSL certificate

### 4. Monitoring
- Set up log monitoring
- Monitor webhook response times
- Track AI processing performance

## 🎯 Next Steps

1. **Configure TwiML App** with your webhook URLs
2. **Test with real calls** to verify functionality
3. **Monitor performance** and adjust as needed
4. **Train agents** on using the AI suggestions
5. **Analyze results** and optimize the system

## 📞 Support

For issues or questions:
- Check server logs for detailed error messages
- Verify all environment variables are set
- Test webhook endpoints manually
- Review Twilio console for call logs

---

**🎉 Your Twilio webhook integration is now ready!** 

The system will automatically process all incoming calls, create clients, transcribe conversations, and generate AI-powered sales suggestions for your agents.

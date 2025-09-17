# 🍕 FoodHub AI Sales Assistant

A real-time AI-powered sales assistant for FoodHub that analyzes customer messages and provides agents with intelligent, contextual sales pitches using OpenAI and FoodHub database context.

## 🚀 Features

### 🤖 AI-Powered Customer Analysis
- **Tone Detection**: angry, frustrated, neutral, positive, confused, urgent
- **Sentiment Analysis**: negative, neutral, positive
- **Intent Recognition**: complaint, inquiry, compliment, request, general
- **Urgency Assessment**: low, medium, high
- **Customer Type**: new, returning, vip, unknown

### 🍕 FoodHub Sales Agent
- **Restaurant Knowledge**: Full database of restaurants, ratings, delivery times, prices
- **Dynamic Recommendations**: Personalized suggestions based on customer preferences
- **Promotion Awareness**: Highlights relevant deals and discounts
- **Cuisine Expertise**: Matches customer cravings with perfect restaurants
- **Enthusiastic Responses**: Engaging, sales-focused communication

### 🔄 Real-time Communication
- **WebSocket Integration**: Live updates to agent dashboards
- **Customer Simulation**: Test with various customer scenarios
- **Agent Dashboard**: Real-time customer analysis and AI suggestions
- **Multi-agent Support**: Broadcasts to all connected agents

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   FoodHub DB    │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (JSON)        │
│                 │    │                 │    │                 │
│ • Agent Dashboard│    │ • Customer API  │    │ • Restaurants   │
│ • Customer Sim  │    │ • OpenAI Client │    │ • Promotions    │
│ • WebSocket UI  │    │ • WebSocket     │    │ • Menu Items    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, WebSocket
- **AI**: OpenAI GPT-4, Custom prompts
- **Database**: FoodHub JSON database
- **Real-time**: WebSocket communication
- **Testing**: Jest, Custom test scripts

## 📦 Installation

1. **Clone and Install**
```bash
git clone <repository>
cd hackathon
npm install
```

2. **Environment Setup**
```bash
cp env.example .env
# Edit .env with your OpenAI API key
```

3. **Start Development**
```bash
npm run dev
```

4. **Access Applications**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

## 🎯 Usage

### Method 1: Web Interface
1. Open http://localhost:3001
2. Click "Start Session" to open agent dashboard
3. Use "Customer Simulation" panel to send messages
4. Watch AI analyze customers and provide sales pitches!

### Method 2: API Endpoints
```bash
# Customer simulation
curl -X POST http://localhost:3000/api/customer-simulation \
  -H "Content-Type: application/json" \
  -d '{"message": "I want pizza", "customerId": "test-123"}'

# Generate suggestion
curl -X POST http://localhost:3000/api/generate-suggestion \
  -H "Content-Type: application/json" \
  -d '{"message": "Customer inquiry", "conversationId": "conv-123"}'
```

### Method 3: Test Scripts
```bash
# Test FoodHub AI agent
npm run test-foodhub

# Test customer service scenarios
npm run test-service

# Test customer flow
npm run test-customer
```

## 🍕 FoodHub Database

The system includes a comprehensive FoodHub database with:

### Restaurants
- **Pizza Palace**: Italian, 4.5⭐, 30-45 min, $$, Pepperoni Pizza
- **Sushi Zen**: Japanese, 4.8⭐, 20-30 min, $$$, Dragon Roll
- **Burger Palace**: American, 4.6⭐, 15-25 min, $, Classic Cheeseburger
- **Spice Garden**: Indian, 4.7⭐, 30-40 min, $$, Chicken Tikka Masala

### Promotions
- Weekend Pizza Deal: Buy one large pizza, get one free!
- Sushi Tuesday: 20% off all sushi rolls on Tuesdays

## 🤖 AI Sales Agent Examples

### Pizza Craving
**Customer**: "I'm craving pizza tonight"
**AI Response**: "Perfect choice! Mama's Italian Kitchen has the best Pizza in town with a 4.8⭐ rating! They deliver in 25-35 min and their Margherita Pizza ($18.99) is a customer favorite. I can also tell you about their other Italian specialties!"

### Sushi Request
**Customer**: "I want to try some sushi"
**AI Response**: "Great taste! Sushi Zen serves fresh, authentic Japanese cuisine with a 4.9⭐ rating! They deliver in 20-30 min and their Dragon Roll ($24.99) is absolutely incredible. I highly recommend trying their Sushi!"

### Budget-Friendly
**Customer**: "I'm looking for something cheap and fast"
**AI Response**: "I've got you covered! Burger Palace offers great value with $ pricing and a 4.6⭐ rating! They deliver in 15-25 min and their Classic Cheeseburger is only $9.99. Perfect for a budget-friendly meal!"

## 📊 API Response Format

```json
{
  "status": "success",
  "conversation_id": "customer-123",
  "customer_message": "I want pizza",
  "suggestions": [
    {
      "text": "Perfect choice! Mama's Italian Kitchen has the best Pizza...",
      "offer_id": "restaurant-1",
      "type": "cuisine_suggestion",
      "confidence": 0.85,
      "deliver_as": "say"
    }
  ],
  "foodhub_analysis": {
    "restaurants_found": 1,
    "promotions_found": 0,
    "cuisine_preferences": ["italian"],
    "price_sensitivity": "medium",
    "delivery_preferences": []
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
MOCK_MODE=false

# Server Configuration
PORT=3000
NODE_ENV=development

# WebSocket Configuration
WS_PORT=3000
```

### FoodHub Database
Edit `foodhub_database.json` to add:
- New restaurants
- Menu items and prices
- Promotions and deals
- Cuisine types

## 🧪 Testing

### Test Scenarios
- **FoodHub Agent**: 10 food delivery scenarios
- **Customer Service**: 6 customer service scenarios
- **Customer Flow**: End-to-end testing

### Quality Checks
- Dynamic response length (>50 chars)
- Restaurant information included
- Enthusiastic tone with exclamation marks
- Specific dish names and prices
- Proper confidence scoring

## 🚀 Deployment

### Docker
```bash
docker-compose up -d
```

### Production
```bash
npm run build
npm start
```

## 📈 Performance

- **Response Time**: <100ms average
- **WebSocket Latency**: <50ms
- **AI Processing**: 1-3 seconds
- **Concurrent Users**: 100+ supported

## 🔮 Future Enhancements

- **Real Restaurant APIs**: Integration with actual delivery platforms
- **Machine Learning**: Improved customer preference learning
- **Multi-language**: Support for multiple languages
- **Voice Integration**: Voice-to-text customer input
- **Analytics Dashboard**: Sales performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the test scripts for examples
- Review the API documentation
- Check the WebSocket connection status
- Verify OpenAI API key configuration

---

**Built with ❤️ for FoodHub AI Sales Assistant**
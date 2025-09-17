import dotenv from "dotenv";
import path from "path";
import { Request, Response } from "express";
import { WebSocketManager } from "../services/websocket";
import { LatencyProfiler } from "../services/latencyProfiler";
import { FoodHubService } from "../services/foodhubService";
import { OpenAIClient } from "../services/openaiClient";
import { PROMPTS, buildPrompt } from "../prompts";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const foodhubService = new FoodHubService();
const openaiClient = new OpenAIClient();

export function customerSimulation(
  wsManager: WebSocketManager,
  latencyProfiler: LatencyProfiler
) {
  return async (req: Request, res: Response) => {
    const endTiming = latencyProfiler.startTiming("customer_simulation");

    try {
      const { message, customerId } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Missing message" });
      }

      const conversationId = customerId || `customer-${Date.now()}`;

      console.log(`🍕 FoodHub Customer: ${message.substring(0, 50)}...`);

      // Test FoodHub service first
      try {
        const testContext = foodhubService.getFoodHubContext();
        console.log(
          `✅ FoodHub context loaded: ${testContext.length} characters`
        );
      } catch (error: any) {
        console.error("❌ FoodHub service error:", error);
        throw new Error(`FoodHub service error: ${error.message}`);
      }

      // Get comprehensive FoodHub context for AI processing
      const foodHubContext = foodhubService.getFoodHubContext();
      const relevantContext = await foodhubService.extractRelevantContext(message);
      const productInfo = foodhubService.getProductInfo(message);

      console.log(`📊 FoodHub Context Analysis:`, {
        total_context_length: foodHubContext.length,
        relevant_context_length: relevantContext.length,
        product_info_length: productInfo.length,
        keywords_found: message.split(" ").length,
      });

      // Generate dynamic FoodHub sales agent response using OpenAI
      const salesAgentResponse = await generateFoodHubSalesResponse(
        message,
        {
          fullContext: foodHubContext,
          relevantContext: relevantContext,
          productInfo: productInfo,
          companyStats: foodhubService.getCompanyStats(),
          globalOperations: foodhubService.getGlobalOperations(),
          competitiveAdvantages: foodhubService.getCompetitiveAdvantages(),
          pricingInfo: foodhubService.getPricingInfo(),
          supportInfo: foodhubService.getSupportInfo(),
        },
        conversationId
      );

      console.log(
        `🤖 Generated ${salesAgentResponse.suggestions.length} FoodHub sales suggestions`
      );

      // Send suggestions via WebSocket to all connected agents
      const wsMessage = {
        conversationId,
        suggestions: salesAgentResponse.suggestions,
        metadata: {
          reason: salesAgentResponse.metadata.reason,
          used_context_ids: salesAgentResponse.metadata.used_context_ids,
          latency: endTiming(),
          timestamp: new Date().toISOString(),
          customerMessage: message,
          foodhubContext: {
            context_length: foodHubContext.length,
            relevant_context_length: relevantContext.length,
            product_info_length: productInfo.length,
            keywords_found: message.split(" ").length,
          },
        },
      };

      // Broadcast to all connected agents
      wsManager.broadcastToConversation(conversationId, wsMessage);

      console.log(
        `✅ FoodHub sales response completed, sent ${salesAgentResponse.suggestions.length} suggestions to agents`
      );

      res.status(200).json({
        status: "success",
        conversation_id: conversationId,
        customer_message: message,
        suggestions: salesAgentResponse.suggestions,
        metadata: wsMessage.metadata,
        latency: wsMessage.metadata.latency,
        agents_notified: wsManager.getConnectionCount(),
        foodhub_analysis: {
          context_length: foodHubContext.length,
          relevant_context_length: relevantContext.length,
          product_info_length: productInfo.length,
          keywords_found: message.split(" ").length,
        },
      });
    } catch (error: any) {
      console.error("Error in customer simulation:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      endTiming();

      res.status(500).json({
        error: `Failed to process customer message: ${error.message}`,
        conversation_id: req.body.customerId || "unknown",
        details: error.message,
      });
    }
  };
}

async function generateFoodHubSalesResponse(
  message: string,
  foodHubContext: any,
  conversationId: string
): Promise<any> {
  console.log("🔍 Environment check:", {
    MOCK_MODE: process.env.MOCK_MODE,
    OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
    OPENAI_CLIENT_AVAILABLE: !!openaiClient.client,
  });

  // Check if OpenAI client is available
  if (!openaiClient.client) {
    console.log("OpenAI client not available, but continuing with context...");
    // For now, we'll still try to generate a response with the context
    // This will help us debug the issue
  }

  try {
    // Create a comprehensive prompt for FoodHub sales agent
    const prompt = buildPrompt.foodhubSales(message, foodHubContext);
    console.log("🍕 Using OpenAI for FoodHub sales response");

    // Use OpenAI directly with the custom prompt
    const response = await openaiClient.client.chat.completions.create({
      // model: "gpt-4",
      model: process.env.OPENAI_MODEL, // Force GPT-4o-mini for cost optimization
      messages: [
        {
          role: "system",
          content:
            PROMPTS.SYSTEM.SALES_AGENT_SIMPLE,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    console.log("OpenAI response received:", {
      choices: response.choices?.length,
      finish_reason: response.choices?.[0]?.finish_reason,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No response content from OpenAI:", {
        choices: response.choices,
        usage: response.usage,
      });
      throw new Error("No response content from OpenAI");
    }

    console.log("OpenAI content length:", content.length);
    const parsed = JSON.parse(content);
    return validateFoodHubResponse(parsed);
  } catch (error) {
    console.error("OpenAI API error for FoodHub sales response:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}


// All static responses removed - only AI-generated responses allowed

function extractCuisinePreferences(message: string): string[] {
  const cuisines = [
    "italian",
    "japanese",
    "chinese",
    "mexican",
    "indian",
    "thai",
    "american",
    "french",
    "korean",
    "vietnamese",
  ];
  return cuisines.filter((cuisine) => message.toLowerCase().includes(cuisine));
}

function extractPriceSensitivity(message: string): string {
  const messageLower = message.toLowerCase();
  if (
    messageLower.includes("cheap") ||
    messageLower.includes("budget") ||
    messageLower.includes("affordable")
  ) {
    return "low";
  }
  if (
    messageLower.includes("expensive") ||
    messageLower.includes("premium") ||
    messageLower.includes("luxury")
  ) {
    return "high";
  }
  return "medium";
}

function extractDeliveryPreferences(message: string): string[] {
  const preferences = [];
  const messageLower = message.toLowerCase();

  if (
    messageLower.includes("fast") ||
    messageLower.includes("quick") ||
    messageLower.includes("asap")
  ) {
    preferences.push("fast_delivery");
  }
  if (messageLower.includes("delivery")) {
    preferences.push("delivery");
  }
  if (messageLower.includes("pickup") || messageLower.includes("pick up")) {
    preferences.push("pickup");
  }

  return preferences;
}

function validateFoodHubResponse(response: any): any {
  if (!response.suggestions || !Array.isArray(response.suggestions)) {
    throw new Error("Invalid response format: missing suggestions array");
  }

  if (!response.metadata || typeof response.metadata.reason !== "string") {
    throw new Error("Invalid response format: missing metadata.reason");
  }

  // Validate each suggestion
  for (const suggestion of response.suggestions) {
    if (!suggestion.text || !suggestion.offer_id || !suggestion.type) {
      throw new Error("Invalid suggestion format");
    }

    if (
      ![
        "product_recommendation",
        "solution_consultation",
        "business_growth",
        "technical_support",
        "pricing_inquiry",
        "upsell",
        "cross-sell",
        "retention",
      ].includes(suggestion.type)
    ) {
      console.error("Invalid suggestion type:", suggestion.type);
      console.error("Available types:", [
        "product_recommendation",
        "solution_consultation",
        "business_growth",
        "technical_support",
        "pricing_inquiry",
        "upsell",
        "cross-sell",
        "retention",
      ]);
      throw new Error(`Invalid suggestion type: ${suggestion.type}`);
    }

    if (!["say", "show", "email"].includes(suggestion.deliver_as)) {
      throw new Error("Invalid deliver_as value");
    }
  }

  return response;
}

import { OpenAI } from 'openai';
import { CallRecord } from '../models/CallRecord';
import { PROMPTS, buildPrompt } from '../prompts';
import fs from 'fs';
import path from 'path';

export interface ClientPreferences {
  cuisineTypes: string[];
  dietaryRestrictions: string[];
  priceRange: 'budget' | 'mid-range' | 'premium';
  preferredMealTimes: string[];
  favoriteDishes: string[];
  dislikedIngredients: string[];
  specialOccasions: string[];
  deliveryPreferences: string[];
  restaurantType: string[];
  ambiance: string[];
  serviceStyle: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  groupSize: 'solo' | 'couple' | 'family' | 'group';
  locationPreferences: string[];
}

export class PreferenceAnalysisService {
  private static openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private static foodhubContext: string = '';

  static async loadFoodHubContext() {
    if (!PreferenceAnalysisService.foodhubContext) {
      const contextPath = path.join(__dirname, '../../../../foodhub_database.txt');
      try {
        PreferenceAnalysisService.foodhubContext = fs.readFileSync(contextPath, 'utf8');
        console.log('📚 FoodHub context loaded for PreferenceAnalysisService.');
      } catch (error) {
        console.warn('⚠️ Could not load FoodHub context, using minimal context.');
        PreferenceAnalysisService.foodhubContext = 'FoodHub is a food delivery and restaurant platform.';
      }
    }
  }

  static async analyzeClientPreferences(clientId: string): Promise<ClientPreferences> {
    await PreferenceAnalysisService.loadFoodHubContext();
    const model = process.env.OPENAI_MODEL; // Force GPT-4o-mini for cost optimization

    // Get all call records for the client
    const callRecords = await CallRecord.find({
      clientId: clientId,
      callAnalysis: { $exists: true },
      transcript: { $exists: true, $ne: '' }
    })
      .sort({ timestamp: -1 })
      .limit(10) // Analyze last 10 calls
      .lean();

    if (callRecords.length === 0) {
      return PreferenceAnalysisService.getDefaultPreferences();
    }

    // Combine all transcripts
    const allTranscripts = callRecords
      .map(call => call.transcript)
      .join('\n\n---\n\n');

    const prompt = buildPrompt.preferenceAnalysis(callRecords.map(call => call.transcript));

    try {
      const response = await PreferenceAnalysisService.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: PROMPTS.SYSTEM.PREFERENCE_ANALYST },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const rawAnalysis = response.choices[0].message.content;
      if (!rawAnalysis) throw new Error("OpenAI returned no content for preference analysis.");

      // Robust JSON parsing
      const jsonMatch = rawAnalysis.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawAnalysis;
      const parsedPreferences = JSON.parse(jsonString);

      // Validate and clean the preferences
      return PreferenceAnalysisService.validatePreferences(parsedPreferences);

    } catch (error) {
      console.error("Error analyzing client preferences:", error);
      return PreferenceAnalysisService.getDefaultPreferences();
    }
  }

  private static validatePreferences(preferences: any): ClientPreferences {
    return {
      cuisineTypes: Array.isArray(preferences.cuisineTypes) ? preferences.cuisineTypes : [],
      dietaryRestrictions: Array.isArray(preferences.dietaryRestrictions) ? preferences.dietaryRestrictions : [],
      priceRange: ['budget', 'mid-range', 'premium'].includes(preferences.priceRange) ? preferences.priceRange : 'mid-range',
      preferredMealTimes: Array.isArray(preferences.preferredMealTimes) ? preferences.preferredMealTimes : ['dinner'],
      favoriteDishes: Array.isArray(preferences.favoriteDishes) ? preferences.favoriteDishes : [],
      dislikedIngredients: Array.isArray(preferences.dislikedIngredients) ? preferences.dislikedIngredients : [],
      specialOccasions: Array.isArray(preferences.specialOccasions) ? preferences.specialOccasions : [],
      deliveryPreferences: Array.isArray(preferences.deliveryPreferences) ? preferences.deliveryPreferences : [],
      restaurantType: Array.isArray(preferences.restaurantType) ? preferences.restaurantType : ['casual dining'],
      ambiance: Array.isArray(preferences.ambiance) ? preferences.ambiance : ['casual'],
      serviceStyle: Array.isArray(preferences.serviceStyle) ? preferences.serviceStyle : ['full service'],
      budgetRange: {
        min: typeof preferences.budgetRange?.min === 'number' ? preferences.budgetRange.min : 10,
        max: typeof preferences.budgetRange?.max === 'number' ? preferences.budgetRange.max : 50
      },
      frequency: ['daily', 'weekly', 'monthly', 'occasional'].includes(preferences.frequency) ? preferences.frequency : 'weekly',
      groupSize: ['solo', 'couple', 'family', 'group'].includes(preferences.groupSize) ? preferences.groupSize : 'couple',
      locationPreferences: Array.isArray(preferences.locationPreferences) ? preferences.locationPreferences : []
    };
  }

  private static getDefaultPreferences(): ClientPreferences {
    return {
      cuisineTypes: ['American', 'Italian'],
      dietaryRestrictions: [],
      priceRange: 'mid-range',
      preferredMealTimes: ['dinner'],
      favoriteDishes: [],
      dislikedIngredients: [],
      specialOccasions: [],
      deliveryPreferences: ['fast delivery'],
      restaurantType: ['casual dining'],
      ambiance: ['casual'],
      serviceStyle: ['full service'],
      budgetRange: { min: 15, max: 40 },
      frequency: 'weekly',
      groupSize: 'couple',
      locationPreferences: []
    };
  }

  static async generatePersonalizedContent(preferences: ClientPreferences): Promise<{
    heroTitle: string;
    heroSubtitle: string;
    featuredCuisines: string[];
    recommendedDishes: string[];
    specialOffers: string[];
    restaurantHighlights: string[];
    callToAction: string;
  }> {
    await PreferenceAnalysisService.loadFoodHubContext();
    const model = process.env.OPENAI_MODEL; // Force GPT-4o-mini for cost optimization

    const prompt = buildPrompt.marketingContent(preferences);

    try {
      const response = await PreferenceAnalysisService.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: PROMPTS.SYSTEM.MARKETING_COPYWRITER },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0].message.content;
      if (!rawContent) throw new Error("OpenAI returned no content for personalized content.");

      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawContent;
      return JSON.parse(jsonString);

    } catch (error) {
      console.error("Error generating personalized content:", error);
      return {
        heroTitle: "Welcome to FoodHub",
        heroSubtitle: "Discover amazing food delivered to your door",
        featuredCuisines: preferences.cuisineTypes.slice(0, 3),
        recommendedDishes: ["Signature Pasta", "Grilled Salmon", "Chicken Curry"],
        specialOffers: ["Free delivery on orders over $25", "20% off your first order"],
        restaurantHighlights: ["Top-rated restaurants", "Fast delivery", "Fresh ingredients"],
        callToAction: "Order now and taste the difference!"
      };
    }
  }
}

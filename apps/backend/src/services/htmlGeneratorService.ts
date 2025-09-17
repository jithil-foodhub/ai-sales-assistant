import fs from 'fs';
import path from 'path';
import { ClientPreferences } from './preferenceAnalysisService';

export interface PersonalizedContent {
  heroTitle: string;
  heroSubtitle: string;
  featuredCuisines: string[];
  recommendedDishes: string[];
  specialOffers: string[];
  restaurantHighlights: string[];
  callToAction: string;
}

export class HtmlGeneratorService {
  private static templatePath = path.join(__dirname, '../../templates/foodhub-template.html');

  static async generatePersonalizedHtml(
    preferences: ClientPreferences,
    content: PersonalizedContent,
    clientName?: string
  ): Promise<string> {
    try {
      // Read the template file
      const template = fs.readFileSync(HtmlGeneratorService.templatePath, 'utf8');

      // Generate cuisine cards
      const cuisineCards = HtmlGeneratorService.generateCuisineCards(preferences.cuisineTypes);

      // Generate dish cards
      const dishCards = HtmlGeneratorService.generateDishCards(content.recommendedDishes || content.restaurantRecommendations?.map(r => r.name) || [], preferences);

      // Generate offer cards
      const offerCards = HtmlGeneratorService.generateOfferCards(content.specialOffers, preferences);

      // Generate highlight cards
      const highlightCards = HtmlGeneratorService.generateHighlightCards(content.restaurantHighlights);

      // Replace placeholders in template
      let personalizedHtml = template
        .replace(/\{\{HERO_TITLE\}\}/g, content.heroTitle)
        .replace(/\{\{HERO_SUBTITLE\}\}/g, content.heroSubtitle)
        .replace(/\{\{CUISINE_CARDS\}\}/g, cuisineCards)
        .replace(/\{\{DISH_CARDS\}\}/g, dishCards)
        .replace(/\{\{OFFER_CARDS\}\}/g, offerCards)
        .replace(/\{\{HIGHLIGHT_CARDS\}\}/g, highlightCards)
        .replace(/\{\{CALL_TO_ACTION\}\}/g, content.callToAction);

      // Add client name if provided
      if (clientName) {
        personalizedHtml = personalizedHtml.replace(
          /<title>(.*?)<\/title>/,
          `<title>${content.heroTitle} - ${clientName}'s FoodHub</title>`
        );
      }

      return personalizedHtml;

    } catch (error) {
      console.error('Error generating personalized HTML:', error);
      throw new Error('Failed to generate personalized HTML');
    }
  }

  private static generateCuisineCards(cuisines: string[]): string {
    // Fallback cuisines if none provided
    if (!cuisines || cuisines.length === 0) {
      cuisines = ['Italian', 'Chinese', 'Mexican', 'Japanese'];
    }
    const cuisineIcons: { [key: string]: string } = {
      'Italian': '🍝',
      'Chinese': '🥢',
      'Indian': '🍛',
      'Mexican': '🌮',
      'Thai': '🍜',
      'Japanese': '🍣',
      'Mediterranean': '🥗',
      'American': '🍔',
      'French': '🥐',
      'Korean': '🍲',
      'Vietnamese': '🍜',
      'Middle Eastern': '🥙',
      'Greek': '🧀',
      'Spanish': '🥘',
      'German': '🍺',
      'British': '🍵',
      'Caribbean': '🥥',
      'Ethiopian': '🍽️',
      'Peruvian': '🐟',
      'Brazilian': '🥩'
    };

    return cuisines.slice(0, 4).map(cuisine => `
      <div class="cuisine-card fade-in-up">
        <div class="cuisine-icon">${cuisineIcons[cuisine] || '🍽️'}</div>
        <h3>${cuisine}</h3>
        <p>Discover authentic ${cuisine.toLowerCase()} flavors crafted by expert chefs, delivered fresh to your door.</p>
      </div>
    `).join('');
  }

  private static generateDishCards(dishes: string[], preferences: ClientPreferences): string {
    // Fallback dishes if none provided
    if (!dishes || dishes.length === 0) {
      dishes = ['Pasta', 'Pizza', 'Sushi', 'Curry', 'Tacos', 'Ramen'];
    }
    const dishDescriptions: { [key: string]: string } = {
      'Pasta': 'Handmade pasta with rich, authentic Italian sauce',
      'Pizza': 'Wood-fired pizza with fresh, premium ingredients',
      'Sushi': 'Fresh, expertly crafted sushi rolls',
      'Curry': 'Aromatic spices and tender meat in rich sauce',
      'Tacos': 'Authentic Mexican tacos with fresh toppings',
      'Ramen': 'Rich, flavorful broth with perfectly cooked noodles',
      'Burger': 'Juicy, flame-grilled burger with premium toppings',
      'Salad': 'Fresh, crisp greens with seasonal ingredients',
      'Soup': 'Warm, comforting soup made with love',
      'Stir Fry': 'Fresh vegetables and protein in savory sauce'
    };

    const priceRanges = {
      'budget': { min: 8, max: 15 },
      'mid-range': { min: 12, max: 25 },
      'premium': { min: 20, max: 40 }
    };

    const priceRange = priceRanges[preferences.priceRange] || priceRanges['mid-range'];

    return dishes.slice(0, 6).map((dish, index) => {
      const price = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
      const description = dishDescriptions[dish] || `Delicious ${dish.toLowerCase()} made with fresh ingredients`;
      
      return `
        <div class="dish-card fade-in-up">
          <div class="dish-image">
            <i class="fas fa-utensils"></i>
          </div>
          <div class="dish-content">
            <h3>${dish}</h3>
            <p>${description}</p>
            <div class="dish-price">$${price}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  private static generateOfferCards(offers: string[], preferences: ClientPreferences): string {
    // Fallback offers if none provided
    if (!offers || offers.length === 0) {
      offers = ['Free Delivery', '20% Off First Order', 'Special Discount'];
    }
    const offerIcons = ['🎉', '💰', '🚀', '⭐', '🎁', '🔥'];
    
    return offers.slice(0, 3).map((offer, index) => `
      <div class="offer-card fade-in-up">
        <h3>${offerIcons[index % offerIcons.length]} ${offer}</h3>
        <p>Limited time offer - don't miss out!</p>
      </div>
    `).join('');
  }

  private static generateHighlightCards(highlights: string[]): string {
    // Fallback highlights if none provided
    if (!highlights || highlights.length === 0) {
      highlights = ['Fast Delivery', 'Fresh Ingredients', 'Top Rated'];
    }
    const highlightIcons = ['⭐', '🚀', '❤️', '🏆', '🛡️', '⚡'];
    const highlightDescriptions = [
      'Top-rated restaurants with excellent reviews',
      'Lightning-fast delivery to your doorstep',
      'Made with love and fresh ingredients',
      'Award-winning chefs and recipes',
      'Safe and secure payment processing',
      '24/7 customer support available'
    ];

    return highlights.slice(0, 3).map((highlight, index) => `
      <div class="highlight-card fade-in-up">
        <div class="highlight-icon">${highlightIcons[index % highlightIcons.length]}</div>
        <h3>${highlight}</h3>
        <p>${highlightDescriptions[index % highlightDescriptions.length]}</p>
      </div>
    `).join('');
  }

  static async saveHtmlToFile(html: string, clientId: string): Promise<string> {
    const outputDir = path.join(__dirname, '../../public/sites', clientId);
    const fileName = `foodhub-${clientId}-${Date.now()}.html`;
    const filePath = path.join(outputDir, fileName);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write HTML file
    fs.writeFileSync(filePath, html, 'utf8');

    console.log(`✅ Personalized HTML generated: ${filePath}`);
    return filePath;
  }

  static generatePreviewUrl(filePath: string, clientId: string): string {
    const fileName = path.basename(filePath);
    return `/sites/${clientId}/${fileName}`;
  }
}

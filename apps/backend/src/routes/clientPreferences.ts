import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { PreferenceAnalysisService } from '../services/preferenceAnalysisService';
import { HtmlGeneratorService } from '../services/htmlGeneratorService';
import { S3Service } from '../services/s3Service';
import { FoodHubService } from '../services/foodhubService';
import { OpenAIClient } from '../services/openaiClient';
import { PROMPTS, buildPrompt } from '../prompts';
import { Client } from '../models/Client';

// Analyze client preferences from call transcripts
export async function analyzeClientPreferences(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    
    console.log(`🔍 Analyzing preferences for client ${agentId}`);

    // Analyze preferences from call transcripts
    const preferences = await PreferenceAnalysisService.analyzeClientPreferences(agentId);
    
    // Generate personalized content
    const personalizedContent = await PreferenceAnalysisService.generatePersonalizedContent(preferences);

    console.log(`✅ Client preferences analyzed:`, {
      cuisineTypes: preferences.cuisineTypes.length,
      dietaryRestrictions: preferences.dietaryRestrictions.length,
      priceRange: preferences.priceRange,
      frequency: preferences.frequency
    });

    res.json({
      success: true,
      data: {
        preferences,
        personalizedContent
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing client preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze client preferences'
    });
  }
}

// Generate personalized HTML website
export async function generatePersonalizedWebsite(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { clientName } = req.body;
    
    console.log(`🌐 Generating personalized website for client ${agentId}`);

    // Analyze preferences
    const preferences = await PreferenceAnalysisService.analyzeClientPreferences(agentId);
    
    // Generate personalized content
    const personalizedContent = await PreferenceAnalysisService.generatePersonalizedContent(preferences);

    // Generate HTML
    const html = await HtmlGeneratorService.generatePersonalizedHtml(
      preferences,
      personalizedContent,
      clientName
    );

    // Save HTML to file
    const filePath = await HtmlGeneratorService.saveHtmlToFile(html, agentId);

    // Generate preview URL
    const previewUrl = HtmlGeneratorService.generatePreviewUrl(filePath, agentId);

    console.log(`✅ Personalized website generated: ${filePath}`);

    res.json({
      success: true,
      data: {
        preferences,
        personalizedContent,
        filePath,
        previewUrl,
        html: html.substring(0, 1000) + '...' // Return first 1000 chars for preview
      }
    });

  } catch (error) {
    console.error('❌ Error generating personalized website:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized website'
    });
  }
}

// Deploy website to S3
export async function deployWebsite(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { filePath, clientName } = req.body;
    
    console.log(`🚀 Deploying website for client ${agentId} to S3`);

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    // Construct full file path if only filename is provided
    const fullFilePath = filePath.startsWith('/') || filePath.includes('\\') 
      ? filePath 
      : path.join(__dirname, '../../public/sites', agentId, filePath);

    console.log(`📁 Full file path: ${fullFilePath}`);

    // Check if file exists
    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({
        success: false,
        error: `File not found: ${fullFilePath}`
      });
    }

    // Upload to S3
    const uploadResult = await S3Service.uploadHtmlFile(fullFilePath, agentId);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error || 'Failed to upload to S3'
      });
    }

    console.log(`✅ Website deployed to S3: ${uploadResult.url}`);

    // Save website URL to client record
    const fileName = path.basename(fullFilePath);
    
    // Replace the existing website (only one website per client)
    await Client.findByIdAndUpdate(agentId, {
      $set: {
        websites: [{
          url: uploadResult.url,
          fileName: fileName,
          deployedAt: new Date(),
          isActive: true
        }]
      }
    });

    res.json({
      success: true,
      data: {
        deployedUrl: uploadResult.url,
        s3Key: uploadResult.key,
        fileName: fileName,
        message: 'Website successfully deployed!'
      }
    });

  } catch (error) {
    console.error('❌ Error deploying website:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy website'
    });
  }
}

// Get client's deployed sites
export async function getClientSites(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    
    console.log(`📋 Getting deployed sites for client ${agentId}`);

    // Get client with websites from database
    const client = await Client.findById(agentId).select('websites');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const websites = client.websites || [];

    res.json({
      success: true,
      data: websites
    });

  } catch (error) {
    console.error('❌ Error getting client sites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get client sites'
    });
  }
}

// Delete deployed site
export async function deleteClientSite(req: Request, res: Response) {
  try {
    const { agentId, fileName } = req.params;
    
    console.log(`🗑️ Deleting site ${fileName} for client ${agentId}`);

    const deleteResult = await S3Service.deleteSite(agentId, fileName);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        error: deleteResult.error || 'Failed to delete site'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Site successfully deleted'
      }
    });

  } catch (error) {
    console.error('❌ Error deleting client site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete client site'
    });
  }
}

// Generate website preview without deploying
export async function generateWebsitePreview(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { modificationRequest } = req.body;
    
    console.log(`🔍 Generating website preview for client ${agentId}`);

    if (!modificationRequest) {
      return res.status(400).json({
        success: false,
        error: 'Modification request is required'
      });
    }

    // Get client and their preferences
    const client = await Client.findById(agentId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Get client's active website
    const activeWebsite = client.websites?.find(w => w.isActive) || client.websites?.[0];
    if (!activeWebsite) {
      return res.status(404).json({
        success: false,
        error: 'No active website found for this client'
      });
    }

    // Get website template context from RAG
    const foodhubService = new FoodHubService();
    const templateContext = await foodhubService.extractRelevantContext(
      `website template modification ${modificationRequest}`, 
      5
    );

    // Get client preferences
    const preferences = await PreferenceAnalysisService.analyzeClientPreferences(agentId);

    // Create AI modification prompt
    const prompt = `You are an expert web developer and designer for FoodHub. A client wants to modify their personalized food ordering website.

CLIENT MODIFICATION REQUEST: "${modificationRequest}"

CURRENT WEBSITE URL: ${activeWebsite.url}

CLIENT PREFERENCES:
${JSON.stringify(preferences, null, 2)}

WEBSITE TEMPLATE CONTEXT:
${templateContext}

INSTRUCTIONS:
1. Analyze the modification request carefully
2. Consider the client's preferences and current website
3. Provide specific, actionable modifications
4. Maintain the FoodHub branding and design consistency
5. Ensure the website remains responsive and functional
6. Focus on the most impactful changes

RESPONSE FORMAT (JSON only):
{
  "modifications": [
    {
      "section": "hero|cuisines|dishes|offers|highlights|footer",
      "type": "content|styling|layout|feature",
      "description": "What to change",
      "implementation": "Specific implementation details",
      "priority": "high|medium|low"
    }
  ],
  "newContent": {
    "heroTitle": "Updated hero title if needed",
    "heroSubtitle": "Updated hero subtitle if needed",
    "featuredCuisines": ["updated", "cuisine", "list"],
    "recommendedDishes": ["updated", "dish", "list"],
    "specialOffers": [
      {
        "title": "Offer title",
        "description": "Offer description",
        "discount": "10% off"
      }
    ],
    "restaurantHighlights": ["updated", "highlight", "list"]
  },
  "cssChanges": {
    "colorScheme": "Any color changes needed",
    "typography": "Any font changes needed",
    "layout": "Any layout modifications needed"
  },
  "reasoning": "Why these modifications were chosen based on the request and client preferences"
}`;

    // Get AI response
    const openaiClient = new OpenAIClient();
    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL, // Force GPT-4o-mini for cost optimization
      messages: [
        {
          role: "system",
          content: PROMPTS.SYSTEM.SALES_AGENT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const aiModifications = JSON.parse(jsonContent);

    // Generate new HTML with modifications
    const personalizedContent = {
      heroSection: {
        headline: aiModifications.newContent?.heroTitle || "Welcome to FoodHub",
        subheading: aiModifications.newContent?.heroSubtitle || "Discover amazing food delivered to your door"
      },
      featuredCuisines: aiModifications.newContent?.featuredCuisines || preferences.cuisineTypes.slice(0, 4),
      specialOffers: aiModifications.newContent?.specialOffers || [],
      restaurantRecommendations: aiModifications.newContent?.restaurantHighlights?.map((h: string) => ({
        name: h,
        cuisine: "Various",
        rating: "4.5 stars"
      })) || []
    };

    // Generate modified HTML
    const modifiedHtml = await HtmlGeneratorService.generatePersonalizedHtml(
      personalizedContent,
      preferences,
      activeWebsite.fileName
    );

    // Save modified HTML locally for preview
    const previewFileName = `foodhub-${agentId}-preview-${Date.now()}.html`;
    const previewFilePath = path.join(__dirname, '../../public/sites', agentId, previewFileName);
    
    // Ensure directory exists
    const dir = path.dirname(previewFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(previewFilePath, modifiedHtml);

    // Generate preview URL
    const previewUrl = `http://localhost:3000/sites/${agentId}/${previewFileName}`;

    console.log(`✅ Website preview generated: ${previewUrl}`);

    res.json({
      success: true,
      data: {
        modifications: aiModifications.modifications,
        newContent: aiModifications.newContent,
        cssChanges: aiModifications.cssChanges,
        reasoning: aiModifications.reasoning,
        previewUrl: previewUrl,
        fileName: previewFileName,
        message: 'Website preview generated successfully!'
      }
    });

  } catch (error) {
    console.error('❌ Error generating website preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate website preview'
    });
  }
}

// Cleanup multiple websites - keep only the most recent one
export async function cleanupWebsites(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    
    console.log(`🧹 Cleaning up multiple websites for client ${agentId}`);

    const client = await Client.findById(agentId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const websites = client.websites || [];
    if (websites.length <= 1) {
      return res.json({
        success: true,
        data: {
          message: 'No cleanup needed - client already has only one website',
          websites: websites
        }
      });
    }

    // Keep only the most recent website (by deployedAt date)
    const mostRecentWebsite = websites.reduce((latest, current) => {
      return new Date(current.deployedAt) > new Date(latest.deployedAt) ? current : latest;
    });

    // Update client to have only the most recent website
    await Client.findByIdAndUpdate(agentId, {
      $set: {
        websites: [{
          ...mostRecentWebsite,
          isActive: true
        }]
      }
    });

    console.log(`✅ Cleaned up websites for client ${agentId}. Kept: ${mostRecentWebsite.fileName}`);

    res.json({
      success: true,
      data: {
        message: 'Websites cleaned up successfully',
        keptWebsite: mostRecentWebsite,
        removedCount: websites.length - 1
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning up websites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup websites'
    });
  }
}

// Delete website from database and S3
export async function deleteWebsite(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { websiteId } = req.body;
    
    console.log(`🗑️ Deleting website ${websiteId} for client ${agentId}`);

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        error: 'Website ID is required'
      });
    }

    // Get client and find the website
    const client = await Client.findById(agentId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const website = client.websites?.find(w => w._id?.toString() === websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        error: 'Website not found'
      });
    }

    // Delete from S3
    try {
      const deleteResult = await S3Service.deleteSite(agentId, website.fileName);
      if (!deleteResult.success) {
        console.warn(`⚠️ Failed to delete from S3: ${deleteResult.error}`);
      }
    } catch (s3Error) {
      console.warn(`⚠️ S3 deletion failed: ${s3Error}`);
    }

    // Remove from database
    await Client.findByIdAndUpdate(agentId, {
      $pull: {
        websites: { _id: websiteId }
      }
    });

    console.log(`✅ Website deleted successfully: ${website.fileName}`);

    res.json({
      success: true,
      data: {
        message: 'Website deleted successfully',
        deletedWebsite: {
          fileName: website.fileName,
          url: website.url
        }
      }
    });

  } catch (error) {
    console.error('❌ Error deleting website:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete website'
    });
  }
}

// AI-powered website modification
export async function modifyWebsite(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { modificationRequest, websiteUrl } = req.body;
    
    console.log(`🤖 AI modifying website for client ${agentId}`);
    console.log(`📝 Modification request: ${modificationRequest}`);

    if (!modificationRequest) {
      return res.status(400).json({
        success: false,
        error: 'Modification request is required'
      });
    }

    // Get client and their preferences
    const client = await Client.findById(agentId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Get client's active website
    const activeWebsite = client.websites?.find(w => w.isActive) || client.websites?.[0];
    if (!activeWebsite) {
      return res.status(404).json({
        success: false,
        error: 'No active website found for this client'
      });
    }

    // Get website template context from RAG
    const foodhubService = new FoodHubService();
    const templateContext = await foodhubService.extractRelevantContext(
      `website template modification ${modificationRequest}`, 
      5
    );

    // Get client preferences
    const preferences = await PreferenceAnalysisService.analyzeClientPreferences(agentId);

    // Create AI modification prompt
    const prompt = `You are an expert web developer and designer for FoodHub. A client wants to modify their personalized food ordering website.

CLIENT MODIFICATION REQUEST: "${modificationRequest}"

CURRENT WEBSITE URL: ${activeWebsite.url}

CLIENT PREFERENCES:
${JSON.stringify(preferences, null, 2)}

WEBSITE TEMPLATE CONTEXT:
${templateContext}

INSTRUCTIONS:
1. Analyze the modification request carefully
2. Consider the client's preferences and current website
3. Provide specific, actionable modifications
4. Maintain the FoodHub branding and design consistency
5. Ensure the website remains responsive and functional
6. Focus on the most impactful changes

RESPONSE FORMAT (JSON only):
{
  "modifications": [
    {
      "section": "hero|cuisines|dishes|offers|highlights|footer",
      "type": "content|styling|layout|feature",
      "description": "What to change",
      "implementation": "Specific implementation details",
      "priority": "high|medium|low"
    }
  ],
  "newContent": {
    "heroTitle": "Updated hero title if needed",
    "heroSubtitle": "Updated hero subtitle if needed",
    "featuredCuisines": ["updated", "cuisine", "list"],
    "recommendedDishes": ["updated", "dish", "list"],
    "specialOffers": [
      {
        "title": "Offer title",
        "description": "Offer description",
        "discount": "10% off"
      }
    ],
    "restaurantHighlights": ["updated", "highlight", "list"]
  },
  "cssChanges": {
    "colorScheme": "Any color changes needed",
    "typography": "Any font changes needed",
    "layout": "Any layout modifications needed"
  },
  "reasoning": "Why these modifications were chosen based on the request and client preferences"
}`;

    // Get AI response
    const openaiClient = new OpenAIClient();
    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL, // Force GPT-4o-mini for cost optimization
      messages: [
        {
          role: "system",
          content: PROMPTS.SYSTEM.SALES_AGENT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const aiModifications = JSON.parse(jsonContent);

    // Generate new HTML with modifications
    const personalizedContent = {
      heroSection: {
        headline: aiModifications.newContent?.heroTitle || "Welcome to FoodHub",
        subheading: aiModifications.newContent?.heroSubtitle || "Discover amazing food delivered to your door"
      },
      featuredCuisines: aiModifications.newContent?.featuredCuisines || preferences.cuisineTypes.slice(0, 4),
      specialOffers: aiModifications.newContent?.specialOffers || [],
      restaurantRecommendations: aiModifications.newContent?.restaurantHighlights?.map((h: string) => ({
        name: h,
        cuisine: "Various",
        rating: "4.5 stars"
      })) || []
    };

    // Generate modified HTML
    const modifiedHtml = await HtmlGeneratorService.generatePersonalizedHtml(
      personalizedContent,
      preferences,
      activeWebsite.fileName
    );

    // Save modified HTML
    const modifiedFileName = `foodhub-${agentId}-modified-${Date.now()}.html`;
    const modifiedFilePath = path.join(__dirname, '../../public/sites', agentId, modifiedFileName);
    
    // Ensure directory exists
    const dir = path.dirname(modifiedFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(modifiedFilePath, modifiedHtml);

    // Deploy modified website
    const uploadResult = await S3Service.uploadHtmlFile(modifiedFilePath, agentId);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to deploy modified website');
    }

    // Update client record with modified website (replace existing)
    await Client.findByIdAndUpdate(agentId, {
      $set: {
        websites: [{
          url: uploadResult.url,
          fileName: modifiedFileName,
          deployedAt: new Date(),
          lastModified: new Date(),
          isActive: true
        }]
      }
    });

    console.log(`✅ Website modified and deployed: ${uploadResult.url}`);

    res.json({
      success: true,
      data: {
        modifications: aiModifications.modifications,
        newContent: aiModifications.newContent,
        cssChanges: aiModifications.cssChanges,
        reasoning: aiModifications.reasoning,
        modifiedUrl: uploadResult.url,
        fileName: modifiedFileName,
        message: 'Website successfully modified and deployed!'
      }
    });

  } catch (error) {
    console.error('❌ Error modifying website:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to modify website'
    });
  }
}

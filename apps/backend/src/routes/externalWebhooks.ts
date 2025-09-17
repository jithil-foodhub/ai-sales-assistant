import { Request, Response } from 'express';
import { ExternalWebhookService } from '../services/externalWebhookService';
import { CallRecord } from '../models/CallRecord';

/**
 * Test external webhook endpoints
 * GET /api/webhooks/external/test
 */
export async function testExternalWebhooks(req: Request, res: Response) {
  try {
    console.log('🔍 Testing external webhook endpoints via API...');
    
    await ExternalWebhookService.testWebhookEndpoints();
    
    res.json({
      success: true,
      message: 'External webhook test completed',
      endpoints: ExternalWebhookService.getWebhookEndpoints()
    });
    
  } catch (error) {
    console.error('❌ Error testing external webhooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test external webhooks',
      message: error.message
    });
  }
}

/**
 * Get list of configured external webhook endpoints
 * GET /api/webhooks/external
 */
export async function getExternalWebhooks(req: Request, res: Response) {
  try {
    const endpoints = ExternalWebhookService.getWebhookEndpoints();
    
    res.json({
      success: true,
      endpoints: endpoints,
      count: endpoints.length
    });
    
  } catch (error) {
    console.error('❌ Error getting external webhooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get external webhooks'
    });
  }
}

/**
 * Add new external webhook endpoint
 * POST /api/webhooks/external
 * Body: { url: string, description: string }
 */
export async function addExternalWebhook(req: Request, res: Response) {
  try {
    const { url, description } = req.body;
    
    if (!url || !description) {
      return res.status(400).json({
        success: false,
        error: 'URL and description are required'
      });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    ExternalWebhookService.addWebhookEndpoint(url, description);
    
    res.json({
      success: true,
      message: 'External webhook endpoint added',
      endpoint: { url, description },
      endpoints: ExternalWebhookService.getWebhookEndpoints()
    });
    
  } catch (error) {
    console.error('❌ Error adding external webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add external webhook'
    });
  }
}

/**
 * Remove external webhook endpoint
 * DELETE /api/webhooks/external
 * Body: { url: string }
 */
export async function removeExternalWebhook(req: Request, res: Response) {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    const removed = ExternalWebhookService.removeWebhookEndpoint(url);
    
    if (removed) {
      res.json({
        success: true,
        message: 'External webhook endpoint removed',
        removedUrl: url,
        endpoints: ExternalWebhookService.getWebhookEndpoints()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Webhook endpoint not found'
      });
    }
    
  } catch (error) {
    console.error('❌ Error removing external webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove external webhook'
    });
  }
}

/**
 * Manually send a call transcript to external webhooks
 * POST /api/webhooks/external/send/:callId
 */
export async function sendCallToExternalWebhooks(req: Request, res: Response) {
  try {
    const { callId } = req.params;
    
    if (!callId) {
      return res.status(400).json({
        success: false,
        error: 'Call ID is required'
      });
    }
    
    // Find the call record
    const callRecord = await CallRecord.findById(callId);
    
    if (!callRecord) {
      return res.status(404).json({
        success: false,
        error: 'Call record not found'
      });
    }
    
    if (!callRecord.transcript || callRecord.transcript.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Call transcript is too short or missing',
        transcriptLength: callRecord.transcript?.length || 0
      });
    }
    
    console.log(`🌐 Manually sending call ${callId} to external webhooks...`);
    console.log(`📄 Transcript length: ${callRecord.transcript.length}`);
    console.log(`📞 Phone: ${callRecord.phoneNumber}`);
    
    // Send to external webhooks
    await ExternalWebhookService.sendTranscriptToExternalWebhooks(
      callRecord.transcript, 
      callRecord
    );
    
    res.json({
      success: true,
      message: 'Call transcript sent to external webhooks',
      callId: callId,
      phoneNumber: callRecord.phoneNumber,
      transcriptLength: callRecord.transcript.length,
      endpoints: ExternalWebhookService.getWebhookEndpoints()
    });
    
  } catch (error) {
    console.error('❌ Error sending call to external webhooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send call to external webhooks',
      message: error.message
    });
  }
}

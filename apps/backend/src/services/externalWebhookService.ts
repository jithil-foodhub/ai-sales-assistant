import axios from 'axios';

interface WebhookEndpoint {
  url: string;
  description: string;
}

// External webhook endpoints to call after call completion
const EXTERNAL_WEBHOOKS: WebhookEndpoint[] = [
  {
    url: 'https://d05cdc9656f4.ngrok-free.app/webhook/bc6624bf-1777-4c26-9df5-7547b0cfd778',
    description: 'Primary external webhook endpoint'
  },
  {
    url: 'https://d05cdc9656f4.ngrok-free.app/webhook/0605eb4c-a290-4c9b-98da-ad7d09011c4c',
    description: 'Secondary external webhook endpoint'
  }
];

export class ExternalWebhookService {
  
  /**
   * Send transcript to external webhook endpoints
   * @param transcript - Full call transcript
   * @param callRecord - Call record for context
   */
  static async sendTranscriptToExternalWebhooks(
    transcript: string, 
    callRecord: any
  ): Promise<void> {
    console.log('🌐 ===== SENDING TRANSCRIPT TO EXTERNAL WEBHOOKS =====');
    console.log(`📄 Transcript length: ${transcript.length} characters`);
    console.log(`📞 Call ID: ${callRecord._id}`);
    console.log(`📞 Phone: ${callRecord.phoneNumber}`);
    
    const promises = EXTERNAL_WEBHOOKS.map(webhook => 
      this.sendToWebhook(webhook, transcript, callRecord)
    );
    
    try {
      // Send to all webhooks in parallel
      const results = await Promise.allSettled(promises);
      
      // Log results
      results.forEach((result, index) => {
        const webhook = EXTERNAL_WEBHOOKS[index];
        if (result.status === 'fulfilled') {
          console.log(`✅ Successfully sent to ${webhook.description}: ${webhook.url}`);
        } else {
          console.error(`❌ Failed to send to ${webhook.description}: ${webhook.url}`, result.reason);
        }
      });
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`🌐 External webhook calls completed: ${successCount}/${EXTERNAL_WEBHOOKS.length} successful`);
      
    } catch (error) {
      console.error('❌ Error in external webhook service:', error);
    }
    
    console.log('🌐 ===== EXTERNAL WEBHOOK CALLS COMPLETE =====');
  }
  
  /**
   * Send transcript to a single webhook endpoint
   * @param webhook - Webhook configuration
   * @param transcript - Full call transcript
   * @param callRecord - Call record for context
   */
  private static async sendToWebhook(
    webhook: WebhookEndpoint, 
    transcript: string, 
    callRecord: any
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Sending to ${webhook.description}...`);
      
      const response = await axios.post(webhook.url, {
        transcript: transcript
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FoodHub-Analytics/1.0'
        },
        timeout: 30000, // 30 second timeout
        maxRedirects: 5
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ Webhook success: ${webhook.url}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Response size: ${JSON.stringify(response.data).length} bytes`);
      
      // Log first 200 characters of response for debugging
      if (response.data) {
        const responseStr = typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data);
        console.log(`   Response preview: "${responseStr.substring(0, 200)}..."`);
      }
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Webhook failed: ${webhook.url}`);
      console.error(`   Duration: ${duration}ms`);
      
      if (error.response) {
        // Server responded with error status
        console.error(`   Status: ${error.response.status} ${error.response.statusText}`);
        console.error(`   Error data:`, error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error(`   Network error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
      } else {
        // Something else happened
        console.error(`   Error: ${error.message}`);
      }
      
      // Re-throw error to be caught by Promise.allSettled
      throw error;
    }
  }
  
  /**
   * Add a new external webhook endpoint
   * @param url - Webhook URL
   * @param description - Description of the webhook
   */
  static addWebhookEndpoint(url: string, description: string): void {
    EXTERNAL_WEBHOOKS.push({ url, description });
    console.log(`➕ Added external webhook: ${description} - ${url}`);
  }
  
  /**
   * Remove a webhook endpoint by URL
   * @param url - Webhook URL to remove
   */
  static removeWebhookEndpoint(url: string): boolean {
    const index = EXTERNAL_WEBHOOKS.findIndex(webhook => webhook.url === url);
    if (index !== -1) {
      const removed = EXTERNAL_WEBHOOKS.splice(index, 1)[0];
      console.log(`➖ Removed external webhook: ${removed.description} - ${removed.url}`);
      return true;
    }
    return false;
  }
  
  /**
   * Get list of configured webhook endpoints
   */
  static getWebhookEndpoints(): WebhookEndpoint[] {
    return [...EXTERNAL_WEBHOOKS];
  }
  
  /**
   * Test connectivity to all webhook endpoints
   */
  static async testWebhookEndpoints(): Promise<void> {
    console.log('🔍 Testing external webhook endpoints...');
    
    const testTranscript = "Test transcript from FoodHub Analytics system";
    const testCallRecord = {
      _id: 'test-call-id',
      phoneNumber: '+1234567890',
      timestamp: new Date()
    };
    
    await this.sendTranscriptToExternalWebhooks(testTranscript, testCallRecord);
  }
}

export default ExternalWebhookService;

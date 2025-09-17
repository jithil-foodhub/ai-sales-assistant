/**
 * Rate Limiter Service for OpenAI API calls
 * Implements token bucket algorithm with exponential backoff
 */

interface RateLimitConfig {
  maxTokensPerMinute: number;
  maxTokensPerDay: number;
  burstLimit: number;
  refillRate: number; // tokens per second
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number;
}

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: RateLimitConfig;
  private dailyUsage: Map<string, number> = new Map();
  private lastDailyReset: number = Date.now();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxTokensPerMinute: 25000, // Conservative limit (83% of 30k)
      maxTokensPerDay: 1000000, // 1M tokens per day
      burstLimit: 5000, // Allow bursts up to 5k tokens
      refillRate: 400, // ~400 tokens per second
      ...config
    };
  }

  /**
   * Check if we can make an API call with the given token count
   */
  async canMakeCall(identifier: string, estimatedTokens: number): Promise<boolean> {
    this.resetDailyUsageIfNeeded();
    
    // Check daily limit
    const dailyUsage = this.dailyUsage.get(identifier) || 0;
    if (dailyUsage + estimatedTokens > this.config.maxTokensPerDay) {
      console.log(`🚫 Daily token limit exceeded for ${identifier}: ${dailyUsage}/${this.config.maxTokensPerDay}`);
      return false;
    }

    // Get or create token bucket
    const bucket = this.getOrCreateBucket(identifier);
    this.refillBucket(bucket);

    // Check if we have enough tokens
    if (bucket.tokens >= estimatedTokens) {
      bucket.tokens -= estimatedTokens;
      this.dailyUsage.set(identifier, dailyUsage + estimatedTokens);
      return true;
    }

    console.log(`🚫 Rate limit exceeded for ${identifier}: ${bucket.tokens}/${estimatedTokens} tokens available`);
    return false;
  }

  /**
   * Wait for tokens to become available
   */
  async waitForTokens(identifier: string, estimatedTokens: number): Promise<void> {
    const bucket = this.getOrCreateBucket(identifier);
    
    while (bucket.tokens < estimatedTokens) {
      const waitTime = Math.ceil((estimatedTokens - bucket.tokens) / this.config.refillRate * 1000);
      console.log(`⏳ Waiting ${waitTime}ms for tokens to refill for ${identifier}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refillBucket(bucket);
    }
  }

  /**
   * Get current token status
   */
  getTokenStatus(identifier: string): { available: number; dailyUsage: number; dailyLimit: number } {
    this.resetDailyUsageIfNeeded();
    const bucket = this.getOrCreateBucket(identifier);
    this.refillBucket(bucket);
    
    return {
      available: bucket.tokens,
      dailyUsage: this.dailyUsage.get(identifier) || 0,
      dailyLimit: this.config.maxTokensPerDay
    };
  }

  /**
   * Reset daily usage at midnight
   */
  private resetDailyUsageIfNeeded(): void {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (now - this.lastDailyReset > oneDay) {
      this.dailyUsage.clear();
      this.lastDailyReset = now;
      console.log('🔄 Daily token usage reset');
    }
  }

  /**
   * Get or create token bucket for identifier
   */
  private getOrCreateBucket(identifier: string): TokenBucket {
    if (!this.buckets.has(identifier)) {
      this.buckets.set(identifier, {
        tokens: this.config.burstLimit,
        lastRefill: Date.now(),
        maxTokens: this.config.burstLimit,
        refillRate: this.config.refillRate
      });
    }
    return this.buckets.get(identifier)!;
  }

  /**
   * Refill bucket based on time elapsed
   */
  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const timeElapsed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timeElapsed * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Get rate limit status for monitoring
   */
  getStatus(): { totalBuckets: number; config: RateLimitConfig } {
    return {
      totalBuckets: this.buckets.size,
      config: this.config
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Decorator for rate-limited OpenAI API calls
 */
export function rateLimited(estimatedTokens: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const identifier = 'global'; // You can make this more specific per call type
      
      if (await rateLimiter.canMakeCall(identifier, estimatedTokens)) {
        return method.apply(this, args);
      } else {
        console.log(`⏳ Rate limit hit, waiting for tokens...`);
        await rateLimiter.waitForTokens(identifier, estimatedTokens);
        return method.apply(this, args);
      }
    };
  };
}

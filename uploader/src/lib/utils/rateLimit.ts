interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per second
}

export const createRateLimiter = (
  capacity: number = 10,
  refillRate: number = 1 // 1 token per second
) => {
  const buckets = new Map<string, TokenBucket>();
  
  return {
    isAllowed: (key: string): boolean => {
      const now = Date.now();
      let bucket = buckets.get(key);
      
      if (!bucket) {
        bucket = {
          tokens: capacity,
          lastRefill: now,
          capacity,
          refillRate,
        };
        buckets.set(key, bucket);
        return true;
      }
      
      // Refill tokens based on time elapsed
      const timePassed = (now - bucket.lastRefill) / 1000; // seconds
      const tokensToAdd = timePassed * refillRate;
      
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
      
      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return true;
      }
      
      return false;
    },
    
    getRemainingTokens: (key: string): number => {
      const bucket = buckets.get(key);
      return bucket ? bucket.tokens : 0;
    },
    
    getTimeUntilNextToken: (key: string): number => {
      const bucket = buckets.get(key);
      if (!bucket || bucket.tokens > 0) return 0;
      
      return Math.ceil((1 - bucket.tokens) / bucket.refillRate * 1000); // milliseconds
    }
  };
};

// Default rate limiter: 10 requests per minute
export const rateLimiter = createRateLimiter(10, 10 / 60); // 10 tokens, refill 10 tokens per minute

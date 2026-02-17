/**
 * Retry logic and rate limiting detection for Google Ads API operations
 */

module.exports = {

    /**
     * Detect if an error is retryable (rate limits, server errors, network issues)
     */
    isRetryableError(error) {
        if (!error) return false;

        // Rate limit errors (HTTP 429)
        if (error.code === 429) return true;

        // gRPC RESOURCE_EXHAUSTED errors
        if (error.code === 8) return true;

        // Server errors (5xx)
        if (error.code >= 500) return true;

        // Network timeout errors
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') return true;

        // Google Ads API specific errors
        if (error.message) {
            const message = error.message.toLowerCase();
            if (message.includes('rate limit') || 
                message.includes('too many requests') ||
                message.includes('quota exceeded') ||
                message.includes('resource_exhausted')) {
                return true;
            }
        }

        // Concurrent modification errors
        if (error.message && error.message.toLowerCase().includes('concurrent_modification')) {
            return true;
        }

        return false;
    },

    /**
     * Calculate delay for exponential backoff with jitter
     */
    calculateRetryDelay(attempt, baseDelayMs = 1000, maxDelayMs = 30000) {
        const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        // Add jitter (±25% random variation)
        const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
        return Math.max(1000, exponentialDelay + jitter); // Minimum 1 second
    },

    /**
     * Adaptive rate limiting based on error patterns
     */
    adjustRateLimit(currentDelayMs, error, context) {
        const JOB_MIN_DELAY = 0;
        const JOB_MAX_DELAY = 10000;
        const JOB_DELAY_INCREMENT = 500;
        const JOB_DELAY_DECREMENT = 50;

        if (this.isRetryableError(error)) {
            // Increase delay on rate limit errors
            const newDelay = Math.min(currentDelayMs + JOB_DELAY_INCREMENT, JOB_MAX_DELAY);
            context.log('info', `Rate limit detected, increasing delay to ${newDelay}ms`);
            return newDelay;
        } else {
            // Decrease delay on successful operations
            const newDelay = Math.max(currentDelayMs - JOB_DELAY_DECREMENT, JOB_MIN_DELAY);
            return newDelay;
        }
    },

    /**
     * Execute operation with retry logic
     */
    async executeWithRetry(operation, options = {}) {
        const {
            maxRetries = 3,
            baseDelayMs = 1000,
            maxDelayMs = 30000,
            context = null
        } = options;

        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries || !this.isRetryableError(error)) {
                    throw error;
                }

                const delay = this.calculateRetryDelay(attempt, baseDelayMs, maxDelayMs);
                
                if (context && context.log) {
                    context.log('warn', `Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${error.message}`);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }
};

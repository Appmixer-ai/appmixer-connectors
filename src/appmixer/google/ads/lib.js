const { GoogleAdsApi } = require('google-ads-api');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Threshold: if Google says retry in more than this, throw RateLimitError for the component to handle via continuation
const RATE_LIMIT_CONTINUATION_THRESHOLD_MS = 60 * 1000;

/**
 * Thrown when Google Ads API rate limit requires a wait longer than we can handle in-process.
 * The component should freeze the chunk, store rateLimitUntil, and schedule continuation.
 */
class RateLimitError extends Error {
    constructor(retryAfterMs, originalMessage) {
        super(`Rate limited by Google Ads API. Retry after ${Math.ceil(retryAfterMs / 1000)}s. Original: ${originalMessage}`);
        this.name = 'RateLimitError';
        this.retryAfterMs = retryAfterMs;
        this.rateLimitUntil = Date.now() + retryAfterMs;
    }
}

module.exports = {

    RateLimitError,

    /**
     * Safe wrapper for context.log.
     * Appmixer's context.log validates the second arg with check-types assertImpl.object,
     * so it MUST be an object like { message: '...' }, not a raw string.
     */
    safeLog(context, level, msg) {
        try {
            const safeMsg = typeof msg === 'string' ? msg : String(msg);
            context.log(level, { message: safeMsg });
        } catch (_) {
            // Fallback to console if context.log throws synchronously
            try { console.error(`[GoogleAds][${level}] ${msg}`); } catch (_2) { /* noop */ }
        }
    },

    /**
     * Normalize multiselect input (array or string) to array format.
     * Strings are treated as single values or comma-separated lists.
     * @param {string|string[]} input
     * @param {object} context
     * @param {string} fieldName
     * @returns {string[]}
     */
    normalizeMultiselectInput(input, context, fieldName) {

        if (Array.isArray(input)) {
            return input;
        } else if (typeof input === 'string') {
            // Handle single string value or comma-separated string
            return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
        } else {
            throw new context.CancelError(`${fieldName} must be a string or an array`);
        }
    },

    /**
     * Safely send progress updates to Appmixer context
     * Handles cases where context might be destroyed during long operations
     */
    safeSendProgress(context, message, percentage) {
        try {
            context.sendJson({ message, percentage }, 'progress');
        } catch (error) {
            // Log error for debugging, but don't throw to avoid breaking long operations
            if (context && context.log) {
                this.safeLog(context, 'warn', `Failed to send progress update: ${error.message}`);
            }
            // Context might be destroyed during long operations - this is expected behavior
        }
    },

    /**
     * Extract human-readable error message from Google Ads API errors
     * Handles nested error structures and provides fallback messages
     */
    extractErrorMessage(error) {
        if (!error) return 'Unknown error occurred';

        // Handle Google Ads API errors
        if (error.errors && Array.isArray(error.errors)) {
            const messages = error.errors.map(err => {
                if (err.message) return err.message;
                if (err.error_code && err.error_code.request_error) {
                    return `Request error: ${err.error_code.request_error}`;
                }
                return 'Google Ads API error';
            });
            return messages.join('; ');
        }

        // Handle standard errors with nested details
        if (error.details && Array.isArray(error.details)) {
            const messages = error.details.map(detail => detail.message || 'API error');
            return messages.join('; ');
        }

        // Handle errors with request_id for debugging
        if (error.request_id) {
            const baseMessage = error.message || 'Google Ads API error';
            return `${baseMessage} (Request ID: ${error.request_id})`;
        }

        // Fallback to standard error message
        return error.message || error.toString() || 'Unknown error occurred';
    },

    /**
     * Parse CSV file stream and group emails by segment
     * Validates email format and logs progress during parsing
     */
    async parseCSV(context, fileStream, segmentColumn) {
        return new Promise((resolve, reject) => {
            const segmentGroups = {};
            let totalRows = 0;
            let validRows = 0;
            let invalidRows = 0;
            let lastProgressTime = Date.now();

            const stream = Readable.from(fileStream)
                .pipe(csv())
                .on('data', (row) => {
                    totalRows++;

                    // Log progress every 5 seconds
                    const now = Date.now();
                    if (now - lastProgressTime > 5000) {
                        this.safeSendProgress(context, `Parsing CSV: ${totalRows} rows processed`, null);
                        lastProgressTime = now;
                    }

                    const email = row.email?.trim().toLowerCase();
                    const segment = segmentColumn ? row[segmentColumn]?.trim() : 'default';

                    // Validate email format
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!email || !emailRegex.test(email)) {
                        invalidRows++;
                        this.safeLog(context, 'debug', `Invalid email format: ${email || 'empty'}`);
                        return;
                    }

                    validRows++;
                    if (!segmentGroups[segment]) {
                        segmentGroups[segment] = [];
                    }
                    segmentGroups[segment].push(email);
                })
                .on('end', () => {
                    this.safeLog(context, 'info', `CSV parsing completed: ${totalRows} total, ${validRows} valid, ${invalidRows} invalid`);
                    resolve(segmentGroups);
                })
                .on('error', (error) => {
                    this.safeLog(context, 'error', `CSV parsing failed: ${this.extractErrorMessage(error)}`);
                    reject(error);
                });
        });
    },

    /**
     * Create Google Ads OfflineUserDataJob with retry logic
     * Handles rate limits and transient errors with exponential backoff
     */
    async createUserDataJob(context, customer, customerId, userListId, maxRetries = 3, initialDelayMs = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Use correct google-ads-api npm package method
                const response = await customer.offlineUserDataJobs.createOfflineUserDataJob({
                    customer_id: customerId,
                    job: {
                        type: 'CUSTOMER_MATCH_USER_LIST',
                        customer_match_user_list_metadata: {
                            user_list: `customers/${customerId}/userLists/${userListId}`
                        }
                    }
                });

                const resourceName = response.resource_name;
                this.safeLog(context, 'info', `Created OfflineUserDataJob: ${resourceName}`);
                return resourceName;

            } catch (error) {
                lastError = error;
                const extractedMsg = this.extractErrorMessage(error);
                const classification = this.classifyError(error, extractedMsg);

                // If rate limited with a large delay, throw RateLimitError for component-level handling
                if (classification.isRateLimit) {
                    const apiDelay = this.parseRetryDelay(extractedMsg);
                    if (apiDelay && apiDelay > RATE_LIMIT_CONTINUATION_THRESHOLD_MS) {
                        this.safeLog(context, 'warn', `Create job rate limited: retry in ${Math.ceil(apiDelay / 1000)}s — escalating to component for continuation`);
                        throw new RateLimitError(apiDelay, extractedMsg);
                    }
                }

                if (attempt === maxRetries || !classification.isRetryable) {
                    this.safeLog(context, 'error', `Create job failed (attempt ${attempt}/${maxRetries}): ${extractedMsg}`);
                    throw error;
                }

                // Short delay — retry in-process
                const exponentialBackoff = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
                const backoffTime = Math.min(exponentialBackoff, 30000);
                this.safeLog(context, 'warn', `Retry ${attempt}/${maxRetries}: Create job failed — waiting ${Math.ceil(backoffTime / 1000)}s`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }

        throw lastError || new Error('Failed to create job after multiple attempts');
    },

    /**
     * Classify error type from Google Ads API error
     * Returns { isRateLimit, isNetworkError, isConcurrentModification, isRetryable }
     */
    classifyError(error, extractedMsg) {
        const msg = extractedMsg.toLowerCase();
        const isRateLimit = msg.includes('rate limit') ||
            msg.includes('quota') ||
            msg.includes('too many requests') ||
            error.code === 8; // RESOURCE_EXHAUSTED

        const isNetworkError = msg.includes('network') ||
            msg.includes('timeout') ||
            error.code === 14; // UNAVAILABLE

        const isConcurrentModification = msg.includes('concurrent') ||
            msg.includes('modified') ||
            error.code === 10; // ABORTED

        return {
            isRateLimit,
            isNetworkError,
            isConcurrentModification,
            isRetryable: isRateLimit || isNetworkError || isConcurrentModification
        };
    },

    /**
     * Wait with smart backoff: uses API suggested delay as minimum + exponential backoff
     */
    async smartBackoff(context, extractedMsg, attempt, initialDelayMs, label) {
        const apiSuggestedDelay = this.parseRetryDelay(extractedMsg);
        const exponentialBackoff = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
        const backoffTime = Math.min(
            Math.max(apiSuggestedDelay || 0, exponentialBackoff),
            30000
        );
        const delaySource = apiSuggestedDelay ? `API suggested ${apiSuggestedDelay / 1000}s + backoff` : 'exponential backoff';
        this.safeLog(context, 'warn', `${label} - waiting ${Math.ceil(backoffTime / 1000)}s (${delaySource})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return apiSuggestedDelay;
    },

    /**
     * Add user data operations with smart retry and recursive split on failure.
     * - Rate limit / network / concurrent errors → wait + retry same batch
     * - Non-retryable errors → split batch in half, retry each half recursively
     * - Single-item failure → log ERROR and return as failed item (no throw)
     * Returns { succeeded: number, failed: Array<{ email, error }> }
     */
    async addOperations(context, customer, customerId, jobResourceName, emailArray, maxRetries = 5, initialDelayMs = 1000, globalRateLimitCallback = null) {
        const result = { succeeded: 0, failed: [] };

        const sendBatch = async (batch, depth = 0, retryCount = 0) => {
            try {
                const operations = batch.map(hashedEmail => ({
                    create: {
                        user_identifiers: [{
                            hashed_email: hashedEmail
                        }]
                    }
                }));

                await customer.offlineUserDataJobs.addOfflineUserDataJobOperations({
                    resource_name: jobResourceName,
                    operations: operations,
                    enable_partial_failure: true
                });

                result.succeeded += batch.length;
                if (depth > 0) {
                    this.safeLog(context, 'info', `Split-retry succeeded: ${batch.length} operations at depth ${depth}`);
                }
                return;

            } catch (error) {
                const extractedMsg = this.extractErrorMessage(error);
                const classification = this.classifyError(error, extractedMsg);

                // If rate limited with a large delay, escalate to component for continuation
                if (classification.isRateLimit) {
                    const apiDelay = this.parseRetryDelay(extractedMsg);
                    if (apiDelay && apiDelay > RATE_LIMIT_CONTINUATION_THRESHOLD_MS) {
                        this.safeLog(context, 'warn', `Upload rate limited: retry in ${Math.ceil(apiDelay / 1000)}s — escalating to component`);
                        throw new RateLimitError(apiDelay, extractedMsg);
                    }
                }

                // Rate limit / network / concurrent with short delay → wait and retry same batch
                if (classification.isRetryable) {
                    if (classification.isRateLimit && globalRateLimitCallback) {
                        globalRateLimitCallback(this.parseRetryDelay(extractedMsg));
                    }

                    if (retryCount < maxRetries) {
                        const errorType = classification.isRateLimit ? 'RATE_LIMIT' :
                            classification.isConcurrentModification ? 'CONCURRENT_MODIFICATION' : 'NETWORK_ERROR';
                        await this.smartBackoff(context, extractedMsg, retryCount + 1, initialDelayMs,
                            `Retry ${retryCount + 1}/${maxRetries} (${errorType}, batch size ${batch.length}, depth ${depth})`);
                        return sendBatch(batch, depth, retryCount + 1);
                    }

                    // Exhausted retries on retryable error — fall through to split logic
                    this.safeLog(context, 'warn', `Exhausted ${maxRetries} retries on retryable error (batch size ${batch.length}), attempting split`);
                }

                // Non-retryable error or exhausted retries: split or log failure
                if (batch.length === 1) {
                    // Base case: single item failed with non-retryable error
                    const failedEmail = batch[0];
                    this.safeLog(context, 'error', `ERROR: Failed to upload user [${failedEmail}]: ${extractedMsg}`);
                    result.failed.push({ email: failedEmail, error: extractedMsg });
                    return;
                }

                // Split batch in half and retry each part independently
                const mid = Math.ceil(batch.length / 2);
                const leftHalf = batch.slice(0, mid);
                const rightHalf = batch.slice(mid);
                this.safeLog(context, 'warn', `Splitting failed batch (size ${batch.length}) into ${leftHalf.length} + ${rightHalf.length} at depth ${depth + 1}`);

                await sendBatch(leftHalf, depth + 1, 0);
                await sendBatch(rightHalf, depth + 1, 0);
            }
        };

        await sendBatch(emailArray, 0, 0);

        if (result.failed.length > 0) {
            this.safeLog(context, 'warn', `Batch complete: ${result.succeeded} succeeded, ${result.failed.length} failed`);
        }

        return result;
    },

    /**
     * Execute OfflineUserDataJob to transition from PENDING to RUNNING
     * Handles rate limits and transient errors with exponential backoff
     */
    async runJob(context, customer, customerId, jobResourceName, maxRetries = 3, initialDelayMs = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Use correct google-ads-api npm package method
                const response = await customer.offlineUserDataJobs.runOfflineUserDataJob({
                    resource_name: jobResourceName
                });

                this.safeLog(context, 'info', `Started job execution: ${jobResourceName}`);
                return response;

            } catch (error) {
                lastError = error;
                const extractedMsg = this.extractErrorMessage(error);
                const classification = this.classifyError(error, extractedMsg);

                // If rate limited with a large delay, escalate to component for continuation
                if (classification.isRateLimit) {
                    const apiDelay = this.parseRetryDelay(extractedMsg);
                    if (apiDelay && apiDelay > RATE_LIMIT_CONTINUATION_THRESHOLD_MS) {
                        this.safeLog(context, 'warn', `Run job rate limited: retry in ${Math.ceil(apiDelay / 1000)}s — escalating to component`);
                        throw new RateLimitError(apiDelay, extractedMsg);
                    }
                }

                if (attempt === maxRetries || !classification.isRetryable) {
                    this.safeLog(context, 'error', `Run job failed (attempt ${attempt}/${maxRetries}): ${extractedMsg}`);
                    throw error;
                }

                // Short delay — retry in-process
                const exponentialBackoff = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
                const backoffTime = Math.min(exponentialBackoff, 30000);
                this.safeLog(context, 'warn', `Retry ${attempt}/${maxRetries}: Run job failed — waiting ${Math.ceil(backoffTime / 1000)}s`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }

        throw lastError || new Error('Failed to run job after multiple attempts');
    },

    /**
     * Parse retry delay from Google Ads API error messages
     * Examples: "Too many requests. Retry in 3 seconds." -> 3000ms
     */
    parseRetryDelay(errorMessage) {
        if (!errorMessage) return null;
        
        const retryMatch = errorMessage.match(/retry in (\d+) seconds?/i);
        if (retryMatch) {
            return parseInt(retryMatch[1]) * 1000; // Convert to milliseconds
        }
        
        return null;
    },

    /**
     * Split array into chunks for batching large datasets
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    },

    /**
     * Format seconds into human-readable time strings
     * Examples: "2m 30s", "1h 15m", "45s"
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
    }
};

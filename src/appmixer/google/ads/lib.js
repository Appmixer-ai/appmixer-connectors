const { GoogleAdsApi } = require('google-ads-api');
const csv = require('csv-parser');
const { Readable } = require('stream');

module.exports = {

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
                context.log('warn', `Failed to send progress update: ${error.message}`);
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
                        context.log('debug', `Invalid email format: ${email || 'empty'}`);
                        return;
                    }

                    validRows++;
                    if (!segmentGroups[segment]) {
                        segmentGroups[segment] = [];
                    }
                    segmentGroups[segment].push(email);
                })
                .on('end', () => {
                    context.log('info', `CSV parsing completed: ${totalRows} total, ${validRows} valid, ${invalidRows} invalid`);
                    resolve(segmentGroups);
                })
                .on('error', (error) => {
                    context.log('error', `CSV parsing failed: ${this.extractErrorMessage(error)}`);
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
                context.log('info', `Created OfflineUserDataJob: ${resourceName}`);
                return resourceName;

            } catch (error) {
                lastError = error;
                const extractedMsg = this.extractErrorMessage(error);

                // Check for retryable errors
                const isRateLimit = extractedMsg.toLowerCase().includes('rate limit') ||
                    extractedMsg.toLowerCase().includes('quota') ||
                    error.code === 8; // RESOURCE_EXHAUSTED

                const isNetworkError = extractedMsg.toLowerCase().includes('network') ||
                    extractedMsg.toLowerCase().includes('timeout') ||
                    error.code === 14; // UNAVAILABLE

                const isRetryableError = isRateLimit || isNetworkError;

                if (attempt === maxRetries || !isRetryableError) {
                    context.log('error', `Create job failed (${isRetryableError ? 'retryable' : 'non-retryable'}, attempt ${attempt}/${maxRetries}): ${extractedMsg}`);
                    throw error;
                }

                const backoffTime = Math.min(
                    initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    30000
                );

                const errorType = isRateLimit ? 'RATE_LIMIT' : 'NETWORK_ERROR';
                context.log('warn', `Retry ${attempt}/${maxRetries}: Create job failed (${errorType}) - waiting ${Math.ceil(backoffTime/1000)}s`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }

        throw lastError || new Error('Failed to create job after multiple attempts');
    },

    /**
     * Add user data operations to OfflineUserDataJob with retry logic
     * Handles rate limits, network errors, and concurrent modifications
     */
    async addOperations(context, customer, customerId, jobResourceName, operations, maxRetries = 3, initialDelayMs = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Use correct google-ads-api npm package method
                await customer.offlineUserDataJobs.addOfflineUserDataJobOperations({
                    resource_name: jobResourceName,
                    operations: operations,
                    enable_partial_failure: true
                });

                context.log('info', `Added ${operations.length} operations to job`);
                return;

            } catch (error) {
                lastError = error;
                const extractedMsg = this.extractErrorMessage(error);

                // Check for retryable errors
                const isRateLimit = extractedMsg.toLowerCase().includes('rate limit') ||
                    extractedMsg.toLowerCase().includes('quota') ||
                    error.code === 8; // RESOURCE_EXHAUSTED

                const isNetworkError = extractedMsg.toLowerCase().includes('network') ||
                    extractedMsg.toLowerCase().includes('timeout') ||
                    error.code === 14; // UNAVAILABLE

                const isConcurrentModification = extractedMsg.toLowerCase().includes('concurrent') ||
                    extractedMsg.toLowerCase().includes('modified') ||
                    error.code === 10; // ABORTED

                const isRetryableError = isRateLimit || isNetworkError || isConcurrentModification;

                if (attempt === maxRetries || !isRetryableError) {
                    context.log('error', `Add operations failed (${isRetryableError ? 'retryable' : 'non-retryable'}, attempt ${attempt}/${maxRetries}): ${extractedMsg}`);
                    throw error;
                }

                const backoffTime = Math.min(
                    initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    30000
                );

                const errorType = isConcurrentModification ? 'CONCURRENT_MODIFICATION' :
                    isRateLimit ? 'RATE_LIMIT' : 'NETWORK_ERROR';
                context.log('warn', `Retry ${attempt}/${maxRetries}: Add operations failed (${errorType}) - waiting ${Math.ceil(backoffTime/1000)}s`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }

        throw lastError || new Error('Failed to add operations after multiple attempts');
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
                await customer.offlineUserDataJobs.runOfflineUserDataJob({
                    resource_name: jobResourceName
                });

                context.log('info', `Started job execution: ${jobResourceName}`);
                return;

            } catch (error) {
                lastError = error;
                const extractedMsg = this.extractErrorMessage(error);

                // Check for retryable errors
                const isRateLimit = extractedMsg.toLowerCase().includes('rate limit') ||
                    extractedMsg.toLowerCase().includes('quota') ||
                    error.code === 8; // RESOURCE_EXHAUSTED

                const isNetworkError = extractedMsg.toLowerCase().includes('network') ||
                    extractedMsg.toLowerCase().includes('timeout') ||
                    error.code === 14; // UNAVAILABLE

                const isConcurrentModification = extractedMsg.toLowerCase().includes('concurrent') ||
                    extractedMsg.toLowerCase().includes('modified') ||
                    error.code === 10; // ABORTED

                const isRetryableError = isRateLimit || isNetworkError || isConcurrentModification;

                if (attempt === maxRetries || !isRetryableError) {
                    context.log('error', `Run job failed (${isRetryableError ? 'retryable' : 'non-retryable'}, attempt ${attempt}/${maxRetries}): ${extractedMsg}`);
                    throw error;
                }

                const backoffTime = Math.min(
                    initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    30000
                );

                const errorType = isConcurrentModification ? 'CONCURRENT_MODIFICATION' :
                    isRateLimit ? 'RATE_LIMIT' : 'NETWORK_ERROR';
                context.log('warn', `Retry ${attempt}/${maxRetries}: Run job failed (${errorType}) - waiting ${Math.ceil(backoffTime/1000)}s`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }

        throw lastError || new Error('Failed to run job after multiple attempts');
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

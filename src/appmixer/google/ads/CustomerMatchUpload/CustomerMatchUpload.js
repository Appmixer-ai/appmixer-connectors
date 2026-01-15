/**
 * Google Ads Customer Match Upload Component
 *
 * Replicates the Scala google-ads-activator functionality:
 * - Reads CSV file with customer data
 * - Groups users by segment
 * - Maps segments to Google Ads User List IDs
 * - Creates OfflineUserDataJobs
 * - Uploads user data with consent metadata
 * - Supports REPLACE (clear first) and ADD (append) modes
 */

'use strict';

const { GoogleAdsApi, enums } = require('google-ads-api');
const { parse } = require('csv-parse');


// Continuation pattern constants (inspired by Facebook Business component)
// These prevent Appmixer's 25-minute timeout by breaking long uploads into continuation windows
const TIMEOUT_TRIGGER_SECONDS = parseInt(process.env.TIMEOUT_TRIGGER_SECONDS) || (60 * 4); // 4 minutes - jump out before Appmixer's limit
const TIMEOUT_SECONDS = parseInt(process.env.TIMEOUT_SECONDS) || 60; // 1 minute - minimum Appmixer timeout
const MAX_CONTINUATION_PERIOD_SECONDS = parseInt(process.env.MAX_CONTINUATION_PERIOD_SECONDS) || (60 * 60 * 48); // 48 hours max

module.exports = {
    /**
     * Safely send progress updates without crashing if context is destroyed
     * This can happen when async operations continue after component has returned
     */
    async safeSendProgress(context, data, port = 'progress') {
        try {
            await context.sendJson(data, port);
        } catch (error) {
            // Context destroyed - component already finished or timed out
            // Silently ignore - this is expected when async operations complete after main flow
            // The 10-second delay before returning to 'out' ensures most progress messages complete
        }
    },

    /**
     * Extract human-readable error message from Google Ads API error object
     * Google Ads errors have structure: { errors: [{message, error_code}], request_id }
     * Standard JS errors have: { message, stack, code }
     */
    extractErrorMessage(error) {
        // Try standard error.message first
        if (error.message) {
            return error.message;
        }

        // Try Google Ads API nested error structure
        if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
            const firstError = error.errors[0];
            let msg = firstError.message || '';

            // Add error code if available
            if (firstError.error_code) {
                const codeStr = JSON.stringify(firstError.error_code);
                msg += ` [Code: ${codeStr}]`;
            }

            // Add request ID if available
            if (error.request_id) {
                msg += ` [Request ID: ${error.request_id}]`;
            }

            return msg;
        }

        // Fallback: try to stringify the error
        try {
            return JSON.stringify(error);
        } catch (e) {
            return String(error);
        }
    },

    async receive(context) {
        // Check if this is a continuation from a previous timeout
        const isContinuation = !!context.messages.timeout;

        // Error collector to capture all internal errors for debugging
        const internalErrors = [];
        const originalLogError = context.log.bind(context);

        // Wrap context.log to capture error logs
        // CRITICAL: Appmixer requires message to be a STRING, not an object
        context.log = function(level, message, ...args) {
            // Ensure message is always a string
            const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);

            if (level === 'error') {
                internalErrors.push(`[${level.toUpperCase()}] ${stringMessage}`);
            }

            // Call original with string message only (no extra args to avoid type errors)
            return originalLogError(level, stringMessage);
        };

        // Extract input parameters from either initial message or continuation message
        let fileId, clientId, clientSecret, refreshToken, developerToken, loginCustomerId, customerId;
        let segmentColumnIndex, emailColumnIndex, segmentToUserList, uploadMode, adPersonalization, adUserData;
        let batchSize, containsHeaders, columnSeparator;

        // State variables for continuation
        let timeStart, processedSegments, segmentGroups, userListJobs, currentSegmentNumber;
        let batchesCompletedOverall, totalBatchesOverall, totalUsersOverall, totalSegments;
        let jobCreationDelayMs, results;

        if (isContinuation) {
            // Resume from timeout - restore all state
            const msg = context.messages.timeout.content;
            fileId = msg.fileId;
            clientId = msg.clientId;
            clientSecret = msg.clientSecret;
            refreshToken = msg.refreshToken;
            developerToken = msg.developerToken;
            loginCustomerId = msg.loginCustomerId;
            customerId = msg.customerId;
            segmentColumnIndex = msg.segmentColumnIndex;
            emailColumnIndex = msg.emailColumnIndex;
            segmentToUserList = msg.segmentToUserList;
            uploadMode = msg.uploadMode;
            adPersonalization = msg.adPersonalization;
            adUserData = msg.adUserData;
            batchSize = msg.batchSize;
            containsHeaders = msg.containsHeaders;
            columnSeparator = msg.columnSeparator;

            // Restore continuation state
            timeStart = new Date(msg.timeStart);
            processedSegments = msg.processedSegments || [];
            // segmentGroups will be re-parsed from CSV
            userListJobs = new Map(msg.userListJobs || []);
            currentSegmentNumber = msg.currentSegmentNumber || 0;
            batchesCompletedOverall = msg.batchesCompletedOverall || 0;
            totalBatchesOverall = msg.totalBatchesOverall || 0;
            totalUsersOverall = msg.totalUsersOverall || 0;
            totalSegments = msg.totalSegments || 0;
            jobCreationDelayMs = msg.jobCreationDelayMs || 0;
            results = msg.results || {
                totalJobs: 0,
                totalUsers: 0,
                jobsBySegment: {},
                errors: [],
                internalErrors: [],
                success: true
            };

            context.log('info', '🔄 CONTINUATION: Resuming from previous timeout');
            context.log('info', `   Processed segments: ${processedSegments.length}/${totalSegments || 'unknown'}`);
            context.log('info', `   Batches completed: ${batchesCompletedOverall}/${totalBatchesOverall}`);
            context.log('info', `   Elapsed time: ${Math.floor((new Date() - timeStart) / 1000)}s`);
        } else {
            // Initial execution - extract from input message
            const msg = context.messages.in.content;
            fileId = msg.fileId;
            clientId = msg.clientId;
            clientSecret = msg.clientSecret;
            refreshToken = msg.refreshToken;
            developerToken = msg.developerToken;
            loginCustomerId = msg.loginCustomerId;
            customerId = msg.customerId;
            segmentColumnIndex = msg.segmentColumnIndex !== undefined ? msg.segmentColumnIndex : 1;
            emailColumnIndex = msg.emailColumnIndex !== undefined ? msg.emailColumnIndex : 0;
            segmentToUserList = msg.segmentToUserList;
            uploadMode = msg.uploadMode || 'REPLACE';
            adPersonalization = msg.adPersonalization || 'GRANTED';
            adUserData = msg.adUserData || 'GRANTED';
            batchSize = msg.batchSize || 10000;
            containsHeaders = msg.containsHeaders !== undefined ? msg.containsHeaders : true;
            columnSeparator = msg.columnSeparator || ',';

            // Initialize state for first execution
            timeStart = new Date();
            processedSegments = [];
            segmentGroups = null; // Will be populated after CSV parsing
            userListJobs = new Map();
            currentSegmentNumber = 0;
            batchesCompletedOverall = 0;
            totalBatchesOverall = 0;
            totalUsersOverall = 0;
            totalSegments = 0;
            jobCreationDelayMs = 0;
            results = {
                totalJobs: 0,
                totalUsers: 0,
                jobsBySegment: {},
                errors: [],
                internalErrors: [],
                success: true
            };
        }

        const errors = results.errors; // Reference to results.errors for backward compatibility

        try {
            // Check if we've exceeded the maximum continuation period
            if ((new Date() - timeStart) >= (MAX_CONTINUATION_PERIOD_SECONDS * 1000)) {
                throw new context.CancelError(`Upload exceeded maximum time limit (${MAX_CONTINUATION_PERIOD_SECONDS / 3600} hours). Please retry with smaller batches or contact support.`);
            }
            // Validate fileId - can be string (Appmixer ID) or object (Google Drive file)
            if (!fileId) {
                throw new Error('Missing fileId. Please provide an Appmixer file ID or Google Drive file object.');
            }

            // Validate OAuth2 credentials are present
            if (!clientId || !clientSecret || !refreshToken) {
                throw new Error('Missing OAuth2 credentials. Please provide clientId, clientSecret, and refreshToken.');
            }

            if (!developerToken) {
                throw new Error('Missing Developer Token. Please provide a valid Google Ads API Developer Token.');
            }

            if (!customerId) {
                throw new Error('Missing Customer ID. Please provide the Google Ads Customer Account ID.');
            }

            context.log('info', `Initializing Google Ads API client for customer ${customerId}`);
            context.log('info', `Running in SEQUENTIAL mode (no concurrency) for maximum reliability`);

            // Parse segment to user list mapping
            let segmentMapping;
            try {
                segmentMapping = typeof segmentToUserList === 'string'
                    ? JSON.parse(segmentToUserList)
                    : segmentToUserList;
            } catch (e) {
                context.log('error', `Failed to parse segmentToUserList. Input value: ${JSON.stringify(segmentToUserList)}`);
                throw new Error(`Invalid segmentToUserList JSON: ${e.message}. Check that keys and values use double quotes, no trailing commas, and valid JSON syntax.`);
            }

            // Normalize segment mapping to support both formats:
            // Format 1: { "segment": "userListId" }
            // Format 2: { "segment": ["userListId1", "userListId2"] }
            const normalizedMapping = {};
            for (const [segment, value] of Object.entries(segmentMapping)) {
                // Convert single value to array for consistent processing
                // Filter out null, undefined, empty strings
                const arrayValue = Array.isArray(value) ? value : [value];
                const validValues = arrayValue.filter(v => v != null && v !== '');

                if (validValues.length > 0) {
                    normalizedMapping[segment] = validValues;
                } else {
                    context.log('warn', `Segment '${segment}' has no valid User List IDs, skipping`);
                }
            }

            // Log the parsed segment mapping
            context.log('info', `Segment mapping: ${JSON.stringify(segmentMapping)}`);
            context.log('info', `Normalized mapping (segment → User List IDs): ${JSON.stringify(normalizedMapping)}`);

            // Initialize Google Ads API client with OAuth2 credentials from input parameters
            const client = new GoogleAdsApi({
                client_id: clientId,
                client_secret: clientSecret,
                developer_token: developerToken
            });

            // Get customer with refresh token (note: customer_account_id in newer API versions)
            const customer = client.Customer({
                customer_account_id: customerId,
                refresh_token: refreshToken,
                login_customer_id: loginCustomerId || undefined
            });

            // Helper function to schedule continuation when timeout is approaching
            const scheduleContinuation = async (reason) => {
                context.log('info', '⏸️  SCHEDULING CONTINUATION');
                context.log('info', `   Reason: ${reason}`);
                context.log('info', `   Processed segments: ${processedSegments.length}/${segmentGroups ? Object.keys(segmentGroups).length : totalSegments || 'unknown'}`);
                context.log('info', `   Batches completed: ${batchesCompletedOverall}/${totalBatchesOverall}`);
                context.log('info', `   Time elapsed: ${Math.floor((new Date() - timeStart) / 1000)}s`);
                context.log('info', `   Next continuation in ${TIMEOUT_SECONDS}s`);

                // Save all state for continuation
                return context.setTimeout({
                    fileId,
                    clientId,
                    clientSecret,
                    refreshToken,
                    developerToken,
                    loginCustomerId,
                    customerId,
                    segmentColumnIndex,
                    emailColumnIndex,
                    segmentToUserList,
                    uploadMode,
                    adPersonalization,
                    adUserData,
                    batchSize,
                    containsHeaders,
                    columnSeparator,
                    // Continuation state
                    timeStart: timeStart.getTime(),
                    processedSegments,
                    userListJobs: Array.from(userListJobs.entries()),
                    currentSegmentNumber,
                    batchesCompletedOverall,
                    totalBatchesOverall,
                    totalUsersOverall,
                    totalSegments,
                    jobCreationDelayMs,
                    results
                }, TIMEOUT_SECONDS * 1000);
            };

            let fileStream;

            // Only parse CSV if this is the first execution (not a continuation)
            if (!isContinuation) {
                // Handle different file input types
                if (typeof fileId === 'object' && fileId.fileContent) {
                    // Direct file content from Google Drive component
                    context.log('info', 'Processing file content directly from Google Drive');
                    const { Readable } = require('stream');
                    fileStream = Readable.from(
                        typeof fileId.fileContent === 'string'
                            ? Buffer.from(fileId.fileContent, fileId.encoding || 'utf8')
                            : fileId.fileContent
                    );
                } else if (typeof fileId === 'string') {
                    // Appmixer file ID
                    context.log('info', `Reading CSV file with ID: ${fileId}`);
                    try {
                        fileStream = await context.getFileReadStream(fileId);
                    } catch (fileError) {
                        throw new Error(`Failed to read file '${fileId}': ${fileError.message}. Ensure the file exists in Appmixer storage.`);
                    }
                } else {
                    throw new Error(`Invalid fileId type: ${typeof fileId}. Expected string (Appmixer ID) or object (Google Drive file).`);
                }

                segmentGroups = await this.parseCSV(
                    fileStream,
                    {
                        segmentColumnIndex,
                        emailColumnIndex,
                        containsHeaders,
                        columnSeparator,
                        batchSize
                    },
                    context
                );

                context.log('info', `Parsed ${segmentGroups ? Object.keys(segmentGroups).length : 0} segments from CSV`);
            } else {
                context.log('info', 'Skipping CSV parsing - using cached segment groups from continuation');
            }

            // Calculate overall totals for general progress tracking (only if first execution)
            const segments = segmentGroups ? Object.entries(segmentGroups) : [];
            if (!isContinuation) {
                totalSegments = 0; // Only count configured segments
                totalBatchesOverall = 0;
                totalUsersOverall = 0;

                // Pre-calculate total batches across all CONFIGURED segments only
                for (const [segment, emails] of segments) {
                    if (normalizedMapping[segment]) {
                        totalSegments++; // Count only configured segments
                        // Each segment may map to multiple User Lists
                        const userListCount = normalizedMapping[segment].length;
                        const segmentBatches = Math.ceil(emails.length / batchSize) * userListCount;
                        totalBatchesOverall += segmentBatches;
                        totalUsersOverall += emails.length * userListCount;
                    }
                }
            }

            context.log('info', `Overall: ${totalSegments} configured segments (${segments.length} in CSV), ${totalUsersOverall} users, ${totalBatchesOverall} total batches`);

            const overallStartTime = Date.now();
            let lastProgressLogTime = 0; // Throttle progress logs to every 5 seconds

            // Track execution time for this continuation window
            const receiveTimeStart = Date.now();

            // Process each segment
            const JOB_MIN_DELAY = 0;
            const JOB_MAX_DELAY = 10000; // Cap at 10 seconds for job creation
            const JOB_DELAY_INCREMENT = 500; // Increase by 500ms on rate limit
            const JOB_DELAY_DECREMENT = 50; // Decrease by 50ms on success

            for (const [segment, emails] of segments) {
                // Check for timeout BEFORE processing each segment
                if ((new Date() - receiveTimeStart) >= TIMEOUT_TRIGGER_SECONDS * 1000) {
                    context.log('info', '⏱️  Timeout approaching - scheduling continuation');
                    return await scheduleContinuation('timeout_trigger');
                }

                // Skip already-processed segments (continuation logic)
                if (processedSegments.includes(segment)) {
                    context.log('info', `⏭️  Skipping already-processed segment '${segment}'`);
                    continue;
                }

                // Declare userListId OUTSIDE try block so it's accessible in catch block
                let userListId = null;

                try {
                    // Check if segment is configured
                    if (!normalizedMapping[segment]) {
                        const error = `Segment '${segment}' not found in configuration. Skipping ${emails.length} users.`;
                        context.log('warn', error);
                        errors.push(error);
                        continue;
                    }

                    currentSegmentNumber++;

                    // Get all User Lists for this segment (may be multiple)
                    const userListIds = normalizedMapping[segment];

                    // Defensive check: ensure userListIds is a valid array
                    if (!userListIds || !Array.isArray(userListIds) || userListIds.length === 0) {
                        const error = `Segment '${segment}' has invalid or empty User List mapping. Expected array of User List IDs, got: ${JSON.stringify(userListIds)}`;
                        context.log('error', error);
                        errors.push(error);
                        continue;
                    }

                    context.log('info', `Processing segment '${segment}': ${emails.length} users → ${userListIds.length} User List(s)`);
                    context.log('info', `  User Lists: ${userListIds.join(', ')}`);

                    // Process each User List for this segment
                    for (userListId of userListIds) {
                        const userListResourceName = `customers/${customerId}/userLists/${userListId}`;

                        context.log('info', `  → Uploading to User List ${userListId}`);

                        // Split into API batches (Google Ads API limit)
                        const batches = this.chunkArray(emails, batchSize);
                        context.log('info', `Split into ${batches.length} API batch(es) of max ${batchSize} users`);

                        // Track timing for ETA calculation
                        const segmentStartTime = Date.now();
                        let lastSegmentProgressLogTime = 0; // Throttle segment progress logs

                        // Adaptive delay system: starts at 0, increases on rate limits, decreases on success
                        let adaptiveDelayMs = 0;
                        const MIN_DELAY = 0;
                        const MAX_DELAY = 5000; // Cap at 5 seconds
                        const DELAY_INCREMENT = 100; // Increase by 100ms on rate limit
                        const DELAY_DECREMENT = 10; // Decrease by 10ms on success

                        // Emit initial progress for this segment
                        await this.safeSendProgress(context, {
                            segment,
                            totalBatches: batches.length,
                            totalUsers: emails.length,
                            currentBatch: 0,
                            status: 'starting',
                            elapsedSeconds: 0,
                            etaSeconds: null,
                            message: `Starting upload for segment '${segment}': ${emails.length} users in ${batches.length} batches`
                        }, 'progress');

                        let jobResourceName = null;
                        let totalUploaded = 0;
                        let isNewJob = false; // Track if we created a new job or reusing existing

                        // Check if we already have a job for this User List
                        if (userListJobs.has(userListId)) {
                            const existingJob = userListJobs.get(userListId);
                            jobResourceName = existingJob.jobResourceName;
                            existingJob.segments.push(segment);
                            context.log('info', `♻️  Reusing existing job for User List ${userListId} (segments: ${existingJob.segments.join(', ')})`);
                            context.log('info', `   Job: ${jobResourceName}`);
                            context.log('info', `   This prevents CONCURRENT_MODIFICATION error`);
                            isNewJob = false;
                        } else {
                            // Remove adaptive delay to prevent timeouts
                            // Fast job creation for better performance

                            // Create new job for this User List
                            context.log('info', `Creating NEW OfflineUserDataJob for segment '${segment}' → User List ${userListId}`);
                            context.log('info', `🔍 TRACE: About to call createUserDataJob...`);
                            try {
                                jobResourceName = await this.createUserDataJob(
                                    customer,
                                    customerId,
                                    userListResourceName,
                                    { adPersonalization, adUserData },
                                    context
                                );
                                context.log('info', `🔍 TRACE: createUserDataJob completed successfully`);

                                // Success: decrease job creation delay
                                if (jobCreationDelayMs > JOB_MIN_DELAY) {
                                    jobCreationDelayMs = Math.max(JOB_MIN_DELAY, jobCreationDelayMs - JOB_DELAY_DECREMENT);
                                    context.log('info', `✓ Job creation success - decreased delay to ${jobCreationDelayMs}ms`);
                                }

                                // Track this job for the User List
                                userListJobs.set(userListId, {
                                    jobResourceName,
                                    segments: [segment]
                                });
                                isNewJob = true;
                            } catch (createError) {
                                // Check if this is a rate limit error during job creation
                                // Google Ads API errors have structure: error.errors[0].message
                                const errorMsg = (createError.message || '').toLowerCase();
                                const errorCode = String(createError.code || '').toLowerCase();

                                // Check nested error structure for Google Ads API
                                let nestedErrorMsg = '';
                                let nestedErrorCode = '';
                                if (createError.errors && Array.isArray(createError.errors) && createError.errors[0]) {
                                    nestedErrorMsg = (createError.errors[0].message || '').toLowerCase();
                                    if (createError.errors[0].error_code) {
                                        nestedErrorCode = JSON.stringify(createError.errors[0].error_code).toLowerCase();
                                    }
                                }

                                const wasRateLimited = createError.code === 429 ||
                                    createError.code === 8 ||
                                    errorCode === 'resource_exhausted' ||
                                    errorMsg.includes('rate limit') ||
                                    errorMsg.includes('too many requests') ||
                                    errorMsg.includes('quota exceeded') ||
                                    errorMsg.includes('retry in') ||
                                    nestedErrorMsg.includes('rate limit') ||
                                    nestedErrorMsg.includes('too many requests') ||
                                    nestedErrorMsg.includes('quota exceeded') ||
                                    nestedErrorMsg.includes('retry in') ||
                                    nestedErrorCode.includes('resource_exhausted') ||
                                    nestedErrorCode.includes('quota_error');

                                if (wasRateLimited) {
                                    // Rate limit detected: increase job creation delay
                                    jobCreationDelayMs = Math.min(JOB_MAX_DELAY, jobCreationDelayMs + JOB_DELAY_INCREMENT);
                                    context.log('warn', `⚠️  Rate limit detected during job creation - increased delay to ${jobCreationDelayMs}ms`);
                                }

                                context.log('error', `🚨 OUTER CATCH - createUserDataJob failed!`);
                                context.log('error', `   Error: ${createError.message}`);
                                context.log('error', `   Type: ${createError.constructor.name}`);
                                context.log('error', `   Was rate limited: ${wasRateLimited}`);

                                // FAIL FAST: If rate limited during job creation, stop processing all segments
                                // No point continuing - we'll just hit the same rate limit on other segments
                                if (wasRateLimited) {
                                    const errorMsg = this.extractErrorMessage(createError);
                                    context.log('error', `🛑 FAIL FAST: Rate limit hit during job creation. Stopping all segment processing.`);
                                    context.log('error', `   ${errorMsg}`);

                                    // Send progress update before returning
                                    await this.safeSendProgress(context, {
                                        segment,
                                        status: 'rate_limited',
                                        message: `Rate limit exceeded during job creation: ${errorMsg}`,
                                        totalSegments,
                                        currentSegment: currentSegmentNumber,
                                        error: errorMsg
                                    });

                                    // Return with clear error message
                                    results.success = false;
                                    results.errors.push(`Rate limit exceeded during job creation: ${errorMsg}. Please wait and retry later.`);
                                    results.internalErrors = internalErrors;

                                    // Remove the 10-second wait that was causing Input Queue timeouts
                                    context.log('info', '⚡ Fast return - no artificial delays');

                                    return context.sendJson(results, 'out');
                                }

                                throw createError; // Re-throw non-rate-limit errors to segment catch
                            }
                        }

                        for (let i = 0; i < batches.length; i++) {
                            const batch = batches[i];
                            const isFirstBatch = i === 0;
                            const progress = ((i + 1) / batches.length * 100).toFixed(1);

                            if (isFirstBatch) {
                                // CRITICAL: removeAll logic
                                // - REPLACE mode + NEW job: removeAll = true (clear existing data)
                                // - REPLACE mode + REUSED job: removeAll = false (already cleared by first segment)
                                // - ADD mode: removeAll = false (always append)
                                const removeAllFirst = uploadMode === 'REPLACE' && isNewJob;

                                context.log('info', `[${progress}%] Batch 1/${batches.length}: Adding ${batch.length} users (mode: ${uploadMode}, removeAll: ${removeAllFirst}, newJob: ${isNewJob})`);
                                context.log('info', `🔍 TRACE: About to call addOperations (batch 1)...`);

                                const batchStartTime = Date.now();
                                let wasSuccessful = false;
                                let wasRateLimited = false;
                                let wasConcurrentModification = false;
                                try {
                                    // Prepare progress info for retry visibility
                                    const progressInfoForRetry = {
                                        segment,
                                        totalBatches: batches.length,
                                        currentBatch: 1,
                                        batchSize: batch.length
                                    };

                                    await this.addOperations(
                                        customer,
                                        jobResourceName,
                                        batch,
                                        removeAllFirst,
                                        context,
                                        progressInfoForRetry
                                    );
                                    context.log('info', `🔍 TRACE: addOperations (batch 1) completed successfully`);
                                    wasSuccessful = true;

                                    // Success: decrease adaptive delay (faster uploads when no rate limits)
                                    if (adaptiveDelayMs > MIN_DELAY) {
                                        adaptiveDelayMs = Math.max(MIN_DELAY, adaptiveDelayMs - DELAY_DECREMENT);
                                        context.log('info', `✓ Success - decreased adaptive delay to ${adaptiveDelayMs}ms`);
                                    }
                                } catch (addError) {
                                    // Check if this is a rate limit error (even after all retries exhausted)
                                    // Google Ads API errors have structure: error.errors[0].message
                                    const errorMsg = (addError.message || '').toLowerCase();
                                    const errorCode = String(addError.code || '').toLowerCase();

                                    // Check nested error structure for Google Ads API
                                    let nestedErrorMsg = '';
                                    let nestedErrorCode = '';
                                    if (addError.errors && Array.isArray(addError.errors) && addError.errors[0]) {
                                        nestedErrorMsg = (addError.errors[0].message || '').toLowerCase();
                                        if (addError.errors[0].error_code) {
                                            nestedErrorCode = JSON.stringify(addError.errors[0].error_code).toLowerCase();
                                        }
                                    }

                                    wasRateLimited = addError.code === 429 ||
                                        addError.code === 8 || // gRPC RESOURCE_EXHAUSTED
                                        (addError.status && addError.status === 429) ||
                                        errorCode === 'resource_exhausted' ||
                                        errorMsg.includes('rate limit') ||
                                        errorMsg.includes('too many requests') ||
                                        errorMsg.includes('quota exceeded') ||
                                        errorMsg.includes('retry in') ||
                                        nestedErrorMsg.includes('rate limit') ||
                                        nestedErrorMsg.includes('too many requests') ||
                                        nestedErrorMsg.includes('quota exceeded') ||
                                        nestedErrorMsg.includes('retry in') ||
                                        nestedErrorCode.includes('resource_exhausted') ||
                                        nestedErrorCode.includes('quota_error');

                                    wasConcurrentModification = errorMsg.includes('concurrent_modification') ||
                                        errorMsg.includes('concurrent modification') ||
                                        nestedErrorMsg.includes('concurrent_modification') ||
                                        nestedErrorMsg.includes('concurrent modification') ||
                                        nestedErrorCode.includes('concurrent_modification') ||
                                        nestedErrorCode.includes('database_error');

                                    if (wasRateLimited) {
                                        // Rate limit detected: increase adaptive delay for next batches
                                        adaptiveDelayMs = Math.min(MAX_DELAY, adaptiveDelayMs + DELAY_INCREMENT);
                                        context.log('warn', `⚠️  Rate limit detected - increased adaptive delay to ${adaptiveDelayMs}ms for next batches`);
                                    }

                                    context.log('error', `🚨 OUTER CATCH - addOperations failed (retries exhausted or non-retryable)`);
                                    context.log('error', `   Error: ${addError.message}`);
                                    context.log('error', `   Type: ${addError.constructor.name}`);
                                    context.log('error', `   Was rate limited: ${wasRateLimited}`);
                                    context.log('error', `   Was concurrent modification: ${wasConcurrentModification}`);
                                    throw addError; // Re-throw to segment catch
                                }

                                // Calculate timing and ETA for segment
                                const batchEndTime = Date.now();
                                const elapsedMs = batchEndTime - batchStartTime;
                                const elapsedSeconds = Math.floor(elapsedMs / 1000);
                                const segmentAvgTimePerBatch = elapsedMs;
                                const segmentRemainingBatches = batches.length - 1;
                                const etaSeconds = segmentRemainingBatches > 0 ? Math.floor((segmentAvgTimePerBatch * segmentRemainingBatches) / 1000) : 0;

                                batchesCompletedOverall++;
                                const overallElapsedMs = Date.now() - overallStartTime;
                                const overallElapsedSeconds = Math.floor(overallElapsedMs / 1000);
                                const overallProgress = ((batchesCompletedOverall / totalBatchesOverall) * 100).toFixed(1);
                                const avgTimePerBatch = overallElapsedMs / batchesCompletedOverall;
                                const remainingBatches = totalBatchesOverall - batchesCompletedOverall;
                                const overallEtaSeconds = Math.floor((avgTimePerBatch * remainingBatches) / 1000);

                                // Build message with general and segment-specific progress
                                const generalMessage = `Segment ${currentSegmentNumber}/${totalSegments}, Batch ${batchesCompletedOverall}/${totalBatchesOverall} (${overallProgress}%) - ${this.formatTime(overallElapsedSeconds)} elapsed, ETA: ${this.formatTime(overallEtaSeconds)}`;
                                const segmentMessage = `Batch 1/${batches.length} uploaded (${progress}%) - ${this.formatTime(elapsedSeconds)} elapsed${etaSeconds ? ', ETA: ' + this.formatTime(etaSeconds) : ''}`;
                                const combinedMessage = `${generalMessage}\n${segmentMessage}`;

                                // Throttle logs: only log every 5 seconds or on first/last batch
                                const now = Date.now();
                                const shouldLog = (now - lastSegmentProgressLogTime) >= 5000 || i === 0 || i === batches.length - 1;
                                if (shouldLog) {
                                    // Log overall progress
                                    context.log('info', `📊 GENERAL: ${generalMessage}`);

                                    // Log segment-specific progress
                                    const segmentProgress = Math.round(((i + 1) / batches.length) * 100);
                                    context.log('info', `📦 SEGMENT: ${segmentMessage}`);
                                    context.log('info', `   Progress: ${totalUploaded}/${emails.length} users (${segmentProgress}%)`);

                                    lastSegmentProgressLogTime = now;
                                }

                                // Emit progress (throttled to 5-second intervals like logs)
                                if (shouldLog) {
                                    await this.safeSendProgress(context, {
                                        segment,
                                        totalBatches: batches.length,
                                        currentBatch: 1,
                                        batchSize: batch.length,
                                        uploadedSoFar: batch.length,
                                        totalUsers: emails.length,
                                        progress: parseFloat(progress),
                                        elapsedSeconds,
                                        etaSeconds,
                                        status: 'uploading',
                                        message: combinedMessage
                                    }, 'progress');
                                }
                            } else {
                                // Subsequent batches: always ADD (never removeAll)

                                context.log('info', `[${progress}%] Batch ${i + 1}/${batches.length}: Adding ${batch.length} users (mode: ADD)`);
                                context.log('info', `🔍 TRACE: About to call addOperations (batch ${i + 1})...`);

                                let wasSuccessful = false;
                                let wasRateLimited = false;
                                let wasConcurrentModification = false;
                                try {
                                    // Prepare progress info for retry visibility
                                    const progressInfoForRetry = {
                                        segment,
                                        totalBatches: batches.length,
                                        currentBatch: i + 1,
                                        batchSize: batch.length
                                    };

                                    await this.addOperations(
                                        customer,
                                        jobResourceName,
                                        batch,
                                        false,
                                        context,
                                        progressInfoForRetry
                                    );
                                    context.log('info', `🔍 TRACE: addOperations (batch ${i + 1}) completed successfully`);
                                    wasSuccessful = true;

                                    // Success: decrease adaptive delay (faster uploads when no rate limits)
                                    if (adaptiveDelayMs > MIN_DELAY) {
                                        adaptiveDelayMs = Math.max(MIN_DELAY, adaptiveDelayMs - DELAY_DECREMENT);
                                        context.log('info', `✓ Success - decreased adaptive delay to ${adaptiveDelayMs}ms`);
                                    }
                                } catch (addError) {
                                    // Check if this was a rate limit error (even after all retries exhausted)
                                    // Google Ads API errors have structure: error.errors[0].message
                                    const errorMsg = (addError.message || '').toLowerCase();
                                    const errorCode = String(addError.code || '').toLowerCase();

                                    // Check nested error structure for Google Ads API
                                    let nestedErrorMsg = '';
                                    let nestedErrorCode = '';
                                    if (addError.errors && Array.isArray(addError.errors) && addError.errors[0]) {
                                        nestedErrorMsg = (addError.errors[0].message || '').toLowerCase();
                                        if (addError.errors[0].error_code) {
                                            nestedErrorCode = JSON.stringify(addError.errors[0].error_code).toLowerCase();
                                        }
                                    }

                                    wasRateLimited = addError.code === 429 ||
                                        addError.code === 8 ||
                                        errorCode === 'resource_exhausted' ||
                                        errorMsg.includes('rate limit') ||
                                        errorMsg.includes('too many requests') ||
                                        errorMsg.includes('quota exceeded') ||
                                        errorMsg.includes('retry in') ||
                                        nestedErrorMsg.includes('rate limit') ||
                                        nestedErrorMsg.includes('too many requests') ||
                                        nestedErrorMsg.includes('quota exceeded') ||
                                        nestedErrorMsg.includes('retry in') ||
                                        nestedErrorCode.includes('resource_exhausted') ||
                                        nestedErrorCode.includes('quota_error');

                                    wasConcurrentModification = errorMsg.includes('concurrent_modification') ||
                                        errorMsg.includes('concurrent modification') ||
                                        nestedErrorMsg.includes('concurrent_modification') ||
                                        nestedErrorMsg.includes('concurrent modification') ||
                                        nestedErrorCode.includes('concurrent_modification') ||
                                        nestedErrorCode.includes('database_error');

                                    if (wasRateLimited) {
                                        // Rate limit detected: increase adaptive delay for next batches
                                        adaptiveDelayMs = Math.min(MAX_DELAY, adaptiveDelayMs + DELAY_INCREMENT);
                                        context.log('warn', `⚠️  Rate limit detected - increased adaptive delay to ${adaptiveDelayMs}ms for next batches`);
                                    }

                                    context.log('error', `🚨 OUTER CATCH - addOperations (batch ${i + 1}) failed (retries exhausted or non-retryable)`);
                                    context.log('error', `   Error: ${addError.message}`);
                                    context.log('error', `   Type: ${addError.constructor.name}`);
                                    context.log('error', `   Was rate limited: ${wasRateLimited}`);
                                    context.log('error', `   Was concurrent modification: ${wasConcurrentModification}`);
                                    throw addError; // Re-throw to segment catch
                                }

                                // Calculate timing and ETA for segment
                                const elapsedMs = Date.now() - segmentStartTime;
                                const elapsedSeconds = Math.floor(elapsedMs / 1000);
                                const progressDecimal = parseFloat(progress) / 100;
                                const etaSeconds = progressDecimal > 0 ? Math.floor((elapsedMs / progressDecimal - elapsedMs) / 1000) : null;

                                // Calculate overall progress
                                batchesCompletedOverall++;
                                const overallElapsedMs = Date.now() - overallStartTime;
                                const overallElapsedSeconds = Math.floor(overallElapsedMs / 1000);
                                const overallProgress = ((batchesCompletedOverall / totalBatchesOverall) * 100).toFixed(1);
                                const avgTimePerBatch = overallElapsedMs / batchesCompletedOverall;
                                const remainingBatches = totalBatchesOverall - batchesCompletedOverall;
                                const overallEtaSeconds = Math.floor((avgTimePerBatch * remainingBatches) / 1000);

                                // Build message with general and segment-specific progress
                                const generalMessage = `Segment ${currentSegmentNumber}/${totalSegments}, Batch ${batchesCompletedOverall}/${totalBatchesOverall} (${overallProgress}%) - ${this.formatTime(overallElapsedSeconds)} elapsed, ETA: ${this.formatTime(overallEtaSeconds)}`;
                                const segmentMessage = `Batch ${i + 1}/${batches.length} uploaded (${progress}%) - ${this.formatTime(elapsedSeconds)} elapsed${etaSeconds ? ', ETA: ' + this.formatTime(etaSeconds) : ''}`;
                                const combinedMessage = `${generalMessage}\n${segmentMessage}`;

                                // Throttle logs: only log every 5 seconds or on first/last batch
                                const now = Date.now();
                                const shouldLog = (now - lastSegmentProgressLogTime) >= 5000 || i === batches.length - 1;
                                if (shouldLog) {
                                    context.log('info', `📊 GENERAL: ${generalMessage}`);
                                    context.log('info', `📦 SEGMENT: ${segmentMessage}`);
                                    lastSegmentProgressLogTime = now;
                                }

                                // Emit progress (throttled to 5-second intervals like logs)
                                if (shouldLog) {
                                    await this.safeSendProgress(context, {
                                        segment,
                                        totalBatches: batches.length,
                                        currentBatch: i + 1,
                                        batchSize: batch.length,
                                        uploadedSoFar: totalUploaded + batch.length,
                                        totalUsers: emails.length,
                                        progress: parseFloat(progress),
                                        elapsedSeconds,
                                        etaSeconds,
                                        status: 'uploading',
                                        message: combinedMessage
                                    }, 'progress');
                                }
                            }

                            totalUploaded += batch.length;

                            // Apply adaptive delay between batches (only if delay > 0)
                            // Remove adaptive delay to prevent timeouts
                            // Fast batch processing for better performance

                            // Progress is now handled by the throttled logs above
                        }

                        // Calculate final timing
                        const totalElapsedMs = Date.now() - segmentStartTime;
                        const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);

                        // Track segment completion (job will be run later, once per User List)
                        results.jobsBySegment[segment] = {
                            jobResourceName,
                            userListId,
                            usersUploaded: totalUploaded,
                            operationName: null, // Will be set after running job
                            status: 'PENDING', // Job created but not yet run
                            uploadMode
                        };

                        results.totalUsers += totalUploaded;

                        // Emit completion progress for this segment
                        await this.safeSendProgress(context, {
                            segment,
                            totalBatches: batches.length,
                            currentBatch: batches.length,
                            uploadedSoFar: totalUploaded,
                            totalUsers: emails.length,
                            progress: 100,
                            elapsedSeconds: totalElapsedSeconds,
                            etaSeconds: 0,
                            status: 'uploaded',
                            message: `Segment '${segment}' complete: ${totalUploaded} users uploaded in ${this.formatTime(totalElapsedSeconds)}`,
                            jobResourceName,
                            operationName: null
                        }, 'progress');

                        context.log('info', `✓ User List ${userListId} complete: ${totalUploaded} users uploaded`);

                    } // End of User List loop

                    // Mark segment as processed for continuation tracking
                    processedSegments.push(segment);
                    context.log('info', `✓ Segment '${segment}' complete - uploaded to ${userListIds.length} User List(s)`);

                } catch (error) {
                    // Serialize error properly - Google Ads API errors have special structure
                    let errorDetails = error.message || 'Unknown error';

                    // Log full error structure for debugging
                    context.log('error', `Error type: ${error.constructor.name}`);
                    context.log('error', `Error code: ${error.code}`);
                    context.log('error', `Error status: ${error.status}`);
                    context.log('error', `Error keys: ${Object.keys(error).join(', ')}`);

                    // Try to extract more details from the error object
                    if (error.errors && Array.isArray(error.errors)) {
                        errorDetails = error.errors.map(e => e.message || JSON.stringify(e)).join('; ');
                        context.log('error', `Error details array: ${JSON.stringify(error.errors)}`);
                    } else if (typeof error === 'object') {
                        try {
                            const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error));
                            errorDetails = serialized;
                            context.log('error', `Full error object: ${serialized}`);
                        } catch (e) {
                            errorDetails = this.extractErrorMessage(error);
                        }
                    }

                    // Include user list ID in error message for easier debugging
                    const userListInfo = userListId ? ` (User List ID: ${userListId})` : ' (User List ID: unknown)';

                    // Check if this error message indicates rate limiting
                    const errDetailsLower = errorDetails.toLowerCase();
                    const wasRateLimitError = errDetailsLower.includes('429') ||
                        errDetailsLower.includes('quota') ||
                        errDetailsLower.includes('resource_exhausted') ||
                        errDetailsLower.includes('rate limit') ||
                        errDetailsLower.includes('retry in');

                    // Wrap error to clarify it's from Google Ads API
                    const errorMsg = `❌ Google Ads API Error - Segment '${segment}'${userListInfo}: ${errorDetails} [Rate limit error: ${wasRateLimitError}]`;
                    context.log('error', errorMsg);
                    context.log('error', `💡 This error came from Google Ads API, not from this component`);
                    errors.push(errorMsg);
                    results.success = false;
                }

                // Add delay between segments to prevent rate limiting (1-2 seconds)
                // Remove inter-segment delay to prevent timeouts
                // Fast segment processing for better performance
            }

            // Now run each job ONCE per User List (not per segment)
            context.log('info', '═══════════════════════════════════════════════════════════');
            context.log('info', `🚀 Running ${userListJobs.size} job(s) to execute uploads...`);
            context.log('info', '═══════════════════════════════════════════════════════════');

            for (const [userListId, jobInfo] of userListJobs) {
                try {
                    context.log('info', `Running job for User List ${userListId} (segments: ${jobInfo.segments.join(', ')})`);
                    context.log('info', `   Job: ${jobInfo.jobResourceName}`);

                    const operation = await this.runJob(customer, jobInfo.jobResourceName, context);

                    // Update all segments that share this User List
                    for (const segment of jobInfo.segments) {
                        if (results.jobsBySegment[segment]) {
                            results.jobsBySegment[segment].operationName = operation.name || null;
                            results.jobsBySegment[segment].status = 'SUBMITTED';
                        }
                    }

                    results.totalJobs++;
                    context.log('info', `✅ Job submitted for User List ${userListId}`);

                } catch (error) {
                    // Enhanced error handling for specific Google Ads API errors
                    const errorMsg = this.extractErrorMessage(error);

                    // Check for specific error types
                    if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
                        context.log('error', `❌ Invalid job or user list for User List ${userListId}`);
                        context.log('error', `   This may indicate the job is in an incompatible state or the user list ID is incorrect`);
                        context.log('error', `   Job: ${jobInfo.jobResourceName}`);
                    } else if (errorMsg.includes('Too many requests') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
                        context.log('error', `⚠️  Rate limit hit for User List ${userListId} - retry logic should handle this`);
                    }

                    const fullErrorMsg = `Failed to run job for User List ${userListId}: ${errorMsg}`;
                    context.log('error', fullErrorMsg);
                    errors.push(fullErrorMsg);

                    // Mark all segments for this User List as failed
                    for (const segment of jobInfo.segments) {
                        if (results.jobsBySegment[segment]) {
                            results.jobsBySegment[segment].status = 'FAILED';
                        }
                    }
                }
            }

            results.errors = errors;

            // Final summary with job status confirmation
            const totalElapsedMs = Date.now() - overallStartTime;
            const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);

            context.log('info', '═══════════════════════════════════════════════════════════');
            context.log('info', `✅ UPLOAD COMPLETE: ${results.totalJobs} jobs, ${results.totalUsers} total users`);
            context.log('info', `⏱️  Total time: ${this.formatTime(totalElapsedSeconds)}`);
            context.log('info', '═══════════════════════════════════════════════════════════');
            context.log('info', '📊 JOB STATUS SUMMARY:');

            // Log each job's status
            for (const [segment, jobInfo] of Object.entries(results.jobsBySegment)) {
                context.log('info', `  • Segment '${segment}': ${jobInfo.status} (${jobInfo.usersUploaded} users)`);
                context.log('info', `    Job: ${jobInfo.jobResourceName}`);
                if (jobInfo.operationName) {
                    context.log('info', `    Operation: ${jobInfo.operationName}`);
                }
            }

            context.log('info', '═══════════════════════════════════════════════════════════');
            context.log('info', '🎯 All jobs SUBMITTED for execution (run() API call succeeded)');
            context.log('info', '📝 Job lifecycle: PENDING → RUNNING → SUCCESS/FAILED');
            context.log('info', '⏳ Google Ads processes jobs asynchronously (may take minutes/hours)');
            context.log('info', '🔍 Verify final status in Google Ads UI');
            context.log('info', '⚠️  Status "SUBMITTED" means run() was accepted, not that job is running yet');
            context.log('info', '═══════════════════════════════════════════════════════════');

            // Add captured internal errors to results
            results.internalErrors = internalErrors;

            // Remove small delay to prevent timeouts
            // Fast completion for better performance

            return context.sendJson(results, 'out');

        } catch (error) {
            const errorMsg = this.extractErrorMessage(error);
            context.log('error', `Fatal error: ${errorMsg}`);
            context.log('error', `Full error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
            results.success = false;
            results.errors.push(errorMsg);

            // Add captured internal errors to results
            results.internalErrors = internalErrors;

            // Remove 10-second wait that was causing Input Queue timeouts
            context.log('info', '⚡ Fast error return - no artificial delays');

            return context.sendJson(results, 'out');
        }
    },

    /**
     * Parse CSV file and group emails by segment
     * Replicates Scala ActivatorStream logic
     */
    async parseCSV(fileStream, options, context) {
        const { segmentColumnIndex, emailColumnIndex, containsHeaders, columnSeparator, batchSize } = options;
        const segmentGroups = {};

        return new Promise((resolve, reject) => {
            const parser = parse({
                delimiter: columnSeparator,
                skip_empty_lines: true,
                from_line: containsHeaders ? 2 : 1,
                relax_column_count: true,
                // Use highWaterMark for memory-efficient streaming of large files
                highWaterMark: 64 * 1024 // 64KB chunks
            });

            let rowCount = 0;
            let skippedCount = 0;
            let lastLogTime = Date.now();

            parser.on('readable', function() {
                let row;
                while ((row = parser.read()) !== null) {
                    rowCount++;

                    // Log progress every 5 seconds to prevent timeout
                    const now = Date.now();
                    if ((now - lastLogTime) > 5000) {
                        context.log('info', `Parsing progress: ${rowCount} rows processed...`);
                        lastLogTime = now;
                    }

                    // Validate row has enough columns
                    const maxIndex = Math.max(segmentColumnIndex, emailColumnIndex);
                    if (row.length <= maxIndex) {
                        skippedCount++;
                        continue;
                    }

                    const segment = row[segmentColumnIndex]?.trim();
                    const hashedEmail = row[emailColumnIndex]?.trim();

                    // Filter empty values (like Scala app does)
                    if (!segment || !hashedEmail) {
                        skippedCount++;
                        continue;
                    }

                    // Group by segment
                    if (!segmentGroups[segment]) {
                        segmentGroups[segment] = [];
                    }

                    segmentGroups[segment].push(hashedEmail);
                }
            });

            parser.on('error', (error) => {
                context.log('error', `CSV parsing error: ${error.message}`);
                reject(error);
            });

            parser.on('end', () => {
                context.log('info', `CSV parsing complete: ${rowCount} rows processed, ${skippedCount} skipped`);
                const totalUsers = Object.values(segmentGroups).reduce((sum, arr) => sum + arr.length, 0);
                context.log('info', `Total valid users: ${totalUsers} across ${Object.keys(segmentGroups).length} segments`);
                resolve(segmentGroups);
            });

            fileStream.pipe(parser);
        });
    },

    /**
     * Create OfflineUserDataJob with retry logic
     *
     * IMPORTANT: This retry logic handles GOOGLE ADS API errors, NOT Appmixer errors.
     * The errors caught here come directly from Google's servers:
     * - Rate limiting (429, RESOURCE_EXHAUSTED, quota errors)
     * - Server errors (5xx, UNAVAILABLE, DEADLINE_EXCEEDED)
     * - Network issues (timeouts, connection resets)
     *
     * Implements exponential backoff with jitter, up to 10 retry attempts.
     * Max backoff time is capped at 30 seconds per attempt.
     */
    async createUserDataJob(customer, customerId, userListResourceName, consent, context) {
        const maxRetries = 5;
        const initialDelayMs = 2000; // 2 seconds initial delay
        let attempt = 0;
        let lastError;

        const job = {
            type: enums.OfflineUserDataJobType.CUSTOMER_MATCH_USER_LIST,
            customer_match_user_list_metadata: {
                user_list: userListResourceName,
                consent: {
                    ad_user_data: enums.ConsentStatus[consent.adUserData],
                    ad_personalization: enums.ConsentStatus[consent.adPersonalization]
                }
            }
        };

        context.log('info', `Creating job for user list: ${userListResourceName}`);
        context.log('info', `Job config: ${JSON.stringify(job)}`);

        while (attempt < maxRetries) {
            try {
                const response = await customer.offlineUserDataJobs.createOfflineUserDataJob({
                    customer_id: customerId,
                    job
                });

                context.log('info', `Job created successfully: ${response.resource_name}`);
                return response.resource_name;

            } catch (error) {
                lastError = error;
                attempt++;

                // Extract Google Ads API error details from nested structure
                const extractedMsg = this.extractErrorMessage(error);
                const nestedError = error.errors?.[0];
                const nestedCode = nestedError?.error_code ? JSON.stringify(nestedError.error_code) : 'N/A';

                // DIAGNOSTIC: Log full error to identify source
                context.log('error', `🔍 DIAGNOSTIC - Create Job Error Caught (attempt ${attempt}/${maxRetries})`);
                context.log('error', `   Error type: ${error.constructor.name}`);
                context.log('error', `   Error message: ${extractedMsg}`);
                context.log('error', `   Error code: ${nestedCode}`);
                context.log('error', `   Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error)).substring(0, 500)}`);

                // Enhanced error detection for Google Ads API (gRPC-style errors)
                // Google Ads API errors have structure: error.errors[0].message
                const errorMsg = extractedMsg.toLowerCase();
                const errorCode = String(error.code || '').toLowerCase();

                // Check nested error structure for Google Ads API
                let nestedErrorMsg = '';
                let nestedErrorCode = '';
                if (error.errors && Array.isArray(error.errors) && error.errors[0]) {
                    nestedErrorMsg = (error.errors[0].message || '').toLowerCase();
                    if (error.errors[0].error_code) {
                        nestedErrorCode = JSON.stringify(error.errors[0].error_code).toLowerCase();
                    }
                }

                const isRateLimit = error.code === 429 ||
                    error.code === 8 || // gRPC RESOURCE_EXHAUSTED
                    (error.status && error.status === 429) ||
                    errorCode === 'resource_exhausted' ||
                    errorMsg.includes('429') ||
                    errorMsg.includes('rate limit') ||
                    errorMsg.includes('too many requests') ||
                    errorMsg.includes('retry in') ||
                    errorMsg.includes('quota exceeded') ||
                    errorMsg.includes('resource_exhausted') ||
                    errorMsg.includes('quota_error') ||
                    nestedErrorMsg.includes('rate limit') ||
                    nestedErrorMsg.includes('too many requests') ||
                    nestedErrorMsg.includes('quota exceeded') ||
                    nestedErrorMsg.includes('retry in') ||
                    nestedErrorCode.includes('resource_exhausted') ||
                    nestedErrorCode.includes('quota_error');

                // Check if this is a long-term quota exhaustion (>1 hour retry time)
                // These should fail immediately, not retry
                const retryMatch = extractedMsg.match(/retry in (\d+) seconds/i);
                const retrySeconds = retryMatch ? parseInt(retryMatch[1]) : 0;
                const isLongTermQuotaExhaustion = isRateLimit && retrySeconds > 3600; // More than 1 hour

                const isConcurrentModification = errorMsg.includes('concurrent_modification') ||
                    errorMsg.includes('concurrent modification') ||
                    nestedErrorMsg.includes('concurrent_modification') ||
                    nestedErrorMsg.includes('concurrent modification') ||
                    nestedErrorCode.includes('concurrent_modification') ||
                    nestedErrorCode.includes('database_error');

                const isRetryableError = (isRateLimit && !isLongTermQuotaExhaustion) ||
                    isConcurrentModification ||
                    (error.code && typeof error.code === 'number' && error.code >= 500) ||
                    (error.status && error.status >= 500) ||
                    error.name === 'AbortError' ||
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'ECONNRESET' ||
                    error.code === 'ECONNREFUSED' ||
                    errorCode.includes('unavailable') ||
                    errorCode.includes('deadline_exceeded');

                // Fail fast on long-term quota exhaustion
                if (isLongTermQuotaExhaustion) {
                    context.log('error', `❌ QUOTA EXHAUSTED - Google Ads requires waiting ${Math.floor(retrySeconds/3600)} hours`);
                    context.log('error', `   Not retrying - please wait and try again later`);
                    context.log('error', `   Message: ${extractedMsg}`);
                    throw error;
                }

                if (!isRetryableError || attempt >= maxRetries) {
                    context.log('error', `❌ FINAL FAILURE - Create job (non-retryable or max retries reached)`);
                    context.log('error', `   Error was ${isRetryableError ? 'retryable' : 'non-retryable'}, attempt ${attempt}/${maxRetries}`);
                    context.log('error', `   Message: ${extractedMsg}`);
                    context.log('error', `   This error is from: ${error.constructor.name}`);
                    throw error;
                }

                const backoffTime = Math.min(
                    initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    30000
                );

                const errorType = isConcurrentModification ? 'CONCURRENT_MODIFICATION' :
                    isRateLimit ? 'RATE LIMIT' : 'NETWORK ERROR';
                context.log('warn', `⚠️  RETRY ${attempt}/${maxRetries}: Create job failed (${errorType}): ${extractedMsg}`);
                context.log('warn', `⏳ Waiting ${Math.ceil(backoffTime/1000)}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                context.log('info', `🔄 Retrying create job now (attempt ${attempt + 1}/${maxRetries})...`);
            }
        }

        throw lastError || new Error('Failed to create job after multiple attempts');
    },

    /**
     * Add operations to OfflineUserDataJob with retry logic
     *
     * IMPORTANT: This retry logic handles GOOGLE ADS API errors, NOT Appmixer errors.
     * The errors caught here come directly from Google's servers:
     * - Rate limiting (429, RESOURCE_EXHAUSTED, quota errors)
     * - Server errors (5xx, UNAVAILABLE, DEADLINE_EXCEEDED)
     * - Network issues (timeouts, connection resets)
     *
     * Implements exponential backoff with jitter, up to 10 retry attempts.
     * Max backoff time is capped at 30 seconds per attempt.
     * Respects Retry-After headers from Google's rate limiting responses.
     */
    async addOperations(customer, jobResourceName, emails, removeAllFirst, context, progressInfo = null) {
        const maxRetries = 5;
        const initialDelayMs = 2000; // 2 seconds initial delay
        let attempt = 0;
        let lastError;

        // Create user data operations
        const operations = emails.map(email => ({
            create: {
                user_identifiers: [{
                    hashed_email: email
                }]
            }
        }));

        // Add removeAll operation at the beginning if needed (REPLACE mode)
        if (removeAllFirst) {
            operations.unshift({ remove_all: true });
            context.log('info', 'Adding removeAll operation (REPLACE mode)');
        }

        context.log('info', `Sending ${operations.length} operations to API (will retry up to ${maxRetries} times if needed)`);

        while (attempt < maxRetries) {
            try {
                context.log('info', `📤 API Call attempt ${attempt + 1}/${maxRetries}...`);
                await customer.offlineUserDataJobs.addOfflineUserDataJobOperations({
                    resource_name: jobResourceName,
                    enable_partial_failure: true,
                    operations
                });

                context.log('info', `✅ Successfully added ${emails.length} operations to job`);
                return; // Success, exit the function

            } catch (error) {
                lastError = error;
                attempt++;

                // Extract Google Ads API error details from nested structure
                const extractedMsg = this.extractErrorMessage(error);
                const nestedError = error.errors?.[0];
                const nestedCode = nestedError?.error_code ? JSON.stringify(nestedError.error_code) : 'N/A';

                context.log('error', `❌ API Call attempt ${attempt}/${maxRetries} FAILED`);

                // DIAGNOSTIC: Log full error to identify source
                context.log('error', `🔍 DIAGNOSTIC - Add Operations Error Caught (attempt ${attempt}/${maxRetries})`);
                context.log('error', `   Error type: ${error.constructor.name}`);
                context.log('error', `   Error message: ${extractedMsg}`);
                context.log('error', `   Error code: ${nestedCode}`);
                context.log('error', `   Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error)).substring(0, 500)}`);

                // Enhanced error detection for Google Ads API (gRPC-style errors)
                const errorMsg = extractedMsg.toLowerCase();
                const errorCode = String(error.code || '').toLowerCase();

                // Check nested error structure for Google Ads API
                let nestedErrorMsg = '';
                let nestedErrorCode = '';
                if (error.errors && Array.isArray(error.errors) && error.errors[0]) {
                    nestedErrorMsg = (error.errors[0].message || '').toLowerCase();
                    if (error.errors[0].error_code) {
                        nestedErrorCode = JSON.stringify(error.errors[0].error_code).toLowerCase();
                    }
                }

                const isRateLimit = error.code === 429 ||
                    error.code === 8 || // gRPC RESOURCE_EXHAUSTED
                    (error.status && error.status === 429) ||
                    errorCode === 'resource_exhausted' ||
                    errorMsg.includes('429') ||
                    errorMsg.includes('rate limit') ||
                    errorMsg.includes('too many requests') ||
                    errorMsg.includes('retry in') ||
                    errorMsg.includes('quota exceeded') ||
                    errorMsg.includes('resource_exhausted') ||
                    errorMsg.includes('quota_error') ||
                    nestedErrorMsg.includes('rate limit') ||
                    nestedErrorMsg.includes('too many requests') ||
                    nestedErrorMsg.includes('quota exceeded') ||
                    nestedErrorMsg.includes('retry in') ||
                    nestedErrorCode.includes('resource_exhausted') ||
                    nestedErrorCode.includes('quota_error');

                // Check if this is a long-term quota exhaustion (>1 hour retry time)
                const retryMatch = extractedMsg.match(/retry in (\d+) seconds/i);
                const retrySeconds = retryMatch ? parseInt(retryMatch[1]) : 0;
                const isLongTermQuotaExhaustion = isRateLimit && retrySeconds > 3600;

                // Check for CONCURRENT_MODIFICATION - this is retryable but needs aggressive backoff
                const isConcurrentModification = errorMsg.includes('concurrent_modification') ||
                    errorMsg.includes('concurrent modification') ||
                    nestedErrorMsg.includes('concurrent_modification') ||
                    nestedErrorMsg.includes('concurrent modification') ||
                    nestedErrorCode.includes('concurrent_modification') ||
                    nestedErrorCode.includes('database_error');

                // Check for other retryable errors (5xx, network issues, etc.)
                const isRetryableError = (isRateLimit && !isLongTermQuotaExhaustion) ||
                    isConcurrentModification ||
                    (error.code && typeof error.code === 'number' && error.code >= 500) ||
                    (error.status && error.status >= 500) ||
                    error.name === 'AbortError' ||
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'ECONNRESET' ||
                    error.code === 'ECONNREFUSED' ||
                    errorCode.includes('unavailable') ||
                    errorCode.includes('deadline_exceeded');

                // Fail fast on long-term quota exhaustion
                if (isLongTermQuotaExhaustion) {
                    context.log('error', `❌ QUOTA EXHAUSTED - Google Ads requires waiting ${Math.floor(retrySeconds/3600)} hours`);
                    context.log('error', `   Not retrying - please wait and try again later`);
                    context.log('error', `   Message: ${extractedMsg}`);
                    throw error;
                }

                // If not retryable or we've reached max retries, rethrow the error
                if (!isRetryableError || attempt >= maxRetries) {
                    context.log('error', `❌ FINAL FAILURE - Add operations (non-retryable or max retries reached)`);
                    context.log('error', `   Error was ${isRetryableError ? 'retryable' : 'non-retryable'}, attempt ${attempt}/${maxRetries}`);
                    context.log('error', `   Is rate limit: ${isRateLimit}`);
                    context.log('error', `   Is concurrent modification: ${isConcurrentModification}`);
                    context.log('error', `   Message: ${extractedMsg}`);
                    context.log('error', `   This error is from: ${error.constructor.name}`);
                    throw error;
                }

                // Calculate delay with exponential backoff and jitter
                const backoffTime = Math.min(
                    initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    30000 // Max 30 seconds
                );

                // Check for Retry-After header for rate limits
                let retryAfterMs = backoffTime;

                // Try to parse "Retry in X seconds" from error message
                if (isRateLimit) {
                    const retryMatch = errorMsg.match(/retry in (\d+) seconds?/);
                    if (retryMatch) {
                        const suggestedDelay = parseInt(retryMatch[1]) * 1000;
                        retryAfterMs = Math.min(suggestedDelay, 300000); // Cap at 5 minutes
                        context.log('info', `📨 Google suggests waiting ${retryMatch[1]} seconds`);
                    } else if (error.metadata && error.metadata.get) {
                        const retryAfter = error.metadata.get('retry-after') || error.metadata.get('retry-after-ms');
                        if (retryAfter && retryAfter.length > 0) {
                            retryAfterMs = Math.min(parseInt(retryAfter[0]) * 1000, 300000);
                            context.log('info', `📨 Server header suggests waiting ${retryAfterMs/1000} seconds`);
                        }
                    }
                }

                // Determine error type for logging
                const errorType = isConcurrentModification ? 'CONCURRENT_MODIFICATION' :
                    isRateLimit ? 'RATE LIMIT' : 'NETWORK ERROR';

                context.log('info', `🔄 RETRY ${attempt}/${maxRetries}: ${errorType} - ${error.message}`);
                context.log('info', `⏳ Waiting ${Math.ceil(retryAfterMs/1000)}s before retry...`);

                // Send retry info to progress port so user can see it
                context.log('error', `📊 RETRY DIAGNOSTIC: progressInfo = ${progressInfo ? 'EXISTS' : 'NULL'}`);
                if (progressInfo) {
                    context.log('error', `📊 SENDING RETRY PROGRESS: attempt ${attempt}/${maxRetries}`);
                    await this.safeSendProgress(context, {
                        ...progressInfo,
                        status: 'retrying',
                        retryAttempt: attempt,
                        maxRetries: maxRetries,
                        retryReason: isConcurrentModification ? 'CONCURRENT_MODIFICATION' :
                            isRateLimit ? 'RATE_LIMIT' : 'NETWORK_ERROR',
                        retryMessage: error.message,
                        waitingSeconds: Math.ceil(retryAfterMs/1000),
                        message: `⚠️ RETRY ${attempt}/${maxRetries}: ${errorType} - Waiting ${Math.ceil(retryAfterMs/1000)}s before retry...`
                    }, 'progress');
                    context.log('error', `📊 RETRY PROGRESS SENT`);
                } else {
                    context.log('error', `📊 WARNING: progressInfo is NULL, cannot send retry progress!`);
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryAfterMs));
                context.log('info', `▶️  Retrying now (attempt ${attempt + 1}/${maxRetries})...`);
            }
        }

        // If we've exhausted all retries, throw the last error
        throw lastError || new Error('Failed to add operations after multiple attempts');
    },

    /**
     * Run OfflineUserDataJob with retry logic
     *
     * IMPORTANT: This retry logic handles GOOGLE ADS API errors, NOT Appmixer errors.
     * The errors caught here come directly from Google's servers:
     * - Rate limiting (429, RESOURCE_EXHAUSTED, quota errors)
     * - Server errors (5xx, UNAVAILABLE, DEADLINE_EXCEEDED)
     * - Network issues (timeouts, connection resets)
     *
     * This method executes the job, transitioning it from PENDING to RUNNING status.
     * After this call succeeds, Google Ads will process the job asynchronously.
     *
     * Implements exponential backoff with jitter, up to 10 retry attempts.
     * Max backoff time is capped at 30 seconds per attempt.
     */
    async runJob(customer, jobResourceName, context) {
        const maxRetries = 5;
        const initialDelayMs = 2000; // 2 seconds initial delay
        let attempt = 0;
        let lastError;

        context.log('info', `Running job: ${jobResourceName}`);

        while (attempt < maxRetries) {
            try {
                const operation = await customer.offlineUserDataJobs.runOfflineUserDataJob({
                    resource_name: jobResourceName
                });

                // Verify we got a valid response
                if (!operation) {
                    throw new Error('runOfflineUserDataJob returned null/undefined - API call may have failed');
                }

                // Log full operation response for debugging
                context.log('info', `✅ Job execution request accepted by Google Ads API`);
                context.log('info', `   Operation response: ${JSON.stringify(operation)}`);
                context.log('info', `   Operation name: ${operation.name || 'N/A'}`);
                context.log('info', `   Operation done: ${operation.done || false}`);

                // The operation object is a LongRunningOperation promise
                // It does NOT contain the actual job status (PENDING/RUNNING/SUCCESS/FAILED)
                // The job will transition from PENDING → RUNNING asynchronously
                context.log('info', `   Note: This is a LongRunningOperation - actual job status not included in response`);

                return operation;

            } catch (error) {
                lastError = error;
                attempt++;

                // Extract Google Ads API error details from nested structure
                const extractedMsg = this.extractErrorMessage(error);
                const nestedError = error.errors?.[0];
                const nestedCode = nestedError?.error_code ? JSON.stringify(nestedError.error_code) : 'N/A';

                // DIAGNOSTIC: Log full error to identify source
                context.log('error', `🔍 DIAGNOSTIC - Run Job Error Caught (attempt ${attempt}/${maxRetries})`);
                context.log('error', `   Error type: ${error.constructor.name}`);
                context.log('error', `   Error message: ${extractedMsg}`);
                context.log('error', `   Error code: ${nestedCode}`);
                context.log('error', `   Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error)).substring(0, 500)}`);

                // Enhanced error detection for Google Ads API (gRPC-style errors)
                const errorMsg = extractedMsg.toLowerCase();
                const errorCode = String(error.code || '').toLowerCase();

                // Check nested error structure for Google Ads API
                let nestedErrorMsg = '';
                let nestedErrorCode = '';
                if (error.errors && Array.isArray(error.errors) && error.errors[0]) {
                    nestedErrorMsg = (error.errors[0].message || '').toLowerCase();
                    if (error.errors[0].error_code) {
                        nestedErrorCode = JSON.stringify(error.errors[0].error_code).toLowerCase();
                    }
                }

                const isRateLimit = error.code === 429 ||
                    error.code === 8 || // gRPC RESOURCE_EXHAUSTED
                    (error.status && error.status === 429) ||
                    errorCode === 'resource_exhausted' ||
                    errorMsg.includes('429') ||
                    errorMsg.includes('rate limit') ||
                    errorMsg.includes('too many requests') ||
                    errorMsg.includes('retry in') ||
                    errorMsg.includes('quota exceeded') ||
                    errorMsg.includes('resource_exhausted') ||
                    errorMsg.includes('quota_error') ||
                    nestedErrorMsg.includes('rate limit') ||
                    nestedErrorMsg.includes('too many requests') ||
                    nestedErrorMsg.includes('quota exceeded') ||
                    nestedErrorMsg.includes('retry in') ||
                    nestedErrorCode.includes('resource_exhausted') ||
                    nestedErrorCode.includes('quota_error');

                // Check if this is a long-term quota exhaustion (>1 hour retry time)
                const retryMatch = extractedMsg.match(/retry in (\d+) seconds/i);
                const retrySeconds = retryMatch ? parseInt(retryMatch[1]) : 0;
                const isLongTermQuotaExhaustion = isRateLimit && retrySeconds > 3600;

                const isConcurrentModification = errorMsg.includes('concurrent_modification') ||
                    errorMsg.includes('concurrent modification') ||
                    nestedErrorMsg.includes('concurrent_modification') ||
                    nestedErrorMsg.includes('concurrent modification') ||
                    nestedErrorCode.includes('concurrent_modification') ||
                    nestedErrorCode.includes('database_error');

                const isRetryableError = (isRateLimit && !isLongTermQuotaExhaustion) ||
                    isConcurrentModification ||
                    (error.code && typeof error.code === 'number' && error.code >= 500) ||
                    (error.status && error.status >= 500) ||
                    error.name === 'AbortError' ||
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'ECONNRESET' ||
                    error.code === 'ECONNREFUSED' ||
                    errorCode.includes('unavailable') ||
                    errorCode.includes('deadline_exceeded');

                // Fail fast on long-term quota exhaustion
                if (isLongTermQuotaExhaustion) {
                    context.log('error', `❌ QUOTA EXHAUSTED - Google Ads requires waiting ${Math.floor(retrySeconds/3600)} hours`);
                    context.log('error', `   Not retrying - please wait and try again later`);
                    context.log('error', `   Message: ${extractedMsg}`);
                    throw error;
                }

                if (!isRetryableError || attempt >= maxRetries) {
                    context.log('error', `❌ FINAL FAILURE - Run job (non-retryable or max retries reached)`);
                    context.log('error', `   Error was ${isRetryableError ? 'retryable' : 'non-retryable'}, attempt ${attempt}/${maxRetries}`);
                    context.log('error', `   Message: ${extractedMsg}`);
                    context.log('error', `   This error is from: ${error.constructor.name}`);
                    throw error;
                }

                const backoffTime = Math.min(
                    initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    30000
                );

                const errorType = isConcurrentModification ? 'CONCURRENT_MODIFICATION' :
                    isRateLimit ? 'RATE LIMIT' : 'NETWORK ERROR';
                context.log('warn', `⚠️  RETRY ${attempt}/${maxRetries}: Run job failed (${errorType}): ${extractedMsg}`);
                context.log('warn', `⏳ Waiting ${Math.ceil(backoffTime/1000)}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                context.log('info', `🔄 Retrying run job now (attempt ${attempt + 1}/${maxRetries})...`);
            }
        }

        throw lastError || new Error('Failed to run job after multiple attempts');
    },

    /**
     * Split array into chunks
     * Helper for batching large datasets
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    },

    /**
     * Format seconds into human-readable time (e.g., "2m 30s", "1h 15m")
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    }
};

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
     * Safely send progress updates without crashing if context is destroyed.
     * This can happen when async operations continue after component has returned.
     */
    async safeSendProgress(context, data, port = 'progress') {
        try {
            await context.sendJson(data, port);
        } catch (error) {
            // Context destroyed - silently ignore (expected when async operations complete after main flow)
        }
    },

    /**
     * Extract human-readable error message from Google Ads API error object.
     * Handles both Google Ads API nested structure and standard JS errors.
     */
    extractErrorMessage(error) {
        if (error.message) {
            return error.message;
        }

        if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
            const firstError = error.errors[0];
            let msg = firstError.message || '';

            if (firstError.error_code) {
                msg += ` [Code: ${JSON.stringify(firstError.error_code)}]`;
            }

            if (error.request_id) {
                msg += ` [Request ID: ${error.request_id}]`;
            }

            return msg;
        }

        try {
            return JSON.stringify(error);
        } catch (e) {
            return String(error);
        }
    },

    async receive(context) {
        // Check if this is a continuation from a previous timeout
        const isContinuation = !!context.messages.timeout;

        const internalErrors = [];
        const originalLog = context.log.bind(context);

        // Wrap context.log to capture errors and ensure messages are strings (Appmixer requirement)
        context.log = function(level, message, ...args) {
            const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);

            if (level === 'error') {
                internalErrors.push(`[${level.toUpperCase()}] ${stringMessage}`);
            }

            return originalLog(level, stringMessage);
        };

        let fileId, clientId, clientSecret, refreshToken, developerToken, loginCustomerId, customerId;
        let segmentColumnIndex, emailColumnIndex, segmentToUserList, uploadMode, adPersonalization, adUserData;
        let batchSize, containsHeaders, columnSeparator;
        let timeStart, processedSegments, segmentGroups, userListJobs, currentSegmentNumber;
        let batchesCompletedOverall, totalBatchesOverall, totalUsersOverall, totalSegments;
        let jobCreationDelayMs, results;

        if (isContinuation) {
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

            timeStart = new Date(msg.timeStart);
            processedSegments = msg.processedSegments || [];
            // segmentGroups re-parsed from CSV (not stored to avoid timeout message size limits)
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

            context.log('info', `Resuming continuation: ${processedSegments.length}/${totalSegments || 'unknown'} segments, ${batchesCompletedOverall}/${totalBatchesOverall} batches`);
        } else {
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

            timeStart = new Date();
            processedSegments = [];
            segmentGroups = null;
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

        const errors = results.errors;

        try {
            if ((new Date() - timeStart) >= (MAX_CONTINUATION_PERIOD_SECONDS * 1000)) {
                throw new context.CancelError(`Upload exceeded maximum time limit (${MAX_CONTINUATION_PERIOD_SECONDS / 3600} hours). Please retry with smaller batches or contact support.`);
            }
            if (!fileId) {
                throw new Error('Missing fileId. Please provide an Appmixer file ID or Google Drive file object.');
            }

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

            let segmentMapping;
            try {
                segmentMapping = typeof segmentToUserList === 'string'
                    ? JSON.parse(segmentToUserList)
                    : segmentToUserList;
            } catch (e) {
                context.log('error', `Failed to parse segmentToUserList. Input value: ${JSON.stringify(segmentToUserList)}`);
                throw new Error(`Invalid segmentToUserList JSON: ${e.message}. Check that keys and values use double quotes, no trailing commas, and valid JSON syntax.`);
            }

            // Normalize segment mapping: support both single value and array formats
            const normalizedMapping = {};
            for (const [segment, value] of Object.entries(segmentMapping)) {
                const arrayValue = Array.isArray(value) ? value : [value];
                const validValues = arrayValue.filter(v => v != null && v !== '');

                if (validValues.length > 0) {
                    normalizedMapping[segment] = validValues;
                } else {
                    context.log('warn', `Segment '${segment}' has no valid User List IDs, skipping`);
                }
            }

            context.log('info', `Normalized mapping: ${JSON.stringify(normalizedMapping)}`);

            const client = new GoogleAdsApi({
                client_id: clientId,
                client_secret: clientSecret,
                developer_token: developerToken
            });

            const customer = client.Customer({
                customer_account_id: customerId,
                refresh_token: refreshToken,
                login_customer_id: loginCustomerId || undefined
            });

            const scheduleContinuation = async (reason) => {
                context.log('info', `Scheduling continuation (${reason}): ${processedSegments.length}/${totalSegments || 'unknown'} segments, ${batchesCompletedOverall}/${totalBatchesOverall} batches`);
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

            // Re-parse CSV on continuation (not stored in state to avoid timeout message size limits)
            if (isContinuation) {
                context.log('info', 'Re-parsing CSV for continuation');
            }

            let fileStream;
            if (typeof fileId === 'object' && fileId.fileContent) {
                context.log('info', 'Processing file content from Google Drive');
                const { Readable } = require('stream');
                fileStream = Readable.from(
                    typeof fileId.fileContent === 'string'
                        ? Buffer.from(fileId.fileContent, fileId.encoding || 'utf8')
                        : fileId.fileContent
                    );
                } else if (typeof fileId === 'string') {
                    context.log('info', `Reading CSV file: ${fileId}`);
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

            const segments = segmentGroups ? Object.entries(segmentGroups) : [];
            if (!isContinuation) {
                totalSegments = 0;
                totalBatchesOverall = 0;
                totalUsersOverall = 0;

                for (const [segment, emails] of segments) {
                    if (normalizedMapping[segment]) {
                        totalSegments++;
                        const userListCount = normalizedMapping[segment].length;
                        const segmentBatches = Math.ceil(emails.length / batchSize) * userListCount;
                        totalBatchesOverall += segmentBatches;
                        totalUsersOverall += emails.length * userListCount;
                    }
                }
            }

            context.log('info', `Overall: ${totalSegments} configured segments (${segments.length} in CSV), ${totalUsersOverall} users, ${totalBatchesOverall} total batches`);

            const overallStartTime = Date.now();
            const receiveTimeStart = Date.now();
            let lastProgressLogTime = 0;

            const JOB_MIN_DELAY = 0;
            const JOB_MAX_DELAY = 10000;
            const JOB_DELAY_INCREMENT = 500;
            const JOB_DELAY_DECREMENT = 50;

            for (const [segment, emails] of segments) {
                if ((new Date() - receiveTimeStart) >= TIMEOUT_TRIGGER_SECONDS * 1000) {
                    context.log('info', 'Timeout approaching - scheduling continuation');
                    return await scheduleContinuation('timeout_trigger');
                }

                if (processedSegments.includes(segment)) {
                    context.log('info', `Skipping already-processed segment '${segment}'`);
                    continue;
                }

                let userListId = null;

                try {
                    if (!normalizedMapping[segment]) {
                        const error = `Segment '${segment}' not found in configuration. Skipping ${emails.length} users.`;
                        context.log('warn', error);
                        errors.push(error);
                        continue;
                    }

                    currentSegmentNumber++;
                    const userListIds = normalizedMapping[segment];

                    if (!userListIds || !Array.isArray(userListIds) || userListIds.length === 0) {
                        const error = `Segment '${segment}' has invalid or empty User List mapping. Expected array of User List IDs, got: ${JSON.stringify(userListIds)}`;
                        context.log('error', error);
                        errors.push(error);
                        continue;
                    }

                    context.log('info', `Processing segment '${segment}': ${emails.length} users → ${userListIds.length} User List(s)`);

                    for (userListId of userListIds) {
                        const userListResourceName = `customers/${customerId}/userLists/${userListId}`;
                        context.log('info', `Uploading to User List ${userListId}`);

                        const batches = this.chunkArray(emails, batchSize);
                        context.log('info', `Split into ${batches.length} batch(es) of max ${batchSize} users`);

                        const segmentStartTime = Date.now();
                        let lastSegmentProgressLogTime = 0;
                        let adaptiveDelayMs = 0;
                        const MIN_DELAY = 0;
                        const MAX_DELAY = 5000;
                        const DELAY_INCREMENT = 100;
                        const DELAY_DECREMENT = 10;
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
                        let isNewJob = false;

                        if (userListJobs.has(userListId)) {
                            const existingJob = userListJobs.get(userListId);
                            jobResourceName = existingJob.jobResourceName;
                            existingJob.segments.push(segment);
                            context.log('info', `Reusing existing job for User List ${userListId} (prevents CONCURRENT_MODIFICATION)`);
                            isNewJob = false;
                        } else {
                            context.log('info', `Creating new OfflineUserDataJob for segment '${segment}' → User List ${userListId}`);
                            try {
                                jobResourceName = await this.createUserDataJob(
                                    customer,
                                    customerId,
                                    userListResourceName,
                                    { adPersonalization, adUserData },
                                    context
                                );

                                if (jobCreationDelayMs > JOB_MIN_DELAY) {
                                    jobCreationDelayMs = Math.max(JOB_MIN_DELAY, jobCreationDelayMs - JOB_DELAY_DECREMENT);
                                }

                                userListJobs.set(userListId, {
                                    jobResourceName,
                                    segments: [segment]
                                });
                                isNewJob = true;
                            } catch (createError) {
                                const errorMsg = (createError.message || '').toLowerCase();
                                const errorCode = String(createError.code || '').toLowerCase();

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
                                    jobCreationDelayMs = Math.min(JOB_MAX_DELAY, jobCreationDelayMs + JOB_DELAY_INCREMENT);
                                    context.log('warn', `Rate limit during job creation - increased delay to ${jobCreationDelayMs}ms`);
                                }

                                context.log('error', `createUserDataJob failed: ${createError.message}`);

                                if (wasRateLimited) {
                                    const extractedErrorMsg = this.extractErrorMessage(createError);
                                    context.log('error', `Rate limit hit during job creation - stopping all segment processing`);

                                    await this.safeSendProgress(context, {
                                        segment,
                                        status: 'rate_limited',
                                        message: `Rate limit exceeded during job creation: ${extractedErrorMsg}`,
                                        totalSegments,
                                        currentSegment: currentSegmentNumber,
                                        error: extractedErrorMsg
                                    });

                                    results.success = false;
                                    results.errors.push(`Rate limit exceeded during job creation: ${extractedErrorMsg}. Please wait and retry later.`);
                                    results.internalErrors = internalErrors;
                                    return context.sendJson(results, 'out');
                                }

                                throw createError;
                            }
                        }

                        for (let i = 0; i < batches.length; i++) {
                            const batch = batches[i];
                            const isFirstBatch = i === 0;
                            const progress = ((i + 1) / batches.length * 100).toFixed(1);

                            if (isFirstBatch) {
                                // REPLACE mode + NEW job: removeAll = true (clear existing data)
                                // REPLACE mode + REUSED job: removeAll = false (already cleared)
                                // ADD mode: removeAll = false (always append)
                                const removeAllFirst = uploadMode === 'REPLACE' && isNewJob;

                                context.log('info', `Batch 1/${batches.length}: Adding ${batch.length} users (mode: ${uploadMode}, removeAll: ${removeAllFirst})`);

                                const batchStartTime = Date.now();
                                try {
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

                                    if (adaptiveDelayMs > MIN_DELAY) {
                                        adaptiveDelayMs = Math.max(MIN_DELAY, adaptiveDelayMs - DELAY_DECREMENT);
                                    }
                                } catch (addError) {
                                    const errorMsg = (addError.message || '').toLowerCase();
                                    const errorCode = String(addError.code || '').toLowerCase();

                                    let nestedErrorMsg = '';
                                    let nestedErrorCode = '';
                                    if (addError.errors && Array.isArray(addError.errors) && addError.errors[0]) {
                                        nestedErrorMsg = (addError.errors[0].message || '').toLowerCase();
                                        if (addError.errors[0].error_code) {
                                            nestedErrorCode = JSON.stringify(addError.errors[0].error_code).toLowerCase();
                                        }
                                    }

                                    const wasRateLimited = addError.code === 429 ||
                                        addError.code === 8 ||
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

                                    if (wasRateLimited) {
                                        adaptiveDelayMs = Math.min(MAX_DELAY, adaptiveDelayMs + DELAY_INCREMENT);
                                        context.log('warn', `Rate limit detected - increased adaptive delay to ${adaptiveDelayMs}ms`);
                                    }

                                    context.log('error', `addOperations failed: ${addError.message}`);
                                    throw addError;
                                }

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

                                const generalMessage = `Segment ${currentSegmentNumber}/${totalSegments}, Batch ${batchesCompletedOverall}/${totalBatchesOverall} (${overallProgress}%) - ${this.formatTime(overallElapsedSeconds)} elapsed, ETA: ${this.formatTime(overallEtaSeconds)}`;
                                const segmentMessage = `Batch 1/${batches.length} uploaded (${progress}%) - ${this.formatTime(elapsedSeconds)} elapsed${etaSeconds ? ', ETA: ' + this.formatTime(etaSeconds) : ''}`;
                                const combinedMessage = `${generalMessage}\n${segmentMessage}`;

                                const now = Date.now();
                                const shouldLog = (now - lastSegmentProgressLogTime) >= 5000 || i === 0 || i === batches.length - 1;
                                if (shouldLog) {
                                    context.log('info', generalMessage);
                                    context.log('info', segmentMessage);
                                    lastSegmentProgressLogTime = now;
                                }

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
                                context.log('info', `Batch ${i + 1}/${batches.length}: Adding ${batch.length} users`);

                                try {
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

                                    if (adaptiveDelayMs > MIN_DELAY) {
                                        adaptiveDelayMs = Math.max(MIN_DELAY, adaptiveDelayMs - DELAY_DECREMENT);
                                    }
                                } catch (addError) {
                                    const errorMsg = (addError.message || '').toLowerCase();
                                    const errorCode = String(addError.code || '').toLowerCase();

                                    let nestedErrorMsg = '';
                                    let nestedErrorCode = '';
                                    if (addError.errors && Array.isArray(addError.errors) && addError.errors[0]) {
                                        nestedErrorMsg = (addError.errors[0].message || '').toLowerCase();
                                        if (addError.errors[0].error_code) {
                                            nestedErrorCode = JSON.stringify(addError.errors[0].error_code).toLowerCase();
                                        }
                                    }

                                    const wasRateLimited = addError.code === 429 ||
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

                                    if (wasRateLimited) {
                                        adaptiveDelayMs = Math.min(MAX_DELAY, adaptiveDelayMs + DELAY_INCREMENT);
                                        context.log('warn', `Rate limit detected - increased adaptive delay to ${adaptiveDelayMs}ms`);
                                    }

                                    context.log('error', `addOperations failed: ${addError.message}`);
                                    throw addError;
                                }

                                const elapsedMs = Date.now() - segmentStartTime;
                                const elapsedSeconds = Math.floor(elapsedMs / 1000);
                                const progressDecimal = parseFloat(progress) / 100;
                                const etaSeconds = progressDecimal > 0 ? Math.floor((elapsedMs / progressDecimal - elapsedMs) / 1000) : null;

                                batchesCompletedOverall++;
                                const overallElapsedMs = Date.now() - overallStartTime;
                                const overallElapsedSeconds = Math.floor(overallElapsedMs / 1000);
                                const overallProgress = ((batchesCompletedOverall / totalBatchesOverall) * 100).toFixed(1);
                                const avgTimePerBatch = overallElapsedMs / batchesCompletedOverall;
                                const remainingBatches = totalBatchesOverall - batchesCompletedOverall;
                                const overallEtaSeconds = Math.floor((avgTimePerBatch * remainingBatches) / 1000);

                                const generalMessage = `Segment ${currentSegmentNumber}/${totalSegments}, Batch ${batchesCompletedOverall}/${totalBatchesOverall} (${overallProgress}%) - ${this.formatTime(overallElapsedSeconds)} elapsed, ETA: ${this.formatTime(overallEtaSeconds)}`;
                                const segmentMessage = `Batch ${i + 1}/${batches.length} uploaded (${progress}%) - ${this.formatTime(elapsedSeconds)} elapsed${etaSeconds ? ', ETA: ' + this.formatTime(etaSeconds) : ''}`;
                                const combinedMessage = `${generalMessage}\n${segmentMessage}`;

                                const now = Date.now();
                                const shouldLog = (now - lastSegmentProgressLogTime) >= 5000 || i === batches.length - 1;
                                if (shouldLog) {
                                    context.log('info', generalMessage);
                                    context.log('info', segmentMessage);
                                    lastSegmentProgressLogTime = now;
                                }

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
                        }

                        const totalElapsedMs = Date.now() - segmentStartTime;
                        const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);

                        results.jobsBySegment[segment] = {
                            jobResourceName,
                            userListId,
                            usersUploaded: totalUploaded,
                            operationName: null,
                            status: 'PENDING',
                            uploadMode
                        };

                        results.totalUsers += totalUploaded;

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

                        context.log('info', `User List ${userListId} complete: ${totalUploaded} users uploaded`);
                    }

                    processedSegments.push(segment);
                    context.log('info', `Segment '${segment}' complete - uploaded to ${userListIds.length} User List(s)`);

                } catch (error) {
                    let errorDetails = error.message || 'Unknown error';

                    if (error.errors && Array.isArray(error.errors)) {
                        errorDetails = error.errors.map(e => e.message || JSON.stringify(e)).join('; ');
                    } else if (typeof error === 'object') {
                        try {
                            errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
                        } catch (e) {
                            errorDetails = this.extractErrorMessage(error);
                        }
                    }

                    const userListInfo = userListId ? ` (User List ID: ${userListId})` : '';
                    const errorMsg = `Google Ads API Error - Segment '${segment}'${userListInfo}: ${errorDetails}`;
                    context.log('error', errorMsg);
                    errors.push(errorMsg);
                    results.success = false;
                }
            }

            context.log('info', `Running ${userListJobs.size} job(s) to execute uploads...`);

            for (const [userListId, jobInfo] of userListJobs) {
                try {
                    context.log('info', `Running job for User List ${userListId} (segments: ${jobInfo.segments.join(', ')})`);
                    context.log('info', `   Job: ${jobInfo.jobResourceName}`);

                    const operation = await this.runJob(customer, jobInfo.jobResourceName, context);

                    for (const segment of jobInfo.segments) {
                        if (results.jobsBySegment[segment]) {
                            results.jobsBySegment[segment].operationName = operation.name || null;
                            results.jobsBySegment[segment].status = 'SUBMITTED';
                        }
                    }

                    results.totalJobs++;
                    context.log('info', `Job submitted for User List ${userListId}`);

                } catch (error) {
                    const errorMsg = this.extractErrorMessage(error);

                    if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
                        context.log('error', `Invalid job or user list for User List ${userListId}: ${jobInfo.jobResourceName}`);
                    }

                    const fullErrorMsg = `Failed to run job for User List ${userListId}: ${errorMsg}`;
                    context.log('error', fullErrorMsg);
                    errors.push(fullErrorMsg);

                    for (const segment of jobInfo.segments) {
                        if (results.jobsBySegment[segment]) {
                            results.jobsBySegment[segment].status = 'FAILED';
                        }
                    }
                }
            }

            results.errors = errors;
            results.internalErrors = internalErrors;

            const totalElapsedMs = Date.now() - overallStartTime;
            const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);

            context.log('info', `Upload complete: ${results.totalJobs} jobs, ${results.totalUsers} total users, ${this.formatTime(totalElapsedSeconds)} elapsed`);
            context.log('info', 'Job status summary:');
            for (const [segment, jobInfo] of Object.entries(results.jobsBySegment)) {
                context.log('info', `  Segment '${segment}': ${jobInfo.status} (${jobInfo.usersUploaded} users)`);
            }
            context.log('info', 'Note: Status "SUBMITTED" means run() was accepted. Jobs process asynchronously in Google Ads.');

            return context.sendJson(results, 'out');

        } catch (error) {
            const errorMsg = this.extractErrorMessage(error);
            context.log('error', `Fatal error: ${errorMsg}`);
            context.log('error', `Full error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
            results.success = false;
            results.errors.push(errorMsg);
            results.internalErrors = internalErrors;

            return context.sendJson(results, 'out');
        }
    },

    /**
     * Parse CSV file and group emails by segment.
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
                highWaterMark: 64 * 1024
            });

            let rowCount = 0;
            let skippedCount = 0;
            let lastLogTime = Date.now();

            parser.on('readable', function() {
                let row;
                while ((row = parser.read()) !== null) {
                    rowCount++;

                    const now = Date.now();
                    if ((now - lastLogTime) > 5000) {
                        context.log('info', `Parsing progress: ${rowCount} rows processed...`);
                        lastLogTime = now;
                    }

                    const maxIndex = Math.max(segmentColumnIndex, emailColumnIndex);
                    if (row.length <= maxIndex) {
                        skippedCount++;
                        continue;
                    }

                    const segment = row[segmentColumnIndex]?.trim();
                    const hashedEmail = row[emailColumnIndex]?.trim();

                    if (!segment || !hashedEmail) {
                        skippedCount++;
                        continue;
                    }

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
     * Create OfflineUserDataJob with retry logic.
     * Handles Google Ads API errors (rate limiting, server errors, network issues) with exponential backoff.
     */
    async createUserDataJob(customer, customerId, userListResourceName, consent, context) {
        const maxRetries = 5;
        const initialDelayMs = 2000;
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

                const extractedMsg = this.extractErrorMessage(error);
                const errorMsg = extractedMsg.toLowerCase();
                const errorCode = String(error.code || '').toLowerCase();

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

                if (isLongTermQuotaExhaustion) {
                    context.log('error', `Quota exhausted - Google Ads requires waiting ${Math.floor(retrySeconds/3600)} hours`);
                    throw error;
                }

                if (!isRetryableError || attempt >= maxRetries) {
                    context.log('error', `Create job failed (${isRetryableError ? 'retryable' : 'non-retryable'}, attempt ${attempt}/${maxRetries}): ${extractedMsg}`);
                    throw error;
                }

                const backoffTime = Math.min(
                    initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    30000
                );

                const errorType = isConcurrentModification ? 'CONCURRENT_MODIFICATION' :
                    isRateLimit ? 'RATE_LIMIT' : 'NETWORK_ERROR';
                context.log('warn', `Retry ${attempt}/${maxRetries}: Create job failed (${errorType}) - waiting ${Math.ceil(backoffTime/1000)}s`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }

        throw lastError || new Error('Failed to create job after multiple attempts');
    },

    /**
     * Add operations to OfflineUserDataJob with retry logic.
     * Handles Google Ads API errors with exponential backoff and respects Retry-After headers.
     */
    async addOperations(customer, jobResourceName, emails, removeAllFirst, context, progressInfo = null) {
        const maxRetries = 5;
        const initialDelayMs = 2000;
        let attempt = 0;
        let lastError;

        const operations = emails.map(email => ({
            create: {
                user_identifiers: [{
                    hashed_email: email
                }]
            }
        }));

        if (removeAllFirst) {
            operations.unshift({ remove_all: true });
        }

        context.log('info', `Sending ${operations.length} operations to API`);

        while (attempt < maxRetries) {
            try {
                await customer.offlineUserDataJobs.addOfflineUserDataJobOperations({
                    resource_name: jobResourceName,
                    enable_partial_failure: true,
                    operations
                });

                context.log('info', `Successfully added ${emails.length} operations to job`);
                return;

            } catch (error) {
                lastError = error;
                attempt++;

                const extractedMsg = this.extractErrorMessage(error);
                const errorMsg = extractedMsg.toLowerCase();
                const errorCode = String(error.code || '').toLowerCase();

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

                if (isLongTermQuotaExhaustion) {
                    context.log('error', `Quota exhausted - Google Ads requires waiting ${Math.floor(retrySeconds/3600)} hours`);
                    throw error;
                }

                if (!isRetryableError || attempt >= maxRetries) {
                    context.log('error', `Add operations failed (${isRetryableError ? 'retryable' : 'non-retryable'}, attempt ${attempt}/${maxRetries}): ${extractedMsg}`);
                    throw error;
                }

                // Calculate delay with exponential backoff and jitter
                const backoffTime = Math.min(
                    initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    30000 // Max 30 seconds
                );

                let retryAfterMs = backoffTime;

                if (isRateLimit) {
                    const retryMatch = errorMsg.match(/retry in (\d+) seconds?/);
                    if (retryMatch) {
                        const suggestedDelay = parseInt(retryMatch[1]) * 1000;
                        retryAfterMs = Math.min(suggestedDelay, 300000);
                    } else if (error.metadata && error.metadata.get) {
                        const retryAfter = error.metadata.get('retry-after') || error.metadata.get('retry-after-ms');
                        if (retryAfter && retryAfter.length > 0) {
                            retryAfterMs = Math.min(parseInt(retryAfter[0]) * 1000, 300000);
                        }
                    }
                }

                const errorType = isConcurrentModification ? 'CONCURRENT_MODIFICATION' :
                    isRateLimit ? 'RATE_LIMIT' : 'NETWORK_ERROR';

                context.log('warn', `Retry ${attempt}/${maxRetries}: ${errorType} - waiting ${Math.ceil(retryAfterMs/1000)}s`);

                if (progressInfo) {
                    await this.safeSendProgress(context, {
                        ...progressInfo,
                        status: 'retrying',
                        retryAttempt: attempt,
                        maxRetries: maxRetries,
                        retryReason: errorType,
                        retryMessage: error.message,
                        waitingSeconds: Math.ceil(retryAfterMs/1000),
                        message: `Retry ${attempt}/${maxRetries}: ${errorType} - waiting ${Math.ceil(retryAfterMs/1000)}s`
                    }, 'progress');
                }

                await new Promise(resolve => setTimeout(resolve, retryAfterMs));
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

                if (!operation) {
                    throw new Error('runOfflineUserDataJob returned null/undefined - API call may have failed');
                }

                context.log('info', `Job execution request accepted by Google Ads API`);
                return operation;

            } catch (error) {
                lastError = error;
                attempt++;

                const extractedMsg = this.extractErrorMessage(error);
                const errorMsg = extractedMsg.toLowerCase();
                const errorCode = String(error.code || '').toLowerCase();

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

                if (isLongTermQuotaExhaustion) {
                    context.log('error', `Quota exhausted - Google Ads requires waiting ${Math.floor(retrySeconds/3600)} hours`);
                    throw error;
                }

                if (!isRetryableError || attempt >= maxRetries) {
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

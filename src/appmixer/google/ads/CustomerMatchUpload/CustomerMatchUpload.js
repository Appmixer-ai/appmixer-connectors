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
const lib = require('../lib');
const retry = require('../retry');
const csvParser = require('../csvParser');


/**
 * CONTINUATION PATTERN DOCUMENTATION
 * 
 * This component uses Appmixer's context.setTimeout() to handle large uploads that exceed
 * the platform's 25-minute execution limit. This pattern was implemented to solve a specific
 * issue where the Appmixer context would be destroyed during long-running Google Ads API operations.
 * 
 * How it works:
 * 1. Component monitors execution time during CSV processing
 * 2. Before reaching 20-minute limit, schedules a continuation with minimal state
 * 3. CSV is re-parsed on each continuation (unavoidable due to message size limits)
 * 4. Progress is tracked via processedSegments array to avoid duplicate work
 * 5. Maximum 1-hour total runtime prevents runaway processes
 * 
 * Trade-offs:
 * - CSV re-parsing adds overhead but prevents memory issues with large files
 * - File deletion between continuations will cause failure (acceptable risk)
 * - State management is simplified to essential data only
 * 
 * This pattern is necessary for handling 10M+ user uploads that can take 30+ minutes
 * to complete due to Google Ads API rate limits and batch processing requirements.
 */
const TIMEOUT_TRIGGER_SECONDS = 20 * 60; // 20 minutes - schedule continuation well before Appmixer's limit
const TIMEOUT_DELAY_SECONDS = 60; // 1 minute delay before resuming
const MAX_UPLOAD_TIME_HOURS = 1; // 1 hour maximum upload time - reasonable for most use cases

module.exports = {


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

        let fileId, developerToken, loginCustomerId, customerId;
        let segmentColumnIndex, emailColumnIndex, segmentToUserList, uploadMode, adPersonalization, adUserData;
        let batchSize, containsHeaders, columnSeparator;
        let timeStart, processedSegments, segmentGroups, currentSegmentNumber, results;

        if (isContinuation) {
            const msg = context.messages.timeout.content;
            
            // Restore essential parameters
            fileId = msg.fileId;
            developerToken = msg.developerToken;
            loginCustomerId = msg.loginCustomerId;
            customerId = msg.customerId;
            segmentToUserList = msg.segmentToUserList;
            uploadMode = msg.uploadMode;
            batchSize = msg.batchSize;
            
            // Restore progress state
            timeStart = new Date(msg.timeStart);
            processedSegments = msg.processedSegments || [];
            currentSegmentNumber = msg.currentSegmentNumber || 0;
            
            // Restore results summary
            results = {
                totalJobs: msg.totalJobs || 0,
                totalUsers: msg.totalUsers || 0,
                jobsBySegment: {},
                errors: msg.errors || [],
                internalErrors: [],
                success: true
            };

            context.log('info', `Resuming continuation: ${processedSegments.length} segments processed`);
        } else {
            const msg = context.messages.in.content;
            fileId = msg.fileId;
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
            currentSegmentNumber = 0;
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
            if ((new Date() - timeStart) >= (MAX_UPLOAD_TIME_HOURS * 60 * 60 * 1000)) {
                throw new context.CancelError(`Upload exceeded maximum time limit (${MAX_UPLOAD_TIME_HOURS} hour). Please retry with smaller batches.`);
            }
            if (!fileId) {
                throw new context.CancelError('Missing fileId. Please provide an Appmixer file ID or Google Drive file object.');
            }

            if (!context.auth || !context.auth.accessToken) {
                throw new context.CancelError('Missing OAuth2 authentication. Please connect your Google account.');
            }

            if (!developerToken) {
                throw new context.CancelError('Missing Developer Token. Please provide a valid Google Ads API Developer Token.');
            }

            if (!customerId) {
                throw new context.CancelError('Missing Customer ID. Please provide the Google Ads Customer Account ID.');
            }

            // Enhanced validation for batchSize
            if (batchSize !== undefined) {
                if (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 100000) {
                    throw new context.CancelError('Invalid batchSize. Must be a number between 1 and 100000. Lower values use less memory.');
                }
            }

            // Enhanced validation for CSV column indices
            if (segmentColumnIndex !== undefined) {
                if (typeof segmentColumnIndex !== 'number' || segmentColumnIndex < 0 || segmentColumnIndex > 50) {
                    throw new context.CancelError('Invalid segmentColumnIndex. Must be a number between 0 and 50.');
                }
            }
            
            if (emailColumnIndex !== undefined) {
                if (typeof emailColumnIndex !== 'number' || emailColumnIndex < 0 || emailColumnIndex > 50) {
                    throw new context.CancelError('Invalid emailColumnIndex. Must be a number between 0 and 50.');
                }
            }

            context.log('info', `Initializing Google Ads API client for customer ${customerId}`);

            let segmentMapping;
            try {
                segmentMapping = typeof segmentToUserList === 'string'
                    ? JSON.parse(segmentToUserList)
                    : segmentToUserList;
            } catch (e) {
                context.log('error', `Failed to parse segmentToUserList. Input value: ${JSON.stringify(segmentToUserList)}`);
                throw new context.CancelError(`Invalid segmentToUserList JSON: ${e.message}. Check that keys and values use double quotes, no trailing commas, and valid JSON syntax.`);
            }

            // Enhanced validation for segmentToUserList JSON structure
            if (!segmentMapping || typeof segmentMapping !== 'object' || Array.isArray(segmentMapping)) {
                throw new context.CancelError('segmentToUserList must be a JSON object with segment names as keys and user list IDs as values.');
            }

            const segmentKeys = Object.keys(segmentMapping);
            if (segmentKeys.length === 0) {
                throw new context.CancelError('segmentToUserList cannot be empty. Please provide at least one segment mapping.');
            }

            if (segmentKeys.length > 100) {
                throw new context.CancelError('segmentToUserList cannot have more than 100 segments. Please reduce the number of segments.');
            }

            // Validate each segment mapping
            for (const [segment, userListIds] of Object.entries(segmentMapping)) {
                if (!segment || typeof segment !== 'string' || segment.trim().length === 0) {
                    throw new context.CancelError(`Invalid segment name: '${segment}'. Segment names must be non-empty strings.`);
                }

                if (segment.length > 100) {
                    throw new context.CancelError(`Segment name '${segment}' is too long. Maximum length is 100 characters.`);
                }

                // Validate user list IDs
                const userListArray = Array.isArray(userListIds) ? userListIds : [userListIds];
                for (const userListId of userListArray) {
                    if (!userListId || (typeof userListId !== 'string' && typeof userListId !== 'number')) {
                        throw new context.CancelError(`Invalid user list ID '${userListId}' for segment '${segment}'. User list IDs must be non-empty strings or numbers.`);
                    }

                    const userListIdStr = String(userListId).trim();
                    if (!/^\d+$/.test(userListIdStr)) {
                        throw new context.CancelError(`Invalid user list ID '${userListId}' for segment '${segment}'. User list IDs must be numeric.`);
                    }
                }
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
                client_id: context.auth.clientId,
                client_secret: context.auth.clientSecret,
                developer_token: developerToken
            });

            const customer = client.Customer({
                customer_account_id: customerId,
                refresh_token: context.auth.refreshToken,
                login_customer_id: loginCustomerId || undefined
            });

            const scheduleContinuation = async (reason) => {
                context.log('info', `Scheduling continuation (${reason}): ${processedSegments.length}/${totalSegments || 'unknown'} segments processed`);
                
                // Store minimal state for continuation - only essential data
                const continuationState = {
                    // Original input parameters
                    fileId,
                    developerToken,
                    loginCustomerId,
                    customerId,
                    segmentToUserList,
                    uploadMode,
                    batchSize,
                    
                    // Progress tracking
                    timeStart: timeStart.getTime(),
                    processedSegments,
                    currentSegmentNumber,
                    
                    // Results summary
                    totalJobs: results.totalJobs,
                    totalUsers: results.totalUsers,
                    errors: results.errors
                };
                
                return context.setTimeout(continuationState, TIMEOUT_DELAY_SECONDS * 1000);
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
                context.log('info', `Processing Appmixer file: ${fileId}`);
                fileStream = await context.getFileReadStream(fileId);
            } else {
                throw new context.CancelError('Invalid fileId format. Expected string (Appmixer file ID) or object (file content).');
            }

            // Validate CSV parsing options
            csvParser.validateParsingOptions({
                segmentColumnIndex,
                emailColumnIndex,
                containsHeaders,
                columnSeparator,
                batchSize
            }, context);

            segmentGroups = await csvParser.parseCSV(fileStream, {
                segmentColumnIndex,
                emailColumnIndex,
                containsHeaders,
                columnSeparator,
                batchSize
            }, context);

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

            const userListJobs = new Map();

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

                        const batches = lib.chunkArray(emails, batchSize);
                        context.log('info', `Split into ${batches.length} batch(es) of max ${batchSize} users`);

                        const segmentStartTime = Date.now();
                        let lastSegmentProgressLogTime = 0;
                        let adaptiveDelayMs = 0;
                        const MIN_DELAY = 0;
                        const MAX_DELAY = 5000;
                        const DELAY_INCREMENT = 100;
                        const DELAY_DECREMENT = 10;
                        lib.safeSendProgress(context, {
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
                                jobResourceName = await lib.createUserDataJob(context, customer, customerId, userListId);

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
                                    const extractedErrorMsg = lib.extractErrorMessage(createError);
                                    context.log('error', `Rate limit hit during job creation - stopping all segment processing`);

                                    lib.safeSendProgress(context, {
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

                                    await lib.addOperations(
                                        context,
                                        customer,
                                        customerId,
                                        jobResourceName,
                                        batch
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

                                const generalMessage = `Segment ${currentSegmentNumber}/${totalSegments}, Batch ${batchesCompletedOverall}/${totalBatchesOverall} (${overallProgress}%) - ${lib.formatTime(overallElapsedSeconds)} elapsed, ETA: ${lib.formatTime(overallEtaSeconds)}`;
                                const segmentMessage = `Batch 1/${batches.length} uploaded (${progress}%) - ${lib.formatTime(elapsedSeconds)} elapsed${etaSeconds ? ', ETA: ' + lib.formatTime(etaSeconds) : ''}`;
                                const combinedMessage = `${generalMessage}\n${segmentMessage}`;

                                const now = Date.now();
                                const shouldLog = (now - lastSegmentProgressLogTime) >= 5000 || i === 0 || i === batches.length - 1;
                                if (shouldLog) {
                                    context.log('info', generalMessage);
                                    context.log('info', segmentMessage);
                                    lastSegmentProgressLogTime = now;
                                }

                                if (shouldLog) {
                                    lib.safeSendProgress(context, {
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

                                    await lib.addOperations(
                                        context,
                                        customer,
                                        customerId,
                                        jobResourceName,
                                        batch
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

                                const generalMessage = `Segment ${currentSegmentNumber}/${totalSegments}, Batch ${batchesCompletedOverall}/${totalBatchesOverall} (${overallProgress}%) - ${lib.formatTime(overallElapsedSeconds)} elapsed, ETA: ${lib.formatTime(overallEtaSeconds)}`;
                                const segmentMessage = `Batch ${i + 1}/${batches.length} uploaded (${progress}%) - ${lib.formatTime(elapsedSeconds)} elapsed${etaSeconds ? ', ETA: ' + lib.formatTime(etaSeconds) : ''}`;
                                const combinedMessage = `${generalMessage}\n${segmentMessage}`;

                                const now = Date.now();
                                const shouldLog = (now - lastSegmentProgressLogTime) >= 5000 || i === batches.length - 1;
                                if (shouldLog) {
                                    context.log('info', generalMessage);
                                    context.log('info', segmentMessage);
                                    lastSegmentProgressLogTime = now;
                                }

                                if (shouldLog) {
                                    lib.safeSendProgress(context, {
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

                        lib.safeSendProgress(context, {
                            segment,
                            totalBatches: batches.length,
                            currentBatch: batches.length,
                            uploadedSoFar: totalUploaded,
                            totalUsers: emails.length,
                            progress: 100,
                            elapsedSeconds: totalElapsedSeconds,
                            etaSeconds: 0,
                            status: 'uploaded',
                            message: `Segment '${segment}' complete: ${totalUploaded} users uploaded in ${lib.formatTime(totalElapsedSeconds)}`,
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
                            errorDetails = lib.extractErrorMessage(error);
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

                    const operation = await lib.runJob(context, customer, customerId, jobInfo.jobResourceName);

                    for (const segment of jobInfo.segments) {
                        if (results.jobsBySegment[segment]) {
                            results.jobsBySegment[segment].operationName = operation.name || null;
                            results.jobsBySegment[segment].status = 'SUBMITTED';
                        }
                    }

                    results.totalJobs++;
                    context.log('info', `Job submitted for User List ${userListId}`);

                } catch (error) {
                    const errorMsg = lib.extractErrorMessage(error);

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

            context.log('info', `Upload complete: ${results.totalJobs} jobs, ${results.totalUsers} total users, ${lib.formatTime(totalElapsedSeconds)} elapsed`);
            context.log('info', 'Job status summary:');
            for (const [segment, jobInfo] of Object.entries(results.jobsBySegment)) {
                context.log('info', `  Segment '${segment}': ${jobInfo.status} (${jobInfo.usersUploaded} users)`);
            }
            context.log('info', 'Note: Status "SUBMITTED" means run() was accepted. Jobs process asynchronously in Google Ads.');

            return context.sendJson(results, 'out');

        } catch (error) {
            const errorMsg = lib.extractErrorMessage(error);
            context.log('error', `Fatal error: ${errorMsg}`);
            context.log('error', `Full error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
            results.success = false;
            results.errors.push(errorMsg);
            results.internalErrors = internalErrors;

            return context.sendJson(results, 'out');
        }
    },


};

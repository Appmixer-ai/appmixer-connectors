/**
 * Google Ads Customer Match Upload Component
 *
 * Reads CSV in chunks (batchSize * chunkMultiplier rows), groups by segment,
 * uploads batches with per-batch progress, then checks timeout.
 * Continuation: finish current chunk work, save lastProcessedRow, schedule next receive().
 * Rate limits: retried up to 5 times with backoff, then stops with error output.
 * stop() hook cancels pending timeouts so stopped flows don't trigger errors.
 */

'use strict';

const { GoogleAdsApi } = require('google-ads-api');
const lib = require('../lib');
const csvParser = require('../csvParser');

const TIMEOUT_TRIGGER_SECONDS = 10 * 60; // check continuation after each chunk if 10 min elapsed
const TIMEOUT_DELAY_SECONDS = 60;        // pause between continuations
const PROGRESS_INTERVAL_MS = 5000;       // throttle progress messages to every 5 seconds
const MAX_UPLOAD_TIME_HOURS = 48;
const STATE_KEY_TIMEOUT_ID = 'pendingTimeoutId';

module.exports = {

    /**
     * Cancel any pending continuation when the flow is stopped.
     */
    async stop(context) {
        try {
            const timeoutId = await context.stateGet(STATE_KEY_TIMEOUT_ID);
            if (timeoutId) {
                await context.clearTimeout(timeoutId);
                await context.stateUnset(STATE_KEY_TIMEOUT_ID);
                lib.safeLog(context, 'info', 'Cleared pending continuation timeout on flow stop');
            }
        } catch (err) {
            lib.safeLog(context, 'warn', `stop() cleanup: ${err.message}`);
        }
    },

    async receive(context) {

        const isContinuation = !!context.messages.timeout;

        // ── Restore or initialize state ──────────────────────────────────────
        let fileId, developerToken, loginCustomerId, customerId;
        let segmentToUserList, uploadMode, batchSize, columnSeparator;
        let timeStart, lastProcessedRow, segmentProgress, errors, totalUsersUploaded;
        let jobsAlreadyRun;
        let totalRows;

        if (isContinuation) {
            const s = context.messages.timeout.content;

            // Guard against stale continuations from older component versions
            if (!s || !s.fileId || !s.customerId) {
                lib.safeLog(context, 'warn', 'Ignoring stale/invalid continuation payload (missing critical fields). Likely from an older component version.');
                return;
            }

            fileId = s.fileId;
            developerToken = s.developerToken;
            loginCustomerId = s.loginCustomerId;
            customerId = s.customerId;
            segmentToUserList = s.segmentToUserList;
            uploadMode = s.uploadMode || 'REPLACE';
            batchSize = s.batchSize || 10000;
            columnSeparator = s.columnSeparator || ',';
            timeStart = new Date(s.timeStart);
            lastProcessedRow = s.lastProcessedRow || 0;
            segmentProgress = s.segmentProgress || {};
            errors = s.errors || [];
            totalUsersUploaded = s.totalUsersUploaded || 0;
            jobsAlreadyRun = s.jobsAlreadyRun || [];
            totalRows = s.totalRows || 0;

            lib.safeLog(context, 'info', `Continuation: row ${lastProcessedRow}/${totalRows}, ${totalUsersUploaded} uploaded`);
        } else {
            const msg = context.messages.in.content;
            fileId = msg.fileId;
            developerToken = msg.developerToken;
            loginCustomerId = msg.loginCustomerId;
            customerId = msg.customerId;
            segmentToUserList = msg.segmentToUserList;
            uploadMode = msg.uploadMode || 'REPLACE';
            batchSize = msg.batchSize || 10000;
            columnSeparator = msg.columnSeparator || ',';
            timeStart = new Date();
            lastProcessedRow = 0;
            segmentProgress = {};
            errors = [];
            totalUsersUploaded = 0;
            jobsAlreadyRun = [];
            totalRows = 0;
        }

        // ── Validation ───────────────────────────────────────────────────────
        if ((Date.now() - timeStart) >= (MAX_UPLOAD_TIME_HOURS * 3600 * 1000)) {
            throw new context.CancelError(`Upload exceeded maximum time limit (${MAX_UPLOAD_TIME_HOURS}h). Check your data and retry.`);
        }
        if (!fileId) throw new context.CancelError('Missing fileId.');
        if (!context.auth || !context.auth.accessToken) throw new context.CancelError('Missing OAuth2 authentication. Please connect your Google account.');
        // Debug: log which auth fields are present (not their values)
        lib.safeLog(context, 'info', `Auth fields: clientId=${!!context.auth.clientId}, clientSecret=${!!context.auth.clientSecret}, accessToken=${!!context.auth.accessToken}, refreshToken=${!!context.auth.refreshToken}`);
        if (!context.auth.refreshToken) {
            throw new context.CancelError('Missing refresh token. Please disconnect and reconnect your Google account to re-authorize with offline access.');
        }
        if (!developerToken) throw new context.CancelError('Missing Developer Token.');
        if (!customerId) throw new context.CancelError('Missing Customer ID.');

        let segmentMapping;
        try {
            segmentMapping = typeof segmentToUserList === 'string' ? JSON.parse(segmentToUserList) : segmentToUserList;
        } catch (e) {
            throw new context.CancelError(`Invalid segmentToUserList JSON: ${e.message}`);
        }
        if (!segmentMapping || typeof segmentMapping !== 'object' || Array.isArray(segmentMapping)) {
            throw new context.CancelError('segmentToUserList must be a JSON object.');
        }

        const normalizedMapping = {};
        for (const [seg, val] of Object.entries(segmentMapping)) {
            const arr = Array.isArray(val) ? val : [val];
            const valid = arr.filter(v => v != null && v !== '' && /^\d+$/.test(String(v).trim()));
            if (valid.length > 0) normalizedMapping[seg] = valid;
        }

        // ── Google Ads API client ────────────────────────────────────────────
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

        // ── Rate limit coordination ──────────────────────────────────────────
        let globalRateLimitUntil = 0;
        const checkGlobalRateLimit = async () => {
            const wait = globalRateLimitUntil - Date.now();
            if (wait > 0) {
                lib.safeLog(context, 'warn', `Global rate limit - waiting ${Math.ceil(wait / 1000)}s`);
                await new Promise(r => setTimeout(r, wait));
            }
        };
        const setGlobalRateLimit = (delay) => {
            globalRateLimitUntil = Date.now() + (delay || 3000);
        };

        // ── Count total rows once on first run ────────────────────────────────
        if (!totalRows) {
            let countStream;
            if (typeof fileId === 'object' && fileId.fileContent) {
                const { Readable } = require('stream');
                countStream = Readable.from(
                    typeof fileId.fileContent === 'string'
                        ? Buffer.from(fileId.fileContent, fileId.encoding || 'utf8')
                        : fileId.fileContent
                );
            } else if (typeof fileId === 'string') {
                countStream = await context.getFileReadStream(fileId);
            }
            if (countStream) {
                totalRows = await csvParser.countRows(countStream, { columnSeparator, segmentKeys: Object.keys(normalizedMapping) }, context);
                lib.safeLog(context, 'info', `CSV total data rows: ${totalRows}`);
            }
        }

        // ── Helpers ──────────────────────────────────────────────────────────
        const receiveTimeStart = Date.now();
        const shouldContinue = () => (Date.now() - receiveTimeStart) >= (TIMEOUT_TRIGGER_SECONDS * 1000);

        // Throttled progress: send at most one progress message every PROGRESS_INTERVAL_MS
        let lastProgressTime = 0;
        const sendThrottledProgress = (force = false) => {
            const now = Date.now();
            if (!force && (now - lastProgressTime) < PROGRESS_INTERVAL_MS) return;
            lastProgressTime = now;

            const elapsed = Math.floor((now - timeStart) / 1000);
            const pct = totalRows > 0 ? Math.round((lastProcessedRow / totalRows) * 100) : 0;

            // ETA: based on processing rate so far
            let etaStr = 'calculating...';
            if (lastProcessedRow > 0 && totalRows > 0) {
                const rowsRemaining = totalRows - lastProcessedRow;
                const rate = lastProcessedRow / elapsed; // rows per second
                const etaSeconds = Math.ceil(rowsRemaining / rate);
                etaStr = lib.formatTime(etaSeconds);
            }

            // Per-segment summary
            const segSummary = {};
            for (const sp of Object.values(segmentProgress)) {
                if (!segSummary[sp.segment]) segSummary[sp.segment] = { uploaded: 0, failed: 0 };
                segSummary[sp.segment].uploaded += sp.uploaded;
                segSummary[sp.segment].failed += sp.failed;
            }
            const segStr = Object.entries(segSummary)
                .map(([s, v]) => `${s}:${v.uploaded}${v.failed ? `(${v.failed} failed)` : ''}`)
                .join(', ');

            lib.safeSendProgress(context, {
                message: `${pct}% | Row ${lastProcessedRow}/${totalRows} | ${totalUsersUploaded} uploaded [${segStr}] | ${lib.formatTime(elapsed)} elapsed | ETA: ${etaStr}`,
                status: 'uploading',
                totalRows,
                lastProcessedRow,
                totalUsersUploaded,
                percentage: pct,
                elapsedSeconds: elapsed,
                eta: etaStr,
                segments: segSummary
            }, 'progress');
        };

        const scheduleContinuation = async (reason) => {
            lib.safeLog(context, 'info', `Scheduling continuation (${reason}): row=${lastProcessedRow}, ${totalUsersUploaded} users uploaded`);

            const trimmedErrors = errors.length > 100 ? errors.slice(-100) : errors;
            const payload = {
                fileId, developerToken,
                loginCustomerId, customerId, segmentToUserList, uploadMode,
                batchSize, columnSeparator,
                timeStart: timeStart.getTime(),
                lastProcessedRow,
                segmentProgress,
                errors: trimmedErrors,
                totalUsersUploaded,
                jobsAlreadyRun,
                totalRows
            };

            try {
                const timeoutId = await context.setTimeout(payload, TIMEOUT_DELAY_SECONDS * 1000);
                // Persist timeoutId so stop() can cancel it
                await context.stateSet(STATE_KEY_TIMEOUT_ID, timeoutId);
                return;
            } catch (err) {
                lib.safeLog(context, 'error', `context.setTimeout FAILED: ${err.message}. Payload ~${JSON.stringify(payload).length} bytes`);
                return context.sendJson({
                    totalJobs: 0,
                    totalUsers: totalUsersUploaded,
                    jobsBySegment: {},
                    errors: [...trimmedErrors, `Continuation failed: ${err.message}`],
                    internalErrors: [],
                    success: false
                }, 'out');
            }
        };

        /**
         * Upload a batch of emails to a segment's user list.
         * Creates the OfflineUserDataJob on first call per user list.
         */
        const uploadBatch = async (segment, emailBatch, isFinal) => {
            const userListIds = normalizedMapping[segment];
            if (!userListIds) return;

            for (const userListId of userListIds) {
                const progressKey = `${segment}__${userListId}`;

                if (!segmentProgress[progressKey]) {
                    segmentProgress[progressKey] = {
                        segment, userListId,
                        jobResourceName: null,
                        uploaded: 0, failed: 0
                    };
                }
                const sp = segmentProgress[progressKey];

                // Create job on first batch for this user list
                if (!sp.jobResourceName) {
                    await checkGlobalRateLimit();
                    try {
                        sp.jobResourceName = await lib.createUserDataJob(context, customer, customerId, userListId);
                        lib.safeLog(context, 'info', `Created job: segment '${segment}' UL ${userListId}: ${sp.jobResourceName}`);
                    } catch (err) {
                            const errMsg = lib.extractErrorMessage(err);
                        lib.safeLog(context, 'error', `Job creation failed: segment '${segment}' UL ${userListId}: ${errMsg}`);
                        errors.push(`Job creation failed: segment '${segment}' UL ${userListId}: ${errMsg}`);
                        return;
                    }
                }

                // Upload
                await checkGlobalRateLimit();
                const result = await lib.addOperations(
                    context, customer, customerId, sp.jobResourceName,
                    emailBatch, 5, 1000, setGlobalRateLimit
                );

                sp.uploaded += result.succeeded;
                sp.failed += result.failed.length;
                totalUsersUploaded += result.succeeded;

                if (result.failed.length > 0) {
                    for (const fail of result.failed) {
                        errors.push(`Segment '${segment}' UL ${userListId}: [${fail.email}] ${fail.error}`);
                    }
                }

                // Throttled progress (at most every 5s)
                sendThrottledProgress();
            }
        };

        // ── Main chunk loop ─────────────────────────────────────────────────
        const segmentKeys = Object.keys(normalizedMapping);
        const chunkSize = batchSize * 5;

        try {
            csvParser.validateParsingOptions({ columnSeparator }, context);

            let csvDone = false;

            while (!csvDone) {
                // Open a fresh file stream for each chunk
                let fileStream;
                if (typeof fileId === 'object' && fileId.fileContent) {
                    const { Readable } = require('stream');
                    fileStream = Readable.from(
                        typeof fileId.fileContent === 'string'
                            ? Buffer.from(fileId.fileContent, fileId.encoding || 'utf8')
                            : fileId.fileContent
                    );
                } else if (typeof fileId === 'string') {
                    fileStream = await context.getFileReadStream(fileId);
                } else {
                    throw new context.CancelError('Invalid fileId format.');
                }

                // readChunk: skip startRow rows, collect chunkSize rows, destroy stream
                const { rows, rowsRead } = await csvParser.readChunk(fileStream, {
                    startRow: lastProcessedRow,
                    rowCount: chunkSize,
                    columnSeparator,
                    segmentKeys
                }, context);

                if (rowsRead === 0) {
                    csvDone = true;
                    lib.safeLog(context, 'info', `CSV fully read at row ${lastProcessedRow}. No more data.`);
                    break;
                }

                // Group chunk rows by segment
                const segmentGroups = {};
                let unmappedCount = 0;
                for (const { segment, email } of rows) {
                    if (!normalizedMapping[segment]) { unmappedCount++; continue; }
                    if (!segmentGroups[segment]) segmentGroups[segment] = [];
                    segmentGroups[segment].push(email);
                }

                // Process ALL segments and ALL batches in this chunk
                const segmentEntries = Object.entries(segmentGroups);
                for (let si = 0; si < segmentEntries.length; si++) {
                    const [segment, emails] = segmentEntries[si];

                    for (let i = 0; i < emails.length; i += batchSize) {
                        const batch = emails.slice(i, i + batchSize);
                        const isFinal = (i + batchSize >= emails.length);
                        await uploadBatch(segment, batch, isFinal);
                    }
                }

                // Advance row pointer — chunk fully processed (all segments succeeded)
                lastProcessedRow += rowsRead;
                // Force a progress message after each chunk completes
                sendThrottledProgress(true);

                // Check timeout AFTER all chunk work is done
                if (shouldContinue()) {
                    return await scheduleContinuation('chunk_timeout');
                }
            }

            // ── All data uploaded — run jobs ─────────────────────────────────
            lib.safeLog(context, 'info', 'All CSV data uploaded. Running jobs...');

            const results = {
                totalJobs: 0,
                totalUsers: totalUsersUploaded,
                jobsBySegment: {},
                errors,
                internalErrors: [],
                success: errors.length === 0
            };

            const alreadyRunSet = new Set(jobsAlreadyRun);
            const jobsToRun = new Map();
            for (const [progressKey, sp] of Object.entries(segmentProgress)) {
                if (!sp.jobResourceName) continue;

                results.jobsBySegment[progressKey] = {
                    segment: sp.segment,
                    jobResourceName: sp.jobResourceName,
                    userListId: sp.userListId,
                    usersUploaded: sp.uploaded,
                    failedUsers: sp.failed,
                    operationName: null,
                    status: 'PENDING',
                    uploadMode
                };

                if (alreadyRunSet.has(sp.jobResourceName)) {
                    results.jobsBySegment[progressKey].status = 'SUBMITTED';
                    continue;
                }

                if (!jobsToRun.has(sp.jobResourceName)) {
                    jobsToRun.set(sp.jobResourceName, { userListId: sp.userListId, progressKeys: [] });
                }
                jobsToRun.get(sp.jobResourceName).progressKeys.push(progressKey);
            }

            for (const [jobResourceName, jobInfo] of jobsToRun) {
                if (shouldContinue()) {
                    return await scheduleContinuation('timeout_during_job_run');
                }

                try {
                    lib.safeLog(context, 'info', `Running job: ${jobResourceName} (UL ${jobInfo.userListId})`);
                    const operation = await lib.runJob(context, customer, customerId, jobResourceName);

                    for (const pk of jobInfo.progressKeys) {
                        if (results.jobsBySegment[pk]) {
                            results.jobsBySegment[pk].operationName = (operation && operation.name) ? operation.name : null;
                            results.jobsBySegment[pk].status = 'SUBMITTED';
                        }
                    }
                    results.totalJobs++;
                    jobsAlreadyRun.push(jobResourceName);
                } catch (err) {
                    const errMsg = lib.extractErrorMessage(err);
                    lib.safeLog(context, 'error', `Failed to run job ${jobResourceName}: ${errMsg}`);
                    errors.push(`Failed to run job UL ${jobInfo.userListId}: ${errMsg}`);
                    for (const pk of jobInfo.progressKeys) {
                        if (results.jobsBySegment[pk]) {
                            results.jobsBySegment[pk].status = 'FAILED';
                        }
                    }
                }
            }

            // Clear timeout state on successful completion
            await context.stateUnset(STATE_KEY_TIMEOUT_ID);

            const totalElapsed = Math.floor((Date.now() - timeStart) / 1000);
            lib.safeLog(context, 'info', `Upload complete: ${results.totalJobs} jobs, ${results.totalUsers} users, ${lib.formatTime(totalElapsed)} elapsed`);

            return context.sendJson(results, 'out');

        } catch (error) {
            const errorMsg = lib.extractErrorMessage(error);
            lib.safeLog(context, 'error', `Fatal error: ${errorMsg}`);

            return context.sendJson({
                totalJobs: 0,
                totalUsers: totalUsersUploaded,
                jobsBySegment: {},
                errors: [...errors, errorMsg],
                internalErrors: [],
                success: false,
                lastProcessedRow: lastProcessedRow || 0,
                totalRows: totalRows || 0
            }, 'out');
        }
    }
};

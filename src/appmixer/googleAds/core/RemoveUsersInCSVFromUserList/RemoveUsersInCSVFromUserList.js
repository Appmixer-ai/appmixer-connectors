'use strict';

const lib = require('../../lib');
const csvParser = require('../../csvParser');

// ---------------------------------------------------------------------------
// Configurable constants – override via context.config in Appmixer backoffice
// ---------------------------------------------------------------------------

/**
 * How many rows to send to the Google Ads API in a single
 * addOfflineUserDataJobOperations call.
 */
const DEFAULT_BATCH_SIZE = 10000;

/**
 * How many seconds of wall-clock time a single receive() invocation is
 * allowed to run before we schedule a continuation and yield.
 */
const DEFAULT_TIMEOUT_TRIGGER_SECONDS = 10 * 60; // 10 min

/**
 * How many seconds to wait before the next continuation is fired.
 */
const DEFAULT_TIMEOUT_SECONDS = 60;

/**
 * Maximum total wall-clock time (seconds) across all continuations.
 * Uploads that exceed this limit are aborted with a partial-upload error.
 */
const DEFAULT_MAX_UPLOAD_SECONDS = 48 * 60 * 60; // 48 hours

/**
 * How often (ms) to emit a progress update while processing.
 */
const PROGRESS_INTERVAL_MS = 5000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normId = lib.normalizeCustomerId;

/**
 * Build a remove OfflineUserDataJobOperation for the Google Ads API.
 */
function buildOperation(row, schemaConfig, adPersonalization, adUserData) {
    const userIdentifiers = lib.buildUserIdentifiersFromCsvRow(row, schemaConfig);
    if (userIdentifiers.length === 0) {
        return null; // row has no usable identifier – skip
    }

    const userData = { userIdentifiers };

    if (adPersonalization || adUserData) {
        userData.consent = {};
        if (adPersonalization) {
            userData.consent.adPersonalization = adPersonalization;
        }
        if (adUserData) {
            userData.consent.adUserData = adUserData;
        }
    }

    // Use "remove" operation to delete users from the list
    return { remove: userData };
}

// ---------------------------------------------------------------------------
// Google Ads API wrappers
// ---------------------------------------------------------------------------

async function createOfflineUserDataJob(context, {
    customerId, loginCustomerId, userListResourceName
}) {
    const normCustomerId = normId(customerId);
    const headers = lib.buildHeaders(context, { loginCustomerId });

    const jobBody = {
        job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
                userList: userListResourceName
            }
        }
    };

    const { data } = await context.httpRequest({
        method: 'POST',
        url: `${lib.API_BASE_URL}/customers/${normCustomerId}/offlineUserDataJobs:create`,
        headers,
        data: jobBody
    });

    return data.resourceName; // e.g. "customers/123/offlineUserDataJobs/456"
}

async function addOperations(context, { customerId, loginCustomerId, jobResourceName, operations }) {

    const headers = lib.buildHeaders(context, { loginCustomerId });

    const { data } = await context.httpRequest({
        method: 'POST',
        url: `${lib.API_BASE_URL}/${jobResourceName}:addOperations`,
        headers,
        data: {
            enable_partial_failure: true,
            operations
        }
    });

    return data;
}

async function runOfflineUserDataJob(context, { customerId, loginCustomerId, jobResourceName }) {
    const headers = lib.buildHeaders(context, { loginCustomerId });

    const { data } = await context.httpRequest({
        method: 'POST',
        url: `${lib.API_BASE_URL}/${jobResourceName}:run`,
        headers,
        data: {}
    });

    return data; // Long-running operation resource name
}

// ---------------------------------------------------------------------------
// Continuation helpers
// ---------------------------------------------------------------------------

function getBatchSize(context) {
    return parseInt(context.config.batchSize) || DEFAULT_BATCH_SIZE;
}

function getTimeoutTriggerMs(context) {
    return (parseInt(context.config.timeoutTriggerSeconds) || DEFAULT_TIMEOUT_TRIGGER_SECONDS) * 1000;
}

function getTimeoutDelayMs(context) {
    return (parseInt(context.config.timeoutSeconds) || DEFAULT_TIMEOUT_SECONDS) * 1000;
}

function getMaxUploadMs(context) {
    return (parseInt(context.config.maxUploadSeconds) || DEFAULT_MAX_UPLOAD_SECONDS) * 1000;
}

function shouldContinue(receiveStartMs, context) {
    return (Date.now() - receiveStartMs) >= getTimeoutTriggerMs(context);
}

function isUploadExpired(uploadStartMs, context) {
    return (Date.now() - uploadStartMs) > getMaxUploadMs(context);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

module.exports = {

    async receive(context) {

        // ------------------------------------------------------------------
        // 0. Detect continuation vs fresh start
        // ------------------------------------------------------------------

        const isContinuation = !!context.messages.timeout;

        let state;
        if (isContinuation) {
            state = context.messages.timeout.content;

            // Guard against stale continuations (e.g. flow was re-deployed)
            if (!state || !state.fileId || !state.customerId) {
                await context.log({ step: 'stale-continuation', info: 'Ignoring stale timeout message' });
                return;
            }
        } else {
            const input = context.messages.in.content;

            lib.ensureRequired(input.customerId, 'Customer ID is required!', context);
            lib.ensureRequired(input.fileId, 'File is required!', context);
            lib.ensureRequired(input.userListId, 'User List ID is required!', context);
            lib.ensureRequired(input.schema, 'Schema is required!', context);

            const normCustomerId = normId(input.customerId);
            const normUserListId = String(input.userListId || '').replace(/[^0-9]/g, '');
            const userListResourceName = `customers/${normCustomerId}/userLists/${normUserListId}`;

            state = {
                fileId: input.fileId,
                customerId: input.customerId,
                loginCustomerId: input.loginCustomerId || null,
                userListResourceName,
                schema: input.schema || null,
                batchSize: getBatchSize(context),
                columnSeparator: input.columnSeparator || ',',
                adPersonalization: input.adPersonalization || null,
                adUserData: input.adUserData || null,

                // Progress tracking
                uploadStartMs: Date.now(),
                lastProcessedRow: 0,    // 0-based index of next row to read
                totalRows: null,        // filled after first count
                totalUsersRemoved: 0,
                totalUsersSkipped: 0,
                totalPartialFailures: 0,
                errors: [],
                internalErrors: [],
                jobResourceName: null,  // resource name of the currently open job
                jobsRun: []             // resource names of jobs already run
            };
        }

        // ------------------------------------------------------------------
        // 1. Resolve total row count on first invocation
        // ------------------------------------------------------------------

        const batchSize = state.batchSize;
        const delimiter = state.columnSeparator;
        const schemaConfig = lib.buildCsvSchemaConfig(state.schema, context);

        if (state.totalRows === null) {
            const countStream = await context.getFileReadStream(state.fileId);
            state.totalRows = await csvParser.countRows(countStream, delimiter);
            await context.log({
                step: 'count-rows',
                totalRows: state.totalRows,
                fileId: state.fileId
            });
        }

        // ------------------------------------------------------------------
        // 2. Create the offline user data job (once per upload)
        // ------------------------------------------------------------------

        const receiveStartMs = Date.now();

        let jobResourceName = state.jobResourceName || null;
        if (!jobResourceName) {
            jobResourceName = await createOfflineUserDataJob(context, {
                customerId: state.customerId,
                loginCustomerId: state.loginCustomerId,
                userListResourceName: state.userListResourceName
            });
            state.jobResourceName = jobResourceName;
            await context.log({
                step: 'created-job',
                jobResourceName,
                userListResourceName: state.userListResourceName
            });
        }

        // ------------------------------------------------------------------
        // 3. Remove loop – read CSV chunks and submit remove operations
        // ------------------------------------------------------------------

        let lastProgressMs = Date.now();

        while (state.lastProcessedRow < state.totalRows) {
            if (isUploadExpired(state.uploadStartMs, context)) {
                const msg = `Remove exceeded maximum allowed time and was aborted after ${state.totalUsersRemoved} users.`;
                state.internalErrors.push(msg);
                await context.log({ step: 'upload-expired', totalUsersRemoved: state.totalUsersRemoved });
                break;
            }

            // Read a chunk from the CSV
            const fileStream = await context.getFileReadStream(state.fileId);
            const rows = await csvParser.readChunk(fileStream, {
                startRow: state.lastProcessedRow,
                rowCount: batchSize,
                delimiter,
                segmentKeys: []
            });

            if (rows.length === 0) {
                break;
            }

            // Build remove operations
            const operations = [];
            let skippedInChunk = 0;

            for (const row of rows) {
                const op = buildOperation(row, schemaConfig, state.adPersonalization, state.adUserData);
                if (op) {
                    operations.push(op);
                } else {
                    skippedInChunk++;
                }
            }

            // Submit to Google Ads
            if (operations.length > 0) {
                const result = await addOperations(context, {
                    customerId: state.customerId,
                    loginCustomerId: state.loginCustomerId,
                    jobResourceName,
                    operations
                });

                if (result.partialFailureError) {
                    state.totalPartialFailures++;
                    state.errors.push(
                        typeof result.partialFailureError === 'object'
                            ? JSON.stringify(result.partialFailureError)
                            : String(result.partialFailureError)
                    );
                }
            }

            state.totalUsersRemoved += operations.length;
            state.totalUsersSkipped += skippedInChunk;
            state.lastProcessedRow += rows.length;

            // Throttled progress update
            const now = Date.now();
            if (now - lastProgressMs >= PROGRESS_INTERVAL_MS) {
                const elapsed = Math.round((now - state.uploadStartMs) / 1000);
                const pct = state.totalRows > 0
                    ? Math.round((state.lastProcessedRow / state.totalRows) * 100)
                    : 0;

                const remaining = state.totalRows - state.lastProcessedRow;
                const rowsPerSec = elapsed > 0 ? state.lastProcessedRow / elapsed : 0;
                const eta = rowsPerSec > 0 ? Math.round(remaining / rowsPerSec) : null;

                await context.sendJson({
                    status: 'in-progress',
                    message: `Removed ${state.totalUsersRemoved} users (${pct}%)`,
                    totalRows: state.totalRows,
                    lastProcessedRow: state.lastProcessedRow,
                    totalUsersRemoved: state.totalUsersRemoved,
                    percentage: pct,
                    elapsedSeconds: elapsed,
                    eta
                }, 'progress');

                lastProgressMs = now;
            }

            // Check if we're running out of time in this invocation
            if (shouldContinue(receiveStartMs, context)) {
                await context.log({
                    step: 'scheduling-continuation',
                    lastProcessedRow: state.lastProcessedRow,
                    totalRows: state.totalRows,
                    totalUsersRemoved: state.totalUsersRemoved
                });

                const timeoutId = await context.setTimeout(state, getTimeoutDelayMs(context));
                await context.stateSet('timeoutId', timeoutId);
                return;
            }
        }

        // ------------------------------------------------------------------
        // 4. Run the job to trigger Google Ads processing
        // ------------------------------------------------------------------

        let runResult = null;
        if (jobResourceName && !state.jobsRun.includes(jobResourceName)) {
            try {
                runResult = await runOfflineUserDataJob(context, {
                    customerId: state.customerId,
                    loginCustomerId: state.loginCustomerId,
                    jobResourceName
                });
                state.jobsRun.push(jobResourceName);
                await context.log({
                    step: 'job-started',
                    jobResourceName,
                    operationName: runResult
                });
            } catch (err) {
                const errMsg = err.message || String(err);
                state.internalErrors.push(`Failed to run job ${jobResourceName}: ${errMsg}`);
                await context.log({ step: 'job-run-error', jobResourceName, error: errMsg });
            }
        }

        // ------------------------------------------------------------------
        // 5. Clean up continuation state and emit final output
        // ------------------------------------------------------------------

        try {
            const savedTimeoutId = await context.stateGet('timeoutId');
            if (savedTimeoutId) {
                await context.clearTimeout(savedTimeoutId);
                await context.stateUnset('timeoutId');
            }
        } catch (e) {
            // Non-fatal – best-effort cleanup
        }

        const success = state.internalErrors.length === 0;

        await context.sendJson({
            totalUsers: state.totalUsersRemoved,
            totalSkipped: state.totalUsersSkipped,
            totalRows: state.totalRows,
            jobResourceName: jobResourceName || null,
            errors: state.errors,
            internalErrors: state.internalErrors,
            success
        }, 'out');
    },

    async stop(context) {
        // Cancel any pending continuation timeout when the flow is stopped
        try {
            const savedTimeoutId = await context.stateGet('timeoutId');
            if (savedTimeoutId) {
                await context.clearTimeout(savedTimeoutId);
                await context.stateUnset('timeoutId');
            }
        } catch (e) {
            // Non-fatal
        }
    }
};

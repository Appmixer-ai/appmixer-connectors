'use strict';

const connections = require('./connections');

module.exports = async (context) => {

    const AsyncJobModel = require('./AsyncJobModel');
    const config = require('./config')(context);
    const collection = () => context.db.collection(AsyncJobModel.collection);

    // Credentials are kept in the platform service state (same pattern as the Kafka
    // connector keeps connection auth), never in the pgAsyncJobs collection.
    const authStateKey = (jobId) => `pgAsyncJobAuth:${jobId}`;

    // ─── TTL Index ────────────────────────────────────────────────────────────
    // Auto-delete completed/errored jobs after 24 hours.
    // Running jobs are never auto-deleted — only via explicit cleanup.
    try {
        await collection().createIndex(
            { updatedAt: 1 },
            { expireAfterSeconds: 86400, partialFilterExpression: { status: { $in: ['done', 'error'] } } }
        );
    } catch (err) {
        await context.log('warn', `[PG_ASYNC] Could not create TTL index: ${err.message}`);
    }

    const discardAuth = async (jobId) => {
        try {
            await context.service.stateUnset(authStateKey(jobId));
        } catch (err) {
            await context.log('warn', `[PG_ASYNC] Could not discard auth for job ${jobId}: ${err.message}`);
        }
    };

    const failJob = async (job, message) => {
        await collection().updateOne(
            { jobId: job.jobId },
            { $set: { status: 'error', error: message, updatedAt: new Date() } }
        );
        await connections.closeConnection(job.jobId);
        await discardAuth(job.jobId);
        await context.triggerComponent(
            job.flowId, job.componentId,
            { asyncJobId: job.jobId, query: job.query, asyncError: message },
            { enqueueOnly: 'true' }
        ).catch(() => {});
    };

    /**
     * Sync pending async jobs from service state into MongoDB and START them here.
     * Components register jobs via context.service.stateAddToSet('pendingAsyncJobs', ...)
     * because they don't have access to context.db — and, crucially, they run in
     * engine worker processes that share no memory with this plugin: a dblink
     * session opened in a component could never be polled by pollLocalJobs. The
     * query is therefore fired from THIS process, so the pg client lands in the
     * local connections map that pollLocalJobs watches.
     */
    async function syncPendingJobs() {

        const pendingJobs = await context.service.stateGet('pendingAsyncJobs');
        if (!pendingJobs || !pendingJobs.length) return;

        for (const jobData of pendingJobs) {
            const { jobId } = jobData;

            try {
                // Check if already in MongoDB (idempotent)
                const existing = await collection().findOne({ jobId });
                if (!existing) {
                    // Credentials go to service state; the job document itself never
                    // holds them so the pgAsyncJobs collection contains no secrets.
                    await context.service.stateSet(authStateKey(jobId), jobData.auth);
                    await collection().insertOne({
                        jobId: jobData.jobId,
                        status: jobData.status || 'running',
                        flowId: jobData.flowId,
                        componentId: jobData.componentId,
                        query: jobData.query,
                        outputType: jobData.outputType,
                        dblinkConnName: null,
                        error: jobData.error || null,
                        createdAt: new Date(jobData.createdAt || Date.now()),
                        updatedAt: new Date()
                    });
                    await context.log('info', `[PG_ASYNC] Synced job ${jobId} from service state to MongoDB.`);

                    try {
                        const dblinkConnName = await connections.startAsyncQuery(jobData.auth, jobId, jobData.query);
                        await collection().updateOne(
                            { jobId },
                            { $set: { dblinkConnName, updatedAt: new Date() } }
                        );
                        await context.log('info', `[PG_ASYNC] Started async query for job ${jobId} (${dblinkConnName}).`);
                    } catch (err) {
                        // Start failed (bad SQL, missing dblink extension, unreachable DB) —
                        // deliver the error to the component instead of leaving the job to
                        // rot until the stale-recovery restart.
                        await failJob(jobData, err.message);
                    }
                }

                // Remove from state set after successful sync
                await context.service.stateRemoveFromSet('pendingAsyncJobs', jobData);
            } catch (err) {
                await context.log('error', `[PG_ASYNC] Failed to sync job ${jobId}: ${err.message}`);
            }
        }
    }

    /**
     * Poll jobs whose pg client lives on THIS node. No distributed lock is needed —
     * ownership is inherent: the dblink session only exists on the node that started
     * the query, so no other node can poll (or accidentally restart) these jobs.
     * Each pending poll refreshes `updatedAt` as a heartbeat; other nodes treat a
     * stale heartbeat as proof the owning node died (see recoverStaleJobs).
     */
    async function pollLocalJobs() {

        const openConns = connections.listConnections();
        const jobIds = Object.keys(openConns);
        if (!jobIds.length) return;

        for (const jobId of jobIds) {

            let job;
            try {
                job = await collection().findOne({ jobId });
                if (!job) {
                    // Not in MongoDB yet — may still be waiting in pendingAsyncJobs
                    // (query started on this node before any sync ran). Only close
                    // the connection once we know the job is not pending either.
                    const pending = await context.service.stateGet('pendingAsyncJobs');
                    if (!(pending || []).some(j => j.jobId === jobId)) {
                        await context.log('info', `[PG_ASYNC] Job ${jobId} has no record. Closing orphaned connection.`);
                        await connections.closeConnection(jobId);
                        await discardAuth(jobId);
                    }
                    continue;
                }

                if (job.status !== 'running') {
                    await connections.closeConnection(jobId);
                    await discardAuth(jobId);
                    continue;
                }

                // ── Sanity check: flow still running? ──────────────────────────
                const flow = await context.db
                    .coreCollection('flows')
                    .findOne({ flowId: job.flowId, stage: 'running' });

                if (!flow) {
                    await context.log('info', `[PG_ASYNC] Flow ${job.flowId} is not running. Removing job ${jobId}.`);
                    await connections.closeConnection(jobId);
                    await collection().deleteOne({ jobId });
                    await discardAuth(jobId);
                    continue;
                }

                // ── Poll the query status ──────────────────────────────────────
                const result = await connections.pollJob(jobId);

                if (!result || result.status === 'pending') {
                    // Heartbeat — tells other nodes this job is alive and owned.
                    await collection().updateOne({ jobId }, { $set: { updatedAt: new Date() } });
                    continue;
                }

                if (result.status === 'done') {
                    const rows = result.rows || [];
                    await context.log('info', `[PG_ASYNC] Job ${jobId} done — ${rows.length} row(s).`);

                    // Persist the result so it can be inspected or re-delivered
                    // even if the triggerComponent delivery below fails.
                    await collection().updateOne(
                        { jobId },
                        {
                            $set: {
                                status: 'done',
                                result: rows,
                                rowCount: rows.length,
                                updatedAt: new Date()
                            }
                        }
                    );

                    await context.triggerComponent(
                        job.flowId,
                        job.componentId,
                        { asyncJobId: jobId, outputType: job.outputType, query: job.query, asyncRows: rows },
                        { enqueueOnly: 'true' }
                    );

                    await connections.closeConnection(jobId);
                    await discardAuth(jobId);
                }

            } catch (err) {
                await context.log('error', `[PG_ASYNC] Error processing job ${jobId}: ${err.message}`);
                if (job) {
                    try {
                        await failJob(job, err.message);
                    } catch (_) { /* best effort */ }
                }
            }
        }
    }

    /**
     * Take over jobs whose owning node died. A job is only restarted when its
     * heartbeat (`updatedAt`) is older than `staleAfterMs` — i.e. no node has
     * polled it for several ticks, which means the original dblink session is
     * gone (it died with its node). This makes the restart cluster-safe: a job
     * actively owned by a live node is never restarted, so the query cannot run
     * twice. Async mode only accepts read-only SELECT queries (enforced in
     * Query.js), so re-execution after a genuine node death is side-effect free.
     */
    async function recoverStaleJobs() {

        const staleBefore = new Date(Date.now() - config.asyncPollJob.staleAfterMs);
        const staleJobs = await collection().find({
            status: 'running',
            updatedAt: { $lt: staleBefore }
        }).toArray();

        if (!staleJobs.length) return;

        const openConns = connections.listConnections();

        for (const job of staleJobs) {
            const { jobId } = job;

            if (openConns[jobId]) continue; // owned locally — pollLocalJobs handles it

            try {
                const auth = await context.service.stateGet(authStateKey(jobId));
                if (!auth) {
                    await failJob(job, 'Cannot recover job: credentials are no longer available.');
                    continue;
                }

                await context.log('info', `[PG_ASYNC] Job ${jobId} heartbeat is stale — restarting query on this node.`);
                const dblinkConnName = await connections.startAsyncQuery(auth, jobId, job.query);
                await collection().updateOne(
                    { jobId },
                    { $set: { dblinkConnName, updatedAt: new Date() } }
                );
            } catch (err) {
                await context.log('error', `[PG_ASYNC] Failed to restart job ${jobId}: ${err.message}`);
                try {
                    await failJob(job, err.message);
                } catch (_) { /* best effort */ }
            }
        }
    }

    // ─── Main Polling Job ─────────────────────────────────────────────────────
    await context.scheduleJob('pgAsyncPollJob', config.asyncPollJob.schedule, async () => {

        // Local polling runs on every node, unconditionally — each node only
        // touches dblink sessions it owns, so no cross-node lock is needed.
        try {
            await pollLocalJobs();
        } catch (err) {
            await context.log('error', `[PG_ASYNC] Local poll error: ${err.message}`);
        }

        // Cluster-wide maintenance (sync + stale takeover) runs on one node at a time.
        let lock;
        try {
            lock = await context.job.lock('pgAsyncPollJob', { ttl: config.asyncPollJob.lockTTL });
        } catch (err) {
            if (err.message === 'locked') return; // another cluster node is handling it
            await context.log('error', `[PG_ASYNC] Failed to acquire poll lock: ${err.message}`);
            return;
        }

        try {
            await syncPendingJobs();
            await recoverStaleJobs();
        } catch (err) {
            await context.log('error', `[PG_ASYNC] Poll job top-level error: ${err.message}`);
        } finally {
            try {
                await lock.unlock();
            } catch (err) {
                await context.log('warn', `[PG_ASYNC] Failed to release poll lock: ${err.message}`);
            }
        }
    });

    // ─── Cleanup Job ─────────────────────────────────────────────────────────
    // Self-healing: remove jobs stuck in 'running' that are older than the threshold.
    await context.scheduleJob('pgAsyncCleanupJob', config.asyncCleanupJob.schedule, async () => {

        let lock;
        try {
            lock = await context.job.lock('pgAsyncCleanupJob', { ttl: config.asyncCleanupJob.lockTTL });
        } catch (err) {
            if (err.message === 'locked') return;
            return;
        }

        try {
            const stuckBefore = new Date(Date.now() - config.asyncCleanupJob.stuckThresholdMs);
            const stuck = await collection().find({
                status: 'running',
                createdAt: { $lt: stuckBefore }
            }).toArray();

            if (stuck.length) {
                await context.log('info', `[PG_ASYNC] Cleanup: removing ${stuck.length} stuck job(s).`);
                for (const job of stuck) {
                    await connections.closeConnection(job.jobId);
                    await discardAuth(job.jobId);
                    await collection().updateOne(
                        { jobId: job.jobId },
                        { $set: { status: 'error', error: 'Job exceeded stuck threshold and was cleaned up.', updatedAt: new Date() } }
                    );
                }
            }
        } catch (err) {
            await context.log('error', `[PG_ASYNC] Cleanup job error: ${err.message}`);
        } finally {
            try {
                await lock.unlock();
            } catch (err) {
                await context.log('warn', `[PG_ASYNC] Failed to release cleanup lock: ${err.message}`);
            }
        }
    });
};

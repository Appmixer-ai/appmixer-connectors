'use strict';

const connections = require('./connections');

module.exports = async (context) => {

    const AsyncJobModel = require('./AsyncJobModel');
    const config = require('./config')(context);
    const collection = () => context.db.collection(AsyncJobModel.collection);

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

    /**
     * Sync pending async jobs from service state into MongoDB.
     * Components register jobs via context.service.stateAddToSet('pendingAsyncJobs', ...)
     * because they don't have access to context.db.
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
                    // Persist to MongoDB
                    await collection().insertOne({
                        jobId: jobData.jobId,
                        status: jobData.status || 'running',
                        flowId: jobData.flowId,
                        componentId: jobData.componentId,
                        auth: jobData.auth,
                        query: jobData.query,
                        outputType: jobData.outputType,
                        dblinkConnName: null,
                        error: jobData.error || null,
                        createdAt: new Date(jobData.createdAt || Date.now()),
                        updatedAt: new Date()
                    });
                    await context.log('info', `[PG_ASYNC] Synced job ${jobId} from service state to MongoDB.`);
                }

                // Remove from state set after successful sync
                await context.service.stateRemoveFromSet('pendingAsyncJobs', jobData);
            } catch (err) {
                await context.log('error', `[PG_ASYNC] Failed to sync job ${jobId}: ${err.message}`);
            }
        }
    }

    // ─── Main Polling Job ─────────────────────────────────────────────────────
    await context.scheduleJob('pgAsyncPollJob', config.asyncPollJob.schedule, async () => {

        let lock;
        try {
            lock = await context.job.lock('pgAsyncPollJob', { ttl: config.asyncPollJob.lockTTL });
        } catch (err) {
            if (err.message === 'locked') return; // another cluster node is handling it
            await context.log('error', `[PG_ASYNC] Failed to acquire poll lock: ${err.message}`);
            return;
        }

        try {
            // First, sync any pending jobs from service state
            await syncPendingJobs();

            const runningJobs = await collection()
                .find({ status: 'running' })
                .toArray();

            if (!runningJobs.length) return;

            await context.log('trace', `[PG_ASYNC] Polling ${runningJobs.length} running job(s).`);

            for (const job of runningJobs) {
                const { jobId, flowId, componentId, auth, query, outputType } = job;

                try {
                    // ── Sanity check: flow still running? ──────────────────────
                    const flow = await context.db
                        .coreCollection('flows')
                        .findOne({ flowId, stage: 'running' });

                    if (!flow) {
                        await context.log('info', `[PG_ASYNC] Flow ${flowId} is not running. Removing job ${jobId}.`);
                        await connections.closeConnection(jobId);
                        await collection().deleteOne({ jobId });
                        continue;
                    }

                    // ── Connection not on this node? Restart query. ────────────
                    const openConns = connections.listConnections();
                    if (!openConns[jobId]) {
                        await context.log('info', `[PG_ASYNC] Job ${jobId} not open locally — restarting query on this node.`);
                        try {
                            const dblinkConnName = await connections.startAsyncQuery(auth, jobId, query);
                            await collection().updateOne(
                                { jobId },
                                { $set: { dblinkConnName, updatedAt: new Date() } }
                            );
                        } catch (err) {
                            await context.log('error', `[PG_ASYNC] Failed to restart job ${jobId}: ${err.message}`);
                            await collection().updateOne(
                                { jobId },
                                { $set: { status: 'error', error: err.message, updatedAt: new Date() } }
                            );
                            await context.triggerComponent(
                                flowId, componentId,
                                { asyncJobId: jobId, asyncError: err.message },
                                { enqueueOnly: 'true' }
                            ).catch(() => {});
                        }
                        continue;
                    }

                    // ── Poll the query status ──────────────────────────────────
                    const result = await connections.pollJob(jobId);

                    if (!result || result.status === 'pending') {
                        continue; // still running, check next tick
                    }

                    if (result.status === 'done') {
                        const rows = result.rows || [];
                        await context.log('info', `[PG_ASYNC] Job ${jobId} done — ${rows.length} row(s).`);

                        // Mark as done in MongoDB
                        await collection().updateOne(
                            { jobId },
                            {
                                $set: {
                                    status: 'done',
                                    updatedAt: new Date()
                                }
                            }
                        );

                        // Deliver rows directly to the component via triggerComponent payload.
                        // This avoids the component needing context.db access.
                        await context.triggerComponent(
                            flowId,
                            componentId,
                            { asyncJobId: jobId, outputType, asyncRows: rows },
                            { enqueueOnly: 'true' }
                        );

                        await connections.closeConnection(jobId);
                    }

                } catch (err) {
                    await context.log('error', `[PG_ASYNC] Error processing job ${jobId}: ${err.message}`);
                    try {
                        await collection().updateOne(
                            { jobId },
                            { $set: { status: 'error', error: err.message, updatedAt: new Date() } }
                        );
                        await connections.closeConnection(jobId);
                        await context.triggerComponent(
                            flowId, componentId,
                            { asyncJobId: jobId, asyncError: err.message },
                            { enqueueOnly: 'true' }
                        ).catch(() => {});
                    } catch (_) { /* best effort */ }
                }
            }

        } catch (err) {
            await context.log('error', `[PG_ASYNC] Poll job top-level error: ${err.message}`);
        } finally {
            lock?.unlock();
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
                    await collection().updateOne(
                        { jobId: job.jobId },
                        { $set: { status: 'error', error: 'Job exceeded stuck threshold and was cleaned up.', updatedAt: new Date() } }
                    );
                }
            }
        } catch (err) {
            await context.log('error', `[PG_ASYNC] Cleanup job error: ${err.message}`);
        } finally {
            lock?.unlock();
        }
    });
};

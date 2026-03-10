'use strict';

const connections = require('./connections');

module.exports = async (context) => {

    const AsyncJobModel = require('./AsyncJobModel')(context);
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
                            // Update dblinkConnName in case it changed (shouldn't, but for clarity)
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
                            // Trigger component so the flow can handle the error via error port (if any)
                            await context.triggerComponent(
                                flowId, componentId,
                                { _asyncJobId: jobId, _asyncError: err.message },
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
                        await context.log('info', `[PG_ASYNC] Job ${jobId} done — ${result.rows.length} row(s).`);

                        // Store rows in Mongo so the component can retrieve them
                        // without passing a large payload through triggerComponent
                        await collection().updateOne(
                            { jobId },
                            {
                                $set: {
                                    status: 'done',
                                    result: result.rows,
                                    updatedAt: new Date()
                                }
                            }
                        );

                        // Wake up the component — it will fetch rows from Mongo by jobId
                        await context.triggerComponent(
                            flowId,
                            componentId,
                            { _asyncJobId: jobId, outputType },
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
                            { _asyncJobId: jobId, _asyncError: err.message },
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

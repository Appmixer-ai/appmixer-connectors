'use strict';

const lib = require('../lib');

/**
 * Every bucket of the project.
 * @param {object} context
 * @returns {Promise<Array<object>>}
 */
const listBuckets = (context) => {

    const { projectId } = context.properties;
    if (!projectId) {
        throw new context.CancelError('Project ID is required!');
    }
    return lib.listAll(context, '/b', { project: projectId });
};

module.exports = {

    async tick(context) {

        let lock;
        try {
            lock = await context.lock(context.componentId, { ttl: 5 * 60 * 1000, maxRetryCount: 0 });
        } catch (err) {
            // Another tick is still running.
            return;
        }
        try {
            const buckets = await listBuckets(context);
            const state = context.state || {};
            const known = Array.isArray(state.known) ? new Set(state.known) : null;

            // An empty answer while buckets were known is not saved: the next tick would fire
            // every known bucket again.
            if (known?.size && !buckets.length) {
                return;
            }

            if (known) {
                const newBuckets = buckets
                    .filter(bucket => !known.has(bucket.id))
                    .sort((a, b) => Date.parse(a.timeCreated) - Date.parse(b.timeCreated));
                for (const bucket of newBuckets) {
                    await context.sendJson(bucket, 'out');
                }
            }

            await context.saveState({ known: buckets.map(bucket => bucket.id) });
        } finally {
            await lock.unlock();
        }
    },

    async test(context) {

        const buckets = await listBuckets(context);
        if (!buckets.length) {
            throw new context.CancelError(`No buckets found in project ${context.properties.projectId} to use as test data. Create a bucket first.`);
        }
        const latest = buckets.reduce((newest, bucket) => (
            Date.parse(bucket.timeCreated) > Date.parse(newest.timeCreated) ? bucket : newest
        ));
        return context.sendJson(latest, 'out');
    }
};

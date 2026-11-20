'use strict';

const lib = require('../lib');

/**
 * Every object of the bucket (under the prefix). The list is sorted by name, not by time,
 * so every page has to be read to see the changes.
 * @param {object} context
 * @returns {Promise<Array<object>>}
 */
const listObjects = (context) => {

    const { bucket, prefix } = context.properties;
    if (!bucket) {
        throw new context.CancelError('Bucket is required!');
    }
    return lib.listAll(context, `${lib.bucketPath(context, bucket)}/o`, prefix ? { prefix } : {});
};

// One version of an object's data and metadata.
const versionKey = (object) => `${object.name}#${object.generation}#${object.metageneration}`;

const time = (object) => Date.parse(object.updated);

/**
 * The objects created or changed since the state, oldest first, and the next state.
 * The state is a high-water mark: the newest `updated` time seen and the versions seen at
 * that very time (several objects can share a timestamp).
 * @param {{initialized?: boolean, since?: string|null, atSince?: string[]}} state
 * @param {Array<object>} objects
 * @returns {{changed: Array<object>, state: object}}
 */
const diff = (state, objects) => {

    const since = state.since ? Date.parse(state.since) : null;
    const atSince = new Set(state.atSince || []);

    const changed = state.initialized
        ? objects.filter(object => {
            const updated = time(object);
            if (since === null || updated > since) {
                return true;
            }
            return updated === since && !atSince.has(versionKey(object));
        })
        : [];
    changed.sort((a, b) => time(a) - time(b));

    let newest = since;
    for (const object of objects) {
        const updated = time(object);
        if (!Number.isNaN(updated) && (newest === null || updated > newest)) {
            newest = updated;
        }
    }
    const nextAtSince = newest === null
        ? []
        : objects.filter(object => time(object) === newest).map(versionKey);
    if (newest !== null && newest === since) {
        // Keep the versions seen earlier at the same time.
        atSince.forEach(key => nextAtSince.includes(key) || nextAtSince.push(key));
    }

    return {
        changed,
        state: {
            initialized: true,
            since: newest === null ? null : new Date(newest).toISOString(),
            atSince: nextAtSince
        }
    };
};

module.exports = {

    diff,

    async tick(context) {

        let lock;
        try {
            lock = await context.lock(context.componentId, { ttl: 5 * 60 * 1000, maxRetryCount: 0 });
        } catch (err) {
            // Another tick is still running.
            return;
        }
        try {
            const objects = await listObjects(context);
            const { changed, state } = diff(context.state || {}, objects);
            for (const object of changed) {
                await context.sendJson(object, 'out');
            }
            await context.saveState(state);
        } finally {
            await lock.unlock();
        }
    },

    async test(context) {

        const objects = await listObjects(context);
        if (!objects.length) {
            throw new context.CancelError(
                `No objects found in bucket ${context.properties.bucket}${context.properties.prefix ? ` under prefix ${context.properties.prefix}` : ''} to use as test data. Upload an object first.`
            );
        }
        const latest = objects.reduce((newest, object) => (time(object) > time(newest) ? object : newest));
        return context.sendJson(latest, 'out');
    }
};

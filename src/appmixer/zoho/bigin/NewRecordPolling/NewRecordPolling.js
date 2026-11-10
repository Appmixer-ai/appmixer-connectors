'use strict';

const lib = require('../lib');

// Records read per tick, newest first.
const PAGE_SIZE = 200;

// Fields every record carries; the module's standard fields are added by GetRecord's output options.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: lib.COMMON_FIELDS
};

/**
 * Newest records of the module (by Created_Time). Shared by tick() and test().
 * @param {Object} context
 * @param {number} max
 * @returns {Promise<Array<Object>>}
 */
const fetchNewest = (context, max) => {

    const moduleName = lib.assertModule(context, context.properties.module);
    return lib.getLatestRecords(context, moduleName, { sortBy: 'Created_Time', max });
};

module.exports = {

    ITEM_SCHEMA,

    async tick(context) {

        let lock;
        try {
            lock = await context.lock(context.componentId, { ttl: 5 * 60 * 1000, maxRetryCount: 0 });
        } catch (err) {
            // Another tick is still running.
            return;
        }
        try {
            const records = await fetchNewest(context, PAGE_SIZE);
            const state = context.state || {};
            const known = Array.isArray(state.known) ? new Set(state.known) : null;

            // An empty answer while records were known is not saved: the next tick would fire
            // every known record again.
            if (known?.size && !records.length) {
                return;
            }

            if (known) {
                const floor = state.floor ? Date.parse(state.floor) : null;
                const newRecords = records
                    .filter(record => !known.has(record.id))
                    .filter(record => !floor || !(Date.parse(record.Created_Time) <= floor))
                    .reverse();
                for (const record of newRecords) {
                    await context.sendJson(record, 'out');
                }
            }

            const oldest = records[records.length - 1];
            await context.saveState({
                known: records.map(record => record.id),
                // More records than one page: older records that move onto the page are not new.
                floor: oldest && records.length >= PAGE_SIZE ? oldest.Created_Time : null
            });
        } finally {
            await lock.unlock();
        }
    },

    async test(context) {

        const [latest] = await fetchNewest(context, 1);
        if (!latest) {
            throw new context.CancelError(`No ${context.properties.module} records found to use as test data.`);
        }
        return context.sendJson(latest, 'out');
    }
};

'use strict';
const uuid = require('uuid').v4;
const parser = require('cron-parser');
const moment = require('moment-timezone');

// The engine rejects `context.setTimeout` delays above its maximum message delay
// (INPUT_QUEUE_MAX_MESSAGE_DELAY, 31 days by default). The next run of a cron schedule can be
// further away than that (monthly schedule across a DST change, dayMonth 29-31, rare matches),
// so long waits are split into chained timeouts of at most MAX_TIMEOUT each.
const MAX_TIMEOUT = 24 * 60 * 60 * 1000; // 1 day

module.exports = {

    async receive(context) {

        const { threshold, generateOutputPortOptions, getWebhookUrl, outputType = 'array' } = context.properties;

        if (getWebhookUrl) {
            return context.sendJson({
                inputs: {
                    webhookUrl: {
                        defaultValue: context.getWebhookUrl()
                    }
                }
            }, 'out');
        }

        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
        }

        let lock;
        try {
            lock = await context.lock(context.componentId, {
                ttl: 60000,           // 60 seconds
                retryDelay: 300,      // 300ms between retries
                maxRetryCount: 100     // retry up to 100 times
            });

            if (context.messages.webhook) {
                // Manually drained by webhook.
                const wrappedEntries = await context.stateGet('entries') || [];
                const entries = wrappedEntries.map(e => e.data);
                await this.sendEntries(context, entries, outputType);
                await context.stateUnset('entries');
                return context.response();
            }

            if (context.messages.timeout) {
                const timeoutContent = context.messages.timeout.content || {};
                if (timeoutContent.intermediate && timeoutContent.nextDate) {
                    // A chained step of a long wait. Do not drain, keep waiting for the original target date.
                    return this.scheduleDrain(context, {
                        previousDate: timeoutContent.previousDate,
                        nextDate: timeoutContent.nextDate
                    });
                }
                const wrappedEntries = await context.stateGet('entries') || [];
                if (!threshold || (threshold && wrappedEntries.length >= threshold)) {
                    if (wrappedEntries.length > 0) {
                        const entries = wrappedEntries.map(e => e.data);
                        await this.sendEntries(context, entries, outputType);
                        await context.stateUnset('entries');
                    }
                }
                return this.scheduleDrain(context, {
                    previousDate: timeoutContent.previousDate,
                    after: timeoutContent.nextDate
                });
            }

            // Wrap entry with a unique ID and add to set
            const { entry } = context.messages.in.content;
            const wrappedEntry = {
                id: uuid(),
                data: entry
            };
            await context.stateAddToSet('entries', wrappedEntry);

            // Check if threshold reached
            if (threshold) {
                const wrappedEntries = await context.stateGet('entries') || [];
                if (wrappedEntries.length >= threshold) {
                    const entries = wrappedEntries.map(e => e.data);
                    await this.sendEntries(context, entries, outputType);
                    await context.stateUnset('entries');
                }
            }

        } finally {
            if (lock) {
                lock.unlock();
            }
        }
    },

    async start(context) {

        const { minute, hour, dayMonth, dayWeek } = context.properties;

        if (minute || hour || dayMonth || dayWeek) {
            return this.scheduleDrain(context, { previousDate: null });
        }
    },

    async sendEntries(context, entries = [], outputType) {

        if (outputType === 'first') {
            if (entries.length) {
                await context.sendJson({ entry: entries[0], index: 0, count: entries.length }, 'out');
            }
        } else if (outputType === 'object') {
            for (let index = 0; index < entries.length; index++) {
                const entry = entries[index];
                await context.sendJson({ entry, index, count: entries.length }, 'out');
            }
        } else if (outputType === 'array') {
            return context.sendJson({ entries, count: entries.length }, 'out');
        } else if (outputType === 'file') {
            if (entries.length) {
                // Stored into CSV file.
                const headers = Object.keys(entries[0] || {});
                let csvRows = [];
                csvRows.push(headers.join(','));
                for (const entry of entries) {
                    const values = headers.map(header => {
                        const val = entry[header];
                        return `"${val}"`;
                    });
                    csvRows.push(values.join(','));
                }
                const csvString = csvRows.join('\n');
                let buffer = Buffer.from(csvString, 'utf8');
                const fileName = `utils-controls-Digest-${(new Date).toISOString()}.csv`;
                const savedFile = await context.saveFileStream(fileName, buffer);
                await context.sendJson({ fileId: savedFile.fileId, count: entries.length }, 'out');
            }
        }
    },

    /**
     * Schedule the next drain.
     * @param {Object} context
     * @param {Object} options
     * @param {string|null} [options.previousDate] Date the current wait was scheduled at (passed through).
     * @param {string|null} [options.nextDate] Target drain date of a wait already in progress. When set,
     *  the cron expression is not evaluated again, so the target cannot move forward.
     * @param {string|null} [options.after] Compute the next cron run after this date (if it is in the future)
     *  instead of after now. Used after a drain so that a timeout delivered slightly early does not
     *  schedule the same run again.
     */
    async scheduleDrain(context, { previousDate = null, nextDate = null, after = null } = {}) {

        const now = moment();

        if (!nextDate) {
            const { timezone, minute, hour, dayMonth, dayWeek } = context.properties;
            if (timezone && !moment.tz.zone(timezone)) {
                throw new context.CancelError('Invalid timezone');
            }

            const expression = `${minute || 0} ${hour || '*'} ${dayMonth || '*'} * ${dayWeek || '*'}`;
            const options = timezone ? { tz: timezone } : {};
            if (after && moment(after).isValid() && moment(after).isAfter(now)) {
                options.currentDate = moment(after).toDate();
            }
            let interval;
            try {
                interval = parser.parseExpression(expression, options);
            } catch (err) {
                throw new context.CancelError(`Invalid schedule: ${err.message}`);
            }
            if (!interval.hasNext()) {
                throw new context.CancelError('Next scheduled date doesn’t exist');
            }

            nextDate = interval.next().toISOString();
            // A new wait starts now.
            previousDate = now.toISOString();
        }

        const diff = Math.max(moment(nextDate).diff(now), 0);
        if (diff > MAX_TIMEOUT) {
            return context.setTimeout({ previousDate, nextDate, intermediate: true }, MAX_TIMEOUT);
        }
        return context.setTimeout({ previousDate, nextDate }, diff);
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'object' || outputType === 'first') {
            return context.sendJson([
                { label: 'Current Entry Index', value: 'index', schema: { type: 'integer' } },
                { label: 'Entries Count', value: 'count', schema: { type: 'integer' } },
                { label: 'Entry', value: 'entry' }
            ], 'out');
        } else if (outputType === 'array') {
            return context.sendJson([
                { label: 'Entries Count', value: 'count', schema: { type: 'integer' } },
                { label: 'Entries', value: 'entries', schema: { type: 'array' } }
            ], 'out');
        } else if (outputType === 'file') {
            return context.sendJson([
                { label: 'Entries Count', value: 'count', schema: { type: 'integer' } },
                { label: 'File ID', value: 'fileId', schema: { type: 'string', format: 'appmixer-file-id' } }
            ], 'out');
        }
    }
};

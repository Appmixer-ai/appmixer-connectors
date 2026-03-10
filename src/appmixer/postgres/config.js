'use strict';

module.exports = context => {

    return {
        asyncPollJob: {
            /** Poll interval. Default: every 5 seconds. */
            schedule: context.config.asyncPollJobSchedule || '*/5 * * * * *',
            /** Distributed lock TTL in ms. Must be shorter than the schedule interval to avoid overlap. */
            lockTTL: parseInt(context.config.asyncPollJobLockTTL, 10) || 8000
        },
        asyncCleanupJob: {
            /** Cleanup orphaned/stuck jobs. Default: every 10 minutes. */
            schedule: context.config.asyncCleanupJobSchedule || '0 */10 * * * *',
            lockTTL: parseInt(context.config.asyncCleanupJobLockTTL, 10) || 15000,
            /** Jobs older than this (ms) that are still 'running' are considered stuck. Default: 24h. */
            stuckThresholdMs: parseInt(context.config.asyncStuckThresholdMs, 10) || 24 * 60 * 60 * 1000
        }
    };
};

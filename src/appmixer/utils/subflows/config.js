'use strict';

const DEFAULT_CALL_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days.

module.exports = context => {

    const callTTL = parseInt(context.config.callTTL, 10);

    return {
        cleanupDefinitions: {

            schedule: context.config.cleanupDefinitionsJob || '0 0 */12 * * *',
            batchSize: context.config.cleanupDefinitionsBatchSize || 100
        },
        // How long (seconds) the caller of a CallFlow call is remembered, i.e. the longest
        // expected run of a called flow. The called flow's FlowCallOutput must be reached within it.
        callTTL: callTTL > 0 ? callTTL : DEFAULT_CALL_TTL_SECONDS,
        cleanupCalls: {

            schedule: context.config.cleanupCallsJob || '0 30 * * * *'
        }
    };
};

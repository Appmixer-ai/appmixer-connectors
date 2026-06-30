'use strict';

module.exports = context => {

    return {
        ipDeleteJob: {

            /** Default: every 10sec */
            schedule: context.config.ipDeleteJobSchedule || '*/10 * * * * *',
            /** Lock TTL, default: 10sec */
            lockTTL: context.config.ipDeleteJobLockTTL || 10000
        },
        cleanup: {
            /** Default: every hour */
            schedule: context.config.cleanupJobSchedule || '0 0 * * * *',
            /** Lock TTL, default: 10sec */
            lockTTL: context.config.cleanupJobLockTTL || 10000
        },
        // Rule name prefix - used as a prefix for the `description` property for all generated rules
        generatedRuleNamePrefix: context.config.generatedRuleNamePrefix || 'Generated Rule',
        // Rule reference prefix - used as a prefix for the `ref` property for all generated rules
        generatedRuleRefPrefix: context.config.generatedRuleRefPrefix || 'generated_rule'
    };
};

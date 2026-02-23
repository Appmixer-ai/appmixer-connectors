'use strict';

const commons = require('../../commons');
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            customerId,
            developerToken,
            loginCustomerId,
            offlineUserDataJobId
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.ensureRequired(developerToken, 'Developer Token is required!', context);
        lib.ensureRequired(offlineUserDataJobId, 'Offline User Data Job ID is required!', context);

        const query = [
            'SELECT',
            '  offline_user_data_job.resource_name,',
            '  offline_user_data_job.id,',
            '  offline_user_data_job.type,',
            '  offline_user_data_job.status,',
            '  offline_user_data_job.failure_reason,',
            '  offline_user_data_job.num_operations,',
            '  offline_user_data_job.num_user_identifiers',
            'FROM offline_user_data_job',
            `WHERE offline_user_data_job.id = ${String(offlineUserDataJobId).replace(/[^0-9]/g, '')}`,
            'LIMIT 1'
        ].join(' ');

        const rows = await commons.searchStream(context, {
            customerId,
            developerToken,
            loginCustomerId,
            query
        });

        const job = rows[0]?.offlineUserDataJob;

        if (!job) {
            throw new context.CancelError('Offline User Data Job not found!');
        }

        return context.sendJson(job, 'out');
    }
};

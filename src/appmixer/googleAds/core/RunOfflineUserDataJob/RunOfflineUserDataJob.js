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

        await context.httpRequest({
            method: 'POST',
            url: `${commons.API_BASE_URL}/customers/${commons.normalizeCustomerId(customerId)}/offlineUserDataJobs/${String(offlineUserDataJobId).replace(/[^0-9]/g, '')}:run`,
            headers: commons.buildHeaders(context, { developerToken, loginCustomerId }),
            data: {}
        });

        return context.sendJson({
            offlineUserDataJobId: String(offlineUserDataJobId).replace(/[^0-9]/g, ''),
            status: 'RUN_REQUESTED'
        }, 'out');
    }
};

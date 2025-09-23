'use strict';
const { makeRequest, logDeprecatedMinorVersion } = require('../../commons');

module.exports = {

    async receive(context) {

        const {
            billId,
            minorVersion,
            syncToken
        } = context.messages.in.content;

        // Log warning for deprecated minor versions
        await logDeprecatedMinorVersion(context, minorVersion);

        const options = {
            path: `v3/company/${context.profileInfo.companyId}/bill?operation=delete&minorversion=${minorVersion}`,
            method: 'POST',
            data: {
                Id: billId,
                SyncToken: syncToken
            }
        };
        const response = await makeRequest({ context, options });
        return context.sendJson(response.data?.Bill, 'out');
    }
};

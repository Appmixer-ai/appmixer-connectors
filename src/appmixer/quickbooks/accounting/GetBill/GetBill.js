'use strict';
const { makeRequest, logDeprecatedMinorVersion } = require('../../commons');

module.exports = {

    async receive(context) {

        const {
            billId,
            minorVersion
        } = context.messages.in.content;

        // Log warning for deprecated minor versions
        await logDeprecatedMinorVersion(context, minorVersion);

        const options = {
            path: `v3/company/${context.profileInfo.companyId}/bill/${billId}?minorversion=${minorVersion}`,
            method: 'GET'
        };
        const response = await makeRequest({ context, options });
        return context.sendJson(response.data?.Bill, 'out');
    }
};

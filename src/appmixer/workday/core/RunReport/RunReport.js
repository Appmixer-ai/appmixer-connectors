'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { reportOwner, reportName, parameters } = context.messages.in.content;

        if (!reportOwner) {
            throw new context.CancelError('Report Owner is required!');
        }
        if (!reportName) {
            throw new context.CancelError('Report Name is required!');
        }

        const origin = lib.hostOrigin(context.auth.host);
        const tenant = lib.tenantName(context.auth.tenant);
        const url = `${origin}/ccx/service/customreport2/${tenant}/`
            + `${encodeURIComponent(reportOwner)}/${encodeURIComponent(reportName)}`;

        const { data } = await lib.request(context, {
            method: 'GET',
            url,
            headers: lib.authHeaders(context),
            params: { ...lib.kvToObject(parameters), format: 'json' }
        });
        const rows = Array.isArray(data?.Report_Entry) ? data.Report_Entry : [];

        return context.sendJson({ result: rows, count: rows.length }, 'out');
    }
};

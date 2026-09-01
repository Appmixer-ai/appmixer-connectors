'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

/**
 * Find invoices matching the given criteria.
 */
module.exports = {

    async receive(context) {

        const { invoiceDateFrom, invoiceDateTo, dueDateFrom, dueDateTo, status, outputType } =
            context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, lib.schemas.invoice, {
                label: 'Invoices',
                value: 'result'
            });
        }

        const criteria = lib.buildCriteria([
            invoiceDateFrom ? `(Invoice_Date:greater_equal:${lib.formatDate(invoiceDateFrom)})` : null,
            invoiceDateTo ? `(Invoice_Date:less_equal:${lib.formatDate(invoiceDateTo)})` : null,
            dueDateFrom ? `(Due_Date:greater_equal:${lib.formatDate(dueDateFrom)})` : null,
            dueDateTo ? `(Due_Date:less_equal:${lib.formatDate(dueDateTo)})` : null,
            status ? `(Status:equals:${lib.escapeCriteriaValue(status)})` : null
        ]);

        // v2 /search does not support the date comparators, so filtered searches use a newer version.
        const records = criteria
            ? await (new ZohoClient(context, undefined, { apiVersion: lib.SEARCH_API_VERSION }))
                .search('Invoices', { criteria })
            : await (new ZohoClient(context)).getRecords('Invoices');

        if (!records.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};

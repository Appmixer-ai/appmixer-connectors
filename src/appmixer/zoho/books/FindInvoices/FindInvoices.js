'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// The out port is dynamic (outputType), so the item contract is exported for the offline tooling.
// Fields of an invoice in the GET /invoices listing.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['invoice_id'],
    properties: {
        invoice_id: { type: 'string', title: 'Invoice ID', example: '460000000038080' },
        invoice_number: { type: 'string', title: 'Invoice Number', example: 'INV-00001' },
        reference_number: { type: 'string', title: 'Reference Number', example: 'PO-4521' },
        status: { type: 'string', title: 'Status', example: 'sent' },
        customer_id: { type: 'string', title: 'Customer ID', example: '460000000026049' },
        customer_name: { type: 'string', title: 'Customer Name', example: 'Bowman Furniture' },
        email: { type: 'string', title: 'Email', example: 'benjamin.george@bowmanfurniture.com' },
        date: { type: 'string', title: 'Date', example: '2026-11-01' },
        due_date: { type: 'string', title: 'Due Date', example: '2026-11-16' },
        currency_id: { type: 'string', title: 'Currency ID', example: '460000000000097' },
        currency_code: { type: 'string', title: 'Currency Code', example: 'USD' },
        total: { type: 'number', title: 'Total', example: 450 },
        balance: { type: 'number', title: 'Balance', example: 450 },
        salesperson_name: { type: 'string', title: 'Salesperson Name', example: 'Will Smith' },
        is_emailed: { type: 'boolean', title: 'Is Emailed', example: true },
        payment_expected_date: { type: 'string', title: 'Payment Expected Date', example: '2026-11-20' },
        last_payment_date: { type: 'string', title: 'Last Payment Date', example: '2026-11-10' },
        created_time: { type: 'string', title: 'Created Time', example: '2026-11-01T10:30:00+0000' },
        last_modified_time: { type: 'string', title: 'Last Modified Time', example: '2026-11-02T08:12:44+0000' }
    }
};

// Text filters passed to GET /invoices as they are.
const FILTERS = ['customer_id', 'customer_name', 'status', 'invoice_number', 'reference_number', 'search_text'];

/**
 * Find invoices: GET /invoices with the API's search filters, one page of up to 200 invoices,
 * newest first.
 * @see https://www.zoho.com/books/api/v3/invoices/#list-invoices
 */
module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const input = context.messages.in.content;
        const { outputType } = input;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Invoices',
                value: 'result'
            });
        }

        const params = {
            organization_id: input.organizationId,
            ...lib.pickDefined(input, FILTERS),
            sort_column: 'created_time',
            sort_order: 'D',
            page: 1,
            per_page: lib.PAGE_SIZE
        };
        if (input.dateStart) {
            params.date_start = lib.formatDate(input.dateStart);
        }
        if (input.dateEnd) {
            params.date_end = lib.formatDate(input.dateEnd);
        }

        const zc = new ZohoClient(context);
        const { invoices = [] } = await zc.request('GET', '/books/v3/invoices', { params });

        if (!invoices.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: invoices });
    }
};

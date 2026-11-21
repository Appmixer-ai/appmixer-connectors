'use strict';

const lib = require('../../lib');

// The output contract of ONE requester. The out port is dynamic, so this is where the contract lives.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'first_name', 'active'],
    properties: {
        id: { type: 'integer', title: 'Requester ID', example: 1000000888 },
        first_name: { type: 'string', title: 'First Name', example: 'Ron' },
        last_name: { type: 'string', title: 'Last Name', example: 'Weasley' },
        job_title: { type: 'string', title: 'Job Title', example: 'Accountant' },
        primary_email: { type: 'string', title: 'Primary Email', example: 'ron.weasley@example.com' },
        secondary_emails: {
            type: 'array',
            title: 'Secondary Emails',
            items: { type: 'string' },
            example: ['ron@example.org']
        },
        work_phone_number: { type: 'string', title: 'Work Phone Number', example: '62443' },
        mobile_phone_number: { type: 'string', title: 'Mobile Phone Number', example: '77762443' },
        department_ids: {
            type: 'array',
            title: 'Department IDs',
            items: { type: 'integer' },
            example: [1000000554]
        },
        reporting_manager_id: { type: 'integer', title: 'Reporting Manager ID', example: 1000000656 },
        location_id: { type: 'integer', title: 'Location ID', example: 1000000023 },
        address: { type: 'string', title: 'Address', example: '12 Grimmauld Place, London' },
        time_zone: { type: 'string', title: 'Time Zone', example: 'Edinburgh' },
        time_format: { type: 'string', title: 'Time Format', example: '12h' },
        language: { type: 'string', title: 'Language', example: 'en' },
        background_information: { type: 'string', title: 'Background Information', example: 'Joined the finance team in 2024.' },
        active: { type: 'boolean', title: 'Active', example: true },
        has_logged_in: { type: 'boolean', title: 'Has Logged In', example: false },
        is_agent: { type: 'boolean', title: 'Is Agent', example: false },
        custom_fields: {
            type: 'object',
            title: 'Custom Fields',
            properties: {},
            example: { employee_number: 'E-1042' }
        },
        created_at: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-11-21T08:30:00Z' },
        updated_at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-21T08:30:00Z' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { email, query, includeAgents, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Requesters' });
        }

        const filter = lib.filterQuery(context, query);
        const params = includeAgents ? { include_agents: true } : {};

        let requesters;
        if (filter) {
            // The query reads a search index (it can lag a few minutes behind changes).
            requesters = await lib.filterPages(context, '/requesters', 'requesters', { ...params, query: filter });
        } else if (email) {
            // The email filter of the list is exact and reads the users themselves.
            requesters = await lib.listPages(context, '/requesters', 'requesters', { ...params, email: String(email).trim() });
        } else {
            requesters = await lib.listPages(context, '/requesters', 'requesters', params);
        }

        const records = requesters.map(lib.withoutNulls);
        if (!records.length) {
            return context.sendJson({ email: email || null, query: filter || null }, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};

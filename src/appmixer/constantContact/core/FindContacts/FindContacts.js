/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib');

const schema = {
    contact_id: {
        type: 'string',
        title: 'Contact Id'
    },
    email_address: {
        type: 'object',
        properties: {},
        title: 'Email Address'
    },
    first_name: {
        type: 'string',
        title: 'First Name'
    },
    last_name: {
        type: 'string',
        title: 'Last Name'
    },
    job_title: {
        type: 'string',
        title: 'Job Title'
    },
    company_name: {
        type: 'string',
        title: 'Company Name'
    },
    birthday_month: {
        type: 'number',
        title: 'Birthday Month'
    },
    birthday_day: {
        type: 'number',
        title: 'Birthday Day'
    },
    anniversary: {
        type: 'string',
        title: 'Anniversary'
    },
    update_source: {
        type: 'string',
        title: 'Update Source'
    },
    create_source: {
        type: 'string',
        title: 'Create Source'
    },
    created_at: {
        type: 'string',
        title: 'Created At'
    },
    updated_at: {
        type: 'string',
        title: 'Updated At'
    },
    deleted_at: {
        type: 'string',
        title: 'Deleted At'
    },
    custom_fields: {
        type: 'array',
        items: {},
        title: 'Custom Fields'
    },
    phone_numbers: {
        type: 'array',
        items: {},
        title: 'Phone Numbers'
    },
    street_addresses: {
        type: 'array',
        items: {},
        title: 'Street Addresses'
    },
    list_memberships: {
        type: 'array',
        items: {},
        title: 'List Memberships'
    },
    taggings: {
        type: 'array',
        items: {},
        title: 'Taggings'
    },
    notes: {
        type: 'array',
        items: {},
        title: 'Notes'
    },
    sms_channel: {
        type: 'object',
        properties: {},
        title: 'Sms Channel'
    }
};

module.exports = {
    async receive(context) {

        const {
            status,
            email,
            lists,
            tags,
            updated_after,
            updated_before,
            created_after,
            created_before,
            optout_after,
            optout_before,
            sms_status,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Contacts', value: 'contacts' });
        }

        // Build query parameters
        const params = {};

        if (status) {
            const normalizedStatus = lib.normalizeMultiselectInput(status, context, 'Status');
            if (normalizedStatus.length > 0) {
                params.status = normalizedStatus.join(',');
            }
        }

        if (email) {
            params.email = email;
        }

        if (lists) {
            const normalizedLists = lib.normalizeMultiselectInput(lists, context, 'Lists');
            if (normalizedLists.length > 0) {
                params.lists = normalizedLists.join(',');
            }
        }

        if (tags) {
            const normalizedTags = lib.normalizeMultiselectInput(tags, context, 'Tags');
            if (normalizedTags.length > 0) {
                params.tags = normalizedTags.join(',');
            }
        }

        if (updated_after) {
            params.updated_after = updated_after;
        }

        if (updated_before) {
            params.updated_before = updated_before;
        }

        if (created_after) {
            params.created_after = created_after;
        }

        if (created_before) {
            params.created_before = created_before;
        }

        if (optout_after) {
            params.optout_after = optout_after;
        }

        if (optout_before) {
            params.optout_before = optout_before;
        }

        if (sms_status) {
            const normalizedSmsStatus = lib.normalizeMultiselectInput(sms_status, context, 'SMS Status');
            if (normalizedSmsStatus.length > 0) {
                params.sms_status = normalizedSmsStatus.join(',');
            }
        }

        // Set limit - use provided value or default to maximum
        params.limit = 500;

        // Always include all contact sub-resources
        params.include = 'custom_fields,list_memberships,phone_numbers,street_addresses,taggings,notes';

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contacts/getContacts
        const options = {
            method: 'GET',
            url: 'https://api.cc.email/v3/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Accept': 'application/json'
            },
            params
        };

        const response = await context.httpRequest(options);

        const contacts = response.data.contacts || [];

        if (contacts.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: contacts, outputType });
    }
};

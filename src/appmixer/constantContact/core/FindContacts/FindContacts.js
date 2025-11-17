'use strict';

const lib = require('../../lib');

const schema = {
    'contact_id': {
        'type': 'string',
        'title': 'Contact Id'
    },
    'email_address': {
        'type': 'object',
        'properties': {
            'address': {
                'type': 'string',
                'title': 'Email Address'
            },
            'permission_to_send': {
                'type': 'string',
                'title': 'Permission To Send'
            },
            'created_at': {
                'type': 'string',
                'title': 'Created At'
            },
            'updated_at': {
                'type': 'string',
                'title': 'Updated At'
            }
        },
        'title': 'Email Address'
    },
    'first_name': {
        'type': 'string',
        'title': 'First Name'
    },
    'last_name': {
        'type': 'string',
        'title': 'Last Name'
    },
    'job_title': {
        'type': 'string',
        'title': 'Job Title'
    },
    'company_name': {
        'type': 'string',
        'title': 'Company Name'
    },
    'list_memberships': {
        'type': 'array',
        'items': {
            'type': 'string'
        },
        'title': 'List Memberships'
    },
    'tags': {
        'type': 'array',
        'items': {
            'type': 'string'
        },
        'title': 'Tags'
    },
    'create_source': {
        'type': 'string',
        'title': 'Create Source'
    },
    'created_at': {
        'type': 'string',
        'title': 'Created At'
    },
    'updated_at': {
        'type': 'string',
        'title': 'Updated At'
    }
};

module.exports = {
    async receive(context) {

        const { email, status, listId, createdAfter, updatedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Contacts', value: 'contacts' });
        }

        // Build query parameters
        const params = {};

        if (email) {
            params.email = email;
        }

        if (status) {
            params.status = status;
        }

        if (listId) {
            params.list_id = listId;
        }

        if (createdAfter) {
            params.created_after = createdAfter;
        }

        if (updatedAfter) {
            params.updated_after = updatedAfter;
        }

        // Set the maximum page size
        params.limit = 500;

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contacts/getContacts
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.cc.email/v3/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Accept': 'application/json'
            },
            params
        });

        const contacts = response.data.contacts || [];

        if (contacts.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: contacts, outputType });
    }
};

'use strict';

const lib = require('../../lib');

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

const CONTACT_SCHEMA = {
    id: { type: 'string', title: 'Contact ID' },
    firstName: { type: 'string', title: 'First Name' },
    lastName: { type: 'string', title: 'Last Name' },
    contactName: { type: 'string', title: 'Full Name' },
    email: { type: 'string', title: 'Email' },
    phone: { type: 'string', title: 'Phone' },
    companyName: { type: 'string', title: 'Company Name' },
    address1: { type: 'string', title: 'Address' },
    city: { type: 'string', title: 'City' },
    state: { type: 'string', title: 'State' },
    postalCode: { type: 'string', title: 'Postal Code' },
    country: { type: 'string', title: 'Country' },
    website: { type: 'string', title: 'Website' },
    source: { type: 'string', title: 'Source' },
    locationId: { type: 'string', title: 'Location ID' },
    dateAdded: { type: 'string', title: 'Date Added' },
    dateUpdated: { type: 'string', title: 'Date Updated' },
    type: { type: 'string', title: 'Type' },
    assignedTo: { type: 'string', title: 'Assigned To' },
    dateOfBirth: { type: 'string', title: 'Date of Birth' },
    timezone: { type: 'string', title: 'Timezone' },
    profilePhoto: { type: 'string', title: 'Profile Photo' },
    businessId: { type: 'string', title: 'Business ID' },
    firstNameRaw: { type: 'string', title: 'First Name (Raw)' },
    lastNameRaw: { type: 'string', title: 'Last Name (Raw)' },
    dnd: { type: 'boolean', title: 'Do Not Disturb' },
    dndSettings: { type: 'object', title: 'DND Settings' },
    tags: { type: 'array', title: 'Tags', items: { type: 'string' } },
    followers: { type: 'array', title: 'Followers', items: { type: 'string' } },
    additionalEmails: { type: 'array', title: 'Additional Emails', items: { type: 'string' } },
    customFields: { type: 'array', title: 'Custom Fields', items: { type: 'object' } }
};

module.exports = {

    async receive(context) {

        const { locationId, query, email, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, CONTACT_SCHEMA, {
                label: 'Contacts',
                value: 'result'
            });
        }

        const resolvedLocationId = locationId || context.auth.locationId;
        if (!resolvedLocationId) {
            throw new context.CancelError('Location ID is required!');
        }

        const params = {
            locationId: resolvedLocationId,
            limit: 100
        };

        if (query) params.query = query;
        if (email && !query) params.query = email;

        const response = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/contacts/`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Version': API_VERSION
            },
            params
        });

        const contacts = response.data?.contacts || [];

        if (contacts.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: contacts });
    }
};

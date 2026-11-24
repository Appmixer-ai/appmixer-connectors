'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    properties: {
        id: { type: 'string', title: 'Contact ID', example: '2021659200000000001' },
        first_name: { type: 'string', title: 'First Name', example: 'Jana' },
        last_name: { type: 'string', title: 'Last Name', example: 'Novakova' },
        preferred_name: { type: 'string', title: 'Preferred Name', example: 'Jana' },
        company_name: { type: 'string', title: 'Company Name', example: 'Prague General Practice' },
        email: { type: 'string', title: 'Email', example: 'jana.novakova@example.com' },
        type: { type: 'string', title: 'Type', example: 'Doctor' },
        type_code: { type: 'integer', title: 'Type Code', example: 1 },
        doctor_type: { type: 'string', title: 'Doctor Type', example: 'general_practitioner' },
        provider_number: { type: 'string', title: 'Provider Number', example: 'PN12345' },
        occupation: { type: 'string', title: 'Occupation', example: 'General Practitioner' },
        title: { type: 'string', title: 'Title', example: 'Dr' },
        address_1: { type: 'string', title: 'Address Line 1', example: '5 Main Street' },
        address_2: { type: 'string', title: 'Address Line 2', example: '' },
        address_3: { type: 'string', title: 'Address Line 3', example: '' },
        city: { type: 'string', title: 'City', example: 'Prague' },
        state: { type: 'string', title: 'State', example: 'Praha' },
        post_code: { type: 'string', title: 'Post Code', example: '11000' },
        country: { type: 'string', title: 'Country', example: 'Czechia' },
        country_code: { type: 'string', title: 'Country Code', example: 'CZ' },
        notes: { type: 'string', title: 'Notes', example: '' },
        phone_numbers: { type: 'array', title: 'Phone Numbers', example: [{ number: '0-123-456-78', phone_type: 'Work', normalized_number: '42012345678' }] },
        archived_at: { type: 'string', format: 'date-time', title: 'Archived At', example: '' },
        created_at: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-08-21T09:20:00Z' },
        updated_at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-08-21T09:20:00Z' }
    }
};

const RELATIONS = [];

/**
 * Turn the inspector inputs into Cliniko `q[]` filters.
 * @param {object} content
 * @returns {Array<string>}
 */
function buildFilters(content) {

    const { firstName, lastName, companyName, email, createdAtFrom, updatedAtFrom } = content;

    const filters = [];

    if (firstName) filters.push(`first_name:~${firstName}`);
    if (lastName) filters.push(`last_name:~${lastName}`);
    if (companyName) filters.push(`company_name:~${companyName}`);
    if (email) filters.push(`email:~${email}`);
    if (createdAtFrom) filters.push(`created_at:>=${createdAtFrom}`);
    if (updatedAtFrom) filters.push(`updated_at:>=${updatedAtFrom}`);

    return filters;
}

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const content = context.messages.in.content || {};
        const { outputType = 'array', isSource } = content;

        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Contacts' });
        }

        let records;
        try {
            records = (await lib.fetchPage(context, {
                path: '/contacts',
                collection: 'contacts',
                filters: buildFilters(content),
                params: { sort: 'updated_at:desc' }
            })).map((record) => lib.expandIds(record, RELATIONS));
        } catch (error) {
            // Source call (Contact dropdown): a dropdown cannot do anything useful with an error.
            if (isSource) {
                return context.sendJson({ result: [] }, 'out');
            }
            throw error;
        }

        if (isSource) {
            return context.sendJson({ result: records }, 'out');
        }

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    },

    // Used by the Contact dropdown (source) on Archive Contact.
    toSelectArray({ result }) {

        return (result || []).map((contact) => {
            const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
            const label = [name, contact.company_name].filter(Boolean).join(' - ') || contact.email || contact.id;
            return {
                label: contact.email && label !== contact.email ? `${label} (${contact.email})` : label,
                value: contact.id
            };
        });
    }
};

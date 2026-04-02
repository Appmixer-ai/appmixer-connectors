'use strict';

const axios = require('axios');
const pathModule = require('path');

const DEFAULT_PREFIX = 'freshdesk-contacts-export';

// Full contact schema — returned by the filter/search endpoints
const schemaFull = {
    id: { type: 'integer', title: 'Contact ID' },
    name: { type: 'string', title: 'Name' },
    email: { type: 'string', title: 'Email' },
    phone: { type: 'string', title: 'Phone' },
    mobile: { type: 'string', title: 'Mobile' },
    twitter_id: { type: 'string', title: 'Twitter Handle' },
    company_id: { type: 'integer', title: 'Company ID' },
    job_title: { type: 'string', title: 'Job Title' },
    description: { type: 'string', title: 'Description' },
    active: { type: 'boolean', title: 'Active' },
    tags: { type: 'array', title: 'Tags' },
    created_at: { type: 'string', title: 'Created At' },
    updated_at: { type: 'string', title: 'Updated At' }
};

// Partial schema — returned by the autocomplete (Search by Name) endpoint
const schemaAutocomplete = {
    id: { type: 'integer', title: 'Contact ID' },
    name: { type: 'string', title: 'Name' },
    phone: { type: 'string', title: 'Phone' },
    mobile: { type: 'string', title: 'Mobile' },
    avatar: { type: 'string', title: 'Avatar' }
};

async function sendArrayOutput({ context, records, outputType }) {

    if (outputType === 'first') {
        if (records.length === 0) {
            throw new context.CancelError('No records available for first output type');
        }
        await context.sendJson(
            { ...records[0], index: 0, count: records.length },
            'out'
        );
    } else if (outputType === 'object') {
        for (let index = 0; index < records.length; index++) {
            await context.sendJson(
                { ...records[index], index, count: records.length },
                'out'
            );
        }
    } else if (outputType === 'array') {
        await context.sendJson({ result: records, count: records.length }, 'out');
    } else if (outputType === 'file') {
        const csvString = toCsv(records);
        const buffer = Buffer.from(csvString, 'utf8');
        const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
        const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
        const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
        await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
        await context.sendJson({ fileId: savedFile.fileId }, 'out');
    } else {
        throw new context.CancelError('Unsupported outputType ' + outputType);
    }
}

function getOutputPortOptions(context, outputType) {

    // Use the appropriate schema based on whether searchName is being used
    const schema = context.messages.in.content.searchName ? schemaAutocomplete : schemaFull;

    if (outputType === 'object' || outputType === 'first') {
        const options = Object.keys(schema).reduce((res, field) => {
            const { title: label, ...schemaWithoutTitle } = schema[field];
            res.push({ label, value: field, schema: schemaWithoutTitle });
            return res;
        }, [
            { label: 'Current Item Index', value: 'index', schema: { type: 'integer' } },
            { label: 'Items Count', value: 'count', schema: { type: 'integer' } }
        ]);
        return context.sendJson(options, 'out');
    }

    if (outputType === 'array') {
        return context.sendJson([
            { label: 'Items Count', value: 'count', schema: { type: 'integer' } },
            {
                label: 'Contacts',
                value: 'result',
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: schema
                    }
                }
            }
        ], 'out');
    }

    if (outputType === 'file') {
        return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
    }
}

function toCsv(array) {

    if (!array || array.length === 0) return '';
    const headers = Object.keys(array[0]);
    return [
        headers.join(','),
        ...array.map(item =>
            Object.values(item).map(property => {
                if (typeof property === 'object') return JSON.stringify(property);
                return property;
            }).join(',')
        )
    ].join('\n');
}

module.exports = {

    async receive(context) {

        const { auth } = context;
        const content = context.messages.in.content;
        const { outputType = 'array' } = content;

        if (context.properties.generateOutputPortOptions) {
            return getOutputPortOptions(context, outputType);
        }

        const params = {};

        // Search by name using the autocomplete endpoint
        if (content.searchName) {
            const response = await axios.get(
                `https://${auth.domain}.freshdesk.com/api/v2/contacts/autocomplete`,
                {
                    params: { term: content.searchName },
                    auth: {
                        username: auth.apiKey,
                        password: 'X'
                    }
                }
            );
            const contacts = Array.isArray(response.data) ? response.data : [];

            if (contacts.length === 0) {
                return context.sendJson({}, 'notFound');
            }

            return sendArrayOutput({ context, records: contacts, outputType });
        }

        // Filter by a single email or phone (Freshdesk filter params)
        if (content.email) params.email = content.email;
        if (content.phone) params.phone = content.phone;
        if (content.mobilePhone) params.mobile_phone = content.mobilePhone;

        // If search query provided, use the search endpoint
        // Freshdesk search API requires the query wrapped in double quotes, e.g. "email:'test@example.com'"
        if (content.query) {
            const searchQuery = content.query.startsWith('"') ? content.query : `"${content.query}"`;
            const response = await axios.get(
                `https://${auth.domain}.freshdesk.com/api/v2/search/contacts`,
                {
                    params: { query: searchQuery },
                    auth: {
                        username: auth.apiKey,
                        password: 'X'
                    }
                }
            );
            const contacts = Array.isArray(response.data) ? response.data : (response.data.results || []);

            if (contacts.length === 0) {
                return context.sendJson({}, 'notFound');
            }

            return sendArrayOutput({ context, records: contacts, outputType });
        }

        // Otherwise use the list/filter endpoint
        if (content.updatedSince) params.updated_since = content.updatedSince;
        if (content.companyId) params.company_id = content.companyId;
        if (content.tag) params.tag = content.tag;
        if (content.page) params.page = content.page;

        const response = await axios.get(
            `https://${auth.domain}.freshdesk.com/api/v2/contacts`,
            {
                params,
                auth: {
                    username: auth.apiKey,
                    password: 'X'
                }
            }
        );

        const contacts = response.data || [];

        if (contacts.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return sendArrayOutput({ context, records: contacts, outputType });
    }
};

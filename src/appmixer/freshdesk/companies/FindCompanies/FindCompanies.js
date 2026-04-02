'use strict';

const axios = require('axios');
const pathModule = require('path');

const DEFAULT_PREFIX = 'freshdesk-companies-export';

// Full schema — returned by the list/search endpoints
const schemaFull = {
    id: { type: 'integer', title: 'Company ID' },
    name: { type: 'string', title: 'Name' },
    description: { type: 'string', title: 'Description' },
    note: { type: 'string', title: 'Note' },
    domains: { type: 'array', title: 'Domains' },
    health_score: { type: 'string', title: 'Health Score' },
    account_tier: { type: 'string', title: 'Account Tier' },
    renewal_date: { type: 'string', title: 'Renewal Date' },
    industry: { type: 'string', title: 'Industry' },
    created_at: { type: 'string', title: 'Created At' },
    updated_at: { type: 'string', title: 'Updated At' }
};

// Partial schema — returned by autocomplete (Search by Name)
const schemaAutocomplete = {
    id: { type: 'integer', title: 'Company ID' },
    name: { type: 'string', title: 'Name' }
};

async function sendArrayOutput({ context, records, outputType }) {

    if (outputType === 'first') {
        if (records.length === 0) {
            throw new context.CancelError('No records available for first output type');
        }
        await context.sendJson({ ...records[0], index: 0, count: records.length }, 'out');
    } else if (outputType === 'object') {
        for (let index = 0; index < records.length; index++) {
            await context.sendJson({ ...records[index], index, count: records.length }, 'out');
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
            { label: 'Companies', value: 'result', schema: { type: 'array', items: { type: 'object', properties: schema } } }
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
            Object.values(item).map(p => typeof p === 'object' ? JSON.stringify(p) : p).join(',')
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

        const baseUrl = `https://${auth.domain}.freshdesk.com/api/v2`;
        const authConfig = { username: auth.apiKey, password: 'X' };

        // Search by name via autocomplete
        if (content.searchName) {
            const response = await axios.get(`${baseUrl}/companies/autocomplete`, {
                params: { term: content.searchName },
                auth: authConfig
            });
            const companies = Array.isArray(response.data) ? response.data : [];
            if (companies.length === 0) return context.sendJson({}, 'notFound');
            return sendArrayOutput({ context, records: companies, outputType });
        }

        // Filter query via search API
        if (content.query) {
            const searchQuery = content.query.startsWith('"') ? content.query : `"${content.query}"`;
            const response = await axios.get(`${baseUrl}/search/companies`, {
                params: { query: searchQuery },
                auth: authConfig
            });
            const companies = Array.isArray(response.data) ? response.data : (response.data.results || []);
            if (companies.length === 0) return context.sendJson({}, 'notFound');
            return sendArrayOutput({ context, records: companies, outputType });
        }

        // List companies with optional pagination
        const params = {};
        if (content.page) params.page = content.page;

        const response = await axios.get(`${baseUrl}/companies`, {
            params,
            auth: authConfig
        });
        const companies = response.data || [];
        if (companies.length === 0) return context.sendJson({}, 'notFound');
        return sendArrayOutput({ context, records: companies, outputType });
    }
};

'use strict';

const Hubspot = require('../../Hubspot');
const lib = require('../../lib');
const ITEM_SCHEMA = require('../../item-schemas.json').ticket;

// The CRM search API returns at most 200 records per page and 10,000 records per query.
const PAGE_SIZE = 200;
const MAX_RESULTS = 10000;
// Returned when the Properties input is empty — the ticket fields of the output schema.
const DEFAULT_PROPERTIES = Object.keys(ITEM_SCHEMA.properties.properties.properties);
// Operators that take no value.
const VALUELESS_OPERATORS = ['HAS_PROPERTY', 'NOT_HAS_PROPERTY'];

function toFilters(context, filters) {

    const conditions = filters?.AND || [];
    return conditions
        .filter(condition => condition && condition.propertyName)
        .map(({ propertyName, operator = 'EQ', value }) => {
            const filter = { propertyName, operator };
            if (!VALUELESS_OPERATORS.includes(operator)) {
                if (value === undefined || value === null || value === '') {
                    throw new context.CancelError(`Filter on ${propertyName}: a value is required for operator ${operator}.`);
                }
                filter.value = String(value);
            }
            return filter;
        });
}

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { query, filters, properties, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Tickets' });
        }

        const searchFilters = toFilters(context, filters);
        if (!query && !searchFilters.length) {
            throw new context.CancelError('Set a search query or at least one filter.');
        }

        const body = {
            sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
            properties: properties
                ? properties.split(',').map(property => property.trim()).filter(Boolean)
                : DEFAULT_PROPERTIES,
            limit: PAGE_SIZE
        };
        if (query) {
            body.query = query;
        }
        if (searchFilters.length) {
            body.filterGroups = [{ filters: searchFilters }];
        }

        const hs = new Hubspot(context.auth.accessToken, context.config, context.httpRequest);
        const records = [];
        let after;
        do {
            if (after) {
                body.after = after;
            }
            // https://developers.hubspot.com/docs/api-reference/latest/crm/search-the-crm
            const { data } = await hs.call('post', 'crm/v3/objects/tickets/search', body);
            records.push(...(data.results || []));
            after = data.paging?.next?.after;
        } while (after && records.length < MAX_RESULTS);

        if (!records.length) {
            return context.sendJson({ query: query || '' }, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputPortName: 'out', outputType, records });
    }
};

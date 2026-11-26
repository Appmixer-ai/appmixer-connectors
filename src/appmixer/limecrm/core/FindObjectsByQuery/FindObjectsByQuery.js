/* eslint-disable no-underscore-dangle */
// Lime CRM's HAL responses and query parameters use underscore names (_embedded, _limit, _sort).
'use strict';

const lib = require('../../lib');

// The output contract of one item. The fields of an item are the properties the query
// lists in responseFormat.object, so the variables are built from the query itself.
const ITEM_SCHEMA = {
    type: 'object',
    properties: {}
};

function parseQuery(context, query) {

    const parsed = lib.parseJsonObject(context, query, 'Query');
    if (!parsed) {
        throw new context.CancelError('Query is required!');
    }
    if (!parsed.limetype || typeof parsed.limetype !== 'string') {
        throw new context.CancelError('Query must name a "limetype".');
    }
    if (!parsed.responseFormat || typeof parsed.responseFormat !== 'object'
        || !parsed.responseFormat.object || typeof parsed.responseFormat.object !== 'object') {
        throw new context.CancelError('Query must list the properties to return in "responseFormat.object".');
    }
    return parsed;
}

/**
 * One variable per property of responseFormat.object (its _alias when set).
 */
function itemSchemaOf(query) {

    let object = {};
    try {
        const parsed = typeof query === 'string' ? JSON.parse(query) : query;
        object = (parsed && parsed.responseFormat && parsed.responseFormat.object) || {};
    } catch (err) {
        object = {};
    }
    const properties = {};
    for (const [key, value] of Object.entries(object)) {
        if (key.startsWith('#')) continue;
        const name = value && typeof value === 'object' && typeof value._alias === 'string' ? value._alias : key;
        properties[name] = value && typeof value === 'object'
            ? { type: 'object', title: name }
            : { type: 'string', title: name };
    }
    return properties;
}

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, itemSchemaOf(query), { label: 'Objects', value: 'result' });
        }

        const parsed = parseQuery(context, query);
        const data = await lib.apiCall(context, {
            path: '/query/',
            params: { q: JSON.stringify(parsed) }
        });
        const records = lib.extractItems(data).map(lib.mapObject);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};

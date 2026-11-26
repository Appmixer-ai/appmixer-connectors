/* eslint-disable no-underscore-dangle */
// Lime CRM's HAL responses and query parameters use underscore names (_embedded, _limit, _sort).
'use strict';

const lib = require('../../lib');

// The output contract of one object when the limetype's properties are not known; the
// variables are generated from the limetype by GetObjectSchema.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'ID', example: 1001 },
        _createdtime: { type: 'string', format: 'date-time', title: 'Created Time', example: '2026-11-16T09:30:00+01:00' },
        _timestamp: { type: 'string', format: 'date-time', title: 'Updated Time', example: '2026-11-16T10:15:00+01:00' }
    }
};

const FILTER_KEY = /^((not|min|max)-)?[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED_PARAMS = ['_limit', '_sort', '_embed', '_offset', 'offset'];

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { filters, sort, outputType } = context.messages.in.content;
        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');

        const params = {};
        let filterObject;
        try {
            filterObject = lib.kvToObject(filters);
        } catch (err) {
            throw new context.CancelError(err.message);
        }
        for (const [key, value] of Object.entries(filterObject)) {
            const name = key.trim();
            if (!FILTER_KEY.test(name) || RESERVED_PARAMS.includes(name)) {
                throw new context.CancelError('Filter "' + key + '" is not a property name (optionally prefixed with not-, min- or max-).');
            }
            params[name] = value === null || value === undefined ? '' : value;
        }
        if (sort) {
            const sortProperty = String(sort).trim();
            if (!/^-?[A-Za-z_][A-Za-z0-9_]*$/.test(sortProperty)) {
                throw new context.CancelError('Sort By must be one property name, optionally prefixed with "-".');
            }
            params._sort = sortProperty;
        }
        params._limit = lib.MAX_PAGE_SIZE;

        const data = await lib.apiCall(context, {
            path: '/limeobject/' + encodeURIComponent(limetype) + '/',
            params
        });
        const records = lib.extractItems(data).map(lib.mapObject);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};

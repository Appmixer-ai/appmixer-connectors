/* eslint-disable no-underscore-dangle */
// Lime CRM's HAL responses and query parameters use underscore names (_embedded, _limit, _sort).
'use strict';

const lib = require('../../lib');

// The output contract of one related object. The related limetype depends on the
// relation, so only the fields every limeobject carries are declared.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'ID', example: 1002 },
        _createdtime: { type: 'string', format: 'date-time', title: 'Created Time', example: '2026-11-16T09:30:00+01:00' },
        _timestamp: { type: 'string', format: 'date-time', title: 'Updated Time', example: '2026-11-16T10:15:00+01:00' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            limetype: rawLimetype,
            objectId: rawObjectId,
            relation: rawRelation,
            sort,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Objects', value: 'result' });
        }

        if (!rawLimetype) {
            throw new context.CancelError('Limetype is required!');
        }
        if (!rawObjectId) {
            throw new context.CancelError('Object ID is required!');
        }
        if (!rawRelation) {
            throw new context.CancelError('Relation is required!');
        }
        const limetype = lib.assertName(context, rawLimetype, 'Limetype');
        const objectId = lib.assertId(context, rawObjectId, 'Object ID');
        const relation = lib.assertName(context, rawRelation, 'Relation');

        const params = { _limit: lib.MAX_PAGE_SIZE };
        if (sort) {
            const sortProperty = String(sort).trim();
            if (!/^-?[A-Za-z_][A-Za-z0-9_]*$/.test(sortProperty)) {
                throw new context.CancelError('Sort By must be one property name, optionally prefixed with "-".');
            }
            params._sort = sortProperty;
        }

        let data;
        try {
            data = await lib.apiCall(context, {
                path: '/limeobject/' + encodeURIComponent(limetype) + '/' + objectId + '/' + encodeURIComponent(relation) + '/',
                params
            });
        } catch (err) {
            // A relation to one object answers 404 when it is not set. The parent itself
            // must exist, otherwise the 404 is reported as an error.
            if (lib.isNotFound(err)) {
                await lib.getObject(context, limetype, objectId);
                return context.sendJson({}, 'notFound');
            }
            throw err;
        }

        const records = lib.isSingleObject(data)
            ? [lib.mapObject(data)]
            : lib.extractItems(data).map(lib.mapObject);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};

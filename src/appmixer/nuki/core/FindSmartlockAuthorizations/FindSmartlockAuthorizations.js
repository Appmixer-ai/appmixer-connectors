'use strict';

const lib = require('../../lib');

// The output contract of one authorization. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-authorization.json');

const isEmpty = (value) => {

    return value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            smartlockId, types, name, accountUserId, outputType
        } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Authorizations' });
        }

        if (!smartlockId) {
            throw new context.CancelError('Smartlock is required!');
        }

        const id = lib.requireNumericId(context, smartlockId, 'Smartlock');
        const typeList = isEmpty(types)
            ? undefined
            : lib.normalizeMultiselectInput(types, context, 'Types')
                .map(type => lib.optionalInteger(context, type, 'Types'))
                .join(',');
        const userId = lib.optionalInteger(context, accountUserId, 'Account User ID');

        let records = await lib.listAuthorizations(context, id, { types: typeList });

        // The API filters by type only. Name and account user are matched here, which is complete
        // because the API returns every authorization of the device in one answer.
        const needle = typeof name === 'string' ? name.trim().toLowerCase() : '';
        if (needle) {
            records = records.filter(auth => String(auth.name || '').toLowerCase().includes(needle));
        }
        if (userId !== undefined) {
            records = records.filter(auth => Number(auth.accountUserId) === userId);
        }

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};

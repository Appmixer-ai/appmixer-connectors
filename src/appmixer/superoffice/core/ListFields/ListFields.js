'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['key', 'label', 'custom'],
    properties: {
        key: { type: 'string', title: 'Key', example: 'cf_SuperOffice_1' },
        label: { type: 'string', title: 'Label', example: 'NPS Score' },
        type: { type: 'string', title: 'Type', example: 'integer' },
        custom: { type: 'boolean', title: 'Custom Field', example: true },
        fieldName: { type: 'string', title: 'Field Name', example: 'SuperOffice:1' },
        fieldType: { type: 'string', title: 'Field Type', example: 'Integer' },
        readOnly: { type: 'boolean', title: 'Read Only', example: false }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Items', value: 'result' });
        }

        // Dropdowns of other components name the object in the source messages or properties.
        const object = context.messages.in.content.object || context.properties.object;
        if (!object || !lib.RECORD_OBJECTS[object]) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw new context.CancelError('Object must be one of: ' + Object.keys(lib.RECORD_OBJECTS).join(', ') + '.');
        }

        let infos;
        try {
            infos = isSource
                ? await lib.customFieldInfosCached(context, object)
                : await lib.customFieldInfos(context, object);
        } catch (err) {
            if (isSource) {
                infos = [];
            } else {
                throw err;
            }
        }
        const byKey = new Map(infos.map(info => [info.key, info]));
        const properties = lib.recordProperties(object, infos);
        const records = Object.keys(properties)
            .filter(key => key !== 'object' && key !== 'customFields')
            .map(key => {
                const info = byKey.get(key);
                const record = { key, label: properties[key].title, type: properties[key].type, custom: Boolean(info) };
                if (info) {
                    record.fieldName = info.fieldName;
                    record.fieldType = info.fieldType;
                    record.readOnly = info.readOnly;
                }
                return record;
            });

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records });
    },

    toSelectArray({ result }) {

        return (result || []).map(item => ({ label: item.label + (item.custom ? ' (custom)' : ''), value: item.key }));
    }
};

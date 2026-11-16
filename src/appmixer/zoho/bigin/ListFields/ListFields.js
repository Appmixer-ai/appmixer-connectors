'use strict';

const lib = require('../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'api_name'],
    properties: {
        id: { type: 'string', title: 'Field ID', example: '2034020000000000519' },
        api_name: { type: 'string', title: 'API Name', example: 'Deal_Name' },
        display_label: { type: 'string', title: 'Display Label', example: 'Pipeline Name' },
        field_label: { type: 'string', title: 'Field Label', example: 'Pipeline Name' },
        data_type: { type: 'string', title: 'Data Type', example: 'text' },
        json_type: { type: 'string', title: 'JSON Type', example: 'string' },
        system_mandatory: { type: 'boolean', title: 'System Mandatory', example: true },
        read_only: { type: 'boolean', title: 'Read Only', example: false },
        custom_field: { type: 'boolean', title: 'Custom Field', example: false },
        length: { type: 'integer', title: 'Length', example: 120 },
        pick_list_values: {
            type: 'array',
            title: 'Picklist Values',
            items: {
                type: 'object',
                properties: {
                    display_value: { type: 'string', title: 'Display Value', example: 'Qualification' },
                    actual_value: { type: 'string', title: 'Actual Value', example: 'Qualification' }
                }
            },
            example: [{ display_value: 'Qualification', actual_value: 'Qualification' }]
        }
    }
};

const toItem = field => ({
    id: field.id,
    api_name: field.api_name,
    display_label: field.display_label,
    field_label: field.field_label,
    data_type: field.data_type,
    json_type: field.json_type,
    system_mandatory: field.system_mandatory,
    read_only: field.read_only,
    custom_field: field.custom_field,
    length: field.length,
    pick_list_values: (field.pick_list_values || []).map(value => ({
        display_value: value.display_value,
        actual_value: value.actual_value
    }))
});

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { module: moduleName, outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Fields',
                value: 'result'
            });
        }

        try {
            if (!moduleName) {
                throw new context.CancelError('Module is required!');
            }
            lib.assertModule(context, moduleName);
            // Field metadata is cached per user and module (lib.getFields) - the inspector asks
            // for it in bursts.
            const fields = await lib.getFields(context, moduleName);
            return await lib.sendArrayOutput({ context, outputType, records: fields.map(toItem) });
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }
    },

    /** Field API names as inspector options (sort by, ...). */
    toSelectArray({ result = [] } = {}) {

        return result.map(field => ({ label: field.display_label || field.api_name, value: field.api_name }));
    },

    /** Values of the Sub_Pipeline picklist. */
    toSubPipelineOptions({ result = [] } = {}) {

        return picklistOptions(result, 'Sub_Pipeline');
    },

    /** Values of the Stage picklist. */
    toStageOptions({ result = [] } = {}) {

        return picklistOptions(result, 'Stage');
    }
};

function picklistOptions(fields, apiName) {

    const field = fields.find(item => item.api_name === apiName);
    return (field?.pick_list_values || []).map(value => ({
        label: value.display_value,
        value: value.actual_value
    }));
}

'use strict';

const api = require('../../api');
const methods = require('./methods.json');

module.exports = {

    async receive(context) {

        if (context.properties.variablesFetch) {
            const result = Object.entries(methods).map(([name, meta]) => ({
                label: `${meta.method} ${meta.path}`,
                value: name
            }));
            return context.sendJson(result, 'out');
        }

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context);
        }

        if (context.properties.generateInspector) {

            const inspector = this.getInputParamsInspector({ method: context.properties.method });
            return context.sendJson(inspector, 'out');
        }

        const method = context.properties.method;
        const params = context.messages.in.content;

        if (!method || !api[method]) {
            throw new context.CancelError(`Unknown API method: ${method}`);
        }

        await context.log({ 'step': 'params', params });
        const result = await api[method].execute(context, params);

        return context.sendJson(result, 'out');
    },

    getOutputPortOptions(context) {

        const method = context.properties.method;
        if (!method || !methods[method]) {
            return context.sendJson([], 'out');
        }

        const schema = methods[method].outputSchema;
        if (!schema || !schema.properties) {
            return context.sendJson([], 'out');
        }

        const options = Object.entries(schema.properties).map(([key, prop]) => {
            const { description, ...schemaRest } = prop;
            return {
                label: key,
                value: key,
                schema: schemaRest
            };
        });

        return context.sendJson(options, 'out');
    },

    getInputParamsInspector({ method }) {

        if (!method || !methods[method]) {
            return {};
        }

        const meta = methods[method];
        const inputSchema = (meta.inputSchema && meta.inputSchema.properties) || {};
        const inputs = {};
        const fields = [];
        const schemaProperties = {};

        (meta.inputParams || []).forEach((param, idx) => {
            const paramSchema = inputSchema[param] || {};
            const paramType = paramSchema.type;
            const mapped = this.mapSchemaToInspector(paramType, paramSchema);

            inputs[param] = {
                type: mapped.inspectorType,
                label: param,
                index: idx + 1,
                tooltip: paramSchema.description || `Parameter: ${param}`
            };

            if (mapped.defaultValue !== undefined) {
                inputs[param].defaultValue = mapped.defaultValue;
            }

            if (paramSchema.enum) {
                inputs[param].type = 'select';
                inputs[param].options = paramSchema.enum.map(v => ({ label: String(v), value: v }));
            }

            schemaProperties[param] = { type: mapped.schemaType };
            fields.push(param);
        });

        return {
            schema: {
                type: 'object',
                properties: schemaProperties
            },
            inputs,
            groups: {
                params: {
                    label: 'Parameters',
                    index: 2,
                    fields
                }
            }
        };
    },

    mapSchemaToInspector(type, schema) {

        switch (type) {
            case 'boolean':
                return {
                    inspectorType: 'toggle',
                    schemaType: 'boolean',
                    defaultValue: schema.default !== undefined ? schema.default : false
                };
            case 'integer':
            case 'number':
                return { inspectorType: 'number', schemaType: 'number' };
            case 'array':
                return { inspectorType: 'textarea', schemaType: 'string' };
            case 'object':
                return { inspectorType: 'textarea', schemaType: 'string' };
            default:
                return { inspectorType: 'text', schemaType: 'string' };
        }
    }
};

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
        const inputs = {};
        const fields = [];

        (meta.inputParams || []).forEach((param, idx) => {
            inputs[param] = {
                type: 'text',
                label: param,
                index: idx + 1,
                tooltip: `Parameter: ${param}`
            };
            fields.push(param);
        });

        return {
            schema: {
                type: 'object',
                properties: Object.fromEntries(fields.map(f => [f, { type: 'string' }]))
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
    }
};

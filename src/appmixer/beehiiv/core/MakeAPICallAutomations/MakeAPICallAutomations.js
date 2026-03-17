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

        // Called as source for dynamic inspector/output — pass properties through
        // so transform functions can access method
        if (!context.messages?.in?.content) {
            return context.sendJson({ method: context.properties.method }, 'out');
        }

        const method = context.properties.method;
        const params = context.messages.in.content;

        if (!method || !api[method]) {
            throw new context.CancelError(`Unknown API method: ${method}`);
        }

        const result = await api[method].execute(context, params);
        return context.sendJson(result, 'out');
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
            inspector: {
                inputs,
                groups: {
                    params: {
                        label: 'Parameters',
                        index: 2,
                        fields
                    }
                }
            }
        };
    },

    getOutputSchema({ method }) {

        if (!method || !methods[method]) {
            return {};
        }
        return methods[method].outputSchema || {};
    }
};

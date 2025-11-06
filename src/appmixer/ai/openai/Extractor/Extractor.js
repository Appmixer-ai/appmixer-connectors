'use strict';

const lib = require('../lib');

module.exports = {

    receive: async function(context) {

        const { file, text, model, outputVariables } = context.messages.in.content;

        if (!text && !file) {
            throw new context.CancelError('Either Text or File is required');
        }

        if (!outputVariables) {
            throw new context.CancelError('Output Variables are required');
        }

        // Build JSON schema from outputVariables
        const jsonSchema = this.buildJsonSchema(outputVariables);

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context, jsonSchema);
        }

        // Prepare content - either from text or file
        let content;
        if (text) {
            content = text;
        } else if (file) {
            // Handle file input - extract text from file
            const fileContent = await context.getFileStream(file);
            content = fileContent.toString('utf-8');
        }

        const { data } = await lib.request(context, 'post', '/chat/completions', {
            model: model || 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert at structured data extraction. You will be given unstructured text and should convert it into the given structure.',
                    name: 'system'
                },
                {
                    role: 'user',
                    content: content,
                    name: 'user'
                }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'json_extraction',
                    schema: jsonSchema
                }
            }
        });

        const json = JSON.parse(data.choices[0].message.content);
        return context.sendJson({ json }, 'out');
    },

    getOutputPortOptions: function(context, jsonSchema) {

        return context.sendJson([
            {
                value: 'json',
                label: 'JSON',
                schema: jsonSchema
            },
            {
                value: 'text',
                label: 'Text',
                schema: { type: 'string' }
            }
        ], 'out');
    },

    buildJsonSchema: function(outputVariables) {
        const properties = {};
        const required = [];

        if (Array.isArray(outputVariables)) {
            outputVariables.forEach(variable => {
                if (variable.name && variable.dataType) {
                    properties[variable.name] = {
                        type: variable.dataType === 'text' ? 'string' : variable.dataType
                    };
                    required.push(variable.name);
                }
            });
        }

        return {
            type: 'object',
            properties: properties,
            required: required,
            additionalProperties: false
        };
    }
};

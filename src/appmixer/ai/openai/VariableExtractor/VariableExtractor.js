'use strict';

const path = require('path');
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
        const jsonSchema = this.buildJsonSchema(outputVariables, context);

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context, jsonSchema);
        }

        // Prepare content - either from text or file
        let content;
        if (text) {
            content = text;

        } else if (file) {
            // Handle file input - extract text from file
            const fileInfo = await context.getFileInfo(file);
            const fileContent = await context.loadFile(file);

            // Check if it's a text-based file
            let contentType = fileInfo.contentType;
            if (!contentType) {
                const ext = path.extname(fileInfo.filename).toLowerCase();
                if (['.txt', '.md', '.csv', '.json', '.xml', '.html'].includes(ext)) {
                    contentType = 'text/plain';
                }
            }

            // Convert to text
            if (contentType && contentType.startsWith('text/') || ['.txt', '.md', '.csv', '.json', '.xml', '.html'].includes(path.extname(fileInfo.filename).toLowerCase())) {
                content = fileContent.toString('utf-8');
            } else {
                throw new context.CancelError(`Unsupported file type: ${contentType || 'unknown'}. Please provide a text-based file.`);
            }

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
        return context.sendJson(json, 'out');
    },

    getOutputPortOptions: function(context, jsonSchema) {
        const options = [];

        // Reuse the properties from the already built jsonSchema
        if (jsonSchema.properties) {
            Object.keys(jsonSchema.properties).forEach(propertyName => {
                const property = jsonSchema.properties[propertyName];
                options.push({
                    value: propertyName,
                    label: propertyName.charAt(0).toUpperCase() + propertyName.slice(1),
                    schema: {
                        type: property.type
                    }
                });
            });
        }

        return context.sendJson(options, 'out');
    },

    buildJsonSchema: function(outputVariables, context) {
        const properties = {};
        const required = [];
        const seenNames = new Set();

        if (Array.isArray(outputVariables.ADD)) {
            outputVariables.ADD.forEach(variable => {
                if (variable.name) {
                    // Check for duplicate variable names
                    if (seenNames.has(variable.name)) {
                        throw new context.CancelError(`Duplicate variable name found: '${variable.name}'. All variable names must be unique.`);
                    }
                    seenNames.add(variable.name);

                    properties[variable.name] = {
                        type: variable.dataType || 'string'
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

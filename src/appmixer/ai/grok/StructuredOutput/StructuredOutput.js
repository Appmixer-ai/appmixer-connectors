'use strict';

module.exports = {
    async receive(context) {

        const { model, role, content, jsonSchema, strict, maxTokens } = context.messages.in.content;

        // Validate required inputs
        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!role) {
            throw new context.CancelError('Role is required!');
        }
        if (!content) {
            throw new context.CancelError('Content is required!');
        }
        if (!jsonSchema) {
            throw new context.CancelError('JSON Schema is required!');
        }

        // Parse JSON schema if it's a string
        let parsedSchema = jsonSchema;
        if (typeof jsonSchema === 'string') {
            try {
                parsedSchema = JSON.parse(jsonSchema);
            } catch (error) {
                throw new context.CancelError('Invalid JSON Schema format!');
            }
        }

        // Build request body
        const requestBody = {
            model: model,
            messages: [
                {
                    role: role,
                    content: content
                }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    schema: parsedSchema
                }
            }
        };

        // Add optional parameters
        if (strict !== undefined && strict !== null) {
            requestBody.response_format.strict = strict;
        }
        if (maxTokens !== undefined && maxTokens !== null) {
            requestBody.max_tokens = maxTokens;
        }

        // https://grok-api.apidog.io/structured-outputs-934099m0
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        context.log({ step: 'response', data });

        return context.sendJson(data, 'out');
    }
};

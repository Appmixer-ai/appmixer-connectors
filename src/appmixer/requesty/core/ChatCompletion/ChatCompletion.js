'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            model,
            instructions,
            prompt,
            temperature,
            maxTokens,
            topP,
            frequencyPenalty,
            presencePenalty
        } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!prompt) {
            throw new context.CancelError('Prompt is required!');
        }

        const messages = [];
        if (instructions) {
            messages.push({ role: 'system', content: instructions });
        }
        messages.push({ role: 'user', content: prompt });

        const data = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            top_p: topP,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty
        };

        // Remove undefined optional parameters.
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const { data: response } = await context.httpRequest({
            method: 'POST',
            url: `${lib.getBaseUrl()}/chat/completions`,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Bearer ${context.auth.apiKey}`
            },
            data
        });

        // Collapse the choices array to its first element so downstream fields
        // such as choices.message.content resolve directly.
        const outputData = {
            ...response,
            choices: response.choices?.[0]
        };

        return context.sendJson(outputData, 'out');
    }
};

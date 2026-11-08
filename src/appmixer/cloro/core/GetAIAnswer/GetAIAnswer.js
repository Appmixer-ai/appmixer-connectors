'use strict';

const lib = require('../../lib');

// Engine value → cloro monitor endpoint.
const ENDPOINTS = {
    aimode: '/v1/monitor/aimode',
    bing_aimode: '/v1/monitor/bing/aimode',
    chatgpt: '/v1/monitor/chatgpt',
    gemini: '/v1/monitor/gemini'
};

module.exports = {
    async receive(context) {

        const { engine, prompt, country } = context.messages.in.content;

        if (!prompt) {
            throw new context.CancelError('Prompt is required!');
        }

        const selected = engine || 'aimode';
        const path = ENDPOINTS[selected];
        if (!path) {
            throw new context.CancelError(`Unsupported engine: ${selected}`);
        }

        if (selected === 'bing_aimode' && lib.encodedPromptLength(prompt) > lib.BING_PROMPT_LIMIT) {
            throw new context.CancelError(
                'The prompt is too long for Bing AI Mode: the limit is 3,500 characters after URL encoding, ' +
                'and non-Latin scripts allow fewer characters.'
            );
        }

        const data = {
            prompt,
            country: (country || 'US').trim().toUpperCase(),
            include: { markdown: true }
        };

        const response = await lib.makeRequest({ context, path, data });
        const result = (response && response.result) || {};

        const sources = (result.sources || []).map(source => ({
            position: source.position,
            label: source.label,
            url: source.url,
            description: source.description
        }));

        return context.sendJson({
            engine: selected,
            prompt,
            text: result.text,
            markdown: result.markdown,
            sources
        }, 'out');
    }
};

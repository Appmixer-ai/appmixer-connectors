'use strict';

const lib = require('../lib');

module.exports = {

    receive: async function(context) {
        if (!context.messages.in.content.text) {
            throw new context.CancelError('Text is required');
        }


        const config = {
            apiKey: context.auth.apiKey,
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
        };

        const out = await lib.generateEmbeddings(context, config, context.messages.in.content);
        return context.sendJson(out, 'out');
    }
};

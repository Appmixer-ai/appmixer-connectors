
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { version, input } = context.messages.in.content;

        // Parse input if it's a string (JSON)
        let parsedInput = input;
        if (typeof input === 'string') {
            try {
                parsedInput = JSON.parse(input);
            } catch (error) {
                throw new Error('Invalid input JSON format');
            }
        }

        // https://replicate.com/docs/reference/http#predictions
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.replicate.com/v1/predictions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                version,
                input: parsedInput
            }
        });

        return context.sendJson(data, 'out');
    }
};

'use strict';

module.exports = {

    async receive(context) {

        const { language, image, name, env } = context.messages.in.content;

        if (!language) {
            throw new context.CancelError('Language is required!');
        }

        const requestBody = {
            language: language
        };

        if (image) {
            requestBody.image = image;
        }

        if (name) {
            requestBody.name = name;
        }

        if (env) {
            try {
                requestBody.env = typeof env === 'string' ? JSON.parse(env) : env;
            } catch (error) {
                throw new context.CancelError('Invalid JSON format for environment variables');
            }
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://app.daytona.io/api/sandbox',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson({
            id: response.data.id,
            name: response.data.name,
            language: response.data.language,
            image: response.data.image,
            status: response.data.status,
            createdAt: response.data.created_at || response.data.createdAt
        }, 'out');
    }
};

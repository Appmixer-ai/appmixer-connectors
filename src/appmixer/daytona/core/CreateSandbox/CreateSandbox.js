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

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.daytona.io/sandbox',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson({
            id: data.id,
            name: data.name,
            language: data.language,
            image: data.image,
            status: data.status,
            createdAt: data.created_at || data.createdAt
        }, 'out');
    }
};

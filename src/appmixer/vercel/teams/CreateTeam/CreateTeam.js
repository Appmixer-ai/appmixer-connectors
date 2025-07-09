
'use strict';

module.exports = {
    async receive(context) {
        const {
            slug,
            name,
            attribution
        } = context.messages.in.content;

        const requestData = {
            slug: slug
        };

        if (name) {
            requestData.name = name;
        }

        if (attribution) {
            requestData.attribution = attribution;
        }

        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.vercel.com/v1/teams',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};

'use strict';

module.exports = {
    async receive(context) {

        // https://developers.kit.com/api-reference/custom-fields/list-custom-fields
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.kit.com/v4/custom_fields',
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            params: {
                per_page: 1000
            }
        });

        return context.sendJson({ result: data.custom_fields }, 'out');
    },

    toSelectArray({ result }) {

        return result.map(customField => {
            return { label: customField.label, value: customField.key };
        });
    }
};

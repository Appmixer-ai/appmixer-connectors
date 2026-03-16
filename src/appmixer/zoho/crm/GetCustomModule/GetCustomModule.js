'use strict';

module.exports = {
    async receive(context) {

        const { module_api_name } = context.messages.in.content;

        // https://www.zoho.com/crm/developer/docs/api/v3/custom-modules.html
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://www.zohoapis.com/crm/v3/settings/custom_modules/${module_api_name}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};

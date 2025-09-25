/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { company_id, name, website, size } = context.messages.in.content;

        if (!company_id) {
            throw new context.CancelError('Company ID is required!');
        }

        const requestBody = {
            company_id,
            name
        };

        if (website) {
            requestBody.website = website;
        }

        if (size) {
            requestBody.size = size;
        }

        // https://developers.intercom.com/docs/references/rest-api/api.intercom.io/companies/createorupdatecompany
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/companies',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};

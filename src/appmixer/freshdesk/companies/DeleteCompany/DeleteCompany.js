'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { companyId } = context.messages.in.content;

        await axios.delete(
            `https://${auth.domain}.freshdesk.com/api/v2/companies/${companyId}`,
            {
                auth: {
                    username: auth.apiKey,
                    password: 'X'
                }
            }
        );

        return context.sendJson({ companyId }, 'out');
    }
};

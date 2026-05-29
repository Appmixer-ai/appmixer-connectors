'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { contactId } = context.messages.in.content;

        await axios.delete(
            `https://${auth.domain}.freshdesk.com/api/v2/contacts/${contactId}`,
            {
                auth: {
                    username: auth.apiKey,
                    password: 'X'
                }
            }
        );

        return context.sendJson({ contactId }, 'out');
    }
};

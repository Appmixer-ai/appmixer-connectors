'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;

        const { data } = await axios.get(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/categories`,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({ categories: data }, 'categories');
    }
};

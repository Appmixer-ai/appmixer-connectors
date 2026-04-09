'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { categoryId } = context.messages.in.content;

        const { data } = await axios.get(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/categories/${categoryId}/folders`,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({ folders: data }, 'folders');
    }
};

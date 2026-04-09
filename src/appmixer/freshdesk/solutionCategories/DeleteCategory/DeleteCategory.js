'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { categoryId } = context.messages.in.content;

        await axios.delete(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/categories/${categoryId}`,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({ id: categoryId }, 'deleted');
    }
};

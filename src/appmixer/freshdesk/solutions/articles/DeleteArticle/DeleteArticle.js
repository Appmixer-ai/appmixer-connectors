'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { articleId } = context.messages.in.content;

        await axios.delete(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/articles/${articleId}`,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({ id: articleId }, 'deleted');
    }
};

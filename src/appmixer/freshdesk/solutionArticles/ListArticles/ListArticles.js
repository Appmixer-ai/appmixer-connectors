'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { folderId } = context.messages.in.content;

        const { data } = await axios.get(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/folders/${folderId}/articles`,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({ articles: data }, 'articles');
    }
};

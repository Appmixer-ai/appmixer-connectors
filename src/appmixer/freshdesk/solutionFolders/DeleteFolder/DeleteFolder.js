'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { folderId } = context.messages.in.content;

        await axios.delete(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/folders/${folderId}`,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({ id: folderId }, 'deleted');
    }
};

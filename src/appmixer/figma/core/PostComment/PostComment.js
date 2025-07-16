
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { file_id, message } = context.messages.in.content;

        // https://www.figma.com/developers/api#comments-post
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.figma.com/v1/files/${file_id}/comments`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                message: message
            }
        });

        return context.sendJson(data, 'out');
    }
};

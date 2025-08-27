'use strict';

module.exports = {
    async receive(context) {

        const { name } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Space ID or Meeting Code is required!');
        }

        // Extract space ID if full resource name is provided
        const spaceId = name.startsWith('spaces/') ? name.split('/')[1] : name;

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/spaces/${spaceId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};

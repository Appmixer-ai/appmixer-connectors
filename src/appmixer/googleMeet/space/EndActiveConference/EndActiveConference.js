'use strict';

module.exports = {
    async receive(context) {

        const { name } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Space ID is required!');
        }

        // Extract space ID from full resource name if needed
        // Handle both "spaces/ID" format and just "ID" format
        const spaceId = name.startsWith('spaces/') ? name.split('/')[1] : name;

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/endActiveConference
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://meet.googleapis.com/v2/spaces/${spaceId}:endActiveConference`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
